import { describe, expect, it } from "vitest";
import { computeRetirement, type RetirementInputs } from "@/lib/retirementEngine";
import type { DBPensionParams } from "@/lib/dbPensionEngine";

const baseInputs: RetirementInputs = {
  currentAge: 60,
  retireAge: 62,
  currentPot: 0,
  monthlyContrib: 0,
  employerContrib: 0,
  expectedReturn: 0,
  inflation: 0,
  targetIncome: 20_000,
  statePensionPct: 100,
  drawdownRate: 0.04,
  isaPot: 0,
  isaDrawdownRate: 0.04,
  isaGrowthRate: 0,
};

const baseDBPension: DBPensionParams = {
  current_age: 60,
  retirement_age: 67,
  current_salary: 54_000,
  salary_growth_rate: 0,
  accrual_rate: 54,
  is_active_member: true,
  revaluation_type: "fixed",
  revaluation_rate: 0,
  revaluation_uplift: 0,
  existing_income: 10_000,
  early_retirement_factor: 0.05,
};

describe("computeRetirement DB pension integration", () => {
  it("projects DB pensions to the scenario retirement age before applying early retirement penalties", () => {
    const projection = computeRetirement(baseInputs, [baseDBPension]);

    // Existing £10k plus two years of £1k accrual, reduced by 25% for claiming five years early.
    expect(projection.totalDBIncome).toBe(9_000);
    expect(projection.totalIncome).toBe(9_000);
  });

  it("keeps an early DB pension reduction permanent through the timeline", () => {
    const projection = computeRetirement(baseInputs, [baseDBPension]);

    expect(projection.timeline.find((point) => point.age === 62)?.dbPension).toBe(9_000);
    expect(projection.timeline.find((point) => point.age === 67)?.dbPension).toBe(9_000);
  });
});
