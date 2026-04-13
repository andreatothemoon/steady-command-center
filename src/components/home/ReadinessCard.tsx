import { motion } from "framer-motion";
import { Target, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RetirementProjection } from "@/lib/retirementEngine";

interface Props {
  projection: RetirementProjection | null;
  retireAge: number;
  targetIncome: number;
}

export default function ReadinessCard({ projection, retireAge, targetIncome }: Props) {
  if (!projection) {
    return (
      <div className="card-insight p-5 flex items-center justify-center min-h-[140px]">
        <p className="text-sm text-muted-foreground">No scenario configured</p>
      </div>
    );
  }

  const pct = projection.readinessPct;
  const status = pct >= 100 ? "ahead" : pct >= 80 ? "on_track" : "behind";

  return (
    <div className="card-insight p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 text-muted-foreground/50" />
        <p className="label-muted" style={{ opacity: 1 }}>Readiness</p>
      </div>

      <div className="flex items-end gap-3 mb-3">
        <span className={cn(
          "text-4xl font-bold tabular-nums tracking-tight",
          status === "ahead" ? "text-success" : status === "on_track" ? "text-card-foreground" : "text-warning"
        )}>
          {pct}%
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

      <div className="h-2 rounded-full bg-secondary/40 overflow-hidden mb-4">
        <motion.div
          className={cn(
            "h-full rounded-full",
            status === "ahead" ? "bg-success" : status === "on_track" ? "bg-primary" : "bg-warning"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </div>

      <div className="space-y-2 mt-auto">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">Projected annual income</span>
          <span className="text-card-foreground font-semibold tabular-nums">{formatCurrency(projection.totalIncome)}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">Target annual income</span>
          <span className="text-card-foreground font-medium tabular-nums">{formatCurrency(targetIncome)}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">DC pot at {retireAge} (real)</span>
          <span className="text-card-foreground font-medium tabular-nums">{formatCurrency(projection.dcPotAtRetirement)}</span>
        </div>
        {projection.dcDepletionAge && (
          <div className="flex justify-between text-[11px]">
            <span className="text-destructive/80">DC pot depletes at</span>
            <span className="text-destructive font-semibold">Age {projection.dcDepletionAge}</span>
          </div>
        )}
      </div>
    </div>
  );
}
