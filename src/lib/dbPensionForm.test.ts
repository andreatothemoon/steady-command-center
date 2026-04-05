import { describe, expect, it } from "vitest";
import { defaultDBPensionForm, toDbPensionFormValues, toDbPensionPayload } from "@/lib/dbPensionForm";

describe("dbPensionForm", () => {
  it("stores percent inputs as decimals for persistence", () => {
    const payload = toDbPensionPayload(defaultDBPensionForm);

    expect(payload.salary_growth_rate).toBeCloseTo(0.03);
    expect(payload.revaluation_rate).toBeCloseTo(0.02);
    expect(payload.revaluation_uplift).toBeCloseTo(0.015);
    expect(payload.indexation_cap).toBeCloseTo(0.05);
  });

  it("converts persisted decimals back into display percentages", () => {
    const formValues = toDbPensionFormValues({
      id: "p1",
      household_id: "h1",
      account_id: "a1",
      name: "Scheme",
      scheme_type: "CARE",
      current_age: 40,
      retirement_age: 67,
      current_salary: 50000,
      salary_growth_rate: 0.04,
      accrual_rate: 54,
      is_active_member: true,
      revaluation_type: "CPI",
      revaluation_rate: 0.02,
      revaluation_uplift: 0.0125,
      indexation_type: "capped",
      indexation_cap: 0.05,
      existing_income: 8000,
      created_at: "2026-04-05T00:00:00Z",
      updated_at: "2026-04-05T00:00:00Z",
    });

    expect(formValues.salary_growth_rate).toBe(4);
    expect(formValues.revaluation_rate).toBe(2);
    expect(formValues.revaluation_uplift).toBe(1.25);
    expect(formValues.indexation_cap).toBe(5);
  });

  it("also handles legacy whole-number percent values from older records", () => {
    const formValues = toDbPensionFormValues({
      id: "p2",
      household_id: "h1",
      account_id: "a1",
      name: "Legacy Scheme",
      scheme_type: "CARE",
      current_age: 40,
      retirement_age: 67,
      current_salary: 50000,
      salary_growth_rate: 3,
      accrual_rate: 54,
      is_active_member: true,
      revaluation_type: "CPI",
      revaluation_rate: 2,
      revaluation_uplift: 1.5,
      indexation_type: "capped",
      indexation_cap: 5,
      existing_income: 8000,
      created_at: "2026-04-05T00:00:00Z",
      updated_at: "2026-04-05T00:00:00Z",
    });

    expect(formValues.salary_growth_rate).toBe(3);
    expect(formValues.revaluation_rate).toBe(2);
    expect(formValues.revaluation_uplift).toBe(1.5);
    expect(formValues.indexation_cap).toBe(5);
  });
});
