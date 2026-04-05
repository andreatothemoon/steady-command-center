import type { DBPension, DBPensionInput } from "@/hooks/useDBPensions";

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
    salary_growth_rate: Number(pension.salary_growth_rate) * 100,
    accrual_rate: Number(pension.accrual_rate),
    is_active_member: pension.is_active_member,
    revaluation_type: pension.revaluation_type,
    revaluation_rate: Number(pension.revaluation_rate) * 100,
    revaluation_uplift: Number(pension.revaluation_uplift) * 100,
    indexation_type: pension.indexation_type,
    indexation_cap: Number(pension.indexation_cap) * 100,
    existing_income: Number(pension.existing_income),
  };
}

export function toDbPensionPayload(form: DBPensionFormValues): DBPensionInput {
  return {
    ...form,
    salary_growth_rate: form.salary_growth_rate / 100,
    revaluation_rate: form.revaluation_rate / 100,
    revaluation_uplift: form.revaluation_uplift / 100,
    indexation_cap: form.indexation_cap / 100,
  };
}
