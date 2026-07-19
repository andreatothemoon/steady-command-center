import { ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useNetWorthHistory } from "@/hooks/useNetWorthHistory";
import { formatCurrency } from "@/lib/format";
import PillarTile from "./PillarTile";

export default function WealthChangeTile() {
  const { data: accounts = [] } = useAccounts();
  const { data: history = [] } = useNetWorthHistory(accounts);

  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const delta = last && prev ? last.value - prev.value : 0;
  const pct = prev && prev.value !== 0 ? (delta / prev.value) * 100 : 0;
  const up = delta >= 0;

  return (
    <PillarTile
      to="/wealth"
      eyebrow="Since last refresh"
      title="Wealth change"
      icon={RefreshCw}
      accent={up ? "success" : "destructive"}
    >
      <div>
        {prev ? (
          <>
            <p className="text-[11px] text-muted-foreground">
              vs {prev.month}
            </p>
            <p
              className={`mt-1 flex items-center gap-1 text-2xl font-semibold tracking-tight tabular-nums ${
                up ? "text-success" : "text-destructive"
              }`}
            >
              {up ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <ArrowDownRight className="h-5 w-5" />
              )}
              {formatCurrency(Math.abs(delta), true)}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground tabular-nums">
              {up ? "+" : "−"}
              {Math.abs(pct).toFixed(1)}% · now {formatCurrency(last.value, true)}
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground">No prior snapshot</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Baseline set
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Refresh accounts to start tracking change.
            </p>
          </>
        )}
      </div>
    </PillarTile>
  );
}
