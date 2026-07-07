import { Calendar } from "lucide-react";

interface Props {
  retireAge: number;
}

export default function BridgeGapCard({ retireAge }: Props) {
  const bridgeYears = Math.max(0, 67 - retireAge);

  return (
    <div className="card-surface h-full p-6">
      <div className="mb-8 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-destructive/10">
          <Calendar className="h-5 w-5 text-destructive" />
        </div>
        <div className="rounded-full border border-border/60 bg-white/80 px-3 py-1 text-xs font-medium text-muted-foreground">
          Bridge years
        </div>
      </div>

      <h3 className="mb-3 text-lg font-semibold tracking-tight text-foreground">Bridge Gap</h3>
      <p className="mb-2 text-3xl font-semibold leading-none tracking-tight text-foreground">
        {bridgeYears === 0 ? "None" : `${bridgeYears} years`}
      </p>
      <p className="text-sm text-muted-foreground">
        {bridgeYears === 0 ? "State Pension begins when you retire." : "Years to fund before State Pension starts."}
      </p>
    </div>
  );
}
