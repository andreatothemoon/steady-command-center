import type { Recommendation, Scenario, Projection } from "../types";

export function generateRecommendations(
  scenario: Scenario,
  projection: Projection
): Recommendation[] {
  const recs: Recommendation[] = [];
  const a = scenario.assumptions;
  const yearsToFI = projection.fiYear - new Date().getFullYear();

  if (a.savingsRate < 0.25) {
    recs.push({
      id: "rec-pension-boost",
      title: "Boost pension by £300/month",
      description:
        "A modest increase in pension contributions compounds meaningfully over your horizon.",
      impact: `Could bring Financial Independence forward by roughly ${Math.max(6, 24 - yearsToFI)} months.`,
      confidence: 0.78,
      priority: "high",
      category: "pension",
    });
  }

  if (projection.retirementYear - projection.fiYear < 2) {
    recs.push({
      id: "rec-buffer",
      title: "Add a 2-year buffer before retirement",
      description:
        "Your FI date and target retirement are tightly aligned. A small buffer meaningfully reduces sequence-of-returns risk.",
      impact: "Increases confidence in your plan from good to strong.",
      confidence: 0.7,
      priority: "medium",
      category: "investing",
    });
  }

  recs.push({
    id: "rec-tax",
    title: "Use your full ISA allowance",
    description: "£20,000 per adult per tax year of tax-free growth.",
    impact: "Reduces lifetime tax drag on your investments.",
    confidence: 0.9,
    priority: "medium",
    category: "tax",
  });

  if (projection.confidence < 0.7) {
    recs.push({
      id: "rec-delay",
      title: "Consider delaying retirement by one year",
      description: "A single extra year of contributions and market growth has an outsized effect near retirement.",
      impact: "Raises your monthly retirement income by an estimated 6-9%.",
      confidence: 0.75,
      priority: "medium",
      category: "career",
    });
  }

  return recs;
}
