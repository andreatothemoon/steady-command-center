import { Receipt } from "lucide-react";
import PillarTile from "./PillarTile";
import { formatCurrency } from "@/lib/format";
import { CURRENT_TAX_YEAR } from "@/lib/constants";
import type { MemberANI } from "@/types/tax";

interface Props {
  memberANIs: MemberANI[];
  isaUsed: number;
  isaLimit: number;
}

export default function TaxTile({ memberANIs, isaUsed, isaLimit }: Props) {
  const maxAni = memberANIs.reduce((m, x) => Math.max(m, x.ani), 0);
  const status =
    maxAni >= 100000
      ? { label: "Over £100k taper", accent: "destructive" as const }
      : maxAni > 85000
        ? { label: "Near £100k taper", accent: "warning" as const }
        : { label: "On track", accent: "success" as const };

  const isaPct = isaLimit > 0 ? Math.min(100, Math.round((isaUsed / isaLimit) * 100)) : 0;

  return (
    <PillarTile
      to="/tax"
      eyebrow={`Tax · ${CURRENT_TAX_YEAR}`}
      title="UK tax position"
      icon={Receipt}
      accent={status.accent}
      footer={
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">ISA allowance</span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(isaUsed, true)} / {formatCurrency(isaLimit, true)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary/70">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${isaPct}%` }}
            />
          </div>
        </div>
      }
    >
      <div>
        <p className="text-[11px] text-muted-foreground">Household status</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{status.label}</p>
        <p className="mt-1 text-[12px] text-muted-foreground tabular-nums">
          Highest ANI {formatCurrency(maxAni)}
        </p>
      </div>
    </PillarTile>
  );
}
