import { useMemo } from "react";
import { motion } from "framer-motion";
import { Target, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { Account } from "@/hooks/useAccounts";

interface Props {
  accounts: Account[];
}

export default function RetirementProgress({ accounts }: Props) {
  const navigate = useNavigate();

  // Derive pension pot from accounts
  const currentPot = accounts
    .filter((a) => ["sipp", "workplace_pension"].includes(a.account_type))
    .reduce((s, a) => s + Number(a.current_value), 0);

  // Simplified projection defaults
  const currentAge = 35;
  const retireAge = 57;
  const monthlyContrib = 1250; // employee + employer
  const expectedReturn = 0.05;
  const inflation = 0.025;
  const targetIncome = 30000;

  const { finalReal, readiness, status } = useMemo(() => {
    const years = retireAge - currentAge;
    const monthlyReal = (expectedReturn - inflation) / 12;
    let pot = currentPot;
    for (let m = 0; m < years * 12; m++) {
      pot = pot * (1 + monthlyReal) + monthlyContrib;
    }
    const income = Math.round(pot * 0.04);
    const pct = Math.min(Math.round((income / targetIncome) * 100), 150);
    const st: "on_track" | "ahead" | "behind" = pct >= 100 ? "ahead" : pct >= 80 ? "on_track" : "behind";
    return { finalReal: Math.round(pot), readiness: pct, status: st };
  }, [currentPot]);

  const estimatedIncome = Math.round(finalReal * 0.04);

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
      </div>
    </div>
  );
}
