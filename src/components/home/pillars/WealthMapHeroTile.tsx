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

type Cell = { key: string; label: string; value: number; color: string; pct: number };

/**
 * Squarified-ish treemap layout. Given cells sorted desc by value and a target
 * aspect ratio close to 1, splits them into rows filling a normalized 100x100 box.
 */
function layoutTreemap(cells: Cell[], width = 100, height = 100) {
  const total = cells.reduce((s, c) => s + c.value, 0);
  if (total <= 0) return [] as (Cell & { x: number; y: number; w: number; h: number })[];

  const scaled = cells.map((c) => ({ ...c, area: (c.value / total) * width * height }));
  const results: (Cell & { x: number; y: number; w: number; h: number })[] = [];

  let x = 0;
  let y = 0;
  let remainingW = width;
  let remainingH = height;
  let i = 0;

  while (i < scaled.length) {
    const shorter = Math.min(remainingW, remainingH);
    const row: typeof scaled = [];
    let rowSum = 0;

    const worst = (r: typeof scaled, side: number) => {
      const sum = r.reduce((s, c) => s + c.area, 0);
      const rMax = Math.max(...r.map((c) => c.area));
      const rMin = Math.min(...r.map((c) => c.area));
      const s2 = side * side;
      const sum2 = sum * sum;
      return Math.max((s2 * rMax) / sum2, sum2 / (s2 * rMin));
    };

    while (i < scaled.length) {
      const next = [...row, scaled[i]];
      const nextSum = rowSum + scaled[i].area;
      if (row.length === 0 || worst(next, shorter) <= worst(row, shorter)) {
        row.push(scaled[i]);
        rowSum = nextSum;
        i++;
      } else break;
    }

    const horizontal = remainingW >= remainingH;
    if (horizontal) {
      const rowH = rowSum / remainingW;
      let cx = x;
      for (const c of row) {
        const cw = c.area / rowH;
        results.push({ ...c, x: cx, y, w: cw, h: rowH });
        cx += cw;
      }
      y += rowH;
      remainingH -= rowH;
    } else {
      const rowW = rowSum / remainingH;
      let cy = y;
      for (const c of row) {
        const ch = c.area / rowW;
        results.push({ ...c, x, y: cy, w: rowW, h: ch });
        cy += ch;
      }
      x += rowW;
      remainingW -= rowW;
    }
  }

  return results;
}

export default function WealthMapHeroTile({ accounts, netWorth }: Props) {
  const navigate = useNavigate();

  const positiveAccounts = useMemo(
    () => accounts.filter((a) => Number(a.current_value) > 0),
    [accounts],
  );

  const cells = useMemo<Cell[]>(() => {
    const mortgages = accounts.filter((a) => a.account_type === "mortgage");
    const raw = TYPE_BUCKETS.map((cls) => {
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

    const sum = raw.reduce((s, c) => s + c.value, 0);
    return raw
      .map((c) => ({ ...c, pct: sum > 0 ? (c.value / sum) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [accounts]);

  const treemap = useMemo(() => layoutTreemap(cells), [cells]);

  const owners = useMemo(() => {
    const set = new Set<string>();
    positiveAccounts.forEach((a) => splitOwnerNames(a.owner_name).forEach((o) => set.add(o)));
    return Array.from(set).map((o) => o.charAt(0).toUpperCase() + o.slice(1));
  }, [positiveAccounts]);

  const regions = useMemo(() => {
    const set = new Set<Region>();
    positiveAccounts.forEach((a) => set.add(accountRegion(a)));
    return Array.from(set);
  }, [positiveAccounts]);

  const topCell = cells[0];

  return (
    <motion.button
      onClick={() => navigate("/wealth-map")}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="card-surface group relative flex h-full min-h-[420px] w-full flex-col overflow-hidden p-6 text-left transition-shadow hover:shadow-md md:p-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
            <Map className="h-[16px] w-[16px]" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Wealth map
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {owners.length > 0 ? owners.join(" · ") : "Your household"}
              {regions.length > 0 && (
                <span className="ml-2">{regions.map((r) => REGION_META[r].flag).join(" ")}</span>
              )}
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

      {/* Body: left column (number + legend) + right column (treemap) */}
      <div className="mt-6 grid flex-1 grid-cols-1 gap-6 md:grid-cols-5">
        {/* Left */}
        <div className="flex flex-col justify-between md:col-span-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Total net worth
            </p>
            <p className="mt-2 text-[2.75rem] font-semibold leading-none tracking-tight text-foreground tabular-nums md:text-[3rem]">
              {formatCurrency(netWorth)}
            </p>
            {topCell && (
              <p className="mt-3 text-[13px] text-muted-foreground">
                Largest bucket{" "}
                <span className="font-medium text-foreground">{topCell.label}</span>{" "}
                <span className="tabular-nums">· {Math.round(topCell.pct)}%</span>
              </p>
            )}
          </div>

          <ul className="mt-6 grid grid-cols-1 gap-y-2.5 sm:grid-cols-2 md:grid-cols-1">
            {cells.map((c) => (
              <li key={c.key} className="flex items-baseline gap-2 text-[13px]">
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-foreground">{c.label}</span>
                <span className="ml-auto text-muted-foreground tabular-nums">
                  {formatCurrency(c.value, true)}
                </span>
                <span className="w-9 text-right text-muted-foreground/80 tabular-nums">
                  {Math.round(c.pct)}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — treemap */}
        <div className="relative md:col-span-3">
          <div className="relative h-full min-h-[260px] w-full overflow-hidden rounded-2xl bg-secondary/40 ring-1 ring-border/50">
            {treemap.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Add accounts to populate your wealth map.
              </div>
            ) : (
              treemap.map((c) => (
                <div
                  key={c.key}
                  className="absolute flex flex-col justify-between overflow-hidden p-3 transition-transform duration-300 group-hover:scale-[0.995]"
                  style={{
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    width: `${c.w}%`,
                    height: `${c.h}%`,
                    backgroundColor: c.color,
                    color: "#fff",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] opacity-90">
                      {c.label}
                    </span>
                    <span className="text-[11px] tabular-nums opacity-80">
                      {Math.round(c.pct)}%
                    </span>
                  </div>
                  <span className="text-[15px] font-semibold tabular-nums leading-tight md:text-[17px]">
                    {formatCurrency(c.value, true)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
