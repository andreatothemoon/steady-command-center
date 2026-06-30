import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BestDownsideAssumptions from "./BestDownsideAssumptions";
import type { RetirementProjection } from "@/lib/retirementEngine";

function makeProjection(totalIncome: number): RetirementProjection {
  return {
    totalIncome,
    totalDBIncome: 0,
    statePension: 0,
    dcDrawdown: 0,
    isaDrawdown: 0,
    otherIncomeAtRetirement: 0,
    readinessPct: 100,
    dcPotAtRetirement: 0,
    taxFreeCashTaken: 0,
    taxFreeCashAge: null,
    dcPotAfterTaxFreeCash: 0,
    isaPotAtRetirement: 0,
    timeline: [],
  } as unknown as RetirementProjection;
}

describe("BestDownsideAssumptions", () => {
  it("renders best and downside scenario values and assumptions", () => {
    render(
      <BestDownsideAssumptions
        bestScenario={{ values: { retireAge: 60 }, projection: makeProjection(48_000) }}
        downsideScenario={{ values: { retireAge: 68 }, projection: makeProjection(24_000) }}
        planningAssumptions={[
          { label: "Inflation", value: "2.5%", adjustable: true },
          { label: "State Pension Age", value: "67", adjustable: false },
        ]}
      />
    );

    expect(screen.getByText("Best Case Scenario")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("68")).toBeInTheDocument();
    // 48000/12 = 4000, 24000/12 = 2000
    expect(screen.getByText("£4,000")).toBeInTheDocument();
    expect(screen.getByText("£2,000")).toBeInTheDocument();
    expect(screen.getByText("Inflation")).toBeInTheDocument();
    expect(screen.getByText("2.5%")).toBeInTheDocument();
    expect(screen.getByText("Fixed by policy or product rules")).toBeInTheDocument();
  });

  it("shows em-dash placeholders when scenarios are missing", () => {
    render(
      <BestDownsideAssumptions
        bestScenario={null}
        downsideScenario={null}
        planningAssumptions={[]}
      />
    );
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });
});
