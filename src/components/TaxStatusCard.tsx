import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, ChevronRight, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Props {
  ani: number;
  pensionContributions?: number;
  isaUsed?: number;
  isaLimit?: number;
  adults?: number;
  children?: number;
}

export default function TaxStatusCard({ ani, pensionContributions = 0, isaUsed = 0, isaLimit = 20000, adults = 1, children: childCount = 0 }: Props) {
  const navigate = useNavigate();
  const threshold = 100000;
  const buffer = Math.max(0, threshold - ani);
  const pct = Math.min((ani / threshold) * 100, 100);
  const overThreshold = ani >= threshold;
  const approaching = !overThreshold && buffer < 15000;

  const status: "safe" | "warning" | "danger" = overThreshold ? "danger" : approaching ? "warning" : "safe";

  const suggestions: string[] = [];
  if (overThreshold) {
    const excess = ani - threshold;
    suggestions.push(`Contribute ${formatCurrency(excess)} more to pension to drop below £100k`);
  } else if (approaching) {
    suggestions.push(`You can contribute ${formatCurrency(buffer)} to pension and stay below £100k`);
  }
  if (pensionContributions > 0 && pensionContributions < 500 * 12) {
    suggestions.push("Consider increasing salary sacrifice by £500/month");
  }
  const isaRemaining = isaLimit - isaUsed;
  if (isaRemaining > 0 && isaRemaining < 5000) {
    suggestions.push(`ISA allowance remaining: ${formatCurrency(isaRemaining)} — deadline approaching`);
  }

  return (
    <div className="card-insight p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="label-muted" style={{ opacity: 1 }}>Tax Status</p>
        <button onClick={() => navigate("/profile")} className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* ANI with status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">Est. Adjusted Net Income</p>
          <p className={cn("text-2xl font-bold tabular-nums tracking-tight", 
            status === "danger" ? "text-destructive" : status === "warning" ? "text-warning" : "text-card-foreground"
          )}>
            {formatCurrency(ani)}
          </p>
        </div>
        <div className={cn(
          status === "safe" && "status-safe",
          status === "warning" && "status-warning",
          status === "danger" && "status-danger",
        )}>
          {status === "safe" ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {status === "safe" ? "Safe" : status === "warning" ? "Approaching" : "At Risk"}
        </div>
      </div>

      {/* Threshold bar */}
      <div className="threshold-bar mb-1.5">
        <motion.div
          className={cn("threshold-bar-fill",
            status === "danger" ? "bg-destructive" : status === "warning" ? "bg-warning" : "bg-primary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        />
        <div className="threshold-marker" style={{ left: "100%" }} />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-4">
        <span>{formatCurrency(0)}</span>
        <span className="font-medium">{formatCurrency(threshold)} threshold</span>
      </div>

      {/* Buffer remaining */}
      {!overThreshold && (
        <p className="text-[11px] text-muted-foreground mb-3">
          <span className="font-medium text-card-foreground">{formatCurrency(buffer)}</span> buffer before personal allowance tapering
        </p>
      )}

      {/* Actionable suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-border/50">
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <TrendingDown className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}