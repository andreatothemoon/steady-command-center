import { Compass } from "lucide-react";
import PillarTile from "./PillarTile";

interface Props {
  scenarioName?: string | null;
}

const WHAT_IFS = ["Retire earlier", "Income change", "Life event"];

export default function LifePlanningTile({ scenarioName }: Props) {
  return (
    <PillarTile
      to="/plan?view=scenarios"
      eyebrow="Life planning"
      title="Model your future"
      icon={Compass}
      accent="primary"
      footer={
        <div className="flex flex-wrap gap-1.5">
          {WHAT_IFS.map((w) => (
            <span
              key={w}
              className="rounded-full bg-secondary/70 px-2.5 py-1 text-[11px] font-medium text-foreground"
            >
              {w}
            </span>
          ))}
        </div>
      }
    >
      <div>
        <p className="text-[11px] text-muted-foreground">Active scenario</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {scenarioName || "Base plan"}
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Explore how life events change the plan.
        </p>
      </div>
    </PillarTile>
  );
}
