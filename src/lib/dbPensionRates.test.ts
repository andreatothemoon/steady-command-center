import { describe, expect, it } from "vitest";
import { denormalizeRateForDisplay, normalizeRate } from "@/lib/dbPensionRates";

describe("dbPensionRates", () => {
  it("leaves decimal rates unchanged", () => {
    expect(normalizeRate(0.03)).toBeCloseTo(0.03);
    expect(denormalizeRateForDisplay(0.03)).toBeCloseTo(3);
  });

  it("normalizes legacy whole-number percentage inputs", () => {
    expect(normalizeRate(3)).toBeCloseTo(0.03);
    expect(normalizeRate(1.5)).toBeCloseTo(0.015);
    expect(denormalizeRateForDisplay(3)).toBeCloseTo(3);
  });

  it("normalizes boundary value of 1 as 1%", () => {
    expect(normalizeRate(1)).toBeCloseTo(0.01);
    expect(denormalizeRateForDisplay(1)).toBeCloseTo(1);
  });

  it("handles zero correctly", () => {
    expect(normalizeRate(0)).toBe(0);
  });
});
