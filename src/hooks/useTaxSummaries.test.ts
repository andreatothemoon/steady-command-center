import { describe, expect, it } from "vitest";
import { computeANI, emptyForm } from "./useTaxSummaries";

const form = (overrides: Partial<typeof emptyForm> = {}) => ({ ...emptyForm, ...overrides });

describe("computeANI", () => {
  it("returns zeros for an empty form", () => {
    const r = computeANI(emptyForm);
    expect(r.gross_income).toBe(0);
    expect(r.adjusted_net_income).toBe(0);
    expect(r.pension_contributions).toBe(0);
    expect(r.buffer_100k).toBe(100000);
    expect(r.buffer_125k).toBe(125140);
  });

  it("sums all gross income components", () => {
    const r = computeANI(
      form({ salary: 50000, bonus: 5000, taxable_benefits: 1000, dividend_income: 2000, rental_income: 3000 })
    );
    expect(r.gross_income).toBe(61000);
  });

  it("grosses up personal pension contributions by 100/80", () => {
    const r = computeANI(form({ salary: 100000, personal_pension_net: 800 }));
    expect(r.grossed_up_personal_pension).toBe(1000);
    expect(r.adjusted_net_income).toBe(99000);
  });

  it("grosses up gift aid by 100/80", () => {
    const r = computeANI(form({ salary: 100000, gift_aid: 800 }));
    expect(r.grossed_up_gift_aid).toBe(1000);
    expect(r.adjusted_net_income).toBe(99000);
  });

  it("subtracts salary sacrifice from ANI", () => {
    const r = computeANI(
      form({ salary: 100000, salary_sacrifice_pension: 5000, other_salary_sacrifice: 1000 })
    );
    expect(r.salary_sacrifice_total).toBe(6000);
    expect(r.adjusted_net_income).toBe(94000);
  });

  it("never produces a negative ANI", () => {
    const r = computeANI(form({ salary: 10000, salary_sacrifice_pension: 50000 }));
    expect(r.adjusted_net_income).toBe(0);
  });

  it("computes buffer to the 100k personal allowance taper threshold", () => {
    const r = computeANI(form({ salary: 90000 }));
    expect(r.buffer_100k).toBe(10000);
  });

  it("reports zero buffer once ANI exceeds 100k", () => {
    const r = computeANI(form({ salary: 110000 }));
    expect(r.buffer_100k).toBe(0);
    expect(r.buffer_125k).toBe(15140);
  });

  it("reports zero buffer to 125,140 once fully tapered", () => {
    const r = computeANI(form({ salary: 130000 }));
    expect(r.buffer_125k).toBe(0);
  });

  it("aggregates pension contributions including grossed-up personal pension", () => {
    const r = computeANI(
      form({ salary: 80000, salary_sacrifice_pension: 4000, employer_pension: 3000, personal_pension_net: 800 })
    );
    expect(r.pension_contributions).toBe(4000 + 3000 + 1000);
  });

  it("integration: high earner using salary sacrifice to dodge the 100k taper", () => {
    const r = computeANI(form({ salary: 110000, salary_sacrifice_pension: 12000 }));
    expect(r.adjusted_net_income).toBe(98000);
    expect(r.buffer_100k).toBe(2000);
  });
});
