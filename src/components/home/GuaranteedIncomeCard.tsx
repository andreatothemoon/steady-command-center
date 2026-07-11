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
      <div className="mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary">
          <Shield className="h-[18px] w-[18px] text-success" />
        </div>
      </div>

      <h3 className="mb-2 text-sm font-medium text-muted-foreground">Guaranteed Income</h3>
      <p className="mb-2 text-2xl font-semibold leading-none tracking-tight text-foreground">
        {projection ? `${formatCurrency(guaranteedMonthly)}/mo` : "—"}
      </p>
      <p className="text-[13px] text-muted-foreground">
        Reliable monthly income from DB pensions and State Pension when it begins.
      </p>
    </div>
  );
}
