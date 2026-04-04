import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceDot, Legend } from "recharts";
import { formatCurrency } from "@/lib/format";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useDBPensions } from "@/hooks/useDBPensions";
import { projectDBPension } from "@/lib/dbPensionEngine";

const UK_STATE_PENSION_FULL = 11502; // 2024/25 full new state pension £/yr

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

  const { data: dbPensions = [] } = useDBPensions();

  const [currentAge, setCurrentAge] = useState(35);
  const [retireAge, setRetireAge] = useState(57);
  const [currentPot, setCurrentPot] = useState(212700);
  const [monthlyContrib, setMonthlyContrib] = useState(750);
  const [employerContrib, setEmployerContrib] = useState(500);
  const [expectedReturn, setExpectedReturn] = useState(5);
  const [inflation, setInflation] = useState(2.5);
  const [targetIncome, setTargetIncome] = useState(30000);
  const [statePensionPct, setStatePensionPct] = useState(100);

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

  // DB pension projections (sum of all schemes)
  const dbPensionProjections = useMemo(() => {
    if (!dbPensions.length) return [];
    return dbPensions.map((p) =>
      projectDBPension({
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
      })
    );
  }, [dbPensions]);

  const totalDBIncome = useMemo(() => {
    return dbPensionProjections.reduce((sum, p) => sum + p.projected_annual_income, 0);
  }, [dbPensionProjections]);

  const statePensionIncome = Math.round(UK_STATE_PENSION_FULL * (statePensionPct / 100));

  // DC pot projection
  const projection = useMemo(() => {
    const years = retireAge - currentAge;
    const monthlyReturn = expectedReturn / 100 / 12;
    const monthlyInflation = inflation / 100 / 12;
    const totalMonthly = monthlyContrib + employerContrib;
    const data: { age: number; nominal: number; real: number; dcIncome: number; dbIncome: number; stateIncome: number; totalIncome: number }[] = [];
    let nominal = currentPot;
    let real = currentPot;

    // Build a lookup of DB total income by age
    const dbByAge: Record<number, number> = {};
    for (const proj of dbPensionProjections) {
      for (const pt of proj.yearly_projection) {
        dbByAge[pt.age] = (dbByAge[pt.age] ?? 0) + pt.total_income;
      }
    }

    for (let y = 0; y <= years; y++) {
      const age = currentAge + y;
      const drawdownIncome = y === years ? Math.round(real * 0.04) : 0;
      // DB income at retirement age (use final value for all)
      const dbAtAge = y === years ? totalDBIncome : (dbByAge[age] ?? 0);
      const stateAtAge = y === years && age >= 67 ? statePensionIncome : 0;
      data.push({
        age,
        nominal: Math.round(nominal),
        real: Math.round(real),
        dcIncome: drawdownIncome,
        dbIncome: dbAtAge,
        stateIncome: stateAtAge,
        totalIncome: drawdownIncome + (y === years ? totalDBIncome : 0) + stateAtAge,
      });
      for (let m = 0; m < 12; m++) {
        nominal = nominal * (1 + monthlyReturn) + totalMonthly;
        real = real * (1 + monthlyReturn - monthlyInflation) + totalMonthly;
      }
    }
    return data;
  }, [currentAge, retireAge, currentPot, monthlyContrib, employerContrib, expectedReturn, inflation, dbPensionProjections, totalDBIncome, statePensionIncome]);

  const finalNominal = projection[projection.length - 1]?.nominal ?? 0;
  const finalReal = projection[projection.length - 1]?.real ?? 0;
  const dcIncome = Math.round(finalReal * 0.04);
  const totalRetirementIncome = dcIncome + totalDBIncome + (retireAge >= 67 ? statePensionIncome : 0);
  const gap = targetIncome - totalRetirementIncome;
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
    { label: "State Pension %", value: statePensionPct, onChange: setStatePensionPct, min: 0, max: 100, step: 5, format: (v: number) => `${v}%` },
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

      {/* Income breakdown cards */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card-surface p-4">
          <p className="label-muted">DC Drawdown</p>
          <p className="value-large mt-1.5">{formatCurrency(dcIncome)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">4% of {formatCurrency(finalReal)}</p>
        </div>
        <div className="card-surface p-4">
          <p className="label-muted">DB Pensions</p>
          <p className="value-large mt-1.5">{formatCurrency(totalDBIncome)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {dbPensions.length} scheme{dbPensions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="card-surface p-4">
          <p className="label-muted">State Pension</p>
          <p className="value-large mt-1.5">{formatCurrency(statePensionIncome)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {statePensionPct}% of full ({formatCurrency(UK_STATE_PENSION_FULL)})
          </p>
        </div>
        <div className={cn("card-surface p-4 border", gap > 0 ? "border-warning/30" : "border-success/30")}>
          <p className="label-muted">Total vs Target</p>
          <p className="value-large mt-1.5">{formatCurrency(totalRetirementIncome)}</p>
          <p className={cn("text-[11px] mt-1 font-medium", gap > 0 ? "text-warning" : "text-success")}>
            {gap > 0 ? `${formatCurrency(gap)} shortfall` : `${formatCurrency(Math.abs(gap))} surplus`}
          </p>
        </div>
      </motion.div>

      {/* DB pension detail (if any) */}
      {dbPensions.length > 0 && (
        <motion.div variants={stagger.item} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dbPensions.map((p, i) => {
            const proj = dbPensionProjections[i];
            if (!proj) return null;
            return (
              <div key={p.id} className="card-surface p-4">
                <p className="text-xs font-semibold text-card-foreground">{p.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{p.scheme_type} · 1/{p.accrual_rate}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Current entitlement</span>
                    <span className="text-card-foreground font-medium">{formatCurrency(proj.current_annual_income)}/yr</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Projected at {p.retirement_age}</span>
                    <span className="text-card-foreground font-semibold">{formatCurrency(proj.projected_annual_income)}/yr</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Existing (revalued)</span>
                    <span className="text-muted-foreground">{formatCurrency(proj.breakdown.existing_entitlement)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Future accrual</span>
                    <span className="text-muted-foreground">{formatCurrency(proj.breakdown.future_accrual)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Chart + sliders */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 hero-surface p-5">
          <p className="label-muted mb-4">DC Pension Projection</p>
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
