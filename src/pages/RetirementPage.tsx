import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useDBPensions } from "@/hooks/useDBPensions";
import {
  computeRetirement,
  generateActions,
  DEFAULT_DRAWDOWN_RATE,
  type RetirementInputs,
} from "@/lib/retirementEngine";
import type { DBPensionParams } from "@/lib/dbPensionEngine";

import HeroOutcome from "@/components/retirement/HeroOutcome";
import IncomeTimeline from "@/components/retirement/IncomeTimeline";
import IncomeSourceCards from "@/components/retirement/IncomeSourceCards";
import ActionsPanel from "@/components/retirement/ActionsPanel";
import QuickControls from "@/components/retirement/QuickControls";
import ScenarioTabs, { type ScenarioMeta } from "@/components/retirement/ScenarioTabs";
import ScenarioComparison from "@/components/retirement/ScenarioComparison";

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

interface ScenarioRow {
  id: string;
  name: string;
  current_age: number;
  retirement_age: number;
  current_pot: number;
  monthly_contribution: number;
  employer_contribution: number;
  expected_return: number;
  inflation_rate: number;
  target_income: number;
}

export default function RetirementPage() {
  const { householdId } = useAuth();
  const qc = useQueryClient();

  // Load all scenarios
  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["retirement_scenarios", householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from("retirement_scenarios")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ScenarioRow[];
    },
    enabled: !!householdId,
  });

  const { data: dbPensions = [] } = useDBPensions();

  // Active scenario & compare mode
  const [activeId, setActiveId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  // Local edits per scenario (keyed by scenario id)
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<ScenarioRow>>>({});
  const [statePensionPct, setStatePensionPct] = useState(100);
  const [drawdownRate, setDrawdownRate] = useState(4);

  // Seed active ID when scenarios load
  useEffect(() => {
    if (scenarios.length > 0 && (!activeId || !scenarios.find((s) => s.id === activeId))) {
      setActiveId(scenarios[0].id);
    }
  }, [scenarios, activeId]);

  // Get merged scenario values (DB + local edits)
  const getScenarioValues = useCallback((scenario: ScenarioRow) => {
    const edits = localEdits[scenario.id] ?? {};
    return {
      currentAge: edits.current_age ?? scenario.current_age,
      retireAge: edits.retirement_age ?? scenario.retirement_age,
      currentPot: edits.current_pot ?? Number(scenario.current_pot),
      monthlyContrib: edits.monthly_contribution ?? Number(scenario.monthly_contribution),
      employerContrib: edits.employer_contribution ?? Number(scenario.employer_contribution),
      expectedReturn: edits.expected_return ?? Number(scenario.expected_return),
      inflation: edits.inflation_rate ?? Number(scenario.inflation_rate),
      targetIncome: edits.target_income ?? Number(scenario.target_income),
    };
  }, [localEdits]);

  const activeScenario = scenarios.find((s) => s.id === activeId);
  const activeValues = activeScenario ? getScenarioValues(activeScenario) : null;

  // Set local edit for active scenario
  const setField = useCallback((field: keyof ScenarioRow, value: number) => {
    if (!activeId) return;
    setLocalEdits((prev) => ({
      ...prev,
      [activeId]: { ...prev[activeId], [field]: value },
    }));
  }, [activeId]);

  // DB pension params
  const dbPensionParams: DBPensionParams[] = useMemo(() =>
    dbPensions.map((p) => toDBPensionParams(p)),
    [dbPensions]
  );

  // Compute projections for all scenarios (needed for compare)
  const allProjections = useMemo(() => {
    return scenarios.map((s) => {
      const v = getScenarioValues(s);
      const inputs: RetirementInputs = {
        ...v,
        retireAge: v.retireAge,
        statePensionPct,
        drawdownRate: drawdownRate / 100,
      };
      const projection = computeRetirement(inputs, dbPensionParams);
      return { scenario: s, values: v, inputs, projection };
    });
  }, [scenarios, getScenarioValues, statePensionPct, drawdownRate, dbPensionParams]);

  const activeProjectionData = allProjections.find((p) => p.scenario.id === activeId);
  const projection = activeProjectionData?.projection;
  const inputs = activeProjectionData?.inputs;
  const actions = useMemo(
    () => inputs && projection ? generateActions(inputs, projection, dbPensionParams) : [],
    [inputs, projection, dbPensionParams]
  );

  // Upsert mutation
  const upsert = useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: Record<string, unknown> }) => {
      if (!householdId) throw new Error("No household");
      if (id) {
        const { error } = await supabase.from("retirement_scenarios").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("retirement_scenarios").insert({ ...values, household_id: householdId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["retirement_scenarios", householdId] });
    },
    onError: () => toast.error("Failed to save scenario"),
  });

  // Debounced save for active scenario
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isLoading || !activeScenario || !activeValues) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      upsert.mutate({
        id: activeScenario.id,
        values: {
          current_age: activeValues.currentAge,
          retirement_age: activeValues.retireAge,
          current_pot: activeValues.currentPot,
          monthly_contribution: activeValues.monthlyContrib,
          employer_contribution: activeValues.employerContrib,
          expected_return: activeValues.expectedReturn,
          inflation_rate: activeValues.inflation,
          target_income: activeValues.targetIncome,
        },
      });
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [activeValues, activeScenario?.id, isLoading]);

  // Create first scenario if none exist
  const createdDefault = useRef(false);
  useEffect(() => {
    if (!isLoading && scenarios.length === 0 && householdId && !createdDefault.current) {
      createdDefault.current = true;
      upsert.mutate({
        id: null,
        values: {
          household_id: householdId,
          name: "Baseline",
          current_age: 35,
          retirement_age: 57,
          current_pot: 212700,
          monthly_contribution: 750,
          employer_contribution: 500,
          expected_return: 5,
          inflation_rate: 2.5,
          target_income: 30000,
        },
      });
    }
  }, [isLoading, scenarios.length, householdId]);

  // Add scenario
  const handleAdd = useCallback((template: "blank" | "early" | "higher") => {
    if (!householdId || !activeValues) return;
    const base = activeValues;
    let name = "New Scenario";
    let values = { ...base };

    if (template === "early") {
      name = "Early Retirement";
      values = { ...base, retireAge: Math.max(50, base.retireAge - 5) };
    } else if (template === "higher") {
      name = "Higher Contributions";
      values = { ...base, monthlyContrib: Math.round(base.monthlyContrib * 1.5) };
    } else {
      name = `Scenario ${scenarios.length + 1}`;
    }

    upsert.mutate({
      id: null,
      values: {
        household_id: householdId,
        name,
        current_age: values.currentAge,
        retirement_age: values.retireAge,
        current_pot: values.currentPot,
        monthly_contribution: values.monthlyContrib,
        employer_contribution: values.employerContrib,
        expected_return: values.expectedReturn,
        inflation_rate: values.inflation,
        target_income: values.targetIncome,
      },
    });
  }, [householdId, activeValues, scenarios.length, upsert]);

  // Delete scenario
  const handleDelete = useCallback(async (id: string) => {
    if (scenarios.length <= 1) return;
    const { error } = await supabase.from("retirement_scenarios").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setLocalEdits((prev) => { const n = { ...prev }; delete n[id]; return n; });
    if (activeId === id) setActiveId(scenarios.find((s) => s.id !== id)?.id ?? null);
    qc.invalidateQueries({ queryKey: ["retirement_scenarios", householdId] });
  }, [scenarios, activeId, householdId, qc]);

  // Slider configs for active scenario
  const quickSliders = activeValues ? [
    { label: "Retirement Age", value: activeValues.retireAge, onChange: (v: number) => setField("retirement_age", v), min: 50, max: 75, step: 1, format: (v: number) => `${v}` },
    { label: "Target Income", value: activeValues.targetIncome, onChange: (v: number) => setField("target_income", v), min: 10000, max: 100000, step: 1000, format: formatCurrency },
    { label: "Your Monthly", value: activeValues.monthlyContrib, onChange: (v: number) => setField("monthly_contribution", v), min: 0, max: 5000, step: 50, format: formatCurrency },
    { label: "Expected Return", value: activeValues.expectedReturn, onChange: (v: number) => setField("expected_return", v), min: 1, max: 10, step: 0.5, format: (v: number) => `${v}%` },
  ] : [];

  const advancedSliders = activeValues ? [
    { label: "Current Age", value: activeValues.currentAge, onChange: (v: number) => setField("current_age", v), min: 18, max: 65, step: 1, format: (v: number) => `${v}` },
    { label: "Current Pot", value: activeValues.currentPot, onChange: (v: number) => setField("current_pot", v), min: 0, max: 1000000, step: 5000, format: formatCurrency },
    { label: "Employer Monthly", value: activeValues.employerContrib, onChange: (v: number) => setField("employer_contribution", v), min: 0, max: 5000, step: 50, format: formatCurrency },
    { label: "Inflation", value: activeValues.inflation, onChange: (v: number) => setField("inflation_rate", v), min: 0, max: 6, step: 0.5, format: (v: number) => `${v}%` },
    { label: "State Pension %", value: statePensionPct, onChange: setStatePensionPct, min: 0, max: 100, step: 5, format: (v: number) => `${v}%` },
    { label: "Drawdown Rate", value: drawdownRate, onChange: setDrawdownRate, min: 2, max: 8, step: 0.5, format: (v: number) => `${v}%` },
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const scenarioMetas: ScenarioMeta[] = scenarios.map((s) => ({ id: s.id, name: s.name }));

  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Retirement Planner</h1>
        <p className="label-subtle mt-1">Your retirement income, projected by source</p>
      </motion.div>

      {/* Scenario tabs */}
      <motion.div variants={stagger.item}>
        <ScenarioTabs
          scenarios={scenarioMetas}
          activeId={activeId ?? ""}
          compareMode={compareMode}
          onSelect={setActiveId}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onToggleCompare={() => setCompareMode(!compareMode)}
        />
      </motion.div>

      {/* Compare mode */}
      {compareMode && allProjections.length >= 2 && (
        <motion.div variants={stagger.item}>
          <ScenarioComparison
            scenarios={allProjections.map((p) => ({
              name: p.scenario.name,
              retireAge: p.values.retireAge,
              monthlyContrib: p.values.monthlyContrib,
              employerContrib: p.values.employerContrib,
              targetIncome: p.values.targetIncome,
              projection: p.projection,
            }))}
          />
        </motion.div>
      )}

      {/* Active scenario detail (hidden in compare mode for cleanliness, but could be shown) */}
      {!compareMode && projection && activeValues && (
        <>
          {/* Hero outcome cards */}
          <motion.div variants={stagger.item}>
            <HeroOutcome projection={projection} retireAge={activeValues.retireAge} targetIncome={activeValues.targetIncome} />
          </motion.div>

          {/* Chart + Controls */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <IncomeTimeline timeline={projection.timeline} retireAge={activeValues.retireAge} targetIncome={activeValues.targetIncome} />
            </div>
            <QuickControls
              quickSliders={quickSliders}
              advancedSliders={advancedSliders}
              isSaving={upsert.isPending}
            />
          </div>

          {/* Actions */}
          <ActionsPanel actions={actions} />

          {/* Income source cards */}
          <motion.div variants={stagger.item}>
            <div className="mb-3">
              <p className="label-muted">Income Sources</p>
              <p className="text-[11px] text-muted-foreground mt-1">Breakdown of where your retirement income comes from</p>
            </div>
            <IncomeSourceCards
              projection={projection}
              dbPensions={dbPensions}
              statePensionPct={statePensionPct}
              retireAge={activeValues.retireAge}
              drawdownRate={drawdownRate / 100}
            />
          </motion.div>
        </>
      )}

      {/* In compare mode, show sliders below the table */}
      {compareMode && activeValues && (
        <div className="max-w-sm">
          <QuickControls
            quickSliders={quickSliders}
            advancedSliders={advancedSliders}
            isSaving={upsert.isPending}
          />
        </div>
      )}
    </motion.div>
  );
}
