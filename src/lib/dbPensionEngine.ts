/**
 * Defined Benefit Pension Engine
 * Models CARE schemes with accrual + revaluation mechanics.
 * DB pensions are income streams, NOT capital pots.
 */

export interface DBPensionParams {
  current_age: number;
  retirement_age: number;
  current_salary: number;
  salary_growth_rate: number;
  accrual_rate: number; // e.g. 54 → 1/54
  is_active_member: boolean;
  revaluation_type: "CPI" | "fixed";
  revaluation_rate: number;
  revaluation_uplift: number;
  existing_income: number; // already-accrued annual income
}

export interface AccrualSlice {
  year: number;
  pension_earned: number;
  revalued_value: number;
  pensionable_salary: number;
  accrual_rate: number;
}

export interface YearlyProjectionPoint {
  age: number;
  total_income: number;
  existing_revalued: number;
  new_accrual: number;
}

export interface DBProjectionResult {
  current_annual_income: number;
  projected_annual_income: number;
  breakdown: {
    existing_entitlement: number;
    future_accrual: number;
  };
  yearly_projection: YearlyProjectionPoint[];
  slices: AccrualSlice[];
}

const DEFAULT_CPI = 0.02;

export function calculateAccrual(salary: number, accrualRate: number): number {
  if (accrualRate <= 0) return 0;
  return salary / accrualRate;
}

export function getRevaluationRate(
  revalType: "CPI" | "fixed",
  revalRate: number,
  revalUplift: number,
  isActive: boolean,
  cpi: number
): number {
  if (revalType === "fixed") return revalRate;
  // CPI-based
  return isActive ? cpi + revalUplift : cpi;
}

export function projectSalary(currentSalary: number, growthRate: number, yearIndex: number): number {
  return currentSalary * Math.pow(1 + growthRate, yearIndex);
}

export function projectDBPension(params: DBPensionParams, cpi: number = DEFAULT_CPI): DBProjectionResult {
  const years = Math.max(0, params.retirement_age - params.current_age);
  const currentYear = new Date().getFullYear();

  // Track existing income revaluation separately
  let existingRevalued = params.existing_income;
  const slices: AccrualSlice[] = [];
  const yearly: YearlyProjectionPoint[] = [];

  // Year 0: current state
  yearly.push({
    age: params.current_age,
    total_income: existingRevalued,
    existing_revalued: existingRevalued,
    new_accrual: 0,
  });

  for (let i = 1; i <= years; i++) {
    const rate = getRevaluationRate(
      params.revaluation_type,
      params.revaluation_rate,
      params.revaluation_uplift,
      params.is_active_member,
      cpi
    );

    // Step 1: revalue existing income
    existingRevalued *= 1 + rate;

    // Step 2: revalue all past new-accrual slices
    for (const slice of slices) {
      slice.revalued_value *= 1 + rate;
    }

    // Step 3: add new accrual if active
    if (params.is_active_member) {
      const salary = projectSalary(params.current_salary, params.salary_growth_rate, i);
      const accrual = calculateAccrual(salary, params.accrual_rate);
      slices.push({
        year: currentYear + i,
        pension_earned: accrual,
        revalued_value: accrual, // first year — no revaluation yet
        pensionable_salary: salary,
        accrual_rate: params.accrual_rate,
      });
    }

    const newAccrualTotal = slices.reduce((sum, s) => sum + s.revalued_value, 0);
    yearly.push({
      age: params.current_age + i,
      total_income: Math.round(existingRevalued + newAccrualTotal),
      existing_revalued: Math.round(existingRevalued),
      new_accrual: Math.round(newAccrualTotal),
    });
  }

  const newAccrualTotal = slices.reduce((sum, s) => sum + s.revalued_value, 0);
  const projectedTotal = Math.round(existingRevalued + newAccrualTotal);

  return {
    current_annual_income: params.existing_income,
    projected_annual_income: projectedTotal,
    breakdown: {
      existing_entitlement: Math.round(existingRevalued),
      future_accrual: Math.round(newAccrualTotal),
    },
    yearly_projection: yearly,
    slices,
  };
}
