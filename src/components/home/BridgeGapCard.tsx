import { Calendar } from "lucide-react";

interface Props {
  retireAge: number;
}

export default function BridgeGapCard({ retireAge }: Props) {
  const bridgeYears = Math.max(0, 67 - retireAge);

  return (
    <div className="card-surface h-full p-6">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10">
          <Calendar className="h-[18px] w-[18px] text-destructive" />
        </div>
        <div className="rounded-full border border-border/60 bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Bridge years
        </div>
      </div>

      <h3 className="mb-2 text-sm font-medium text-muted-foreground">Bridge Gap</h3>
      <p className="mb-2 text-2xl font-semibold leading-none tracking-tight text-foreground">
        {bridgeYears === 0 ? "None" : `${bridgeYears} years`}
      </p>
      <p className="text-[13px] text-muted-foreground">
        {bridgeYears === 0 ? "State Pension begins when you retire." : "Years to fund before State Pension starts."}
      </p>
    </div>
  );
}
