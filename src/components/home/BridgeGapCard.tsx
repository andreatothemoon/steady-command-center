import { Calendar } from "lucide-react";

interface Props {
  retireAge: number;
}

export default function BridgeGapCard({ retireAge }: Props) {
  const bridgeYears = Math.max(0, 67 - retireAge);

  return (
    <div className="card-surface h-full min-h-[260px] border-l-[6px] border-l-primary p-8">
      <div className="mb-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-[#fef3f2]">
          <Calendar className="h-6 w-6 text-destructive" />
        </div>
      </div>

      <h3 className="mb-5 text-[2.125rem] font-semibold tracking-[-0.04em] text-foreground">Bridge Gap</h3>
      <p className="mb-3 text-[4rem] font-semibold leading-none tracking-[-0.08em] text-foreground">
        {bridgeYears === 0 ? "None" : `${bridgeYears} years`}
      </p>
      <p className="max-w-[18rem] text-xl leading-snug text-muted-foreground">
        {bridgeYears === 0 ? "State Pension starts when you retire" : "To cover before State Pension"}
      </p>
    </div>
  );
}
