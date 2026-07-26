import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Map as MapIcon } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { splitOwnerNames } from "@/lib/accountOwners";
import { accountRegion, REGION_META, type Region } from "@/lib/geography";
import { cn } from "@/lib/utils";
import type { Account } from "@/hooks/useAccounts";

type RegionFocus = "all" | "uk" | "international";
const FOCUS_OPTIONS: { key: RegionFocus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "uk", label: "UK" },
  { key: "international", label: "International" },
];
const inFocus = (r: Region, f: RegionFocus) =>
  f === "all" ? true : f === "uk" ? r === "uk" : r !== "uk";

interface Props {
  accounts: Account[];
  netWorth: number;
}

const OWNER_PALETTE = ["#091540", "#4F8CFF", "#895b1e", "#efcb68", "#22C55E", "#6b7280"];

type OwnerCell = {
  key: string;
  label: string;
  value: number;
  pct: number;
  color: string;
};

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function WealthMapHeroTile({ accounts, netWorth }: Props) {
  const navigate = useNavigate();
  const [focus, setFocus] = useState<RegionFocus>("all");

  const ownerCells = useMemo<OwnerCell[]>(() => {
    const byOwner = new Map<string, number>();
    accounts.forEach((a) => {
      const region = accountRegion(a);
      if (!inFocus(region, focus)) return;
      const owners = splitOwnerNames(a.owner_name);
      const share = Number(a.current_value) / Math.max(owners.length, 1);
      const list = owners.length > 0 ? owners : ["unassigned"];
      list.forEach((o) => byOwner.set(o, (byOwner.get(o) ?? 0) + share));
    });
    const total = Array.from(byOwner.values()).reduce((s, v) => s + Math.max(v, 0), 0);
    return Array.from(byOwner.entries())
      .filter(([, v]) => v > 0)
      .map(([name, v], idx) => ({
        key: name,
        label: titleCase(name),
        value: v,
        pct: total > 0 ? (v / total) * 100 : 0,
        color: OWNER_PALETTE[idx % OWNER_PALETTE.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [accounts, focus]);

  const regionTotals = useMemo(() => {
    const map = new Map<Region, number>();
    accounts.forEach((a) => {
      const region = accountRegion(a);
      map.set(region, (map.get(region) ?? 0) + Number(a.current_value));
    });
    const total = Array.from(map.values()).reduce((s, v) => s + Math.max(v, 0), 0);
    return Array.from(map.entries())
      .filter(([, v]) => v > 0)
      .map(([region, value]) => ({
        region,
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
        meta: REGION_META[region],
      }))
      .sort((a, b) => b.value - a.value);
  }, [accounts]);

  const focusedTotal = ownerCells.reduce((s, c) => s + c.value, 0);
  const focusedPct = netWorth > 0 ? (focusedTotal / netWorth) * 100 : 0;
  const displayedTotal = focus === "all" ? netWorth : focusedTotal;

  return (
    <motion.div
      role="link"
      tabIndex={0}
      onClick={() => navigate("/wealth-map")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate("/wealth-map");
        }
      }}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="card-surface group relative w-full cursor-pointer overflow-hidden p-6 text-left transition-shadow hover:shadow-md md:p-8"
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
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

        <div className="flex items-center gap-3">
          <div
            role="tablist"
            aria-label="Region focus"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex w-fit items-center gap-1 rounded-full border border-border/60 bg-secondary/50 p-1"
          >
            {FOCUS_OPTIONS.map((opt) => {
              const active = focus === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFocus(opt.key);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <motion.span
            variants={{ rest: { x: 0, y: 0 }, hover: { x: 2, y: -2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/60 group-hover:text-foreground"
          >
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
          </motion.span>
        </div>
      </div>

      {/* Responsive layout: 1-col on mobile, 2-col at md, 3-col at xl */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-12">
        {/* Left: Hero number */}
        <div className="min-w-0 md:col-span-2 md:border-b md:border-border/60 md:pb-6 xl:col-span-3 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-6">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {focus === "all"
              ? "Total net worth"
              : focus === "uk"
                ? "UK-based wealth"
                : "International wealth"}
          </p>
          <p className="mt-2 text-[2.25rem] font-semibold leading-none tracking-tight text-foreground tabular-nums sm:text-[2.5rem] md:text-[2.75rem]">
            {formatCurrency(displayedTotal)}
          </p>
          {focus !== "all" && (
            <p className="mt-2 text-[12px] text-muted-foreground tabular-nums">
              {Math.round(focusedPct)}% of {formatCurrency(netWorth, true)} total
            </p>
          )}
          <p className="mt-4 text-[13px] text-muted-foreground">
            {accounts.length} {accounts.length === 1 ? "account" : "accounts"} across{" "}
            {regionTotals.length} {regionTotals.length === 1 ? "region" : "regions"}
          </p>
        </div>

        {/* Middle: Owner pie + legend */}
        <div className="min-w-0 md:col-span-1 md:border-r md:border-border/60 md:pr-6 xl:col-span-5">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              By owner
            </p>
            <p className="text-[11px] text-muted-foreground">
              {ownerCells.length} {ownerCells.length === 1 ? "person" : "people"}
            </p>
          </div>
          {ownerCells.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-2xl bg-secondary/40 p-6 text-center text-sm text-muted-foreground ring-1 ring-border/50">
              Add accounts to populate your wealth map.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <div className="h-[160px] w-[160px] flex-shrink-0 sm:h-[180px] sm:w-[180px] xl:h-[200px] xl:w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ownerCells}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="90%"
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {ownerCells.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number, _name: string, props: any) => [
                        `${formatCurrency(value, true)} (${Math.round(props?.payload?.pct ?? 0)}%)`,
                        props?.payload?.label,
                      ]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        color: "hsl(var(--foreground))",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex w-full min-w-0 flex-1 flex-col gap-2">
                {ownerCells.map((c) => (
                  <li
                    key={c.key}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[13px]"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="truncate text-foreground">{c.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2 whitespace-nowrap">
                      <span className="text-foreground tabular-nums">
                        {formatCurrency(c.value, true)}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {Math.round(c.pct)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Geography */}
        <div className="min-w-0 md:col-span-1 xl:col-span-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
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
            <ul className="flex flex-col gap-3">
              {regionTotals.map((r) => (
                <li key={r.region} className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[13px]">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-base leading-none">{r.meta.flag}</span>
                      <span className="truncate text-foreground">{r.meta.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2 whitespace-nowrap">
                      <span className="text-foreground tabular-nums">
                        {formatCurrency(r.value, true)}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {Math.round(r.pct)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${r.pct}%`, backgroundColor: r.meta.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
