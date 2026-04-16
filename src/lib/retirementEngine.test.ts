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

describe("computeRetirement tax-free cash", () => {
  it("takes 25% tax-free cash by default and draws income from the remaining DC pot", () => {
    const projection = computeRetirement(
      {
        ...baseInputs,
        retireAge: 60,
        currentPot: 100_000,
        targetIncome: 10_000,
      },
      []
    );

    expect(projection.dcPotAtRetirement).toBe(100_000);
    expect(projection.taxFreeCashTaken).toBe(25_000);
    expect(projection.taxFreeCashAge).toBe(60);
    expect(projection.dcPotAfterTaxFreeCash).toBe(75_000);
    expect(projection.dcDrawdown).toBe(3_000);
    expect(projection.timeline.find((point) => point.age === 60)?.taxFreeCash).toBe(25_000);
  });

  it("allows scenarios to reduce tax-free cash to preserve more drawdown income", () => {
    const projection = computeRetirement(
      {
        ...baseInputs,
        retireAge: 60,
        currentPot: 100_000,
        targetIncome: 10_000,
        taxFreeCashPct: 0,
      },
      []
    );

    expect(projection.taxFreeCashTaken).toBe(0);
    expect(projection.taxFreeCashAge).toBe(60);
    expect(projection.dcPotAfterTaxFreeCash).toBe(100_000);
    expect(projection.dcDrawdown).toBe(4_000);
  });

  it("lets scenarios switch tax-free cash off explicitly", () => {
    const projection = computeRetirement(
      {
        ...baseInputs,
        retireAge: 60,
        currentPot: 100_000,
        targetIncome: 10_000,
        taxFreeCashEnabled: false,
      },
      []
    );

    expect(projection.taxFreeCashTaken).toBe(0);
    expect(projection.taxFreeCashAge).toBeNull();
    expect(projection.dcPotAfterTaxFreeCash).toBe(100_000);
    expect(projection.dcDrawdown).toBe(4_000);
  });

  it("can take tax-free cash after retirement and recalculates DC drawdown from that age", () => {
    const projection = computeRetirement(
      {
        ...baseInputs,
        retireAge: 60,
        currentPot: 100_000,
        targetIncome: 10_000,
        taxFreeCashAge: 62,
      },
      []
    );

    expect(projection.taxFreeCashAge).toBe(62);
    expect(projection.taxFreeCashTaken).toBe(23_000);
    expect(projection.dcPotAfterTaxFreeCash).toBe(69_000);
    expect(projection.timeline.find((point) => point.age === 60)?.dcDrawdown).toBe(4_000);
    expect(projection.timeline.find((point) => point.age === 62)?.taxFreeCash).toBe(23_000);
    expect(projection.timeline.find((point) => point.age === 62)?.dcDrawdown).toBe(2_760);
  });
});
