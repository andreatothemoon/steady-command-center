import { useMemo } from "react";
import { motion } from "framer-motion";
import type { PlanEvent, EventType } from "@/planning/types";
import { usePlan } from "@/planning/store/PlanContext";
import { cn } from "@/lib/utils";
import {
  Home,
  Landmark,
  Baby,
  Heart,
  TrendingUp,
  Sunset,
  Coffee,
  Briefcase,
  DoorOpen,
  Gift,
  Building2,
  BadgePoundSterling,
  ShoppingBag,
  PiggyBank,
  Plane,
  GraduationCap,
  Sparkle,
} from "lucide-react";

const ICONS: Record<EventType, typeof Home> = {
  home_purchase: Home,
  mortgage: Landmark,
  child: Baby,
  marriage: Heart,
  salary_change: TrendingUp,
  retirement: Sunset,
  semi_retirement: Coffee,
  business_acquisition: Briefcase,
  business_sale: DoorOpen,
  inheritance: Gift,
  property_purchase: Building2,
  property_sale: BadgePoundSterling,
  rental_income: Building2,
  large_expense: ShoppingBag,
  investment_contribution: PiggyBank,
  move_abroad: Plane,
  education: GraduationCap,
  custom: Sparkle,
};

function iconFor(type: EventType) {
  return ICONS[type] ?? Sparkle;
}

interface Props {
  onSelectEvent?: (event: PlanEvent) => void;
}

export default function LifeTimeline({ onSelectEvent }: Props) {
  const { scenarioEvents, activeScenario } = usePlan();

  const sorted = useMemo(
    () => [...scenarioEvents].sort((a, b) => a.date.localeCompare(b.date)),
    [scenarioEvents]
  );

  const nowYear = new Date().getFullYear();

  return (
    <section className="animate-fade-in">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Life timeline</h2>
          <p className="text-xs text-muted-foreground">
            The events shaping the {activeScenario.name} scenario.
          </p>
        </div>
      </div>

      <div className="relative rounded-2xl border border-border/60 bg-card p-6">
        <div className="relative overflow-x-auto pb-2 [scrollbar-width:thin]">
          <div className="relative flex min-w-max items-stretch gap-6">
            {/* Today marker */}
            <TimelinePin year={nowYear} label="Today" isNow />

            {sorted.map((ev, idx) => {
              const Icon = iconFor(ev.type);
              const year = new Date(ev.date).getFullYear();
              return (
                <motion.button
                  key={ev.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  onClick={() => onSelectEvent?.(ev)}
                  className={cn(
                    "group flex w-[200px] flex-col gap-2 rounded-xl border border-border/60 bg-background/60 p-4 text-left transition-all",
                    "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_14px_30px_-22px_rgba(15,23,42,0.35)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground/80 group-hover:bg-primary/10 group-hover:text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      {year}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{ev.title}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary/60" />
                    {Math.round(ev.probability * 100)}% likely · in{" "}
                    {Math.max(0, year - nowYear)} yrs
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-[54px] -z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      </div>
    </section>
  );
}

function TimelinePin({ year, label, isNow }: { year: number; label: string; isNow?: boolean }) {
  return (
    <div className="flex w-[80px] flex-col items-center justify-center gap-2">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border-2",
          isNow ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
        )}
      >
        <span className="h-2 w-2 rounded-full bg-current" />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground/80">{label}</span>
      <span className="text-[10px] text-muted-foreground">{year}</span>
    </div>
  );
}
