import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const taxYear = "2025/26";

interface Allowance {
  label: string;
  used: number;
  limit: number;
  warning?: string;
}

const allowances: Allowance[] = [
  { label: "ISA Allowance", used: 18000, limit: 20000 },
  { label: "Pension Annual Allowance", used: 9000, limit: 60000 },
  { label: "Capital Gains Allowance", used: 1200, limit: 3000 },
  { label: "Dividend Allowance", used: 500, limit: 500, warning: "Fully used" },
];

export default function TaxPage() {
  const ani = 72000;
  const aniWarning = ani >= 100000;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tax</h1>
        <p className="text-sm text-muted-foreground mt-1">Tax year {taxYear} — Allowances & thresholds</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-xl border p-5",
          aniWarning ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          {aniWarning ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-success" />
          )}
          <h2 className="text-sm font-semibold text-card-foreground">Adjusted Net Income (ANI)</h2>
        </div>
        <p className="text-3xl font-semibold text-card-foreground">{formatCurrency(ani)}</p>
        {aniWarning ? (
          <p className="text-sm text-destructive mt-1">Above £100k: personal allowance tapering applies</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">Below £100k threshold — no personal allowance tapering</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Higher-rate (40%) taxpayer · Consider salary sacrifice to reduce ANI
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {allowances.map((a) => {
          const pct = Math.min((a.used / a.limit) * 100, 100);
          const remaining = a.limit - a.used;
          const isFull = remaining <= 0;

          return (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-xl border bg-card p-5",
                isFull ? "border-warning/30" : "border-border"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm font-medium text-card-foreground">{a.label}</p>
                {a.warning && (
                  <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                    {a.warning}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-lg font-semibold text-card-foreground">{formatCurrency(a.used)}</span>
                <span className="text-sm text-muted-foreground">of {formatCurrency(a.limit)}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isFull ? "bg-warning" : pct > 80 ? "bg-warning" : "bg-primary"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {!isFull && (
                <p className="text-xs text-muted-foreground mt-2">{formatCurrency(remaining)} remaining</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
