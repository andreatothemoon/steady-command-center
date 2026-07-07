import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FundingMixCard from "./FundingMixCard";

describe("FundingMixCard accessibility", () => {
  it("exposes the card title as a heading landmark", () => {
    render(
      <FundingMixCard
        fundingMix={{ stableIncome: 24_000, flexibleIncome: 12_000, totalIncome: 36_000 }}
      />
    );
    expect(
      screen.getByRole("heading", { level: 2, name: /Retirement Funding Mix/i })
    ).toBeInTheDocument();
  });

  it("is purely presentational — no interactive elements to trap keyboard focus", () => {
    render(<FundingMixCard fundingMix={null} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });

  it("renders descriptive text alongside numeric values (not numbers alone)", () => {
    render(
      <FundingMixCard
        fundingMix={{ stableIncome: 24_000, flexibleIncome: 12_000, totalIncome: 36_000 }}
      />
    );
    // Ensure labels describe each number for screen reader context
    expect(screen.getByText(/Guaranteed income/i)).toBeInTheDocument();
    expect(screen.getByText(/Flexible drawdown capacity/i)).toBeInTheDocument();
    expect(screen.getByText(/What this means/i)).toBeInTheDocument();
  });
});
