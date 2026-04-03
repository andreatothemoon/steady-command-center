import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { mockContributions } from "@/data/mockData";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const tagColors: Record<string, string> = {
  pension: "bg-chart-1/10 text-chart-1",
  isa: "bg-chart-2/10 text-chart-2",
  mortgage: "bg-chart-4/10 text-chart-4",
};

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

export default function ContributionsPage() {
  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contributions</h1>
        <p className="label-subtle mt-1">Track meaningful cash flows</p>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card-surface p-4">
          <p className="label-muted">Pension (This Year)</p>
          <p className="value-compact mt-1.5">{formatCurrency(9000)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Employee + Employer</p>
        </div>
        <div className="card-surface p-4">
          <p className="label-muted">ISA (This Year)</p>
          <p className="value-compact mt-1.5">{formatCurrency(18000)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">£2,000 remaining</p>
        </div>
        <div className="card-surface p-4">
          <p className="label-muted">Mortgage Overpayments</p>
          <p className="value-compact mt-1.5">{formatCurrency(2000)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">This tax year</p>
        </div>
      </motion.div>

      <motion.div variants={stagger.item} className="card-surface overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <p className="label-muted">Recent Contributions</p>
        </div>
        <div className="divide-y divide-border">
          {mockContributions.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  c.type.includes("employer") ? "bg-success/10" : "bg-primary/10"
                )}>
                  {c.amount > 0 ? (
                    <ArrowUpRight className={cn("h-4 w-4", c.type.includes("employer") ? "text-success" : "text-primary")} />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{c.description}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(c.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide", tagColors[c.tag] || "bg-secondary text-secondary-foreground")}>
                  {c.tag}
                </span>
                <span className="text-sm font-semibold tabular-nums text-card-foreground">
                  {formatCurrency(c.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
