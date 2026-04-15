import { motion } from "framer-motion";
import { AlertTriangle, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RetirementAction } from "@/lib/retirementEngine";

const item = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    border: "border-destructive/20",
    bg: "bg-destructive/5",
    iconColor: "text-destructive",
    badge: "status-danger",
    label: "Critical",
  },
  opportunity: {
    icon: Lightbulb,
    border: "border-warning/20",
    bg: "bg-warning/5",
    iconColor: "text-warning",
    badge: "status-warning",
    label: "Opportunity",
  },
  optimisation: {
    icon: Sparkles,
    border: "border-primary/20",
    bg: "bg-primary/5",
    iconColor: "text-primary",
    badge: "status-safe",
    label: "Optimisation",
  },
};

interface Props {
  actions: RetirementAction[];
}

export default function ActionsPanel({ actions }: Props) {
  if (actions.length === 0) return null;

  return (
    <motion.div variants={item} className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Retirement Actions</h2>
        <p className="mt-2 text-sm text-muted-foreground">Personalised insights based on your plan.</p>
      </div>
      <div className="space-y-4">
        {actions.map((action, i) => {
          const config = severityConfig[action.severity];
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              className={cn("card-surface border p-6", config.border)}
            >
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", config.bg)}>
                  <config.icon className={cn("h-5 w-5", config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-lg font-semibold text-card-foreground">{action.title}</p>
                    <span className={cn(config.badge, "hidden sm:inline-flex")}>{config.label}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{action.explanation}</p>
                  <p className="mt-2 text-sm font-medium text-card-foreground">{action.impact}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
