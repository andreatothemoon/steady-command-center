import type { Projection, ImpactSummary } from "../types";

export function diffProjections(before: Projection, after: Projection): ImpactSummary {
  const fiDelta = after.fiYear - before.fiYear;
  const incomeDelta = after.retirementMonthlyIncome - before.retirementMonthlyIncome;
  const confDelta = after.confidence - before.confidence;

  let headline = "No material change to your plan.";
  if (fiDelta > 0)
    headline = `This delays Financial Independence by ${monthsPhrase(fiDelta)}.`;
  else if (fiDelta < 0)
    headline = `This brings Financial Independence forward by ${monthsPhrase(-fiDelta)}.`;
  else if (Math.abs(incomeDelta) > 50)
    headline =
      incomeDelta > 0
        ? `Your future monthly income improves by £${Math.round(incomeDelta).toLocaleString()}.`
        : `Your future monthly income drops by £${Math.round(-incomeDelta).toLocaleString()}.`;

  const mitigation =
    fiDelta > 0 || incomeDelta < -100
      ? "Increase pension contribution by £250/month to offset this."
      : undefined;

  return {
    fiYear: { before: before.fiYear, after: after.fiYear },
    retirementMonthlyIncome: {
      before: before.retirementMonthlyIncome,
      after: after.retirementMonthlyIncome,
    },
    confidence: { before: before.confidence, after: after.confidence },
    headline,
    mitigation,
  };
}

function monthsPhrase(years: number): string {
  const months = Math.round(years * 12);
  if (months < 12) return `${months} months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y}y ${m}m` : `${y} year${y > 1 ? "s" : ""}`;
}
