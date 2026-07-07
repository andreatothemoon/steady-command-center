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

describe("BestDownsideAssumptions accessibility", () => {
  it("exposes each card as a heading landmark", () => {
    render(
      <BestDownsideAssumptions
        bestScenario={{ values: { retireAge: 60 }, projection: makeProjection(48_000) }}
        downsideScenario={{ values: { retireAge: 68 }, projection: makeProjection(24_000) }}
        planningAssumptions={[
          { label: "Inflation", value: "2.5%", adjustable: true },
        ]}
      />
    );

    expect(screen.getByRole("heading", { level: 2, name: /Best Case Scenario/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Downside Case/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Planning Assumptions/i })).toBeInTheDocument();
  });

  it("does not add spurious interactive elements (presentational cards)", () => {
    render(
      <BestDownsideAssumptions
        bestScenario={null}
        downsideScenario={null}
        planningAssumptions={[{ label: "Inflation", value: "2.5%", adjustable: true }]}
      />
    );
    // No buttons/links inside the assumptions summary — it's read-only content
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("decorative trend icons do not introduce unlabeled interactive elements", () => {
    const { container } = render(
      <BestDownsideAssumptions
        bestScenario={{ values: { retireAge: 60 }, projection: makeProjection(48_000) }}
        downsideScenario={{ values: { retireAge: 68 }, projection: makeProjection(24_000) }}
        planningAssumptions={[]}
      />
    );
    // SVGs are decorative — should not be focusable
    const svgs = container.querySelectorAll("svg");
    svgs.forEach((svg) => {
      expect(svg.getAttribute("tabindex")).not.toBe("0");
    });
  });
});
