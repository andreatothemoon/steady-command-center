import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, ChevronRight, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { MemberANI } from "@/pages/OverviewPage";

interface Props {
  memberANIs: MemberANI[];
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

function getAniStatus(ani: number): "safe" | "warning" | "danger" {
  if (ani >= 100000) return "danger";
  if (ani > 85000) return "warning";
  return "safe";
}

export default function TaxPosition({ memberANIs, isaUsed, isaLimit, pensionContributions = 0 }: Props) {
  const navigate = useNavigate();

  // Find worst-case member
  const sorted = [...memberANIs].sort((a, b) => b.ani - a.ani);
  const worst = sorted[0];
  const worstStatus = worst ? getAniStatus(worst.ani) : "safe";

  const isaRemaining = isaLimit - isaUsed;
  const isaStatus: "safe" | "warning" | "danger" = isaRemaining <= 0 ? "danger" : isaRemaining < 5000 ? "warning" : "safe";

  const pensionAA = 60000;
  const pensionStatus: "safe" | "warning" | "danger" =
    pensionContributions >= pensionAA ? "danger" : pensionContributions > pensionAA * 0.85 ? "warning" : "safe";

  // Actionable insight for the worst-case member
  let insight = "";
  if (worst) {
    const threshold = 100000;
    const buffer = Math.max(0, threshold - worst.ani);
    if (worst.ani >= threshold) {
      insight = `${worst.name}: Contribute ${formatCurrency(worst.ani - threshold)} more to pension to drop below £100k`;
    } else if (buffer < 15000) {
      insight = `${worst.name}: Can contribute ${formatCurrency(buffer)} to pension and stay below £100k`;
    }
  }

  return (
    <div className="card-insight p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-secondary border border-border flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-muted-foreground/70" />
          </div>
          <div>
            <p className="text-base font-semibold text-card-foreground">Tax Position</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Allowance usage and income pressure at a glance.</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
        >
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Per-member ANI */}
      {memberANIs.length === 0 ? (
        <div className="mb-4">
          <p className="text-[11px] text-muted-foreground mb-0.5">Adjusted Net Income</p>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-card-foreground">—</p>
        </div>
      ) : (
        <div className="space-y-2.5 mb-5">
          {sorted.map((m) => {
            const status = getAniStatus(m.ani);
            return (
              <div key={m.name} className="flex items-center justify-between rounded-3xl border border-border/70 bg-white/70 px-4 py-3">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">{m.name}</p>
                  <p className={cn(
                    "text-xl font-semibold tabular-nums tracking-tight",
                    status === "danger" ? "text-destructive" : status === "warning" ? "text-warning" : "text-card-foreground"
                  )}>
                    {formatCurrency(m.ani)}
                  </p>
                </div>
                <div className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  status === "safe" && "status-safe",
                  status === "warning" && "status-warning",
                  status === "danger" && "status-danger",
                )}>
                  {status === "safe" ? "Below £100k" : status === "warning" ? "Approaching" : "Over £100k"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Allowance bars */}
      <div className="space-y-5 flex-1">
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
