import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Map } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { splitOwnerNames } from "@/lib/accountOwners";
import { accountRegion, REGION_META, type Region } from "@/lib/geography";
import type { Account } from "@/hooks/useAccounts";

interface Props {
  accounts: Account[];
  netWorth: number;
}

const TYPE_BUCKETS: { key: string; label: string; color: string; types: string[] }[] = [
  { key: "pension", label: "Pension", color: "#091540", types: ["sipp", "workplace_pension", "db_pension"] },
  { key: "equities", label: "Equities", color: "#efcb68", types: ["stocks_and_shares_isa", "gia", "employer_share_scheme"] },
  { key: "property", label: "Property", color: "#895b1e", types: ["property"] },
  { key: "cash", label: "Cash", color: "#4F8CFF", types: ["current_account", "savings", "cash_isa"] },
  { key: "crypto", label: "Crypto", color: "#22C55E", types: ["crypto"] },
];

type Slice = { key: string; label: string; value: number; color: string };

export default function WealthMapHeroTile({ accounts, netWorth }: Props) {
  const navigate = useNavigate();

  const positiveAccounts = useMemo(
    () => accounts.filter((a) => Number(a.current_value) > 0),
    [accounts],
  );

  /* By asset type (property shown net of mortgage) */
  const typeSlices = useMemo<Slice[]>(() => {
    const mortgages = accounts.filter((a) => a.account_type === "mortgage");
    return TYPE_BUCKETS.map((cls) => {
      let total = 0;
      if (cls.key === "property") {
        total = accounts
          .filter((a) => a.account_type === "property")
          .reduce((s, p) => {
            const m = mortgages.find((mo) => mo.linked_account_id === p.id);
            const bal = m ? Math.abs(Number(m.current_value)) : 0;
            return s + Math.max(Number(p.current_value) - bal, 0);
          }, 0);
      } else {
        total = accounts
          .filter((a) => cls.types.includes(a.account_type) && Number(a.current_value) > 0)
          .reduce((s, a) => s + Number(a.current_value), 0);
      }
      return { key: cls.key, label: cls.label, color: cls.color, value: total };
    }).filter((s) => s.value > 0);
  }, [accounts]);
  const typeTotal = typeSlices.reduce((s, x) => s + x.value, 0);
  const sortedTypes = [...typeSlices].sort((a, b) => b.value - a.value);

  /* Owners */
  const owners = useMemo(() => {
    const set = new Set<string>();
    positiveAccounts.forEach((a) => splitOwnerNames(a.owner_name).forEach((o) => set.add(o)));
    return Array.from(set).map((o) => o.charAt(0).toUpperCase() + o.slice(1));
  }, [positiveAccounts]);

  /* Regions */
  const regions = useMemo(() => {
    const set = new Set<Region>();
    positiveAccounts.forEach((a) => set.add(accountRegion(a)));
    return Array.from(set);
  }, [positiveAccounts]);

  return (
    <motion.button
      onClick={() => navigate("/wealth-map")}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="card-surface group relative flex h-full w-full flex-col overflow-hidden p-6 text-left transition-shadow hover:shadow-md md:p-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
            <Map className="h-[16px] w-[16px]" strokeWidth={2} />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Wealth map
          </p>
        </div>
        <motion.span
          variants={{ rest: { x: 0, y: 0 }, hover: { x: 2, y: -2 } }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/60 group-hover:text-foreground"
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
        </motion.span>
      </div>

      {/* Hero number */}
      <div className="mt-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Total net worth</p>
        <p className="mt-2 text-5xl font-semibold tracking-tight text-foreground tabular-nums md:text-[3.25rem]">
          {formatCurrency(netWorth)}
        </p>
      </div>

      {/* Main visual — asset type composition */}
      <div className="mt-8 flex flex-1 flex-col justify-end gap-5">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
          {sortedTypes.map((s) => {
            const pct = typeTotal > 0 ? (s.value / typeTotal) * 100 : 0;
            if (pct < 0.5) return null;
            return (
              <div
                key={s.key}
                style={{ width: `${pct}%`, backgroundColor: s.color }}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all"
              />
            );
          })}
        </div>

        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {sortedTypes.map((s) => {
            const pct = typeTotal > 0 ? Math.round((s.value / typeTotal) * 100) : 0;
            return (
              <li key={s.key} className="flex items-center gap-2 text-[13px]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-foreground">{s.label}</span>
                <span className="text-muted-foreground tabular-nums">{pct}%</span>
              </li>
            );
          })}
        </ul>

        {/* Subtle footer strip: owners + regions */}
        <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 pt-4 text-[12px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-[0.14em] text-[10px]">Owners</span>
            <span className="text-foreground">{owners.length > 0 ? owners.join(" · ") : "—"}</span>
          </div>
          <span className="text-border">•</span>
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-[0.14em] text-[10px]">Regions</span>
            <span className="text-foreground">
              {regions.length > 0 ? regions.map((r) => REGION_META[r].flag).join(" ") : "—"}
            </span>
          </div>
        </div>
      </div>

      {accounts.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Add accounts to populate your wealth map.
        </p>
      )}
    </motion.button>
  );
}
