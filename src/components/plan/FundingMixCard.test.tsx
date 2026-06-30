import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FundingMixCard from "./FundingMixCard";

describe("FundingMixCard", () => {
  it("renders monthly values derived from annual funding mix", () => {
    render(
      <FundingMixCard
        fundingMix={{
          stableIncome: 24_000,
          flexibleIncome: 12_000,
          totalIncome: 36_000,
        }}
      />
    );

    expect(screen.getByText("Retirement Funding Mix")).toBeInTheDocument();
    // 24000/12 = 2000, 12000/12 = 1000, 36000/12 = 3000
    expect(screen.getByText("£2,000/mo")).toBeInTheDocument();
    expect(screen.getByText("£1,000/mo")).toBeInTheDocument();
    expect(screen.getByText(/£3,000\/month/)).toBeInTheDocument();
  });

  it("renders zeros when fundingMix is null", () => {
    render(<FundingMixCard fundingMix={null} />);
    const zeros = screen.getAllByText("£0/mo");
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });
});
