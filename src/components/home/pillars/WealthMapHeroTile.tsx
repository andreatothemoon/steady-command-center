import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Map, Layers, Users, Globe2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { splitOwnerNames } from "@/lib/accountOwners";
import { accountRegion, REGION_META, type Region } from "@/lib/geography";
import type { Account } from "@/hooks/useAccounts";

interface Props {
  accounts: Account[];
  netWorth: number;
}

/* Asset-type buckets kept in sync with the Wealth map palette */
const TYPE_BUCKETS: { key: string; label: string; color: string; types: string[] }[] = [
  { key: "pension", label: "Pension", color: "#091540", types: ["sipp", "workplace_pension", "db_pension"] },
  { key: "equities", label: "Equities", color: "#efcb68", types: ["stocks_and_shares_isa", "gia", "employer_share_scheme"] },
  { key: "property", label: "Property", color: "#895b1e", types: ["property"] },
  { key: "cash", label: "Cash", color: "#aeb7b3", types: ["current_account", "savings", "cash_isa"] },
  { key: "crypto", label: "Crypto", color: "#dcf763", types: ["crypto"] },
];

/* Deterministic per-owner colour so joint slices don't collide */
const OWNER_PALETTE = ["#4F8CFF", "#22C55E", "#efcb68", "#895b1e", "#8B5CF6", "#EF4444"];

type Slice = { key: string; label: string; value: number; color: string };

function DistributionRow({
  icon: Icon,
  title,
  slices,
  total,
}: {
  icon: typeof Layers;
  title: string;
  slices: Slice[];
  total: number;
}) {
  const items = slices.filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.25} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {title}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {items.length} {items.length === 1 ? "group" : "groups"}
        </span>
      </div>

      {/* stacked bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
        {items.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          if (pct < 0.5) return null;
          return (
            <div
              key={s.key}
              style={{ width: `${pct}%`, backgroundColor: s.color }}
              className="h-full first:rounded-l-full last:rounded-r-full"
            />
          );
        })}
      </div>

      {/* legend — two columns, aligned */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {items.slice(0, 4).map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.key} className="flex items-center justify-between text-[12px]">
              <span className="flex min-w-0 items-center gap-1.5 text-foreground">
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.label}</span>
              </span>
              <span className="ml-2 flex-shrink-0 text-muted-foreground tabular-nums">{pct}%</span>
            </li>
          );
        })}
        {items.length > 4 && (
          <li className="col-span-2 text-[11px] text-muted-foreground">
            +{items.length - 4} more
          </li>
        )}
      </ul>
    </div>
  );
}

export default function WealthMapHeroTile({ accounts, netWorth }: Props) {
  const navigate = useNavigate();

  const positiveAccounts = useMemo(
    () => accounts.filter((a) => Number(a.current_value) > 0),
    [accounts],
  );
  const totalAssets = useMemo(
    () => positiveAccounts.reduce((s, a) => s + Number(a.current_value), 0),
    [positiveAccounts],
  );

  /* ── By asset type (property is shown as equity net of mortgages) ── */
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
    });
  }, [accounts]);
  const typeTotal = typeSlices.reduce((s, x) => s + x.value, 0);

  /* ── By owner (joint accounts split evenly across owners) ── */
  const ownerSlices = useMemo<Slice[]>(() => {
    const map = new Map<string, number>();
    positiveAccounts.forEach((a) => {
      const owners = splitOwnerNames(a.owner_name);
      const list = owners.length > 0 ? owners : ["unassigned"];
      const share = Number(a.current_value) / list.length;
      list.forEach((o) => map.set(o, (map.get(o) ?? 0) + share));
    });
    return Array.from(map.entries()).map(([key, value], i) => ({
      key,
      label: key === "unassigned" ? "Unassigned" : key.charAt(0).toUpperCase() + key.slice(1),
      value,
      color: key === "unassigned" ? "#aeb7b3" : OWNER_PALETTE[i % OWNER_PALETTE.length],
    }));
  }, [positiveAccounts]);
  const ownerTotal = ownerSlices.reduce((s, x) => s + x.value, 0);

  /* ── By region (heuristic; defaults to UK) ── */
  const geoSlices = useMemo<Slice[]>(() => {
    const map = new Map<Region, number>();
    positiveAccounts.forEach((a) => {
      const r = accountRegion(a);
      map.set(r, (map.get(r) ?? 0) + Number(a.current_value));
    });
    return Array.from(map.entries()).map(([region, value]) => ({
      key: region,
      label: `${REGION_META[region].flag}  ${REGION_META[region].label}`,
      value,
      color: REGION_META[region].color,
    }));
  }, [positiveAccounts]);
  const geoTotal = geoSlices.reduce((s, x) => s + x.value, 0);

  return (
    <motion.button
      onClick={() => navigate("/wealth-map")}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="card-surface group relative flex h-full w-full flex-col p-6 text-left transition-shadow hover:shadow-sm md:p-8"
    >
      {/* Header */}
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
              Type · Owners · Geography
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

      {/* Summary strip */}
      <div className="mt-7 grid grid-cols-3 gap-6 border-b border-border/60 pb-6">
        <div className="col-span-3 md:col-span-1">
          <p className="text-[11px] text-muted-foreground">Total net worth</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground tabular-nums md:text-[2.75rem]">
            {formatCurrency(netWorth)}
          </p>
        </div>
        <div className="hidden md:block">
          <p className="text-[11px] text-muted-foreground">Asset classes</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {typeSlices.filter((s) => s.value > 0).length}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">across {accounts.length} account{accounts.length === 1 ? "" : "s"}</p>
        </div>
        <div className="hidden md:block">
          <p className="text-[11px] text-muted-foreground">Regions</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {geoSlices.length}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {ownerSlices.filter((o) => o.key !== "unassigned").length} owner{ownerSlices.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Three aligned distribution rows */}
      <div className="mt-6 grid flex-1 grid-cols-1 gap-6 md:grid-cols-3">
        <DistributionRow icon={Layers} title="By asset type" slices={typeSlices} total={typeTotal} />
        <DistributionRow icon={Users} title="By owner" slices={ownerSlices} total={ownerTotal} />
        <DistributionRow icon={Globe2} title="By geography" slices={geoSlices} total={geoTotal} />
      </div>

      {accounts.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Add accounts to populate your wealth map.
        </p>
      )}
    </motion.button>
  );
}
