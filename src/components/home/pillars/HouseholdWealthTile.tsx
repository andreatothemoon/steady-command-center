import { Wallet } from "lucide-react";
import PillarTile from "./PillarTile";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/hooks/useAccounts";
import type { HouseholdProfile } from "@/hooks/useHouseholdProfiles";

interface Props {
  accounts: Account[];
  netWorth: number;
  adults: HouseholdProfile[];
}

export default function HouseholdWealthTile({ accounts, netWorth, adults }: Props) {
  const assets = accounts.reduce((s, a) => {
    const v = Number(a.current_value);
    return v > 0 ? s + v : s;
  }, 0);
  const liabilities = accounts.reduce((s, a) => {
    const v = Number(a.current_value);
    return v < 0 ? s + Math.abs(v) : s;
  }, 0);

  return (
    <PillarTile
      to="/wealth"
      eyebrow="Wealth"
      title="Household wealth"
      icon={Wallet}
      accent="primary"
      footer={
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <div className="rounded-xl bg-secondary/60 px-3 py-2">
            <p className="text-muted-foreground">Assets</p>
            <p className="font-semibold text-foreground tabular-nums">
              {formatCurrency(assets, true)}
            </p>
          </div>
          <div className="rounded-xl bg-secondary/60 px-3 py-2">
            <p className="text-muted-foreground">Liabilities</p>
            <p className="font-semibold text-foreground tabular-nums">
              {formatCurrency(liabilities, true)}
            </p>
          </div>
        </div>
      }
    >
      <div>
        <p className="text-[11px] text-muted-foreground">Net worth</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
          {formatCurrency(netWorth)}
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          {accounts.length} account{accounts.length === 1 ? "" : "s"}
          {adults.length > 0 && ` · ${adults.map((a) => a.name).join(" & ")}`}
        </p>
      </div>
    </PillarTile>
  );
}
