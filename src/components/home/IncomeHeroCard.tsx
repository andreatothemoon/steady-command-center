import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { RetirementProjection } from "@/lib/retirementEngine";

interface Props {
  monthlyIncome: number | null;
  retireAge: number;
  projection: RetirementProjection | null;
  targetIncome: number;
}

export default function IncomeHeroCard({ monthlyIncome, retireAge, projection, targetIncome }: Props) {
  const navigate = useNavigate();
  const monthlyTarget = Math.round(targetIncome / 12);
  const readinessPct = projection?.readinessPct ?? 0;
  const gap = projection?.gap ?? 0;
  const confidence = readinessPct >= 95 ? "High" : readinessPct >= 80 ? "Medium" : "Low";
  const confidenceDot = readinessPct >= 95 ? "bg-success" : readinessPct >= 80 ? "bg-warning" : "bg-destructive";

  if (monthlyIncome === null) {
    return (
      <div className="hero-surface p-10">
        <div className="py-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">
            Current Plan
          </div>
          <p className="mt-8 text-5xl font-semibold tracking-tight text-foreground">Plan not set up</p>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Set up a retirement scenario to see your projected income, target gap, and recommended next actions.
          </p>
          <button
            onClick={() => navigate("/plan")}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/92"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-surface p-8 lg:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground/70">
            Current Plan
          </div>
          <div className="mt-7 flex items-end gap-3">
            <h2 className="text-[3.75rem] font-semibold tracking-[-0.06em] text-foreground leading-none lg:text-[4.5rem]">
              {formatCurrency(monthlyIncome)}
            </h2>
            <span className="pb-2 text-2xl font-medium text-muted-foreground">/ month</span>
          </div>
          <p className="mt-3 text-lg text-muted-foreground">at age {retireAge}</p>
          <p className="mt-1 text-sm text-muted-foreground">After tax, in today's money</p>
        </div>

        <div className="grid gap-6 text-left sm:grid-cols-3 lg:min-w-[360px]">
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Confidence</p>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${confidenceDot}`} />
              <span className="text-lg font-semibold text-foreground">{confidence}</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Target</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(monthlyTarget)}/mo</p>
          </div>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Gap</p>
            <p className={`text-lg font-semibold ${gap > 0 ? "text-destructive" : "text-success"}`}>
              {gap > 0 ? `-${formatCurrency(Math.round(gap / 12))}/mo` : "On target"}
            </p>
          </div>
        </div>
      </div>

      <div className="my-8 h-px bg-border/60" />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-success"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(readinessPct, 100)}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 lg:min-w-[260px]">
          <span className="text-sm font-medium text-muted-foreground">{readinessPct}% of target</span>
          <button
            onClick={() => navigate("/plan")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/92"
          >
            Model scenarios <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
