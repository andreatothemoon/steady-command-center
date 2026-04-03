import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
  warning?: boolean;
}

export default function MetricCard({ label, value, sub, icon, trend, className, warning }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
        warning && "border-warning/30",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-card-foreground">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {trend && (
          <span className={cn("text-xs font-medium", trend.positive ? "text-success" : "text-destructive")}>
            {trend.positive ? "+" : ""}{trend.value}
          </span>
        )}
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </motion.div>
  );
}
