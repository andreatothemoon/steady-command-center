import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Account } from "@/hooks/useAccounts";
import { useNetWorthHistory } from "@/hooks/useNetWorthHistory";

interface Props {
  accounts: Account[];
  netWorth: number;
  expectedReturn?: number;
  inflation?: number;
}

/** Asset buckets used for projection stacking */
const BUCKETS: { key: string; label: string; color: string; types: string[] }[] = [
  { key: "guaranteed", label: "Pensions", color: "#091540", types: ["db_pension", "workplace_pension", "sipp"] },
  { key: "growth", label: "Investments", color: "#4F8CFF", types: ["stocks_and_shares_isa", "cash_isa", "gia", "employer_share_scheme"] },
  { key: "property", label: "Property", color: "#895b1e", types: ["property"] },
  { key: "cash", label: "Cash", color: "#aeb7b3", types: ["current_account", "savings"] },
  { key: "alternatives", label: "Alternatives", color: "#7c5cff", types: ["crypto"] },
];
const HIST_COLOR = "#bfd4ff";
const HIST_PRESENT = "#dfe9ff";

const HORIZONS = [
  { key: "10Y", label: "10 yrs", years: 10 },
  { key: "20Y", label: "20 yrs", years: 20 },
  { key: "30Y", label: "30 yrs", years: 30 },
] as const;
type HorizonKey = (typeof HORIZONS)[number]["key"];

function bucketOf(type: string): string {
  return BUCKETS.find((b) => b.types.includes(type))?.key ?? "alternatives";
}

export default function WealthProjectionTile({
  accounts,
  netWorth,
  expectedReturn = 0.06,
  inflation = 0.025,
}: Props) {
  const { data: history = [] } = useNetWorthHistory(accounts);
  const [horizon, setHorizon] = useState<HorizonKey>("20Y");

  const years = HORIZONS.find((h) => h.key === horizon)!.years;

  // Bucket totals today (net of debt against property)
  const bucketNow = useMemo(() => {
    const mortgages = accounts.filter((a) => a.account_type === "mortgage");
    const totals: Record<string, number> = {};
    BUCKETS.forEach((b) => (totals[b.key] = 0));

    accounts.forEach((a) => {
      const v = Number(a.current_value);
      if (v <= 0) return;
      if (a.account_type === "property") {
        const mort = mortgages.find((m) => m.linked_account_id === a.id);
        const bal = mort ? Math.abs(Number(mort.current_value)) : 0;
        totals.property += Math.max(v - bal, 0);
        return;
      }
      if (a.account_type === "mortgage" || a.account_type === "loan" || a.account_type === "credit_card") return;
      totals[bucketOf(a.account_type)] += v;
    });
    return totals;
  }, [accounts]);

  const currentYear = new Date().getFullYear();

  // Historic bars — sample up to 5 evenly across history
  const historic = useMemo(() => {
    if (history.length === 0) return [];
    const HIST_TARGET = 5;
    const sampled = history.length <= HIST_TARGET
      ? history
      : Array.from({ length: HIST_TARGET }, (_, i) =>
          history[Math.round((i * (history.length - 1)) / (HIST_TARGET - 1))],
        );
    return sampled.map((p) => ({
      label: p.month,
      total: Math.max(p.value, 0),
      stacks: [{ key: "history", color: HIST_COLOR, value: Math.max(p.value, 0) }],
      isPresent: false,
    }));
  }, [history]);

  // Present bar (bridge between history and projection)
  const present = useMemo(() => ({
    label: `${currentYear}`,
    total: netWorth,
    stacks: [{ key: "history", color: HIST_PRESENT, value: Math.max(netWorth, 0) }],
    isPresent: true,
  }), [netWorth, currentYear]);

  // Projection bars — spaced across horizon
  const projection = useMemo(() => {
    const realReturn = Math.max(expectedReturn - inflation, 0);
    const POINTS = 5;
    const bars = [];
    for (let i = 1; i <= POINTS; i++) {
      const y = Math.round((i * years) / POINTS);
      const growth = Math.pow(1 + realReturn, y);
      const stacks = BUCKETS.map((b) => ({
        key: b.key,
        color: b.color,
        label: b.label,
        // Property compounds slower (inflation-only), others at realReturn+inflation
        value:
          b.key === "property"
            ? bucketNow[b.key] * Math.pow(1 + inflation, y)
            : bucketNow[b.key] * growth,
      }));
      const total = stacks.reduce((s, x) => s + x.value, 0);
      bars.push({ label: `${currentYear + y}`, total, stacks, isPresent: false });
    }
    return bars;
  }, [bucketNow, years, expectedReturn, inflation, currentYear]);

  const allBars = [...historic, present, ...projection];
  const maxTotal = Math.max(1, ...allBars.map((b) => b.total));

  const endValue = projection[projection.length - 1]?.total ?? netWorth;
  const growthMultiple = netWorth > 0 ? endValue / netWorth : 0;

  // Most recent account update — used as the "last updated" for the present bar
  const lastUpdatedLabel = useMemo(() => {
    const times = accounts
      .map((a) => (a.last_updated ? new Date(a.last_updated).getTime() : 0))
      .filter((t) => t > 0);
    if (times.length === 0) return null;
    return new Date(Math.max(...times)).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [accounts]);

  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="card-surface flex h-full min-h-[440px] w-full flex-col overflow-hidden p-6 md:p-7"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
            <TrendingUp className="h-[16px] w-[16px]" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Wealth value history & projection
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {(historic[0]?.label ?? `${currentYear}`)} — {currentYear + years}
            </p>
          </div>
        </div>

        {/* Horizon control */}
        <div
          role="tablist"
          aria-label="Projection horizon"
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/50 p-1"
        >
          {HORIZONS.map((h) => {
            const active = horizon === h.key;
            return (
              <button
                key={h.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setHorizon(h.key)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {h.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero summary */}
      <div className="mt-4 flex items-baseline gap-3">
        <p className="text-[2rem] font-semibold leading-none tracking-tight text-foreground tabular-nums">
          {formatCurrency(endValue, true)}
        </p>
        {growthMultiple > 0 && (
          <p className="text-[12px] text-muted-foreground tabular-nums">
            {growthMultiple.toFixed(1)}× by {currentYear + years}
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="mt-5 flex-1">
        {(() => {
          const Y_TICKS = 4;
          const ticks = Array.from({ length: Y_TICKS + 1 }, (_, i) => (maxTotal * (Y_TICKS - i)) / Y_TICKS);
          const AXIS_W = 44;
          return (
            <div className="relative h-full min-h-[340px] w-full">
              {/* Y-axis labels + gridlines */}
              <div className="absolute inset-y-0 left-0 bottom-6 top-2" style={{ width: AXIS_W }}>
                {ticks.map((t, i) => (
                  <div
                    key={i}
                    className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
                    style={{ top: `${(i / Y_TICKS) * 100}%` }}
                  >
                    {formatCurrency(t, true)}
                  </div>
                ))}
              </div>
              <div className="absolute bottom-6 top-2 right-0" style={{ left: AXIS_W }}>
                {ticks.map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-x-0 border-t border-dashed border-border/40"
                    style={{ top: `${(i / Y_TICKS) * 100}%` }}
                  />
                ))}
              </div>

              {/* Bars */}
              <div
                className="absolute bottom-6 top-2 right-0 flex items-stretch gap-1.5 sm:gap-2"
                style={{ left: AXIS_W }}
              >
                {allBars.map((bar, idx) => {
                  const heightPct = (bar.total / maxTotal) * 100;
                  const isHistoric = idx < historic.length;
                  const isProjection = idx > historic.length;
                  return (
                    <div key={idx} className="flex flex-1 flex-col items-center justify-end">
                      <div
                        className="relative flex w-full cursor-pointer flex-col-reverse overflow-hidden rounded-t-md transition-opacity hover:opacity-90"
                        style={{ height: `${heightPct}%` }}
                        onMouseEnter={(e) => {
                          const parent = (e.currentTarget.closest(".relative.h-full") as HTMLElement) ?? null;
                          const pRect = parent?.getBoundingClientRect();
                          const r = e.currentTarget.getBoundingClientRect();
                          setHover({
                            idx,
                            x: r.left + r.width / 2 - (pRect?.left ?? 0),
                            y: r.top - (pRect?.top ?? 0),
                          });
                        }}
                        onMouseLeave={() => setHover((h) => (h?.idx === idx ? null : h))}
                      >
                        {bar.stacks.map((s, i) => {
                          const segPct = bar.total > 0 ? (s.value / bar.total) * 100 : 0;
                          if (segPct <= 0) return null;
                          return (
                            <div
                              key={s.key + i}
                              style={{ height: `${segPct}%`, backgroundColor: s.color }}
                              className={cn("w-full", bar.isPresent && "opacity-90")}
                            />
                          );
                        })}
                        <span
                          className={cn(
                            "pointer-events-none absolute left-1/2 -top-4 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium tabular-nums",
                            bar.isPresent ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {formatCurrency(bar.total, true)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hover tooltip */}
              {hover && allBars[hover.idx] && (() => {
                const bar = allBars[hover.idx];
                const isHistoric = hover.idx < historic.length;
                const isProjection = hover.idx > historic.length;
                const updated = isProjection
                  ? "Projected value"
                  : isHistoric
                    ? `Snapshot · ${bar.label}`
                    : lastUpdatedLabel
                      ? `Last updated ${lastUpdatedLabel}`
                      : "Current value";
                return (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border/70 bg-popover px-3 py-2 shadow-lg"
                    style={{ left: hover.x, top: hover.y - 8 }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {bar.label}
                    </p>
                    <p className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
                      {formatCurrency(bar.total, true)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{updated}</p>
                  </div>
                );
              })()}

              {/* X-axis labels */}
              <div
                className="absolute inset-x-0 bottom-0 flex gap-1.5 sm:gap-2"
                style={{ left: AXIS_W }}
              >
                {allBars.map((bar, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-1 items-center justify-center text-[10px] tabular-nums",
                      bar.isPresent ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {bar.label}
                  </div>
                ))}
              </div>

              {/* Divider line between history and projection */}
              {historic.length > 0 && (
                <div
                  className="pointer-events-none absolute bottom-6 top-2 w-px border-l border-dashed border-border/70"
                  style={{
                    left: `calc(${AXIS_W}px + ((${historic.length} + 0.5) / ${allBars.length}) * (100% - ${AXIS_W}px) - 0.5px)`,
                  }}
                />
              )}
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/60 pt-4">
        <span className="flex items-center gap-2 text-[12px]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: HIST_COLOR }} />
          <span className="text-foreground">History</span>
        </span>
        {BUCKETS.map((b) => (
          <span key={b.key} className="flex items-center gap-2 text-[12px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
            <span className="text-foreground">{b.label}</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}
