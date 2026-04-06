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

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

export default function RetirementPage() {
  const { householdId } = useAuth();
  const qc = useQueryClient();

  // Load scenario
  const { data: scenario, isLoading } = useQuery({
    queryKey: ["retirement_scenario_primary", householdId],
    queryFn: async () => {
      if (!householdId) return null;
      const { data, error } = await supabase
        .from("retirement_scenarios")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!householdId,
  });

  const { data: dbPensions = [] } = useDBPensions();

  // State
  const [currentAge, setCurrentAge] = useState(35);
  const [retireAge, setRetireAge] = useState(57);
  const [currentPot, setCurrentPot] = useState(212700);
  const [monthlyContrib, setMonthlyContrib] = useState(750);
  const [employerContrib, setEmployerContrib] = useState(500);
  const [expectedReturn, setExpectedReturn] = useState(5);
  const [inflation, setInflation] = useState(2.5);
  const [targetIncome, setTargetIncome] = useState(30000);
  const [statePensionPct, setStatePensionPct] = useState(100);
  const [drawdownRate, setDrawdownRate] = useState(4);

  // Seed from DB
  const seeded = useRef(false);
  useEffect(() => {
    if (scenario && !seeded.current) {
      seeded.current = true;
      setCurrentAge(scenario.current_age);
      setRetireAge(scenario.retirement_age);
      setCurrentPot(Number(scenario.current_pot));
      setMonthlyContrib(Number(scenario.monthly_contribution));
      setEmployerContrib(Number(scenario.employer_contribution));
      setExpectedReturn(Number(scenario.expected_return));
      setInflation(Number(scenario.inflation_rate));
      setTargetIncome(Number(scenario.target_income));
    }
  }, [scenario]);

  // Upsert mutation
  const upsert = useMutation({
    mutationFn: async (values: {
      current_age: number;
      retirement_age: number;
      current_pot: number;
      monthly_contribution: number;
      employer_contribution: number;
      expected_return: number;
      inflation_rate: number;
      target_income: number;
    }) => {
      if (!householdId) throw new Error("No household");
      if (scenario?.id) {
        const { error } = await supabase
          .from("retirement_scenarios")
          .update(values)
          .eq("id", scenario.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("retirement_scenarios")
          .insert({ ...values, household_id: householdId, name: "Default Scenario" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["retirement_scenario_primary", householdId] });
    },
    onError: () => toast.error("Failed to save scenario"),
  });

  // Debounced save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      upsert.mutate({
        current_age: currentAge,
        retirement_age: retireAge,
        current_pot: currentPot,
        monthly_contribution: monthlyContrib,
        employer_contribution: employerContrib,
        expected_return: expectedReturn,
        inflation_rate: inflation,
        target_income: targetIncome,
      });
    }, 800);
  }, [currentAge, retireAge, currentPot, monthlyContrib, employerContrib, expectedReturn, inflation, targetIncome]);

  const initialLoad = useRef(true);
  useEffect(() => {
    if (isLoading) return;
    if (initialLoad.current) { initialLoad.current = false; return; }
    scheduleSave();
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [currentAge, retireAge, currentPot, monthlyContrib, employerContrib, expectedReturn, inflation, targetIncome, isLoading]);

  // Build DB pension params
  const dbPensionParams: DBPensionParams[] = useMemo(() =>
    dbPensions.map((p) => ({
      current_age: p.current_age,
      retirement_age: p.retirement_age,
      current_salary: Number(p.current_salary),
      salary_growth_rate: Number(p.salary_growth_rate),
      accrual_rate: Number(p.accrual_rate),
      is_active_member: p.is_active_member,
      revaluation_type: p.revaluation_type,
      revaluation_rate: Number(p.revaluation_rate),
      revaluation_uplift: Number(p.revaluation_uplift),
      existing_income: Number(p.existing_income),
    })),
    [dbPensions]
  );

  // Compute projection
  const inputs: RetirementInputs = useMemo(() => ({
    currentAge,
    retireAge,
    currentPot,
    monthlyContrib,
    employerContrib,
    expectedReturn,
    inflation,
    targetIncome,
    statePensionPct,
    drawdownRate: drawdownRate / 100,
  }), [currentAge, retireAge, currentPot, monthlyContrib, employerContrib, expectedReturn, inflation, targetIncome, statePensionPct, drawdownRate]);

  const projection = useMemo(() => computeRetirement(inputs, dbPensionParams), [inputs, dbPensionParams]);
  const actions = useMemo(() => generateActions(inputs, projection, dbPensionParams), [inputs, projection, dbPensionParams]);

  // Slider configs
  const quickSliders = [
    { label: "Retirement Age", value: retireAge, onChange: setRetireAge, min: 50, max: 75, step: 1, format: (v: number) => `${v}` },
    { label: "Target Income", value: targetIncome, onChange: setTargetIncome, min: 10000, max: 100000, step: 1000, format: formatCurrency },
    { label: "Your Monthly", value: monthlyContrib, onChange: setMonthlyContrib, min: 0, max: 5000, step: 50, format: formatCurrency },
    { label: "Expected Return", value: expectedReturn, onChange: setExpectedReturn, min: 1, max: 10, step: 0.5, format: (v: number) => `${v}%` },
  ];

  const advancedSliders = [
    { label: "Current Age", value: currentAge, onChange: setCurrentAge, min: 18, max: 65, step: 1, format: (v: number) => `${v}` },
    { label: "Current Pot", value: currentPot, onChange: setCurrentPot, min: 0, max: 1000000, step: 5000, format: formatCurrency },
    { label: "Employer Monthly", value: employerContrib, onChange: setEmployerContrib, min: 0, max: 5000, step: 50, format: formatCurrency },
    { label: "Inflation", value: inflation, onChange: setInflation, min: 0, max: 6, step: 0.5, format: (v: number) => `${v}%` },
    { label: "State Pension %", value: statePensionPct, onChange: setStatePensionPct, min: 0, max: 100, step: 5, format: (v: number) => `${v}%` },
    { label: "Drawdown Rate", value: drawdownRate, onChange: setDrawdownRate, min: 2, max: 8, step: 0.5, format: (v: number) => `${v}%` },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Retirement Planner</h1>
        <p className="label-subtle mt-1">Your retirement income, projected by source</p>
      </motion.div>

      {/* Hero outcome cards */}
      <motion.div variants={stagger.item}>
        <HeroOutcome projection={projection} retireAge={retireAge} targetIncome={targetIncome} />
      </motion.div>

      {/* Chart + Controls */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IncomeTimeline timeline={projection.timeline} retireAge={retireAge} targetIncome={targetIncome} />
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
          retireAge={retireAge}
          drawdownRate={drawdownRate / 100}
        />
      </motion.div>
    </motion.div>
  );
}
