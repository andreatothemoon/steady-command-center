import { Check, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { stagger } from "@/lib/animation";
import type { RetirementProjection } from "@/lib/retirementEngine";
import type { RetirementScenario } from "@/hooks/useRetirementScenarios";

interface ProjectionEntry {
  scenario: RetirementScenario;
  values: { retireAge: number; monthlyContrib: number; employerContrib: number };
  projection: RetirementProjection;
}

interface Props {
  allProjections: ProjectionEntry[];
  activeId: string | null;
  compareMode: boolean;
  onSelect: (id: string) => void;
  onExitCompare: () => void;
}

function confidenceLabel(pct: number) {
  if (pct >= 100) return "Very High";
  if (pct >= 90) return "High";
  if (pct >= 75) return "Medium";
  return "Low";
}

export default function ScenarioOverviewList({
  allProjections,
  activeId,
  compareMode,
  onSelect,
  onExitCompare,
}: Props) {
  return (
    <motion.div variants={stagger.item} className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Scenarios</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a scenario to edit, or compare them side by side.
        </p>
      </div>
      <div className="space-y-4">
        {allProjections.map(({ scenario, values, projection }) => {
          const isActive = scenario.id === activeId;
          return (
            <button
              key={scenario.id}
              onClick={() => {
                onSelect(scenario.id);
                if (compareMode) onExitCompare();
              }}
              className={cn(
                "card-surface group w-full p-8 text-left transition-all hover:shadow-sm",
                isActive && "border-primary border-2",
              )}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold text-foreground">{scenario.name}</h3>
                    {isActive && (
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
                    <div>
                      <p className="text-sm text-muted-foreground">Retirement Age</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                        {values.retireAge}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Income</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                        {formatCurrency(Math.round(projection.totalIncome / 12))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {confidenceLabel(projection.readinessPct)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contributions</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {formatCurrency(values.monthlyContrib + values.employerContrib)}/mo
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Outcome</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {projection.readinessPct}% of target
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-success">
                      <Check className="h-4 w-4" />
                      <span>Currently using this scenario</span>
                    </div>
                  )}
                </div>

                <span className="rounded-xl p-2 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  <ChevronRight className="h-5 w-5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
