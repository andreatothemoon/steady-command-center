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
    <div className="card-surface h-full min-h-[260px] p-8">
      <div className="mb-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-[#eef9f1]">
          <Shield className="h-6 w-6 text-success" />
        </div>
      </div>

      <h3 className="mb-5 text-[2.125rem] font-semibold tracking-[-0.04em] text-foreground">Guaranteed Income</h3>
      <p className="mb-3 text-[4rem] font-semibold leading-none tracking-[-0.08em] text-foreground">
        {projection ? `${formatCurrency(guaranteedMonthly)}/mo` : "—"}
      </p>
      <p className="max-w-[22rem] text-xl leading-snug text-muted-foreground">
        DB Pension + State Pension (from age 67)
      </p>
    </div>
  );
}
