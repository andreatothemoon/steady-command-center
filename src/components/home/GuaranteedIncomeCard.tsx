import { Shield } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { RetirementProjection } from "@/lib/retirementEngine";

interface Props {
  projection: RetirementProjection | null;
}

export default function GuaranteedIncomeCard({ projection }: Props) {
  const guaranteedMonthly = projection
    ? Math.round((projection.totalDBIncome + projection.statePensionIncome) / 12)
    : 0;

  return (
    <div className="card-surface h-full p-6">
      <div className="mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-secondary">
          <Shield className="h-5 w-5 text-success" />
        </div>
      </div>

      <h3 className="mb-3 text-lg font-semibold tracking-tight text-foreground">Guaranteed Income</h3>
      <p className="mb-2 text-3xl font-semibold leading-none tracking-tight text-foreground">
        {projection ? `${formatCurrency(guaranteedMonthly)}/mo` : "—"}
      </p>
      <p className="text-sm text-muted-foreground">
        Reliable monthly income from DB pensions and State Pension when it begins.
      </p>
    </div>
  );
}
