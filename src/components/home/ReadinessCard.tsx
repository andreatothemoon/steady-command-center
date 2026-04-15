import { Target } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { RetirementProjection } from "@/lib/retirementEngine";

interface Props {
  projection: RetirementProjection | null;
  retireAge: number;
  targetIncome: number;
}

export default function ReadinessCard({ projection, retireAge, targetIncome }: Props) {
  if (!projection) {
    return (
      <div className="card-surface min-h-[220px] p-8 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No scenario configured</p>
      </div>
    );
  }

  const guaranteedMonthly = Math.round((projection.dbPensionIncome + projection.statePensionIncome) / 12);
  const bridgeYears = Math.max(0, 67 - retireAge);
  const onTrack = projection.readinessPct >= 100;

  return (
    <div className="card-surface h-full p-8">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f7fb]">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${onTrack ? "bg-success" : "bg-warning"}`} />
          <span className={`text-sm font-medium ${onTrack ? "text-success" : "text-warning"}`}>
            {onTrack ? "On track" : "Needs attention"}
          </span>
        </div>
      </div>

      <h3 className="mb-2 text-lg font-semibold text-foreground">Retirement Readiness</h3>
      <p className="mb-1 text-3xl font-semibold text-foreground">Age {retireAge}</p>
      <p className="text-sm text-muted-foreground">Target retirement age</p>

      <div className="mt-6 space-y-2 border-t border-border/60 pt-5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Projected income</span>
          <span className="font-semibold text-foreground">{formatCurrency(projection.totalIncome)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Target income</span>
          <span className="font-medium text-foreground">{formatCurrency(targetIncome)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Readiness</span>
          <span className="font-medium text-foreground">{projection.readinessPct}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">DC pot at retirement</span>
          <span className="font-medium text-foreground">{formatCurrency(projection.dcPotAtRetirement)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Guaranteed income</span>
          <span className="font-medium text-foreground">{formatCurrency(guaranteedMonthly)}/mo</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Bridge gap</span>
          <span className="font-medium text-foreground">{bridgeYears} years</span>
        </div>
      </div>
    </div>
  );
}
