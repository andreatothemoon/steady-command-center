import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, ChevronRight, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Props {
  ani: number;
  isaUsed: number;
  isaLimit: number;
  pensionContributions?: number;
}

function BarRow({
  label, used, limit, status,
}: {
  label: string;
  used: number;
  limit: number;
  status: "safe" | "warning" | "danger";
}) {
  const pct = Math.min((used / limit) * 100, 100);
  const remaining = limit - used;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className={cn(
          "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
          status === "safe" && "status-safe",
          status === "warning" && "status-warning",
          status === "danger" && "status-danger",
        )}>
          {status === "safe" ? "✓ Safe" : status === "warning" ? "⚠ Approaching" : "✕ At Risk"}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden mb-1">
        <motion.div
          className={cn(
            "h-full rounded-full",
            status === "danger" ? "bg-destructive" : status === "warning" ? "bg-warning" : "bg-primary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
        <span>{formatCurrency(used)} used</span>
        <span>{formatCurrency(remaining)} remaining</span>
      </div>
    </div>
  );
}

export default function TaxPosition({ ani, isaUsed, isaLimit, pensionContributions = 0 }: Props) {
  const navigate = useNavigate();
  const threshold = 100000;
  const buffer = Math.max(0, threshold - ani);
  const overThreshold = ani >= threshold;
  const approaching = !overThreshold && buffer < 15000;
  const aniStatus: "safe" | "warning" | "danger" = overThreshold ? "danger" : approaching ? "warning" : "safe";

  const isaRemaining = isaLimit - isaUsed;
  const isaStatus: "safe" | "warning" | "danger" = isaRemaining <= 0 ? "danger" : isaRemaining < 5000 ? "warning" : "safe";

  const pensionAA = 60000;
  const pensionStatus: "safe" | "warning" | "danger" =
    pensionContributions >= pensionAA ? "danger" : pensionContributions > pensionAA * 0.85 ? "warning" : "safe";

  // Actionable insight
  let insight = "";
  if (overThreshold) {
    insight = `Contribute ${formatCurrency(ani - threshold)} more to pension to drop below £100k`;
  } else if (approaching) {
    insight = `You can contribute ${formatCurrency(buffer)} to pension and stay below £100k`;
  }

  return (
    <div className="card-insight p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground/50" />
          <p className="label-muted" style={{ opacity: 1 }}>Tax Position</p>
        </div>
        <button
          onClick={() => navigate("/tax")}
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
        >
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* ANI headline */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[11px] text-muted-foreground mb-0.5">Adjusted Net Income</p>
          <p className={cn(
            "text-2xl font-bold tabular-nums tracking-tight",
            aniStatus === "danger" ? "text-destructive" : aniStatus === "warning" ? "text-warning" : "text-card-foreground"
          )}>
            {formatCurrency(ani)}
          </p>
        </div>
        <div className={cn(
          "text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1",
          aniStatus === "safe" && "status-safe",
          aniStatus === "warning" && "status-warning",
          aniStatus === "danger" && "status-danger",
        )}>
          {aniStatus === "safe" ? "Below £100k" : aniStatus === "warning" ? "Approaching" : "Over £100k"}
        </div>
      </div>

      {/* Allowance bars */}
      <div className="space-y-4 flex-1">
        <BarRow label="ISA Allowance" used={isaUsed} limit={isaLimit} status={isaStatus} />
        <BarRow label="Pension Annual Allowance" used={pensionContributions} limit={pensionAA} status={pensionStatus} />
      </div>

      {/* Insight */}
      {insight && (
        <div className="pt-3 mt-3 border-t border-border/40">
          <div className="flex items-start gap-2">
            <TrendingDown className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">{insight}</p>
          </div>
        </div>
      )}
    </div>
  );
}
