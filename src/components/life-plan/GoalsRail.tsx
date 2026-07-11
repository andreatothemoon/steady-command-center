import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePlan } from "@/planning/store/PlanContext";
import type { Goal, GoalConfidence } from "@/planning/types";
import { cn } from "@/lib/utils";

const CONFIDENCE_LABEL: Record<GoalConfidence, string> = {
  high: "High confidence",
  on_track: "On track",
  at_risk: "At risk",
  off_track: "Off track",
};

const CONFIDENCE_STYLE: Record<GoalConfidence, string> = {
  high: "bg-primary/10 text-primary",
  on_track: "bg-secondary text-foreground/80",
  at_risk: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  off_track: "bg-destructive/10 text-destructive",
};

export default function GoalsRail() {
  const { evaluatedGoals } = usePlan();
  if (!evaluatedGoals.length) return null;

  return (
    <section className="animate-fade-in">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Goals</h2>
        <p className="text-xs text-muted-foreground">What money is for.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {evaluatedGoals.map((g) => (
          <GoalCard key={g.id} goal={g} />
        ))}
      </div>
    </section>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const pct = Math.round(goal.progress * 100);
  return (
    <Card className="group border-border/60 p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-22px_rgba(15,23,42,0.3)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{goal.title}</p>
          {goal.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{goal.description}</p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-1 text-[10px] font-medium",
            CONFIDENCE_STYLE[goal.confidence]
          )}
        >
          {CONFIDENCE_LABEL[goal.confidence]}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{pct}% of the way there</span>
        <span>Est. {goal.estimatedCompletion}</span>
      </div>
    </Card>
  );
}
