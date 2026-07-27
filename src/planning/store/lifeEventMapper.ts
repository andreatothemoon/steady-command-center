import type { LifeEventWithEffects } from "@/hooks/useLifeEvents";
import type {
  PlanEvent,
  FinancialEffect,
  FinancialEffectKind,
  EventType,
  EventStatus,
} from "../types";

const EFFECT_KINDS: FinancialEffectKind[] = [
  "cash_delta",
  "recurring_income",
  "recurring_expense",
  "asset_delta",
  "liability_delta",
  "salary_delta",
  "pension_contribution_delta",
];

const FREQUENCIES = new Set(["monthly", "annual", "one_off"]);

function toEffectKind(kind: string): FinancialEffectKind {
  return (EFFECT_KINDS as string[]).includes(kind)
    ? (kind as FinancialEffectKind)
    : "cash_delta";
}

function toFrequency(f: string | null | undefined): FinancialEffect["frequency"] {
  return f && FREQUENCIES.has(f) ? (f as FinancialEffect["frequency"]) : undefined;
}

/**
 * Convert a persisted life event + its effects into the in-memory PlanEvent
 * shape the projection engine understands. Life events live at household scope,
 * so we attach them to the currently active scenario at read-time.
 */
export function lifeEventToPlanEvent(
  row: LifeEventWithEffects,
  scenarioId: string,
): PlanEvent {
  const effects: FinancialEffect[] = (row.effects ?? []).map((e) => ({
    id: e.id,
    eventId: row.id,
    kind: toEffectKind(e.kind),
    amount: Number(e.amount) || 0,
    frequency: toFrequency(e.frequency),
    startYear: e.start_year,
    endYear: e.end_year ?? undefined,
    label: e.label,
  }));

  return {
    id: `life:${row.id}`,
    title: row.title,
    type: (row.event_type as EventType) ?? "custom",
    date: row.event_date,
    probability: Number(row.probability) || 1,
    status: (row.status as EventStatus) ?? "planned",
    notes: row.notes ?? undefined,
    scenarioId,
    effects,
  };
}
