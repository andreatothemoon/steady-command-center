import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ScenarioOverviewList from "./ScenarioOverviewList";
import type { RetirementProjection } from "@/lib/retirementEngine";
import type { RetirementScenario } from "@/hooks/useRetirementScenarios";

function makeScenario(id: string, name: string): RetirementScenario {
  return {
    id,
    name,
    current_age: 40,
    retirement_age: 65,
    current_pot: 0,
    monthly_contribution: 0,
    employer_contribution: 0,
    expected_return: 5,
    inflation_rate: 2,
    target_income: 30_000,
    household_id: "h1",
    created_at: "",
    updated_at: "",
  };
}

function makeProjection(totalIncome: number, readinessPct: number): RetirementProjection {
  return {
    totalIncome,
    readinessPct,
    timeline: [],
  } as unknown as RetirementProjection;
}

describe("ScenarioOverviewList", () => {
  const entries = [
    {
      scenario: makeScenario("a", "Base"),
      values: { retireAge: 65, monthlyContrib: 500, employerContrib: 250 },
      projection: makeProjection(36_000, 95),
    },
    {
      scenario: makeScenario("b", "Aggressive"),
      values: { retireAge: 60, monthlyContrib: 1000, employerContrib: 500 },
      projection: makeProjection(24_000, 70),
    },
  ];

  it("renders scenarios with computed monthly income and contributions", () => {
    render(
      <ScenarioOverviewList
        allProjections={entries}
        activeId="a"
        compareMode={false}
        onSelect={() => {}}
        onExitCompare={() => {}}
      />
    );

    expect(screen.getByText("Base")).toBeInTheDocument();
    expect(screen.getByText("Aggressive")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    // 36000/12 = 3000
    expect(screen.getByText("£3,000")).toBeInTheDocument();
    // contributions: 500+250 = 750
    expect(screen.getByText("£750/mo")).toBeInTheDocument();
    // confidence: 95 -> High, 70 -> Low
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("95% of target")).toBeInTheDocument();
  });

  it("calls onSelect when a scenario is clicked and exits compare mode if active", () => {
    const onSelect = vi.fn();
    const onExitCompare = vi.fn();
    render(
      <ScenarioOverviewList
        allProjections={entries}
        activeId="a"
        compareMode={true}
        onSelect={onSelect}
        onExitCompare={onExitCompare}
      />
    );

    fireEvent.click(screen.getByText("Aggressive"));
    expect(onSelect).toHaveBeenCalledWith("b");
    expect(onExitCompare).toHaveBeenCalled();
  });
});
