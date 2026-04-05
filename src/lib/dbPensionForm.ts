import type { DBPension, DBPensionInput } from "@/hooks/useDBPensions";
import { denormalizeRateForDisplay, normalizeRate } from "@/lib/dbPensionRates";

export interface DBPensionFormValues {
  name: string;
  scheme_type: "CARE" | "FINAL_SALARY";
  current_age: number;
  retirement_age: number;
  current_salary: number;
  salary_growth_rate: number;
  accrual_rate: number;
  is_active_member: boolean;
  revaluation_type: "CPI" | "fixed";
  revaluation_rate: number;
  revaluation_uplift: number;
  indexation_type: "CPI" | "capped";
  indexation_cap: number;
  existing_income: number;
}

export const defaultDBPensionForm: DBPensionFormValues = {
  name: "NHS Pension",
  scheme_type: "CARE",
  current_age: 35,
  retirement_age: 67,
  current_salary: 45000,
  salary_growth_rate: 3,
  accrual_rate: 54,
  is_active_member: true,
  revaluation_type: "CPI",
  revaluation_rate: 2,
  revaluation_uplift: 1.5,
  indexation_type: "CPI",
  indexation_cap: 5,
  existing_income: 0,
};

export function toDbPensionFormValues(pension: DBPension): DBPensionFormValues {
  return {
    name: pension.name,
    scheme_type: pension.scheme_type,
    current_age: pension.current_age,
    retirement_age: pension.retirement_age,
    current_salary: Number(pension.current_salary),
    salary_growth_rate: denormalizeRateForDisplay(Number(pension.salary_growth_rate)),
    accrual_rate: Number(pension.accrual_rate),
    is_active_member: pension.is_active_member,
    revaluation_type: pension.revaluation_type,
    revaluation_rate: denormalizeRateForDisplay(Number(pension.revaluation_rate)),
    revaluation_uplift: denormalizeRateForDisplay(Number(pension.revaluation_uplift)),
    indexation_type: pension.indexation_type,
    indexation_cap: denormalizeRateForDisplay(Number(pension.indexation_cap)),
    existing_income: Number(pension.existing_income),
  };
}

export function toDbPensionPayload(form: DBPensionFormValues): DBPensionInput {
  return {
    ...form,
    salary_growth_rate: normalizeRate(form.salary_growth_rate),
    revaluation_rate: normalizeRate(form.revaluation_rate),
    revaluation_uplift: normalizeRate(form.revaluation_uplift),
    indexation_cap: normalizeRate(form.indexation_cap),
  };
}
