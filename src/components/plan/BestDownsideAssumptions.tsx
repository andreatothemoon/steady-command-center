import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { stagger } from "@/lib/animation";
import type { RetirementProjection } from "@/lib/retirementEngine";

interface SortedEntry {
  values: { retireAge: number };
  projection: RetirementProjection;
}

interface Assumption {
  label: string;
  value: string;
  adjustable: boolean;
}

interface Props {
  bestScenario: SortedEntry | null;
  downsideScenario: SortedEntry | null;
  planningAssumptions: Assumption[];
}

export default function BestDownsideAssumptions({
  bestScenario,
  downsideScenario,
  planningAssumptions,
}: Props) {
  return (
    <motion.div variants={stagger.item} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="card-surface p-8">
        <h2 className="text-xl font-semibold text-foreground">Best Case Scenario</h2>
        <div className="mt-6 space-y-5">
          <div>
            <p className="text-sm text-muted-foreground">Retirement Age</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {bestScenario ? bestScenario.values.retireAge : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Monthly Income</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-success">
              {bestScenario ? formatCurrency(Math.round(bestScenario.projection.totalIncome / 12)) : "—"}
            </p>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">What drives it</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Higher readiness and stronger income cover</li>
              <li className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Better balance between retirement age and contributions</li>
              <li className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />More resilient against late-stage shortfall</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card-surface p-8">
        <h2 className="text-xl font-semibold text-foreground">Downside Case</h2>
        <div className="mt-6 space-y-5">
          <div>
            <p className="text-sm text-muted-foreground">Retirement Age</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {downsideScenario ? downsideScenario.values.retireAge : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Monthly Income</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-destructive">
              {downsideScenario ? formatCurrency(Math.round(downsideScenario.projection.totalIncome / 12)) : "—"}
            </p>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">What weakens it</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Lower readiness against your target income</li>
              <li className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Less room for bridge years before State Pension</li>
              <li className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Greater dependency on drawdown from DC assets</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card-surface p-8">
        <h2 className="text-xl font-semibold text-foreground">Planning Assumptions</h2>
        <div className="mt-4 space-y-4">
          {planningAssumptions.map((assumption) => (
            <div key={assumption.label} className="flex items-center justify-between border-b border-border/50 py-3 last:border-0">
              <div>
                <p className="font-medium text-foreground">{assumption.label}</p>
                {!assumption.adjustable && (
                  <p className="mt-1 text-xs text-muted-foreground">Fixed by policy or product rules</p>
                )}
              </div>
              <p className="text-lg font-semibold text-foreground">{assumption.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
