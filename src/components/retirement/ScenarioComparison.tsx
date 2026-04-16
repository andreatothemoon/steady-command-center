import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import type { RetirementProjection } from "@/lib/retirementEngine";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ScenarioData {
  name: string;
  retireAge: number;
  monthlyContrib: number;
  employerContrib: number;
  targetIncome: number;
  projection: RetirementProjection;
}

interface Props {
  scenarios: ScenarioData[];
}

const item = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ScenarioComparison({ scenarios }: Props) {
  if (scenarios.length < 2) return null;

  const bestIdx = scenarios.reduce((best, s, i) =>
    s.projection.readinessPct > scenarios[best].projection.readinessPct ? i : best, 0
  );

  const metrics: { label: string; key: string; format: (s: ScenarioData) => string; highlight?: "highest" | "lowest" }[] = [
    { label: "Retirement Age", key: "retireAge", format: (s) => `${s.retireAge}`, highlight: "lowest" },
    { label: "Monthly Contribution", key: "monthly", format: (s) => formatCurrency(s.monthlyContrib + s.employerContrib) },
    { label: "Target Income", key: "target", format: (s) => formatCurrency(s.targetIncome) },
    { label: "DC Pot at Retirement", key: "dcPot", format: (s) => formatCurrency(s.projection.dcPotAtRetirement), highlight: "highest" },
    { label: "Tax-Free Cash", key: "taxFreeCash", format: (s) => s.projection.taxFreeCashTaken > 0 ? formatCurrency(s.projection.taxFreeCashTaken) : "Not taken", highlight: "highest" },
    { label: "Tax-Free Cash Age", key: "taxFreeCashAge", format: (s) => s.projection.taxFreeCashAge ? `Age ${s.projection.taxFreeCashAge}` : "—" },
    { label: "DC Pot After Cash", key: "dcPotAfterCash", format: (s) => formatCurrency(s.projection.dcPotAfterTaxFreeCash), highlight: "highest" },
    { label: "DC Drawdown (p.a.)", key: "dcDraw", format: (s) => formatCurrency(s.projection.dcDrawdown), highlight: "highest" },
    { label: "DB Income (p.a.)", key: "dbIncome", format: (s) => formatCurrency(s.projection.totalDBIncome) },
    { label: "State Pension (p.a.)", key: "spIncome", format: (s) => formatCurrency(s.projection.statePensionIncome) },
    { label: "Total Income (p.a.)", key: "totalIncome", format: (s) => formatCurrency(s.projection.totalIncome), highlight: "highest" },
    { label: "Gap / Surplus", key: "gap", format: (s) => {
      const v = s.projection.gap;
      return `${v > 0 ? "−" : "+"}${formatCurrency(Math.abs(v))}`;
    }},
    { label: "Readiness", key: "readiness", format: (s) => `${s.projection.readinessPct}%`, highlight: "highest" },
    { label: "DC Depletes At", key: "deplete", format: (s) => s.projection.dcDepletionAge ? `Age ${s.projection.dcDepletionAge}` : "Never" },
  ];

  return (
    <motion.div variants={item} className="card-surface p-6 lg:p-8">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-foreground">Scenario Comparison</h2>
        <p className="mt-2 text-sm text-muted-foreground">Side-by-side view of your retirement scenarios.</p>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="text-[11px] font-medium text-muted-foreground w-[180px]">Metric</TableHead>
              {scenarios.map((s, i) => (
                <TableHead key={i} className="text-center min-w-[140px]">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[11px] font-semibold text-card-foreground">{s.name}</span>
                    {i === bestIdx && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((m) => {
              const values = scenarios.map((s) => m.format(s));
              return (
                <TableRow key={m.key} className="border-border/30 hover:bg-muted/30">
                  <TableCell className="text-[11px] text-muted-foreground font-medium py-2.5">{m.label}</TableCell>
                  {scenarios.map((s, i) => {
                    const isBest = i === bestIdx;
                    const isGapRow = m.key === "gap";
                    const gap = s.projection.gap;
                    return (
                      <TableCell key={i} className="text-center py-2.5">
                        <span className={cn(
                          "text-xs tabular-nums font-medium",
                          isBest && m.highlight ? "text-primary font-semibold" : "text-card-foreground",
                          isGapRow && gap > 0 && "text-destructive",
                          isGapRow && gap <= 0 && "text-emerald-500",
                        )}>
                          {values[i]}
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
            {/* Status row */}
            <TableRow className="border-border/30">
              <TableCell className="text-[11px] text-muted-foreground font-medium py-2.5">Status</TableCell>
              {scenarios.map((s, i) => {
                const statusConfig = {
                  on_track: { label: "On Track", className: "status-safe" },
                  close: { label: "Close", className: "status-warning" },
                  gap: { label: "Income Gap", className: "status-danger" },
                };
                const st = statusConfig[s.projection.status];
                return (
                  <TableCell key={i} className="text-center py-2.5">
                    <span className={st.className}>{st.label}</span>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
