import { usePlan } from "@/planning/store/PlanContext";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function ScenarioSelector() {
  const { state, activeScenario, setActiveScenario } = usePlan();

  return (
    <section className="animate-fade-in">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Scenarios</h2>
        <p className="text-xs text-muted-foreground">Switch to see how your plan changes.</p>
      </div>

      <div className="-mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {state.scenarios.map((s) => {
          const active = s.id === activeScenario.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveScenario(s.id)}
              className={cn(
                "group relative flex min-w-[220px] snap-start flex-col gap-1 rounded-2xl border p-4 text-left transition-all",
                active
                  ? "border-primary/40 bg-primary/5 shadow-[0_10px_30px_-18px_rgba(79,140,255,0.35)]"
                  : "border-border/60 bg-card hover:border-border hover:bg-card/80"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    active ? "bg-primary" : "bg-muted-foreground/40"
                  )}
                />
                <span className="text-sm font-semibold text-foreground">{s.name}</span>
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
              {active && (
                <motion.div
                  layoutId="scenario-underline"
                  className="absolute inset-x-4 bottom-1 h-0.5 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}

        <button
          disabled
          className="flex min-w-[140px] snap-start flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border/60 p-4 text-xs text-muted-foreground opacity-60"
          title="Coming soon"
        >
          <Plus className="h-4 w-4" />
          New scenario
        </button>
      </div>
    </section>
  );
}
