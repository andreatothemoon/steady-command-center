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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          variants={item}
          className={cn(
            "relative p-4 lg:p-5 overflow-hidden",
            card.accent ? "hero-surface" : "card-surface"
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              "flex items-center justify-center w-7 h-7 rounded-lg",
              card.accent
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              <card.icon className="w-3.5 h-3.5" />
            </div>
            <span className="label-muted">{card.label}</span>
          </div>
          <p className={cn(
            "font-bold tabular-nums tracking-tight",
            card.accent ? "text-3xl lg:text-4xl text-primary" : "text-2xl lg:text-3xl text-card-foreground"
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
              <p className="text-[11px] text-muted-foreground">{card.sub}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
