import { Calendar } from "lucide-react";

interface Props {
  retireAge: number;
}

export default function BridgeGapCard({ retireAge }: Props) {
  const bridgeYears = Math.max(0, 67 - retireAge);

  return (
    <div className="card-surface h-full border-l-4 border-l-primary p-5">
      <div className="mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10">
          <Calendar className="h-5 w-5 text-destructive" />
        </div>
      </div>

      <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground">Bridge Gap</h3>
      <p className="mb-1 text-[2rem] font-semibold leading-none tracking-tight text-foreground">
        {bridgeYears === 0 ? "None" : `${bridgeYears} years`}
      </p>
      <p className="text-sm text-muted-foreground">
        {bridgeYears === 0 ? "State Pension starts when you retire" : "To cover before State Pension"}
      </p>
    </div>
  );
}
