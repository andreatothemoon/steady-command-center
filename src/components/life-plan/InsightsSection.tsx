import { Card } from "@/components/ui/card";
import { usePlan } from "@/planning/store/PlanContext";
import { Lightbulb } from "lucide-react";

export default function InsightsSection() {
  const { recommendations } = usePlan();
  if (!recommendations.length) return null;

  return (
    <section className="animate-fade-in">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Insights</h2>
        <p className="text-xs text-muted-foreground">Personalised for the active scenario.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {recommendations.map((r) => (
          <Card key={r.id} className="flex gap-4 border-border/60 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{r.title}</p>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-foreground/70">
                  {r.priority}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
              <p className="mt-3 text-xs font-medium text-primary">{r.impact}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
