import { TrendingUp } from "lucide-react";
import type { RetirementProjection } from "@/lib/retirementEngine";

interface Props {
  projection: RetirementProjection | null;
  retireAge: number;
}

export default function ReadinessCard({ projection, retireAge }: Props) {
  if (!projection) {
    return (
      <div className="card-surface flex min-h-[260px] items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">No scenario configured</p>
      </div>
    );
  }

  const onTrack = projection.readinessPct >= 100;

  return (
    <div className="card-surface h-full min-h-[260px] p-8">
      <div className="mb-12 flex items-start justify-between">
        <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-[#eef5fb]">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${onTrack ? "bg-success" : "bg-warning"}`} />
          <span className={`text-base font-medium ${onTrack ? "text-success" : "text-warning"}`}>
            {onTrack ? "On track" : "Needs attention"}
          </span>
        </div>
      </div>

      <h3 className="mb-5 text-[2.125rem] font-semibold tracking-[-0.04em] text-foreground">Retirement Readiness</h3>
      <p className="mb-3 text-[4rem] font-semibold leading-none tracking-[-0.08em] text-foreground">Age {retireAge}</p>
      <p className="text-xl text-muted-foreground">Target retirement age</p>
    </div>
  );
}
