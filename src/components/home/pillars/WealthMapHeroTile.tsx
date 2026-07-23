import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Map as MapIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { splitOwnerNames } from "@/lib/accountOwners";
import { accountRegion, REGION_META, type Region } from "@/lib/geography";
import type { Account } from "@/hooks/useAccounts";

interface Props {
  accounts: Account[];
  netWorth: number;
}

/** Palette for owner blocks — semantic-ish, cycles for >4 owners. */
const OWNER_PALETTE = ["#091540", "#4F8CFF", "#895b1e", "#efcb68", "#22C55E", "#6b7280"];

type OwnerCell = {
  key: string;
  label: string;
  value: number;
  pct: number;
  color: string;
  regions: { region: Region; value: number }[];
};

/** Squarified-ish treemap layout in a normalized 100x100 box. */
function layoutTreemap<T extends { value: number }>(items: T[]) {
  const total = items.reduce((s, c) => s + c.value, 0);
  const W = 100;
  const H = 100;
  if (total <= 0) return [] as (T & { x: number; y: number; w: number; h: number })[];
  const scaled = items.map((c) => ({ ...c, area: (c.value / total) * W * H }));
  const results: (T & { x: number; y: number; w: number; h: number })[] = [];

  let x = 0,
    y = 0,
    remW = W,
    remH = H,
    i = 0;

  const worst = (r: typeof scaled, side: number) => {
    const sum = r.reduce((s, c) => s + c.area, 0);
    const rMax = Math.max(...r.map((c) => c.area));
    const rMin = Math.min(...r.map((c) => c.area));
    const s2 = side * side;
    const sum2 = sum * sum;
    return Math.max((s2 * rMax) / sum2, sum2 / (s2 * rMin));
  };

  while (i < scaled.length) {
    const shorter = Math.min(remW, remH);
    const row: typeof scaled = [];
    let rowSum = 0;
    while (i < scaled.length) {
      const next = [...row, scaled[i]];
      const nextSum = rowSum + scaled[i].area;
      if (row.length === 0 || worst(next, shorter) <= worst(row, shorter)) {
        row.push(scaled[i]);
        rowSum = nextSum;
        i++;
      } else break;
    }
    const horizontal = remW >= remH;
    if (horizontal) {
      const rowH = rowSum / remW;
      let cx = x;
      for (const c of row) {
        const cw = c.area / rowH;
        results.push({ ...c, x: cx, y, w: cw, h: rowH });
        cx += cw;
      }
      y += rowH;
      remH -= rowH;
    } else {
      const rowW = rowSum / remH;
      let cy = y;
      for (const c of row) {
        const ch = c.area / rowW;
        results.push({ ...c, x, y: cy, w: rowW, h: ch });
        cy += ch;
      }
      x += rowW;
      remW -= rowW;
    }
  }
  return results;
}

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function WealthMapHeroTile({ accounts, netWorth }: Props) {
  const navigate = useNavigate();

  const positiveAccounts = useMemo(
    () => accounts.filter((a) => Number(a.current_value) > 0),
    [accounts],
  );

  /* Owner cells — split joint accounts equally between owners */
  const ownerCells = useMemo<OwnerCell[]>(() => {
    const byOwner = new Map<string, { total: number; byRegion: Map<Region, number> }>();
    positiveAccounts.forEach((a) => {
      const owners = splitOwnerNames(a.owner_name);
      const share = Number(a.current_value) / Math.max(owners.length, 1);
      const region = accountRegion(a);
      const list = owners.length > 0 ? owners : ["unassigned"];
      list.forEach((o) => {
        const entry = byOwner.get(o) ?? { total: 0, byRegion: new Map() };
        entry.total += share;
        entry.byRegion.set(region, (entry.byRegion.get(region) ?? 0) + share);
        byOwner.set(o, entry);
      });
    });
    const total = Array.from(byOwner.values()).reduce((s, v) => s + v.total, 0);
    return Array.from(byOwner.entries())
      .map(([name, v], idx) => ({
        key: name,
        label: titleCase(name),
        value: v.total,
        pct: total > 0 ? (v.total / total) * 100 : 0,
        color: OWNER_PALETTE[idx % OWNER_PALETTE.length],
        regions: Array.from(v.byRegion.entries())
          .map(([region, value]) => ({ region, value }))
          .sort((a, b) => b.value - a.value),
      }))
      .sort((a, b) => b.value - a.value);
  }, [positiveAccounts]);

  const treemap = useMemo(() => layoutTreemap(ownerCells), [ownerCells]);

  /* Region totals across household */
  const regionTotals = useMemo(() => {
    const map = new Map<Region, number>();
    positiveAccounts.forEach((a) => {
      const region = accountRegion(a);
      map.set(region, (map.get(region) ?? 0) + Number(a.current_value));
    });
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([region, value]) => ({
        region,
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
        meta: REGION_META[region],
      }))
      .sort((a, b) => b.value - a.value);
  }, [positiveAccounts]);

  return (
    <motion.button
      onClick={() => navigate("/wealth-map")}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="card-surface group relative flex h-full min-h-[440px] w-full flex-col overflow-hidden p-6 text-left transition-shadow hover:shadow-md md:p-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
            <MapIcon className="h-[16px] w-[16px]" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Wealth map
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Who owns what · where it sits
            </p>
          </div>
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
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Total net worth
        </p>
        <p className="mt-2 text-[2.75rem] font-semibold leading-none tracking-tight text-foreground tabular-nums md:text-[3rem]">
          {formatCurrency(netWorth)}
        </p>
      </div>

      {/* Owner treemap */}
      <div className="mt-6 flex-1">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            By owner
          </p>
          <p className="text-[11px] text-muted-foreground">
            {ownerCells.length} {ownerCells.length === 1 ? "person" : "people"}
          </p>
        </div>
        <div className="relative h-[220px] w-full overflow-hidden rounded-2xl bg-secondary/40 ring-1 ring-border/50">
          {treemap.length === 0 ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Add accounts to populate your wealth map.
            </div>
          ) : (
            treemap.map((c) => {
              const dense = c.w < 22 || c.h < 22;
              return (
                <div
                  key={c.key}
                  className="absolute flex flex-col justify-between overflow-hidden p-3 text-white transition-transform duration-300 group-hover:scale-[0.995]"
                  style={{
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    width: `${c.w}%`,
                    height: `${c.h}%`,
                    backgroundColor: c.color,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-[12px] font-semibold uppercase tracking-[0.1em] opacity-95">
                      {c.label}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums opacity-85">
                      {Math.round(c.pct)}%
                    </span>
                  </div>
                  {!dense && (
                    <div className="flex items-end justify-between gap-2">
                      <span className="text-[15px] font-semibold tabular-nums leading-tight md:text-[17px]">
                        {formatCurrency(c.value, true)}
                      </span>
                      <span className="text-[13px] leading-none tracking-wide opacity-90">
                        {c.regions.slice(0, 3).map((r) => REGION_META[r.region].flag).join(" ")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Geography strip */}
      <div className="mt-5 border-t border-border/60 pt-4">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            By geography
          </p>
          <p className="text-[11px] text-muted-foreground">
            {regionTotals.length} {regionTotals.length === 1 ? "region" : "regions"}
          </p>
        </div>
        {regionTotals.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">—</p>
        ) : (
          <>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
              {regionTotals.map((r) => (
                <div
                  key={r.region}
                  style={{ width: `${r.pct}%`, backgroundColor: r.meta.color }}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
              {regionTotals.map((r) => (
                <li key={r.region} className="flex items-center gap-2 text-[13px]">
                  <span className="text-base leading-none">{r.meta.flag}</span>
                  <span className="text-foreground">{r.meta.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {Math.round(r.pct)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </motion.button>
  );
}
