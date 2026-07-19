import { Gauge } from "lucide-react";
import PillarTile from "./PillarTile";
import type { RetirementProjection } from "@/lib/retirementEngine";

interface Props {
  projection: RetirementProjection | null;
  scenarioName?: string | null;
}

export default function PlanTrackTile({ projection, scenarioName }: Props) {
  const readiness = projection?.readinessPct ?? 0;
  const onTrack = readiness >= 100;
  const near = readiness >= 85 && readiness < 100;

  const status = onTrack
    ? { label: "On track", accent: "success" as const }
    : near
      ? { label: "Almost there", accent: "warning" as const }
      : { label: "Off track", accent: "destructive" as const };

  return (
    <PillarTile
      to="/plan"
      eyebrow="Plan status"
      title="Are you on track?"
      icon={Gauge}
      accent={status.accent}
      footer={
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Readiness</span>
            <span className="font-semibold text-foreground tabular-nums">
              {Math.round(readiness)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary/70">
            <div
              className={`h-full rounded-full transition-all ${
                onTrack ? "bg-success" : near ? "bg-warning" : "bg-destructive"
              }`}
              style={{ width: `${Math.min(readiness, 100)}%` }}
            />
          </div>
        </div>
      }
    >
      <div>
        <p className="text-[11px] text-muted-foreground">
          {scenarioName || "Active scenario"}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {status.label}
        </p>
      </div>
    </PillarTile>
  );
}
