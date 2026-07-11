import type { Goal, Projection, GoalConfidence } from "../types";

export function evaluateGoals(goals: Goal[], projection: Projection): Goal[] {
  return goals.map((g) => {
    const targetYear = new Date(g.targetDate).getFullYear();
    const estimated = estimateCompletionYear(g, projection);
    const slack = targetYear - estimated;
    let confidence: GoalConfidence = "on_track";
    if (slack >= 3) confidence = "high";
    else if (slack >= 0) confidence = "on_track";
    else if (slack >= -2) confidence = "at_risk";
    else confidence = "off_track";

    // simple progress: interpolate on projected net worth vs target amount if provided
    let progress = g.progress;
    if (g.targetAmount) {
      const currentNW = projection.yearlyNetWorth[0]?.value ?? 0;
      progress = Math.max(0, Math.min(1, currentNW / g.targetAmount));
    }

    return {
      ...g,
      confidence,
      progress,
      estimatedCompletion: `${estimated}`,
    };
  });
}

function estimateCompletionYear(goal: Goal, projection: Projection): number {
  if (goal.targetAmount) {
    const hit = projection.yearlyNetWorth.find((p) => p.value >= goal.targetAmount!);
    return hit?.year ?? projection.yearlyNetWorth[projection.yearlyNetWorth.length - 1].year;
  }
  // Non-monetary goals: assume aligned with FI year
  return projection.fiYear;
}
