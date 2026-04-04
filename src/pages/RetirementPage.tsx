import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceDot } from "recharts";
import { formatCurrency } from "@/lib/format";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

  const [currentAge, setCurrentAge] = useState(35);
  const [retireAge, setRetireAge] = useState(57);
  const [currentPot, setCurrentPot] = useState(212700);
  const [monthlyContrib, setMonthlyContrib] = useState(750);
  const [employerContrib, setEmployerContrib] = useState(500);
  const [expectedReturn, setExpectedReturn] = useState(5);
  const [inflation, setInflation] = useState(2.5);
  const [targetIncome, setTargetIncome] = useState(30000);

  // Seed local state from DB once loaded
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
    onError: (err) => {
      toast.error("Failed to save scenario");
      console.error(err);
    },
  });

  // Debounced auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedulesSave = useCallback(() => {
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

  // Trigger save when any value changes (skip initial load)
  const initialLoad = useRef(true);
  useEffect(() => {
    if (isLoading) return;
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    schedulesSave();
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [currentAge, retireAge, currentPot, monthlyContrib, employerContrib, expectedReturn, inflation, targetIncome, isLoading]);

  const projection = useMemo(() => {
    const years = retireAge - currentAge;
    const monthlyReturn = expectedReturn / 100 / 12;
    const monthlyInflation = inflation / 100 / 12;
    const totalMonthly = monthlyContrib + employerContrib;
    const data: { age: number; nominal: number; real: number }[] = [];
    let nominal = currentPot;
    let real = currentPot;
    for (let y = 0; y <= years; y++) {
      data.push({ age: currentAge + y, nominal: Math.round(nominal), real: Math.round(real) });
      for (let m = 0; m < 12; m++) {
        nominal = nominal * (1 + monthlyReturn) + totalMonthly;
        real = real * (1 + monthlyReturn - monthlyInflation) + totalMonthly;
      }
    }
    return data;
  }, [currentAge, retireAge, currentPot, monthlyContrib, employerContrib, expectedReturn, inflation]);

  const finalNominal = projection[projection.length - 1]?.nominal ?? 0;
  const finalReal = projection[projection.length - 1]?.real ?? 0;
  const drawdownRate = 0.04;
  const estimatedIncome = Math.round(finalReal * drawdownRate);
  const gap = targetIncome - estimatedIncome;
  const lastPoint = projection[projection.length - 1];

  const sliders = [
    { label: "Current Age", value: currentAge, onChange: setCurrentAge, min: 18, max: 65, step: 1, format: (v: number) => `${v}` },
    { label: "Retirement Age", value: retireAge, onChange: setRetireAge, min: 50, max: 75, step: 1, format: (v: number) => `${v}` },
    { label: "Current Pot", value: currentPot, onChange: setCurrentPot, min: 0, max: 1000000, step: 5000, format: formatCurrency },
    { label: "Your Monthly", value: monthlyContrib, onChange: setMonthlyContrib, min: 0, max: 5000, step: 50, format: formatCurrency },
    { label: "Employer Monthly", value: employerContrib, onChange: setEmployerContrib, min: 0, max: 5000, step: 50, format: formatCurrency },
    { label: "Expected Return", value: expectedReturn, onChange: setExpectedReturn, min: 1, max: 10, step: 0.5, format: (v: number) => `${v}%` },
    { label: "Inflation", value: inflation, onChange: setInflation, min: 0, max: 6, step: 0.5, format: (v: number) => `${v}%` },
    { label: "Target Income", value: targetIncome, onChange: setTargetIncome, min: 10000, max: 100000, step: 1000, format: formatCurrency },
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
      <motion.div variants={stagger.item}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Retirement</h1>
            <p className="label-subtle mt-1">Project your pension pot and retirement income</p>
          </div>
          {upsert.isPending && (
            <span className="text-[10px] text-muted-foreground/60 animate-pulse">Saving…</span>
          )}
        </div>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card-surface p-4">
          <p className="label-muted">Projected Pot (Real)</p>
          <p className="value-large mt-1.5">{formatCurrency(finalReal)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Nominal: {formatCurrency(finalNominal)}</p>
        </div>
        <div className="card-surface p-4">
          <p className="label-muted">Est. Annual Income</p>
          <p className="value-large mt-1.5">{formatCurrency(estimatedIncome)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">4% drawdown rate</p>
        </div>
        <div className={cn("card-surface p-4", gap > 0 ? "border-warning/20" : "border-success/20")}>
          <p className="label-muted">Income Gap</p>
          <p className={cn("value-large mt-1.5", gap > 0 ? "text-warning" : "text-success")}>
            {gap > 0 ? `-${formatCurrency(gap)}` : `+${formatCurrency(Math.abs(gap))}`}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {gap > 0 ? "Below target — increase contributions" : "On track to meet target"}
          </p>
        </div>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 hero-surface p-5">
          <p className="label-muted mb-4">Pension Projection</p>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={projection}>
              <defs>
                <linearGradient id="nomGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="age" tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} tickLine={false} axisLine={false} width={60} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="card-surface px-3 py-2 shadow-xl border border-border">
                      <p className="text-xs text-muted-foreground">Age {label}</p>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(payload[1]?.value as number)} real</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(payload[0]?.value as number)} nominal</p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="nominal" stroke="hsl(217, 91%, 60%)" strokeWidth={1.5} fill="url(#nomGrad)" animationDuration={1200} strokeDasharray="6 3" />
              <Area type="monotone" dataKey="real" stroke="hsl(142, 71%, 45%)" strokeWidth={2.5} fill="url(#realGrad)" animationDuration={1500} />
              {lastPoint && (
                <ReferenceDot x={lastPoint.age} y={lastPoint.real} r={4} fill="hsl(142, 71%, 45%)" stroke="hsl(222, 28%, 9%)" strokeWidth={2.5} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-insight p-5 space-y-4">
          <p className="label-muted">Assumptions</p>
          {sliders.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between mb-1.5">
                <span className="text-[11px] text-muted-foreground">{s.label}</span>
                <span className="text-[11px] font-semibold text-card-foreground tabular-nums">{s.format(s.value)}</span>
              </div>
              <Slider
                value={[s.value]}
                onValueChange={([v]) => s.onChange(v)}
                min={s.min}
                max={s.max}
                step={s.step}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
