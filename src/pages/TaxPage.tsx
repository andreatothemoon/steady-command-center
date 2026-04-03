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

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

export default function TaxPage() {
  const ani = 72000;
  const aniWarning = ani >= 100000;

  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tax</h1>
        <p className="label-subtle mt-1">Tax year {taxYear} — Allowances & thresholds</p>
      </motion.div>

      <motion.div
        variants={stagger.item}
        className={cn(
          "p-5 rounded-xl border",
          aniWarning ? "card-alert" : "hero-surface"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          {aniWarning ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-success" />
          )}
          <p className="label-muted">Adjusted Net Income (ANI)</p>
        </div>
        <p className="value-hero text-3xl">{formatCurrency(ani)}</p>
        {aniWarning ? (
          <p className="text-sm text-destructive mt-1">Above £100k — personal allowance tapering applies</p>
        ) : (
          <p className="label-subtle mt-1">Below £100k threshold — no personal allowance tapering</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-2">
          Higher-rate (40%) taxpayer · Consider salary sacrifice to reduce ANI
        </p>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {allowances.map((a) => {
          const pct = Math.min((a.used / a.limit) * 100, 100);
          const remaining = a.limit - a.used;
          const isFull = remaining <= 0;

          return (
            <div
              key={a.label}
              className={cn(
                "card-surface p-4",
                isFull && "border-warning/20"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <p className="label-muted">{a.label}</p>
                {a.warning && (
                  <span className="text-[10px] font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {a.warning}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="value-compact">{formatCurrency(a.used)}</span>
                <span className="text-sm text-muted-foreground">of {formatCurrency(a.limit)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    isFull ? "bg-warning" : pct > 80 ? "bg-warning" : "bg-primary"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              {!isFull && (
                <p className="text-[11px] text-muted-foreground mt-1.5">{formatCurrency(remaining)} remaining</p>
              )}
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
