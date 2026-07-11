import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { usePlan } from "@/planning/store/PlanContext";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function PlanHero() {
  const { projection, activeScenario } = usePlan();
  const confidencePct = Math.round(projection.confidence * 100);

  return (
    <section className="animate-fade-in">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Plan</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Explore your future with confidence.
          </p>
        </div>
        <Badge variant="secondary" className="hidden gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium md:inline-flex">
          <Sparkles className="h-3 w-3" />
          {activeScenario.name}
        </Badge>
      </div>

      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-secondary/20 p-8 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.15)]">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            You're on track
          </span>
          <p className="mt-1 text-2xl font-medium text-foreground/90">
            Your plan supports Financial Independence in{" "}
            <span className="font-semibold text-foreground">{projection.fiYear}</span>, with roughly{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(projection.retirementMonthlyIncome)}
            </span>{" "}
            of monthly income in retirement.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
          <HeroStat label="Financial Independence" value={String(projection.fiYear)} sub={`in ${Math.max(0, projection.fiYear - new Date().getFullYear())} years`} />
          <HeroStat
            label="Retirement Income"
            value={`${formatCurrency(projection.retirementMonthlyIncome)}`}
            sub="per month"
          />
          <HeroStat label="Confidence" value={`${confidencePct}%`} sub={confidenceLabel(confidencePct)} accent />
          <HeroStat label="Scenario" value={activeScenario.name} sub={activeScenario.description} truncate />
        </div>

        <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            key={confidencePct}
            initial={{ width: 0 }}
            animate={{ width: `${confidencePct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      </Card>
    </section>
  );
}

function HeroStat({
  label,
  value,
  sub,
  accent,
  truncate,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  truncate?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          accent ? "text-primary" : "text-foreground"
        } ${truncate ? "truncate" : ""}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function confidenceLabel(pct: number): string {
  if (pct >= 85) return "Strong";
  if (pct >= 70) return "On track";
  if (pct >= 50) return "Building";
  return "At risk";
}
