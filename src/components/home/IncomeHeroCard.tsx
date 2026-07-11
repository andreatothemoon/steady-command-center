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
  const stableMonthly = projection
    ? Math.round((projection.totalDBIncome + projection.statePensionIncome + projection.otherIncomeAtRetirement) / 12)
    : 0;
  const flexibleMonthly = projection
    ? Math.round(
        (projection.dcDrawdown +
          (projection.timeline.find((point) => point.age === retireAge)?.isaWithdrawal ?? 0)) / 12
      )
    : 0;
  const confidence = readinessPct >= 95 ? "High" : readinessPct >= 80 ? "Medium" : "Low";
  const confidenceDot = readinessPct >= 95 ? "bg-success" : readinessPct >= 80 ? "bg-warning" : "bg-destructive";

  if (monthlyIncome === null) {
    return (
      <div className="hero-surface p-10">
        <div className="py-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground/70">
            Retirement
          </div>
          <p className="mt-8 text-5xl font-semibold tracking-tight text-foreground">No retirement scenario set up</p>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Set up a retirement scenario to see your projected income, target gap, and recommended next actions.
          </p>
          <button
            onClick={() => navigate("/retirement")}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/92"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-surface overflow-hidden p-8 lg:p-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-accent/[0.06]" />

      <div className="relative flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1.65fr)_24rem] xl:items-start">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/75 px-4 py-2 text-sm font-medium text-foreground/70 backdrop-blur">
            Retirement
          </div>

          <div className="mt-7 flex flex-wrap items-end gap-x-3 gap-y-2">
            <h2 className="text-[3.35rem] font-semibold leading-none tracking-[-0.065em] text-foreground sm:text-[3.9rem] lg:text-[4.75rem]">
              {formatCurrency(monthlyIncome)}
            </h2>
            <span className="pb-2 text-xl font-medium text-muted-foreground sm:text-2xl">/ month</span>
          </div>

          <p className="mt-3 text-lg text-muted-foreground">Projected retirement income at age {retireAge}</p>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            A live view of what your selected scenario can support in today&apos;s money, blending guaranteed income, drawdown, and any configured bridge support.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-border/60 bg-white/75 px-5 py-4 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Guaranteed Base</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{formatCurrency(stableMonthly)}/mo</p>
              <p className="mt-1 text-sm text-muted-foreground">DB, State Pension, and persistent other income.</p>
            </div>
            <div className="rounded-[24px] border border-border/60 bg-white/75 px-5 py-4 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Flexible Capacity</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{formatCurrency(flexibleMonthly)}/mo</p>
              <p className="mt-1 text-sm text-muted-foreground">DC pension drawdown and ISA withdrawals in the selected scenario.</p>
            </div>
            <div className="rounded-[24px] border border-border/60 bg-white/75 px-5 py-4 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Readiness</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{readinessPct}%</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {gap > 0 ? `Gap of ${formatCurrency(Math.round(gap / 12))}/mo against target.` : "Currently meeting or exceeding your target."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-border/70 bg-white/85 p-6 shadow-[0_18px_44px_-30px_hsl(var(--foreground)/0.22)] backdrop-blur">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Retirement Snapshot</p>
          <div className="mt-6 space-y-5">
            <div>
              <p className="mb-1 text-sm font-medium text-foreground/60">Confidence</p>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${confidenceDot}`} />
                <span className="text-lg font-semibold text-foreground">{confidence}</span>
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-foreground/60">Target income</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{formatCurrency(monthlyTarget)}/mo</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-foreground/60">Difference to target</p>
              <p className={`text-2xl font-semibold tracking-tight ${gap > 0 ? "text-destructive" : "text-success"}`}>
                {gap > 0 ? `-${formatCurrency(Math.round(gap / 12))}/mo` : "On target"}
              </p>
            </div>
            <div className="rounded-[24px] bg-secondary/65 px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-foreground/70">Progress toward goal</span>
                <span className="text-sm font-semibold text-foreground">{readinessPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/70">
                <motion.div
                  className="h-full rounded-full bg-success"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(readinessPct, 100)}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              </div>
            </div>
            <button
              onClick={() => navigate("/retirement")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/92"
            >
              Model scenarios <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Explore contribution, retirement age, and other income changes in your retirement scenario.
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-8 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-4 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Retirement age</span>
          <span>{retireAge}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-4 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Monthly goal</span>
          <span>{formatCurrency(monthlyTarget)}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-4 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Scenario status</span>
          <span>{gap > 0 ? "Below target" : "On track"}</span>
        </div>
      </div>
    </div>
  );
}
