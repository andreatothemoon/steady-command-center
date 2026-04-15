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
      sub: `${retireAge - 35 > 0 ? retireAge - 35 : "–"} years to go`,
      accent: false,
    },
    {
      icon: TrendingUp,
      label: "Projected Income",
      value: formatCurrency(projection.totalIncome),
      sub: "per year at retirement",
      accent: true,
    },
    {
      icon: Target,
      label: "Target Income",
      value: formatCurrency(targetIncome),
      sub: "per year",
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          variants={item}
          className={cn(
            "relative overflow-hidden p-6",
            card.accent ? "hero-surface" : "card-surface"
          )}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl",
              card.accent
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-muted-foreground"
            )}>
              <card.icon className="h-4.5 w-4.5" />
            </div>
            <span className="text-sm text-muted-foreground">{card.label}</span>
          </div>
          <p className={cn(
            "font-semibold tabular-nums tracking-tight",
            card.accent ? "text-4xl text-primary" : "text-3xl text-card-foreground"
          )}>
            {card.value}
          </p>
          <div className="mt-2">
            {card.statusClass ? (
              <span className={card.statusClass}>
                <span className={cn(
                  "inline-block w-1.5 h-1.5 rounded-full",
                  card.isGap ? "bg-current" : "bg-current"
                )} />
                {card.sub}
              </span>
            ) : (
              <p className="text-sm text-muted-foreground">{card.sub}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
