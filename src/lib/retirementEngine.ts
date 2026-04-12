/**
 * Retirement Decision Engine
 * Computes income-first retirement projections across all sources.
 */

import { projectDBPension, type DBPensionParams } from "./dbPensionEngine";

export const UK_STATE_PENSION_FULL = 11502;
export const STATE_PENSION_AGE = 67;
export const DEFAULT_DRAWDOWN_RATE = 0.04;
export const DEFAULT_LONGEVITY = 90;

export interface RetirementInputs {
  currentAge: number;
  retireAge: number;
  currentPot: number;
  monthlyContrib: number;
  employerContrib: number;
  expectedReturn: number; // %
  inflation: number; // %
  targetIncome: number;
  statePensionPct: number; // 0-100
  drawdownRate: number; // decimal e.g. 0.04
  isaPot: number; // total ISA balance at today
  isaDrawdownRate: number; // decimal e.g. 0.04
  isaGrowthRate: number; // % annual growth for ISA
}

export interface IncomeTimelinePoint {
  age: number;
  dcDrawdown: number;
  dbPension: number;
  statePension: number;
  isaWithdrawal: number;
  otherIncome: number;
  totalIncome: number;
  dcPot: number; // remaining DC pot at this age
}

export interface RetirementProjection {
  dcPotAtRetirement: number;
  dcPotAtRetirementNominal: number;
  dcDrawdown: number;
  totalDBIncome: number;
  statePensionIncome: number;
  totalIncome: number;
  gap: number; // positive = shortfall
  readinessPct: number;
  status: "on_track" | "close" | "gap";
  timeline: IncomeTimelinePoint[];
  dcDepletionAge: number | null; // age when DC pot runs out
}

export interface RetirementAction {
  id: string;
  severity: "critical" | "opportunity" | "optimisation";
  title: string;
  explanation: string;
  impact: string;
}

/** Project DC pot growth to a given age */
function projectDCPot(
  currentPot: number,
  monthlyContrib: number,
  employerContrib: number,
  expectedReturn: number,
  inflation: number,
  years: number
): { nominal: number; real: number } {
  const monthlyReturn = expectedReturn / 100 / 12;
  const monthlyInflation = inflation / 100 / 12;
  const totalMonthly = monthlyContrib + employerContrib;
  let nominal = currentPot;
  let real = currentPot;
  for (let y = 0; y < years; y++) {
    for (let m = 0; m < 12; m++) {
      nominal = nominal * (1 + monthlyReturn) + totalMonthly;
      real = real * (1 + monthlyReturn - monthlyInflation) + totalMonthly;
    }
  }
  return { nominal: Math.round(nominal), real: Math.round(real) };
}

/** Build full income timeline from current age to longevity */
export function buildIncomeTimeline(
  inputs: RetirementInputs,
  dbPensionParams: DBPensionParams[],
  longevity: number = DEFAULT_LONGEVITY
): IncomeTimelinePoint[] {
  const { currentAge, retireAge, currentPot, monthlyContrib, employerContrib, expectedReturn, inflation, statePensionPct, drawdownRate, isaPot, isaDrawdownRate, isaGrowthRate } = inputs;
  const statePensionAnnual = Math.round(UK_STATE_PENSION_FULL * (statePensionPct / 100));

  // Pre-compute DB projections
  const dbProjections = dbPensionParams.map((p) => ({
    projection: projectDBPension(p),
    schemeRetireAge: p.retirement_age,
    earlyFactor: p.early_retirement_factor, // decimal e.g. 0.03
  }));
  
  // Build DB income by age lookup (sum across all schemes)
  // If user takes DB early, apply early retirement penalty
  const dbByAge: Record<number, number> = {};
  for (const { projection: proj, schemeRetireAge, earlyFactor } of dbProjections) {
    const projectedIncome = proj.projected_annual_income;
    // DB income can start at user's retire age or scheme NRA, whichever is earlier
    const startAge = Math.min(retireAge, schemeRetireAge);
    for (let age = startAge; age <= longevity; age++) {
      let income = projectedIncome;
      // Apply early retirement penalty if taking before scheme NRA
      if (age < schemeRetireAge && earlyFactor > 0) {
        const yearsEarly = schemeRetireAge - age;
        const penalty = Math.min(yearsEarly * earlyFactor, 1); // cap at 100%
        income = Math.round(income * (1 - penalty));
      }
      dbByAge[age] = (dbByAge[age] ?? 0) + income;
    }
  }

  const timeline: IncomeTimelinePoint[] = [];
  
  // Phase 1: Accumulation (current age to retirement)
  for (let age = currentAge; age < retireAge; age++) {
    timeline.push({
      age,
      dcDrawdown: 0,
      dbPension: 0,
      statePension: 0,
      isaWithdrawal: 0,
      otherIncome: 0,
      totalIncome: 0,
      dcPot: 0, // will fill below
    });
  }

  // Compute DC pot at retirement
  const yearsToRetire = Math.max(0, retireAge - currentAge);
  const { real: dcPotReal } = projectDCPot(currentPot, monthlyContrib, employerContrib, expectedReturn, inflation, yearsToRetire);

  // Compute ISA pot at retirement (grows but no contributions assumed)
  const isaRealReturn = (isaGrowthRate - inflation) / 100;
  let isaAtRetire = isaPot * Math.pow(1 + Math.max(isaRealReturn, 0), yearsToRetire);
  
  // Phase 2: Decumulation (retirement to longevity)
  let remainingPot = dcPotReal;
  const annualDrawdown = Math.round(dcPotReal * drawdownRate);
  let dcDepletionAge: number | null = null;
  let remainingIsa = isaAtRetire;
  const isaAnnualDrawdown = Math.round(isaAtRetire * isaDrawdownRate);
  
  for (let age = retireAge; age <= longevity; age++) {
    const dc = remainingPot > 0 ? Math.min(annualDrawdown, remainingPot) : 0;
    remainingPot = Math.max(0, remainingPot - dc);
    if (remainingPot === 0 && dcDepletionAge === null && age > retireAge) {
      dcDepletionAge = age;
    }

    const isa = remainingIsa > 0 ? Math.min(isaAnnualDrawdown, remainingIsa) : 0;
    remainingIsa = Math.max(0, remainingIsa - isa);
    
    const db = dbByAge[age] ?? 0;
    const sp = age >= STATE_PENSION_AGE ? statePensionAnnual : 0;
    const total = dc + db + sp + isa;
    
    timeline.push({
      age,
      dcDrawdown: dc,
      dbPension: db,
      statePension: sp,
      isaWithdrawal: isa,
      otherIncome: 0,
      totalIncome: total,
      dcPot: remainingPot,
    });
  }

  // Fill accumulation phase DC pot values
  for (let i = 0; i < yearsToRetire; i++) {
    const { real } = projectDCPot(currentPot, monthlyContrib, employerContrib, expectedReturn, inflation, i);
    if (timeline[i]) timeline[i].dcPot = real;
  }

  return timeline;
}

/** Full projection result */
export function computeRetirement(
  inputs: RetirementInputs,
  dbPensionParams: DBPensionParams[]
): RetirementProjection {
  const timeline = buildIncomeTimeline(inputs, dbPensionParams);
  const retirePoint = timeline.find((p) => p.age === inputs.retireAge);
  
  const yearsToRetire = Math.max(0, inputs.retireAge - inputs.currentAge);
  const { nominal, real } = projectDCPot(
    inputs.currentPot, inputs.monthlyContrib, inputs.employerContrib,
    inputs.expectedReturn, inputs.inflation, yearsToRetire
  );

  const dcDrawdown = Math.round(real * inputs.drawdownRate);
  const totalDBIncome = dbPensionParams.reduce((sum, p) => {
    const proj = projectDBPension(p);
    return sum + proj.projected_annual_income;
  }, 0);
  const statePensionIncome = Math.round(UK_STATE_PENSION_FULL * (inputs.statePensionPct / 100));
  // ISA income at retirement
  const isaRealReturn = (inputs.isaGrowthRate - inputs.inflation) / 100;
  const isaAtRetire = inputs.isaPot * Math.pow(1 + Math.max(isaRealReturn, 0), yearsToRetire);
  const isaDrawdown = Math.round(isaAtRetire * inputs.isaDrawdownRate);
  // At retirement, state pension only counts if retire age >= 67
  const incomeAtRetirement = dcDrawdown + isaDrawdown + totalDBIncome + (inputs.retireAge >= STATE_PENSION_AGE ? statePensionIncome : 0);
  const gap = inputs.targetIncome - incomeAtRetirement;
  const pct = Math.min(Math.round((incomeAtRetirement / inputs.targetIncome) * 100), 150);
  
  // Find DC depletion age
  let dcDepletionAge: number | null = null;
  for (const pt of timeline) {
    if (pt.age > inputs.retireAge && pt.dcPot === 0 && dcDepletionAge === null) {
      dcDepletionAge = pt.age;
      break;
    }
  }

  return {
    dcPotAtRetirement: real,
    dcPotAtRetirementNominal: nominal,
    dcDrawdown,
    totalDBIncome,
    statePensionIncome,
    totalIncome: incomeAtRetirement,
    gap,
    readinessPct: pct,
    status: gap <= 0 ? "on_track" : gap < inputs.targetIncome * 0.15 ? "close" : "gap",
    timeline,
    dcDepletionAge,
  };
}

/** Generate contextual retirement actions */
export function generateActions(
  inputs: RetirementInputs,
  projection: RetirementProjection,
  dbPensionParams: DBPensionParams[]
): RetirementAction[] {
  const actions: RetirementAction[] = [];

  // Gap before state pension
  if (inputs.retireAge < STATE_PENSION_AGE) {
    const bridgeYears = STATE_PENSION_AGE - inputs.retireAge;
    const bridgeGap = projection.statePensionIncome;
    actions.push({
      id: "bridge_gap",
      severity: "critical",
      title: `${bridgeYears}-year income gap before State Pension`,
      explanation: `Retiring at ${inputs.retireAge} means ${bridgeYears} years without State Pension income of ${formatGBP(bridgeGap)}/yr.`,
      impact: `You'll need to bridge ${formatGBP(bridgeGap * bridgeYears)} from other sources.`,
    });
  }

  // Income shortfall
  if (projection.gap > 0) {
    const extraMonthly = Math.ceil(projection.gap / (inputs.drawdownRate * 12 * Math.max(1, inputs.retireAge - inputs.currentAge)));
    actions.push({
      id: "income_gap",
      severity: projection.status === "gap" ? "critical" : "opportunity",
      title: `${formatGBP(projection.gap)}/yr income shortfall`,
      explanation: `Your projected income of ${formatGBP(projection.totalIncome)}/yr is below your target of ${formatGBP(inputs.targetIncome)}/yr.`,
      impact: `Increasing contributions by ~${formatGBP(Math.max(50, extraMonthly))}/month could help close this gap.`,
    });
  }

  // Delay retirement benefit
  if (inputs.retireAge < 65) {
    const laterInputs = { ...inputs, retireAge: inputs.retireAge + 2 };
    const laterProj = computeRetirement(laterInputs, dbPensionParams);
    const incomeGain = laterProj.totalIncome - projection.totalIncome;
    if (incomeGain > 0) {
      actions.push({
        id: "delay_retire",
        severity: "opportunity",
        title: `Delaying retirement by 2 years`,
        explanation: `Working until ${inputs.retireAge + 2} gives your pot more time to grow.`,
        impact: `Increases annual income by ${formatGBP(incomeGain)}/yr.`,
      });
    }
  }

  // DC depletion warning
  if (projection.dcDepletionAge && projection.dcDepletionAge < 85) {
    actions.push({
      id: "dc_depletion",
      severity: "critical",
      title: `DC pot depletes at age ${projection.dcDepletionAge}`,
      explanation: `At a ${(inputs.drawdownRate * 100).toFixed(0)}% drawdown rate, your DC pot runs out before age 85.`,
      impact: `After ${projection.dcDepletionAge}, you'll only have DB pension and State Pension.`,
    });
  }

  // On track
  if (projection.gap <= 0 && actions.length === 0) {
    actions.push({
      id: "on_track",
      severity: "optimisation",
      title: "You're on track",
      explanation: `Your projected income exceeds your target by ${formatGBP(Math.abs(projection.gap))}/yr.`,
      impact: "Consider retiring earlier or increasing your target income.",
    });
  }

  return actions;
}

function formatGBP(v: number): string {
  return `£${Math.round(Math.abs(v)).toLocaleString("en-GB")}`;
}
