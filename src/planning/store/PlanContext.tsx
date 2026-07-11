import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Decision, Goal, PlanEvent, PlanState, Scenario, Projection, Recommendation } from "../types";
import { seedPlanState } from "./seed";
import { projectScenario, evaluateGoals, generateRecommendations } from "../engine";

const STORAGE_KEY = "wealthos.plan.v1";

interface PlanContextValue {
  state: PlanState;
  activeScenario: Scenario;
  scenarioEvents: PlanEvent[];
  projection: Projection;
  evaluatedGoals: Goal[];
  recommendations: Recommendation[];
  setActiveScenario: (id: string) => void;
  upsertEvent: (event: PlanEvent) => void;
  deleteEvent: (id: string) => void;
  duplicateEvent: (id: string) => void;
  upsertDecision: (d: Decision) => void;
  acceptDecision: (id: string) => void;
  rejectDecision: (id: string) => void;
  reset: () => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

function loadState(): PlanState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedPlanState;
    const parsed = JSON.parse(raw) as PlanState;
    if (!parsed.scenarios?.length) return seedPlanState;
    return parsed;
  } catch {
    return seedPlanState;
  }
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlanState>(() => loadState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const activeScenario =
    state.scenarios.find((s) => s.id === state.activeScenarioId) ?? state.scenarios[0];

  const scenarioEvents = useMemo(
    () => state.events.filter((e) => activeScenario.eventIds.includes(e.id)),
    [state.events, activeScenario]
  );

  const projection = useMemo(
    () => projectScenario(activeScenario, scenarioEvents),
    [activeScenario, scenarioEvents]
  );

  const evaluatedGoals = useMemo(() => {
    const scoped = state.goals.filter((g) => activeScenario.goalIds.includes(g.id));
    return evaluateGoals(scoped, projection);
  }, [state.goals, activeScenario, projection]);

  const recommendations = useMemo(
    () => generateRecommendations(activeScenario, projection),
    [activeScenario, projection]
  );

  const setActiveScenario = useCallback(
    (id: string) => setState((s) => ({ ...s, activeScenarioId: id })),
    []
  );

  const upsertEvent = useCallback((event: PlanEvent) => {
    setState((s) => {
      const exists = s.events.some((e) => e.id === event.id);
      const events = exists ? s.events.map((e) => (e.id === event.id ? event : e)) : [...s.events, event];
      const scenarios = s.scenarios.map((sc) =>
        sc.id === event.scenarioId && !sc.eventIds.includes(event.id)
          ? { ...sc, eventIds: [...sc.eventIds, event.id] }
          : sc
      );
      return { ...s, events, scenarios };
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      events: s.events.filter((e) => e.id !== id),
      scenarios: s.scenarios.map((sc) => ({ ...sc, eventIds: sc.eventIds.filter((x) => x !== id) })),
    }));
  }, []);

  const duplicateEvent = useCallback((id: string) => {
    setState((s) => {
      const src = s.events.find((e) => e.id === id);
      if (!src) return s;
      const copy: PlanEvent = { ...src, id: `${src.id}-copy-${Date.now()}`, title: `${src.title} (copy)` };
      const scenarios = s.scenarios.map((sc) =>
        sc.id === src.scenarioId ? { ...sc, eventIds: [...sc.eventIds, copy.id] } : sc
      );
      return { ...s, events: [...s.events, copy], scenarios };
    });
  }, []);

  const upsertDecision = useCallback((d: Decision) => {
    setState((s) => {
      const exists = s.decisions.some((x) => x.id === d.id);
      return {
        ...s,
        decisions: exists ? s.decisions.map((x) => (x.id === d.id ? d : x)) : [...s.decisions, d],
      };
    });
  }, []);

  const acceptDecision = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      decisions: s.decisions.map((d) => (d.id === id ? { ...d, status: "accepted" } : d)),
    }));
  }, []);

  const rejectDecision = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      decisions: s.decisions.map((d) => (d.id === id ? { ...d, status: "rejected" } : d)),
    }));
  }, []);

  const reset = useCallback(() => setState(seedPlanState), []);

  const value: PlanContextValue = {
    state,
    activeScenario,
    scenarioEvents,
    projection,
    evaluatedGoals,
    recommendations,
    setActiveScenario,
    upsertEvent,
    deleteEvent,
    duplicateEvent,
    upsertDecision,
    acceptDecision,
    rejectDecision,
    reset,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used inside <PlanProvider>");
  return ctx;
}
