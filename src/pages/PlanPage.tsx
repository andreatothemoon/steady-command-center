/**
 * Plan Page — absorbs Retirement + DB Pensions
 * Interactive modeling with sliders, scenario comparison, DB pension integration
 */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useDBPensions } from "@/hooks/useDBPensions";
import { useAccounts } from "@/hooks/useAccounts";
import {
  useRetirementScenarios,
  useSelectedRetirementScenario,
  useSetSelectedRetirementScenario,
  type RetirementScenario,
} from "@/hooks/useRetirementScenarios";
import { Check, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  computeRetirement,
  generateActions,
  DEFAULT_LONGEVITY,
  STATE_PENSION_AGE,
  DEFAULT_TAX_FREE_CASH_PCT,
  type RetirementInputs,
} from "@/lib/retirementEngine";
import type { DBPensionParams } from "@/lib/dbPensionEngine";
import { toDBPensionParams } from "@/lib/dbPensionRates";

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

export default function PlanPage() {
  const { householdId } = useAuth();
  const qc = useQueryClient();

  const { data: scenarios = [] } = useRetirementScenarios();
  const { scenario: selectedScenario, isLoading } = useSelectedRetirementScenario();
  const setSelectedScenario = useSetSelectedRetirementScenario();

  const { data: dbPensions = [] } = useDBPensions();
  const { data: accounts = [] } = useAccounts();
  const canPersistTaxFreeCash = scenarios.some((scenario) => "tax_free_cash_pct" in scenario);
  const canPersistTaxFreeCashOptions = scenarios.some((scenario) => "tax_free_cash_enabled" in scenario);

  const totalIsaPot = useMemo(() =>
    accounts
      .filter((a) => a.account_type === "cash_isa" || a.account_type === "stocks_and_shares_isa")
      .reduce((sum, a) => sum + Number(a.current_value), 0),
    [accounts]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<RetirementScenario>>>({});
  const [statePensionPct, setStatePensionPct] = useState(100);
  const [drawdownRate, setDrawdownRate] = useState(4);

  useEffect(() => {
    if (selectedScenario && activeId !== selectedScenario.id) {
      setActiveId(selectedScenario.id);
    } else if (!selectedScenario && activeId && !scenarios.find((s) => s.id === activeId)) {
      setActiveId(null);
    }
  }, [scenarios, selectedScenario, activeId]);

  const getScenarioValues = useCallback((scenario: RetirementScenario) => {
    const edits = localEdits[scenario.id] ?? {};
    const retireAge = edits.retirement_age ?? scenario.retirement_age;
    return {
      currentAge: edits.current_age ?? scenario.current_age,
      retireAge,
      currentPot: edits.current_pot ?? Number(scenario.current_pot),
      monthlyContrib: edits.monthly_contribution ?? Number(scenario.monthly_contribution),
      employerContrib: edits.employer_contribution ?? Number(scenario.employer_contribution),
      expectedReturn: edits.expected_return ?? Number(scenario.expected_return),
      inflation: edits.inflation_rate ?? Number(scenario.inflation_rate),
      targetIncome: edits.target_income ?? Number(scenario.target_income),
      taxFreeCashPct:
        edits.tax_free_cash_pct ??
        ("tax_free_cash_pct" in scenario
          ? Number(scenario.tax_free_cash_pct)
          : DEFAULT_TAX_FREE_CASH_PCT),
      taxFreeCashEnabled:
        edits.tax_free_cash_enabled ??
        ("tax_free_cash_enabled" in scenario
          ? Boolean(scenario.tax_free_cash_enabled)
          : true),
      taxFreeCashAge:
        edits.tax_free_cash_age ??
        ("tax_free_cash_age" in scenario && scenario.tax_free_cash_age != null
          ? Number(scenario.tax_free_cash_age)
          : retireAge),
    };
  }, [localEdits]);

  const activeScenario = scenarios.find((s) => s.id === activeId);
  const activeValues = activeScenario ? getScenarioValues(activeScenario) : null;
  const activeEdits = activeId ? localEdits[activeId] : undefined;

  const setField = useCallback((field: keyof RetirementScenario, value: number | boolean | null) => {
    if (!activeId) return;
    setLocalEdits((prev) => ({
      ...prev,
      [activeId]: { ...prev[activeId], [field]: value },
    }));
  }, [activeId]);

  const dbPensionParams: DBPensionParams[] = useMemo(() =>
    dbPensions.map((p) => toDBPensionParams(p)), [dbPensions]);

  const allProjections = useMemo(() => {
    return scenarios.map((s) => {
      const v = getScenarioValues(s);
      const inputs: RetirementInputs = {
        ...v,
        retireAge: v.retireAge,
        statePensionPct,
        drawdownRate: drawdownRate / 100,
        taxFreeCashEnabled: v.taxFreeCashEnabled,
        taxFreeCashPct: v.taxFreeCashPct,
        taxFreeCashAge: v.taxFreeCashAge,
        isaPot: totalIsaPot,
        isaDrawdownRate: drawdownRate / 100,
        isaGrowthRate: v.expectedReturn,
      };
      const projection = computeRetirement(inputs, dbPensionParams);
      return { scenario: s, values: v, inputs, projection };
    });
  }, [scenarios, getScenarioValues, statePensionPct, drawdownRate, dbPensionParams, totalIsaPot]);

  const activeProjectionData = allProjections.find((p) => p.scenario.id === activeId);
  const projection = activeProjectionData?.projection;
  const inputs = activeProjectionData?.inputs;
  const fundingMix = projection
    ? {
        stableIncome: projection.totalDBIncome + projection.statePensionIncome,
        flexibleIncome:
          projection.dcDrawdown +
          (projection.timeline.find((point) => point.age === activeValues?.retireAge)?.isaWithdrawal ?? 0),
        totalIncome: projection.totalIncome,
      }
    : null;
  const actions = useMemo(
    () => inputs && projection ? generateActions(inputs, projection, dbPensionParams) : [],
    [inputs, projection, dbPensionParams]
  );

  const handleSelectScenario = useCallback((id: string) => {
    setActiveId(id);
    setSelectedScenario.mutate(id, {
      onError: () => toast.error("Failed to remember selected scenario"),
    });
  }, [setSelectedScenario]);

  const upsert = useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: Record<string, unknown>; clearLocalEdits?: Partial<RetirementScenario> }) => {
      if (!householdId) throw new Error("No household");
      if (id) {
        const { error } = await supabase.from("retirement_scenarios").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("retirement_scenarios").insert({ ...values, household_id: householdId });
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      if (variables.id && variables.clearLocalEdits) {
        setLocalEdits((prev) => {
          if (prev[variables.id!] !== variables.clearLocalEdits) return prev;
          const next = { ...prev };
          delete next[variables.id!];
          return next;
        });
      }
      qc.invalidateQueries({ queryKey: ["retirement_scenarios", householdId] });
    },
    onError: () => toast.error("Failed to save scenario"),
  });

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isLoading || !activeScenario || !activeEdits || Object.keys(activeEdits).length === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const valuesToSave = getScenarioValues(activeScenario);
      upsert.mutate({
        id: activeScenario.id,
        clearLocalEdits: activeEdits,
        values: {
          current_age: valuesToSave.currentAge,
          retirement_age: valuesToSave.retireAge,
          current_pot: valuesToSave.currentPot,
          monthly_contribution: valuesToSave.monthlyContrib,
          employer_contribution: valuesToSave.employerContrib,
          expected_return: valuesToSave.expectedReturn,
          inflation_rate: valuesToSave.inflation,
          target_income: valuesToSave.targetIncome,
          ...(canPersistTaxFreeCash ? { tax_free_cash_pct: valuesToSave.taxFreeCashPct } : {}),
          ...(canPersistTaxFreeCashOptions
            ? {
                tax_free_cash_enabled: valuesToSave.taxFreeCashEnabled,
                tax_free_cash_age: valuesToSave.taxFreeCashAge,
              }
            : {}),
        },
      });
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [activeEdits, activeScenario, canPersistTaxFreeCash, canPersistTaxFreeCashOptions, getScenarioValues, isLoading]);

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
          ...(canPersistTaxFreeCash ? { tax_free_cash_pct: DEFAULT_TAX_FREE_CASH_PCT } : {}),
          ...(canPersistTaxFreeCashOptions
            ? { tax_free_cash_enabled: true, tax_free_cash_age: 57 }
            : {}),
          target_income: 30000,
        },
      });
    }
  }, [isLoading, scenarios.length, householdId]);

  const handleAdd = useCallback((template: "blank" | "early" | "higher") => {
    if (!householdId || !activeValues) return;
    const base = activeValues;
    let name = "New Scenario";
    let values = { ...base };
    if (template === "early") { name = "Early Retirement"; values = { ...base, retireAge: Math.max(50, base.retireAge - 5) }; }
    else if (template === "higher") { name = "Higher Contributions"; values = { ...base, monthlyContrib: Math.round(base.monthlyContrib * 1.5) }; }
    else { name = `Scenario ${scenarios.length + 1}`; }
    upsert.mutate({
      id: null,
      values: {
        household_id: householdId, name,
        current_age: values.currentAge, retirement_age: values.retireAge,
        current_pot: values.currentPot, monthly_contribution: values.monthlyContrib,
        employer_contribution: values.employerContrib, expected_return: values.expectedReturn,
        inflation_rate: values.inflation,
        ...(canPersistTaxFreeCash ? { tax_free_cash_pct: values.taxFreeCashPct } : {}),
        ...(canPersistTaxFreeCashOptions
          ? {
              tax_free_cash_enabled: values.taxFreeCashEnabled,
              tax_free_cash_age: values.taxFreeCashAge,
            }
          : {}),
        target_income: values.targetIncome,
      },
    });
  }, [householdId, activeValues, scenarios.length, upsert, canPersistTaxFreeCash, canPersistTaxFreeCashOptions]);

  const handleDelete = useCallback(async (id: string) => {
    if (scenarios.length <= 1) return;
    const { error } = await supabase.from("retirement_scenarios").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setLocalEdits((prev) => { const n = { ...prev }; delete n[id]; return n; });
    if (activeId === id) {
      const nextScenarioId = scenarios.find((s) => s.id !== id)?.id ?? null;
      setActiveId(nextScenarioId);
      setSelectedScenario.mutate(nextScenarioId, {
        onError: () => toast.error("Failed to remember selected scenario"),
      });
    }
    qc.invalidateQueries({ queryKey: ["retirement_scenarios", householdId] });
  }, [scenarios, activeId, householdId, qc, setSelectedScenario]);

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
    { label: "Tax-Free Cash", value: activeValues.taxFreeCashPct, onChange: (v: number) => setField("tax_free_cash_pct", v), min: 0, max: 25, step: 1, format: (v: number) => activeValues.taxFreeCashEnabled ? `${v}%` : "Not taken", disabled: !activeValues.taxFreeCashEnabled },
    { label: "Tax-Free Cash Age", value: Math.max(activeValues.taxFreeCashAge, activeValues.retireAge), onChange: (v: number) => setField("tax_free_cash_age", v), min: activeValues.retireAge, max: 75, step: 1, format: (v: number) => activeValues.taxFreeCashEnabled ? `${v}` : "Not taken", disabled: !activeValues.taxFreeCashEnabled },
    { label: "State Pension %", value: statePensionPct, onChange: setStatePensionPct, min: 0, max: 100, step: 5, format: (v: number) => `${v}%` },
    { label: "Drawdown Rate", value: drawdownRate, onChange: setDrawdownRate, min: 2, max: 8, step: 0.5, format: (v: number) => `${v}%` },
  ] : [];

  const advancedToggles = activeValues ? [
    {
      label: "Take tax-free cash",
      description: activeValues.taxFreeCashEnabled
        ? "Model a one-off DC pension lump sum."
        : "Keep the full DC pot invested for drawdown.",
      checked: activeValues.taxFreeCashEnabled,
      onChange: (checked: boolean) => setField("tax_free_cash_enabled", checked),
    },
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const scenarioMetas: ScenarioMeta[] = scenarios.map((s) => ({ id: s.id, name: s.name }));
  const sortedProjections = [...allProjections].sort((a, b) => b.projection.readinessPct - a.projection.readinessPct);
  const bestScenario = sortedProjections[0] ?? null;
  const downsideScenario = sortedProjections[sortedProjections.length - 1] ?? null;
  const planningAssumptions = [
    { label: "Investment returns", value: activeValues ? `${activeValues.expectedReturn.toFixed(1)}% p.a. (nominal)` : "—", adjustable: true },
    { label: "Inflation", value: activeValues ? `${activeValues.inflation.toFixed(1)}% p.a.` : "—", adjustable: true },
    { label: "State Pension age", value: `${STATE_PENSION_AGE}`, adjustable: false },
    { label: "Life expectancy", value: `${DEFAULT_LONGEVITY} years`, adjustable: false },
    {
      label: "Tax-free cash",
      value: activeValues?.taxFreeCashEnabled
        ? `${activeValues.taxFreeCashPct.toFixed(0)}% at age ${activeValues.taxFreeCashAge}`
        : "Not taken",
      adjustable: true,
    },
    { label: "Drawdown rate", value: `${drawdownRate.toFixed(1)}%`, adjustable: true },
  ];

  return (
    <motion.div className="space-y-8" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item}>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Plan</h1>
        <p className="mt-2 text-muted-foreground">Compare scenarios, explore trade-offs, and tune the assumptions behind your retirement plan.</p>
      </motion.div>

      <motion.div variants={stagger.item}>
        <ScenarioTabs
          scenarios={scenarioMetas}
          activeId={activeId ?? ""}
          compareMode={compareMode}
          onSelect={handleSelectScenario}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onToggleCompare={() => setCompareMode(!compareMode)}
        />
      </motion.div>

      <motion.div variants={stagger.item} className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Scenarios</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose a scenario to edit, or compare them side by side.</p>
        </div>
        <div className="space-y-4">
          {allProjections.map(({ scenario, values, projection: scenarioProjection }) => {
            const isActive = scenario.id === activeId;
            return (
              <button
                key={scenario.id}
                onClick={() => {
                  handleSelectScenario(scenario.id);
                  if (compareMode) setCompareMode(false);
                }}
                className={cn(
                  "card-surface group w-full p-8 text-left transition-all hover:shadow-sm",
                  isActive && "border-primary border-2"
                )}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold text-foreground">{scenario.name}</h3>
                      {isActive && (
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
                      <div>
                        <p className="text-sm text-muted-foreground">Retirement Age</p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{values.retireAge}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Income</p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                          {formatCurrency(Math.round(scenarioProjection.totalIncome / 12))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {scenarioProjection.readinessPct >= 100 ? "Very High" : scenarioProjection.readinessPct >= 90 ? "High" : scenarioProjection.readinessPct >= 75 ? "Medium" : "Low"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Contributions</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {formatCurrency(values.monthlyContrib + values.employerContrib)}/mo
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Outcome</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">{scenarioProjection.readinessPct}% of target</p>
                      </div>
                    </div>

                    {isActive && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-success">
                        <Check className="h-4 w-4" />
                        <span>Currently using this scenario</span>
                      </div>
                    )}
                  </div>

                  <span className="rounded-xl p-2 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    <ChevronRight className="h-5 w-5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

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

      {!compareMode && projection && activeValues && (
        <>
          <motion.div variants={stagger.item} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="card-surface p-8">
              <h2 className="text-xl font-semibold text-foreground">Best Case Scenario</h2>
              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-sm text-muted-foreground">Retirement Age</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                    {bestScenario ? bestScenario.values.retireAge : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-success">
                    {bestScenario ? formatCurrency(Math.round(bestScenario.projection.totalIncome / 12)) : "—"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">What drives it</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      Higher readiness and stronger income cover
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      Better balance between retirement age and contributions
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      More resilient against late-stage shortfall
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card-surface p-8">
              <h2 className="text-xl font-semibold text-foreground">Downside Case</h2>
              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-sm text-muted-foreground">Retirement Age</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                    {downsideScenario ? downsideScenario.values.retireAge : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-destructive">
                    {downsideScenario ? formatCurrency(Math.round(downsideScenario.projection.totalIncome / 12)) : "—"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">What weakens it</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      Lower readiness against your target income
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      Less room for bridge years before State Pension
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      Greater dependency on drawdown from DC assets
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card-surface p-8">
              <h2 className="text-xl font-semibold text-foreground">Planning Assumptions</h2>
              <div className="mt-4 space-y-4">
                {planningAssumptions.map((assumption) => (
                  <div key={assumption.label} className="flex items-center justify-between border-b border-border/50 py-3 last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{assumption.label}</p>
                      {!assumption.adjustable && (
                        <p className="mt-1 text-xs text-muted-foreground">Fixed by policy or product rules</p>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-foreground">{assumption.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={stagger.item}>
            <HeroOutcome projection={projection} retireAge={activeValues.retireAge} targetIncome={activeValues.targetIncome} />
          </motion.div>

          <motion.div variants={stagger.item} className="card-surface p-8">
            <h2 className="text-2xl font-semibold text-foreground">Retirement Funding Mix</h2>
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-sm text-muted-foreground">Guaranteed income</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                  {formatCurrency(Math.round((fundingMix?.stableIncome ?? 0) / 12))}/mo
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Scenario-adjusted DB pensions plus State Pension when available.</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Flexible drawdown capacity</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                  {formatCurrency(Math.round((fundingMix?.flexibleIncome ?? 0) / 12))}/mo
                </p>
                <p className="mt-1 text-sm text-muted-foreground">From DC pensions and ISA drawdown in the selected scenario.</p>
              </div>
              <div className="border-t border-border/60 pt-5">
                <p className="text-sm text-muted-foreground">What this means</p>
                <p className="mt-2 text-base text-foreground">
                  Your selected scenario supports an estimated {formatCurrency(Math.round((fundingMix?.totalIncome ?? 0) / 12))}/month,
                  with {formatCurrency(Math.round((fundingMix?.stableIncome ?? 0) / 12))}/month coming from more stable sources.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-6">
              <IncomeTimeline timeline={projection.timeline} retireAge={activeValues.retireAge} targetIncome={activeValues.targetIncome} />
              <ActionsPanel actions={actions} />
            </div>
            <QuickControls quickSliders={quickSliders} advancedSliders={advancedSliders} advancedToggles={advancedToggles} isSaving={upsert.isPending} />
          </div>

          <motion.div variants={stagger.item}>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Income Sources</h2>
              <p className="mt-2 text-sm text-muted-foreground">Breakdown of where your retirement income comes from in the selected scenario.</p>
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

      {compareMode && activeValues && (
        <div className="max-w-md">
          <QuickControls quickSliders={quickSliders} advancedSliders={advancedSliders} advancedToggles={advancedToggles} isSaving={upsert.isPending} />
        </div>
      )}
    </motion.div>
  );
}
