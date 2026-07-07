import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("ScenarioOverviewList accessibility", () => {
  it("renders each scenario as a real <button> element (keyboard focusable)", () => {
    render(
      <ScenarioOverviewList
        allProjections={entries}
        activeId="a"
        compareMode={false}
        onSelect={() => {}}
        onExitCompare={() => {}}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(entries.length);
    // Each button should have an accessible name derived from its visible content
    expect(buttons[0]).toHaveAccessibleName(/Base/);
    expect(buttons[1]).toHaveAccessibleName(/Aggressive/);
  });

  it("supports Tab navigation between scenarios and activation via Enter/Space", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <ScenarioOverviewList
        allProjections={entries}
        activeId="a"
        compareMode={false}
        onSelect={onSelect}
        onExitCompare={() => {}}
      />
    );

    await user.tab();
    expect(screen.getAllByRole("button")[0]).toHaveFocus();

    await user.tab();
    expect(screen.getAllByRole("button")[1]).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("b");

    onSelect.mockClear();
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("has a heading landmark for the section", () => {
    render(
      <ScenarioOverviewList
        allProjections={entries}
        activeId="a"
        compareMode={false}
        onSelect={() => {}}
        onExitCompare={() => {}}
      />
    );
    expect(
      screen.getByRole("heading", { level: 2, name: /Scenarios/i })
    ).toBeInTheDocument();
  });
});
