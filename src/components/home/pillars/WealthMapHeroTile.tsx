import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Map } from "lucide-react";
import AllocationDonut from "@/components/AllocationDonut";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/hooks/useAccounts";

interface Props {
  accounts: Account[];
  netWorth: number;
}

const CLASSES: { key: string; label: string; color: string; types: string[] }[] = [
  { key: "cash", label: "Cash", color: "#aeb7b3", types: ["current_account", "savings", "cash_isa"] },
  { key: "equities", label: "Equities", color: "#efcb68", types: ["stocks_and_shares_isa", "gia", "employer_share_scheme"] },
  { key: "property", label: "Property", color: "#895b1e", types: ["property"] },
  { key: "pension", label: "Pension", color: "#091540", types: ["sipp", "workplace_pension", "db_pension"] },
  { key: "crypto", label: "Crypto", color: "#dcf763", types: ["crypto"] },
];

export default function WealthMapHeroTile({ accounts, netWorth }: Props) {
  const navigate = useNavigate();

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

  return (
    <motion.button
      onClick={() => navigate("/wealth-map")}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="card-surface group relative flex h-full w-full flex-col p-6 text-left transition-shadow hover:shadow-sm md:p-8"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
            <Map className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Wealth map
            </p>
            <p className="mt-0.5 text-[15px] font-semibold tracking-tight text-foreground">
              Everything you own, at a glance
            </p>
          </div>
        </div>
        <motion.span
          variants={{ rest: { x: 0 }, hover: { x: 3 } }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="mt-1 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/60"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
        </motion.span>
      </div>

      <div className="mt-8 grid flex-1 grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        <div>
          <p className="text-[11px] text-muted-foreground">Total net worth</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground tabular-nums md:text-5xl">
            {formatCurrency(netWorth)}
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {buckets.length} asset class{buckets.length === 1 ? "" : "es"} · {accounts.length} account
            {accounts.length === 1 ? "" : "s"}
          </p>

          <ul className="mt-6 space-y-2">
            {buckets
              .sort((a, b) => b.value - a.value)
              .map((b) => {
                const pct = total > 0 ? Math.round((b.value / total) * 100) : 0;
                return (
                  <li key={b.key} className="flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                      {b.label}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatCurrency(b.value, true)} · {pct}%
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>

        <div className="relative min-h-[240px]">
          {accounts.length > 0 ? (
            <AllocationDonut accounts={accounts} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Add accounts to see your map
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
