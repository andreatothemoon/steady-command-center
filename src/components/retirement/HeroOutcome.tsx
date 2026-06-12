import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Calendar, TrendingUp, Target, ArrowUpDown } from "lucide-react";
import type { RetirementProjection } from "@/lib/retirementEngine";

const item = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface Props {
  projection: RetirementProjection;
  retireAge: number;
  targetIncome: number;
}

export default function HeroOutcome({ projection, retireAge, targetIncome }: Props) {
  const statusConfig = {
    on_track: { label: "On Track", className: "status-safe" },
    close: { label: "Close", className: "status-warning" },
    gap: { label: "Income Gap", className: "status-danger" },
  };
  const status = statusConfig[projection.status];

  const cards = [
    {
      icon: Calendar,
      label: "Retirement Age",
      value: `${retireAge}`,
      sub: "Selected scenario timing",
      accent: false,
    },
    {
      icon: TrendingUp,
      label: "Projected Income",
      value: formatCurrency(projection.totalIncome),
      sub: "annual income at retirement",
      accent: true,
    },
    {
      icon: Target,
      label: "Target Income",
      value: formatCurrency(targetIncome),
      sub: "annual target",
      accent: false,
    },
    {
      icon: ArrowUpDown,
      label: projection.gap > 0 ? "Shortfall" : "Surplus",
      value: formatCurrency(Math.abs(projection.gap)),
      sub: status.label,
      accent: false,
      statusClass: status.className,
      isGap: projection.gap > 0,
    },
  ];

  return (
    <div className="hero-surface p-8 lg:p-10">
      <div className="mb-7 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Selected Scenario Outcome</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground">
            {status.label === "On Track" ? "This plan is broadly working." : status.label === "Close" ? "This plan is within reach." : "This plan still needs support."}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Use this as the anchor for the rest of the page: what the scenario produces, where the pressure points are, and which assumptions matter most.
          </p>
        </div>
        <span className={cn(status.className, "self-start lg:self-auto")}>{status.label}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            variants={item}
            className={cn(
              "relative overflow-hidden rounded-[28px] border p-6",
              card.accent
                ? "border-primary/20 bg-white shadow-[0_20px_48px_-34px_hsl(var(--primary)/0.32)]"
                : "border-border/60 bg-white/85"
            )}
          >
            <div className="mb-5 flex items-center gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl",
                  card.accent ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                )}
              >
                <card.icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <p
              className={cn(
                "font-semibold tabular-nums tracking-tight",
                card.accent ? "text-4xl text-primary" : "text-3xl text-card-foreground"
              )}
            >
              {card.value}
            </p>
            <div className="mt-3">
              {card.statusClass ? (
                <span className={card.statusClass}>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                  {card.sub}
                </span>
              ) : (
                <p className="text-sm text-muted-foreground">{card.sub}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
