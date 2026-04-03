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

export default function ContributionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contributions</h1>
        <p className="text-sm text-muted-foreground mt-1">Track meaningful cash flows</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Pension (This Year)</p>
          <p className="text-xl font-semibold text-card-foreground mt-1">{formatCurrency(9000)}</p>
          <p className="text-xs text-muted-foreground mt-1">Employee + Employer</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">ISA (This Year)</p>
          <p className="text-xl font-semibold text-card-foreground mt-1">{formatCurrency(18000)}</p>
          <p className="text-xs text-muted-foreground mt-1">£2,000 remaining</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Mortgage Overpayments</p>
          <p className="text-xl font-semibold text-card-foreground mt-1">{formatCurrency(2000)}</p>
          <p className="text-xs text-muted-foreground mt-1">This tax year</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-muted-foreground">Recent Contributions</h2>
        </div>
        <div className="divide-y divide-border">
          {mockContributions.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/50 transition-colors">
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
                  <p className="text-xs text-muted-foreground">{formatDate(c.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", tagColors[c.tag] || "bg-secondary text-secondary-foreground")}>
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
    </div>
  );
}
