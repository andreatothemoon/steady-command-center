import type { DBPensionParams } from "./dbPensionEngine";

export function normalizeRate(value: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  // Rates >= 1 are assumed to be percentages (e.g. 3 → 0.03, 1 → 0.01)
  // Rates < 1 are assumed to be already decimal (e.g. 0.03)
  return Math.abs(numeric) >= 1 ? numeric / 100 : numeric;
}

export function denormalizeRateForDisplay(value: number): number {
  return normalizeRate(value) * 100;
}

/** Convert a DB pension row into engine params, safely normalizing rates */
export function toDBPensionParams(p: {
  current_age: number;
  retirement_age: number;
  current_salary: number | string;
  salary_growth_rate: number | string;
  accrual_rate: number | string;
  is_active_member: boolean;
  revaluation_type: "CPI" | "fixed";
  revaluation_rate: number | string;
  revaluation_uplift: number | string;
  existing_income: number | string;
  early_retirement_factor: number | string;
}): DBPensionParams {
  return {
    current_age: p.current_age,
    retirement_age: p.retirement_age,
    current_salary: Number(p.current_salary),
    salary_growth_rate: normalizeRate(Number(p.salary_growth_rate)),
    accrual_rate: Number(p.accrual_rate),
    is_active_member: p.is_active_member,
    revaluation_type: p.revaluation_type,
    revaluation_rate: normalizeRate(Number(p.revaluation_rate)),
    revaluation_uplift: normalizeRate(Number(p.revaluation_uplift)),
    existing_income: Number(p.existing_income),
    early_retirement_factor: normalizeRate(Number(p.early_retirement_factor)),
  };
}
