import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import PillarTile from "./PillarTile";
import type { PlanEvent, PlanState } from "@/planning/types";

const STORAGE_KEY = "wealthos.plan.v1";

function readNextEvent(): PlanEvent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PlanState;
    const active = state.scenarios.find((s) => s.id === state.activeScenarioId) ?? state.scenarios[0];
    if (!active) return null;
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = state.events
      .filter((e) => active.eventIds.includes(e.id) && e.status !== "cancelled" && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] ?? null;
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function relative(iso: string) {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const months = Math.max(0, Math.round((d - now) / (1000 * 60 * 60 * 24 * 30.44)));
  if (months < 1) return "This month";
  if (months < 12) return `in ${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0
    ? `in ${years} year${years === 1 ? "" : "s"}`
    : `in ${years}y ${rem}m`;
}

export default function NextLifeEventTile() {
  const [event, setEvent] = useState<PlanEvent | null>(null);

  useEffect(() => {
    setEvent(readNextEvent());
    const onStorage = () => setEvent(readNextEvent());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <PillarTile
      to="/plan"
      eyebrow="Life plan"
      title="Next life event"
      icon={CalendarClock}
      accent="primary"
      footer={
        event ? (
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">{formatDate(event.date)}</span>
            <span className="font-semibold text-foreground">{relative(event.date)}</span>
          </div>
        ) : undefined
      }
    >
      <div>
        {event ? (
          <>
            <p className="text-[11px] text-muted-foreground capitalize">
              {event.type.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {event.title}
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground">Nothing scheduled</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Add an event
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Map future decisions on your plan timeline.
            </p>
          </>
        )}
      </div>
    </PillarTile>
  );
}
