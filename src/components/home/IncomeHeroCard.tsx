import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { RetirementProjection } from "@/lib/retirementEngine";

interface Props {
  monthlyIncome: number | null;
  retireAge: number;
  projection: RetirementProjection | null;
  targetIncome: number;
}

function useAnimatedValue(target: number, duration = 1200) {
  const [value, setValue] = import("react").then ? 0 : 0;
  // Simple implementation using useState/useEffect
  const { useState, useEffect, useRef } = require("react");
  return target; // fallback
}

export default function IncomeHeroCard({ monthlyIncome, retireAge, projection, targetIncome }: Props) {
  const navigate = useNavigate();
  const monthlyTarget = Math.round(targetIncome / 12);
  const gap = projection ? projection.gap : 0;
  const readinessPct = projection?.readinessPct ?? 0;
  const status = projection?.status ?? "gap";

  const statusConfig = {
    on_track: { label: "On Track", class: "status-safe" },
    close: { label: "Close", class: "status-warning" },
    gap: { label: "Income Gap", class: "status-danger" },
  };
  const st = statusConfig[status];

  if (monthlyIncome === null) {
    return (
      <div className="hero-surface p-6 lg:p-8">
        <div className="text-center py-8">
          <p className="label-muted mb-3">Monthly Retirement Income</p>
          <p className="text-muted-foreground text-sm mb-4">Set up a retirement scenario to see your projected income</p>
          <button
            onClick={() => navigate("/plan")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-surface p-6 lg:p-8 relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 80% at 50% 80%, hsl(142 71% 45% / 0.04) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="label-muted mb-2">Monthly Retirement Income</p>
            <div className="flex items-baseline gap-3">
              <h1 className="value-hero text-5xl lg:text-[4rem] leading-none text-primary">
                {formatCurrency(monthlyIncome)}
              </h1>
              <span className="text-lg text-muted-foreground font-medium">/month</span>
            </div>
            <p className="text-[13px] text-muted-foreground mt-2">
              After tax, in today's money · at age {retireAge}
            </p>

            <div className="flex items-center gap-3 mt-4">
              <span className={st.class}>{st.label}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {readinessPct}% of target ({formatCurrency(monthlyTarget)}/mo)
              </span>
            </div>

            {gap > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[12px] text-destructive/80 mt-2"
              >
                Gap: {formatCurrency(Math.round(gap / 12))}/month · {formatCurrency(gap)}/year
              </motion.p>
            )}
          </div>

          <button
            onClick={() => navigate("/plan")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/40 text-card-foreground text-sm font-medium hover:bg-secondary/60 transition-colors self-start lg:self-auto"
          >
            Model scenarios <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
