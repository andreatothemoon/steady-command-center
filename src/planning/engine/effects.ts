import type { PlanEvent, FinancialEffect } from "../types";

// Aggregate raw effects list from events. Kept pure & simple.
export function collectEffects(events: PlanEvent[]): FinancialEffect[] {
  return events.flatMap((e) => e.effects);
}

// Sum of annualised expected impact of an event on cash at a given year.
export function annualCashImpact(effect: FinancialEffect, year: number): number {
  if (year < effect.startYear) return 0;
  if (effect.endYear && year > effect.endYear) return 0;
  switch (effect.frequency) {
    case "monthly":
      return effect.amount * 12;
    case "annual":
      return effect.amount;
    case "one_off":
      return year === effect.startYear ? effect.amount : 0;
    default:
      return year === effect.startYear ? effect.amount : 0;
  }
}
