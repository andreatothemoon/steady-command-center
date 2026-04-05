import { useMemo } from "react";
import { motion } from "framer-motion";
import { Target, ChevronRight, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Account } from "@/hooks/useAccounts";
import { useDBPensions } from "@/hooks/useDBPensions";
import { projectDBPension } from "@/lib/dbPensionEngine";

interface Props {
  accounts: Account[];
}

export default function RetirementProgress({ accounts }: Props) {
  const navigate = useNavigate();
  const { householdId } = useAuth();
  const { data: dbPensions = [] } = useDBPensions();

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

  // Derive pension pot from accounts
  const pensionPot = accounts
    .filter((a) => ["sipp", "workplace_pension"].includes(a.account_type))
    .reduce((s, a) => s + Number(a.current_value), 0);

  // DB pension projected income
  const totalDBIncome = useMemo(() => {
    if (!dbPensions.length) return 0;
    return dbPensions.reduce((sum, p) => {
      const proj = projectDBPension({
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
      });
      return sum + proj.projected_annual_income;
    }, 0);
  }, [dbPensions]);

  const UK_STATE_PENSION = 11502;

  // Use scenario from DB or sensible defaults
  const currentAge = scenario?.current_age ?? 35;
  const retireAge = scenario?.retirement_age ?? 57;
  const monthlyContrib = (scenario?.monthly_contribution ?? 750) + (scenario?.employer_contribution ?? 500);
  const expectedReturn = (scenario?.expected_return ?? 5) / 100;
  const inflation = (scenario?.inflation_rate ?? 2.5) / 100;
  const targetIncome = scenario?.target_income ?? 30000;
  const currentPot = scenario?.current_pot ?? pensionPot;

  const { finalReal, readiness, status, estimatedIncome } = useMemo(() => {
    const years = retireAge - currentAge;
    if (years <= 0) {
      const dcIncome = Math.round(currentPot * 0.04);
      const total = dcIncome + totalDBIncome + UK_STATE_PENSION;
      return { finalReal: currentPot, readiness: Math.min(Math.round((total / targetIncome) * 100), 150), status: "ahead" as const, estimatedIncome: total };
    }
    const monthlyReal = (expectedReturn - inflation) / 12;
    let pot = currentPot;
    for (let m = 0; m < years * 12; m++) {
      pot = pot * (1 + monthlyReal) + monthlyContrib;
    }
    const dcIncome = Math.round(pot * 0.04);
    const totalIncome = dcIncome + totalDBIncome + UK_STATE_PENSION;
    const pct = Math.min(Math.round((totalIncome / targetIncome) * 100), 150);
    const st: "on_track" | "ahead" | "behind" = pct >= 100 ? "ahead" : pct >= 80 ? "on_track" : "behind";
    return { finalReal: Math.round(pot), readiness: pct, status: st, estimatedIncome: totalIncome };
  }, [currentPot, retireAge, currentAge, monthlyContrib, expectedReturn, inflation, targetIncome, totalDBIncome]);

  // Empty state — no scenario created yet
  if (!isLoading && !scenario) {
    return (
      <div className="card-insight p-5 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground/50" />
            <p className="label-muted" style={{ opacity: 1 }}>Retirement Readiness</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-sm text-muted-foreground">No retirement scenario configured yet</p>
          <button
            onClick={() => navigate("/retirement")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Set up projection
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-insight p-5 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-muted-foreground/50" />
          <p className="label-muted" style={{ opacity: 1 }}>Retirement Readiness</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-insight p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground/50" />
          <p className="label-muted" style={{ opacity: 1 }}>Retirement Readiness</p>
        </div>
        <button
          onClick={() => navigate("/retirement")}
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
        >
          Details <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Readiness percentage */}
      <div className="flex items-end gap-3 mb-4">
        <span className={cn(
          "text-4xl font-bold tabular-nums tracking-tight",
          status === "ahead" ? "text-success" : status === "on_track" ? "text-card-foreground" : "text-warning"
        )}>
          {readiness}%
        </span>
        <span className={cn(
          "text-xs font-semibold px-2 py-0.5 rounded-full mb-1",
          status === "ahead" && "status-safe",
          status === "on_track" && "bg-primary/10 text-primary",
          status === "behind" && "status-warning"
        )}>
          {status === "ahead" ? "Ahead" : status === "on_track" ? "On Track" : "Behind"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-secondary/40 overflow-hidden mb-4">
        <motion.div
          className={cn(
            "h-full rounded-full",
            status === "ahead" ? "bg-success" : status === "on_track" ? "bg-primary" : "bg-warning"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(readiness, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </div>

      {/* Key stats */}
      <div className="space-y-2 mt-auto">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Projected pot (real)</span>
          <span className="text-card-foreground font-medium tabular-nums">{formatCurrency(finalReal)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Est. annual income</span>
          <span className="text-card-foreground font-medium tabular-nums">{formatCurrency(estimatedIncome)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Target income</span>
          <span className="text-card-foreground font-medium tabular-nums">{formatCurrency(targetIncome)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Retire at</span>
          <span className="text-card-foreground font-medium">{retireAge}</span>
        </div>
        {scenario && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Scenario</span>
            <span className="text-card-foreground font-medium truncate max-w-[120px]">{scenario.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
