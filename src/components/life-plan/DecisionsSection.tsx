import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { usePlan } from "@/planning/store/PlanContext";
import { cn } from "@/lib/utils";
import type { DecisionCategory } from "@/planning/types";
import { Briefcase, Home, HeartHandshake, PiggyBank, Plane, Sparkles, Sunset, User } from "lucide-react";

const CATEGORY_ICON: Record<DecisionCategory, typeof Home> = {
  housing: Home,
  career: Briefcase,
  family: HeartHandshake,
  business: Briefcase,
  lifestyle: Sparkles,
  retirement: Sunset,
  investing: PiggyBank,
  relocation: Plane,
};

export default function DecisionsSection() {
  const { state, acceptDecision, rejectDecision } = usePlan();
  const considering = state.decisions.filter((d) => d.status === "considering");

  return (
    <section className="animate-fade-in">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Considering</h2>
          <p className="text-xs text-muted-foreground">Decisions you're weighing up.</p>
        </div>
      </div>

      {considering.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 border-dashed border-border/70 bg-transparent p-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">What are you thinking about?</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Add a decision — buying a home, changing job, moving country — and see its impact before committing.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {considering.map((d) => {
            const Icon = CATEGORY_ICON[d.category] ?? Sparkles;
            return (
              <Card key={d.id} className="flex flex-col gap-4 border-border/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{d.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
                  </div>
                </div>

                {d.expectedImpact && (
                  <div className={cn("rounded-lg bg-secondary/60 px-3 py-2 text-xs text-foreground/80")}>
                    {d.expectedImpact}
                  </div>
                )}

                <div className="mt-auto flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => rejectDecision(d.id)}>
                    <X className="mr-1.5 h-3.5 w-3.5" /> Not now
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => acceptDecision(d.id)}>
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Accept
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
