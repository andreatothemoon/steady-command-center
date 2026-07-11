import type { Scenario, PlanEvent, Projection } from "../types";
import { annualCashImpact } from "./effects";

const HORIZON_YEARS = 45;

export function projectScenario(scenario: Scenario, events: PlanEvent[]): Projection {
  const a = scenario.assumptions;
  const nowYear = new Date().getFullYear();
  const yearlyNetWorth: { year: number; value: number }[] = [];

  let netWorth = a.currentNetWorth;
  let annualNet = a.annualNetIncome;
  let annualExpenses = a.annualExpenses;
  let retirementYear = nowYear + Math.max(1, a.targetRetirementAge - a.currentAge);
  let fiYear = nowYear;
  let fiReached = false;

  for (let i = 0; i <= HORIZON_YEARS; i++) {
    const year = nowYear + i;

    // Apply per-event effects for the year
    let extraCash = 0;
    let extraIncome = 0;
    let extraExpense = 0;
    let assetDelta = 0;
    let liabilityDelta = 0;
    for (const ev of events) {
      for (const eff of ev.effects) {
        const impact = annualCashImpact(eff, year) * ev.probability;
        switch (eff.kind) {
          case "cash_delta":
            extraCash += impact;
            break;
          case "recurring_income":
          case "salary_delta":
            extraIncome += impact;
            break;
          case "recurring_expense":
            extraExpense += impact;
            break;
          case "asset_delta":
            assetDelta += impact;
            break;
          case "liability_delta":
            liabilityDelta += impact;
            break;
          case "pension_contribution_delta":
            extraExpense += impact; // savings from spendable cash
            assetDelta += impact; // added to pension pot
            break;
        }
      }
    }

    const isRetired = year >= retirementYear;
    const income = isRetired ? 0 : annualNet + extraIncome;
    const expenses = annualExpenses + extraExpense;
    const savings = income - expenses + extraCash;

    netWorth = netWorth * (1 + a.investmentReturn) + savings + assetDelta - liabilityDelta;

    yearlyNetWorth.push({ year, value: Math.round(netWorth) });

    // FI = when 4% of net worth covers current expenses (inflation-adjusted)
    const inflatedExpenses = annualExpenses * Math.pow(1 + a.inflation, i);
    if (!fiReached && netWorth * 0.04 >= inflatedExpenses) {
      fiYear = year;
      fiReached = true;
    }

    annualNet = annualNet * (1 + a.inflation);
    annualExpenses = annualExpenses * (1 + a.inflation);
  }

  if (!fiReached) fiYear = nowYear + HORIZON_YEARS;

  const netWorthAtRetirement =
    yearlyNetWorth.find((p) => p.year === retirementYear)?.value ?? netWorth;
  const retirementMonthlyIncome = Math.max(0, Math.round((netWorthAtRetirement * 0.04) / 12));

  // Confidence heuristic: horizon buffer + savings rate strength
  const buffer = Math.max(0, retirementYear - fiYear);
  const savingsRate = Math.max(
    0,
    Math.min(1, (a.annualNetIncome - a.annualExpenses) / Math.max(1, a.annualNetIncome))
  );
  const confidence = Math.max(0.15, Math.min(0.98, 0.55 + buffer * 0.03 + savingsRate * 0.35));

  return {
    scenarioId: scenario.id,
    fiYear,
    retirementYear,
    retirementMonthlyIncome,
    confidence,
    netWorthAtRetirement: Math.round(netWorthAtRetirement),
    yearlyNetWorth,
    successProbability: confidence,
  };
}
