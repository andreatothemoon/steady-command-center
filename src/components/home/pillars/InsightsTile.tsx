import { Lightbulb } from "lucide-react";
import PillarTile from "./PillarTile";
import { staleness } from "@/lib/format";
import type { Account } from "@/hooks/useAccounts";
import type { MemberANI } from "@/types/tax";

interface Props {
  accounts: Account[];
  memberANIs: MemberANI[];
  isaUsed: number;
  isaLimit: number;
}

export default function InsightsTile({ accounts, memberANIs, isaUsed, isaLimit }: Props) {
  const staleCount = accounts.filter((a) => staleness(a.last_updated) === "stale").length;
  const taperCount = memberANIs.filter((m) => m.ani > 85000).length;
  const isaRemaining = isaLimit - isaUsed;
  const isaAlert = isaRemaining > 0 && isaRemaining < 5000;

  const total = staleCount + taperCount + (isaAlert ? 1 : 0);

  const headline =
    taperCount > 0
      ? `${taperCount} tax taper risk${taperCount === 1 ? "" : "s"}`
      : staleCount > 0
        ? `${staleCount} stale account${staleCount === 1 ? "" : "s"}`
        : isaAlert
          ? "ISA allowance running out"
          : "All clear";

  return (
    <PillarTile
      to="/actions"
      eyebrow="Insights"
      title="What matters now"
      icon={Lightbulb}
      accent={total > 0 ? "warning" : "success"}
      footer={
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground">Open items</span>
          <span className="font-semibold text-foreground tabular-nums">{total}</span>
        </div>
      }
    >
      <div>
        <p className="text-[11px] text-muted-foreground">Top signal</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{headline}</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Prioritised across freshness, tax and optimisation.
        </p>
      </div>
    </PillarTile>
  );
}
