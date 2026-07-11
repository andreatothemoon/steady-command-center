import { TrendingUp } from "lucide-react";
import type { RetirementProjection } from "@/lib/retirementEngine";

interface Props {
  projection: RetirementProjection | null;
  retireAge: number;
}

export default function ReadinessCard({ projection, retireAge }: Props) {
  if (!projection) {
    return (
      <div className="card-surface flex min-h-[140px] items-center justify-center p-5">
        <p className="text-sm text-muted-foreground">No scenario configured</p>
      </div>
    );
  }

  const onTrack = projection.readinessPct >= 100;

  return (
    <div className="card-surface h-full p-6">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary">
          <TrendingUp className="h-[18px] w-[18px] text-primary" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${onTrack ? "bg-success" : "bg-warning"}`} />
          <span className={`text-[13px] font-medium ${onTrack ? "text-success" : "text-warning"}`}>
            {onTrack ? "On track" : "Needs attention"}
          </span>
        </div>
      </div>

      <h3 className="mb-2 text-sm font-medium text-muted-foreground">Retirement Readiness</h3>
      <p className="mb-2 text-2xl font-semibold leading-none tracking-tight text-foreground">Age {retireAge}</p>
      <p className="text-[13px] text-muted-foreground">Your selected retirement age in the active scenario.</p>
    </div>
  );
}
