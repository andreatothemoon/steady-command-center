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
    <motion.div variants={item} className="space-y-3">
      <div>
        <p className="label-muted">Retirement Actions</p>
        <p className="text-[11px] text-muted-foreground mt-1">Personalised insights based on your plan</p>
      </div>
      <div className="space-y-2">
        {actions.map((action, i) => {
          const config = severityConfig[action.severity];
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              className={cn("card-surface p-4 border-l-2", config.border)}
            >
              <div className="flex items-start gap-3">
                <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5", config.bg)}>
                  <config.icon className={cn("w-4 h-4", config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-card-foreground">{action.title}</p>
                    <span className={cn(config.badge, "hidden sm:inline-flex")}>{config.label}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{action.explanation}</p>
                  <p className="text-[12px] font-medium text-card-foreground mt-1">{action.impact}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
