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
    <div className="card-surface h-full p-5">
      <div className="mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef9f1]">
          <Shield className="h-5 w-5 text-success" />
        </div>
      </div>

      <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground">Guaranteed Income</h3>
      <p className="mb-1 text-[2rem] font-semibold leading-none tracking-tight text-foreground">
        {projection ? `${formatCurrency(guaranteedMonthly)}/mo` : "—"}
      </p>
      <p className="text-sm text-muted-foreground">
        DB Pension + State Pension (from age 67)
      </p>
    </div>
  );
}
