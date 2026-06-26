import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import { stagger } from "@/lib/animation";

interface FundingMix {
  stableIncome: number;
  flexibleIncome: number;
  totalIncome: number;
}

export default function FundingMixCard({ fundingMix }: { fundingMix: FundingMix | null }) {
  const stable = Math.round((fundingMix?.stableIncome ?? 0) / 12);
  const flexible = Math.round((fundingMix?.flexibleIncome ?? 0) / 12);
  const total = Math.round((fundingMix?.totalIncome ?? 0) / 12);

  return (
    <motion.div variants={stagger.item} className="card-surface p-8">
      <h2 className="text-2xl font-semibold text-foreground">Retirement Funding Mix</h2>
      <div className="mt-6 space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">Guaranteed income</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(stable)}/mo</p>
          <p className="mt-1 text-sm text-muted-foreground">Scenario-adjusted DB pensions plus State Pension when available.</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Flexible drawdown capacity</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(flexible)}/mo</p>
          <p className="mt-1 text-sm text-muted-foreground">From DC pensions and ISA drawdown in the selected scenario.</p>
        </div>
        <div className="border-t border-border/60 pt-5">
          <p className="text-sm text-muted-foreground">What this means</p>
          <p className="mt-2 text-base text-foreground">
            Your selected scenario supports an estimated {formatCurrency(total)}/month,
            with {formatCurrency(stable)}/month coming from more stable sources.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
