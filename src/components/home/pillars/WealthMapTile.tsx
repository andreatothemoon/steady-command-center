import { useMemo } from "react";
import { Map } from "lucide-react";
import PillarTile from "./PillarTile";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/hooks/useAccounts";

interface Props {
  accounts: Account[];
}

const CLASSES: { key: string; label: string; color: string; types: string[] }[] = [
  { key: "cash", label: "Cash", color: "#aeb7b3", types: ["current_account", "savings", "cash_isa"] },
  { key: "equities", label: "Equities", color: "#efcb68", types: ["stocks_and_shares_isa", "gia", "employer_share_scheme"] },
  { key: "property", label: "Property", color: "#895b1e", types: ["property"] },
  { key: "pension", label: "Pension", color: "#091540", types: ["sipp", "workplace_pension", "db_pension"] },
  { key: "crypto", label: "Crypto", color: "#dcf763", types: ["crypto"] },
];

export default function WealthMapTile({ accounts }: Props) {
  const buckets = useMemo(() => {
    const mortgages = accounts.filter((a) => a.account_type === "mortgage");
    return CLASSES.map((cls) => {
      if (cls.key === "property") {
        const total = accounts
          .filter((a) => a.account_type === "property")
          .reduce((s, p) => {
            const mort = mortgages.find((m) => m.linked_account_id === p.id);
            const bal = mort ? Math.abs(Number(mort.current_value)) : 0;
            return s + Math.max(Number(p.current_value) - bal, 0);
          }, 0);
        return { ...cls, value: total };
      }
      const total = accounts
        .filter((a) => cls.types.includes(a.account_type) && Number(a.current_value) > 0)
        .reduce((s, a) => s + Number(a.current_value), 0);
      return { ...cls, value: total };
    }).filter((b) => b.value > 0);
  }, [accounts]);

  const total = buckets.reduce((s, b) => s + b.value, 0);
  const top = [...buckets].sort((a, b) => b.value - a.value)[0];

  return (
    <PillarTile
      to="/wealth?view=map"
      eyebrow="Allocation"
      title="Wealth map"
      icon={Map}
      accent="primary"
      footer={
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
          {buckets.map((b) => (
            <div
              key={b.key}
              style={{ width: `${(b.value / total) * 100}%`, backgroundColor: b.color }}
              className="h-full"
            />
          ))}
        </div>
      }
    >
      {total > 0 ? (
        <>
          <div>
            <p className="text-[11px] text-muted-foreground">Largest bucket</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {top.label}
              <span className="ml-2 text-sm font-medium text-muted-foreground tabular-nums">
                {Math.round((top.value / total) * 100)}%
              </span>
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground tabular-nums">
              {formatCurrency(top.value, true)} of {formatCurrency(total, true)}
            </p>
          </div>
          <ul className="mt-3 space-y-1">
            {buckets.slice(0, 3).map((b) => (
              <li key={b.key} className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                  {b.label}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {Math.round((b.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Add accounts to see your allocation.</p>
      )}
    </PillarTile>
  );
}
