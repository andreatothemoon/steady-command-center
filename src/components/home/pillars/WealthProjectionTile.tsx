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

/**
 * Premium palette
 *  #0A0A0A onyx  ·  #C69B3C gold  ·  #BFC1C2 silver  ·  #36454F charcoal  ·  #F4F4F4 alabaster
 */
const PALETTE = {
  onyx: "#0A0A0A",
  gold: "#C69B3C",
  goldSoft: "#E4C079",
  silver: "#BFC1C2",
  charcoal: "#36454F",
  alabaster: "#F4F4F4",
  hairline: "rgba(10,10,10,0.08)",
};

/** Asset buckets used for projection stacking */
const BUCKETS: {
  key: string;
  label: string;
  base: string;
  top: string;
  types: string[];
}[] = [
  { key: "guaranteed", label: "Pensions", base: PALETTE.onyx, top: "#2a2a2c", types: ["db_pension", "workplace_pension", "sipp"] },
  { key: "growth", label: "Investments", base: PALETTE.gold, top: PALETTE.goldSoft, types: ["stocks_and_shares_isa", "cash_isa", "gia", "employer_share_scheme"] },
  { key: "property", label: "Property", base: PALETTE.charcoal, top: "#4d5c67", types: ["property"] },
  { key: "cash", label: "Cash", base: PALETTE.silver, top: "#d7d8d9", types: ["current_account", "savings"] },
  { key: "alternatives", label: "Alternatives", base: "#7A5A2A", top: "#9a7940", types: ["crypto"] },
];
const HIST_COLOR = "#EDECE7";
const HIST_TOP = "#F7F5F0";
const HIST_PRESENT_BASE = "#DAD4C4";
const HIST_PRESENT_TOP = "#EBE5D3";

const HORIZONS = [
  { key: "10Y", label: "10 yrs", years: 10 },
  { key: "20Y", label: "20 yrs", years: 20 },
  { key: "30Y", label: "30 yrs", years: 30 },
] as const;
type HorizonKey = (typeof HORIZONS)[number]["key"];

function bucketOf(type: string): string {
  return BUCKETS.find((b) => b.types.includes(type))?.key ?? "alternatives";
}

function gradientFor(base: string, top: string) {
  return `linear-gradient(180deg, ${top} 0%, ${base} 62%, ${base} 100%)`;
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
      stacks: [{ key: "history", base: HIST_COLOR, top: HIST_TOP, value: Math.max(p.value, 0) }],
      isPresent: false,
    }));
  }, [history]);

  const present = useMemo(() => ({
    label: `${currentYear}`,
    total: netWorth,
    stacks: [{ key: "history", base: HIST_PRESENT_BASE, top: HIST_PRESENT_TOP, value: Math.max(netWorth, 0) }],
    isPresent: true,
  }), [netWorth, currentYear]);

  const projection = useMemo(() => {
    const realReturn = Math.max(expectedReturn - inflation, 0);
    const POINTS = 5;
    const bars = [];
    for (let i = 1; i <= POINTS; i++) {
      const y = Math.round((i * years) / POINTS);
      const growth = Math.pow(1 + realReturn, y);
      const stacks = BUCKETS.map((b) => ({
        key: b.key,
        base: b.base,
        top: b.top,
        label: b.label,
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
      className="relative flex h-full min-h-[460px] w-full flex-col overflow-hidden rounded-[28px] p-6 md:p-8"
      style={{
        background: `linear-gradient(180deg, #FFFFFF 0%, ${PALETTE.alabaster} 100%)`,
        border: `1px solid ${PALETTE.hairline}`,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.9) inset, 0 30px 60px -40px rgba(10,10,10,0.28), 0 8px 22px -18px rgba(10,10,10,0.18)",
      }}
    >
      {/* Ambient gold wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[0.10] blur-3xl"
        style={{ background: `radial-gradient(circle, ${PALETTE.gold} 0%, transparent 70%)` }}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: `linear-gradient(180deg, ${PALETTE.goldSoft}, ${PALETTE.gold})`,
              color: PALETTE.onyx,
              boxShadow: "0 6px 14px -8px rgba(198,155,60,0.55), 0 0 0 1px rgba(198,155,60,0.35) inset",
            }}
          >
            <TrendingUp className="h-[16px] w-[16px]" strokeWidth={2.25} />
          </span>
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: PALETTE.charcoal }}
            >
              Wealth · History &amp; Projection
            </p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: "rgba(54,69,79,0.75)" }}>
              {(historic[0]?.label ?? `${currentYear}`)} — {currentYear + years}
            </p>
          </div>
        </div>

        {/* Horizon control */}
        <div
          role="tablist"
          aria-label="Projection horizon"
          className="inline-flex items-center gap-1 rounded-full p-1"
          style={{
            background: "rgba(10,10,10,0.04)",
            border: `1px solid ${PALETTE.hairline}`,
          }}
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
                  "rounded-full px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-all",
                )}
                style={
                  active
                    ? {
                        background: PALETTE.onyx,
                        color: PALETTE.alabaster,
                        boxShadow: "0 4px 10px -6px rgba(10,10,10,0.5)",
                      }
                    : { color: "rgba(54,69,79,0.7)" }
                }
              >
                {h.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero summary */}
      <div className="relative mt-6 flex items-baseline gap-4">
        <p
          className="leading-none tabular-nums"
          style={{
            fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
            fontWeight: 500,
            fontSize: "2.75rem",
            letterSpacing: "-0.035em",
            color: PALETTE.onyx,
          }}
        >
          {formatCurrency(endValue, true)}
        </p>
        {growthMultiple > 0 && (
          <span
            className="inline-flex items-baseline gap-1 rounded-full px-2.5 py-1 text-[11px] tabular-nums"
            style={{
              background: "rgba(198,155,60,0.10)",
              color: PALETTE.gold,
              border: `1px solid rgba(198,155,60,0.28)`,
            }}
          >
            <span className="font-semibold">{growthMultiple.toFixed(1)}×</span>
            <span style={{ color: "rgba(54,69,79,0.85)" }}>by {currentYear + years}</span>
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="relative mt-6 flex-1">
        {(() => {
          const Y_TICKS = 4;
          const ticks = Array.from({ length: Y_TICKS + 1 }, (_, i) => (maxTotal * (Y_TICKS - i)) / Y_TICKS);
          const AXIS_W = 52;
          return (
            <div className="relative h-full min-h-[340px] w-full">
              {/* Y-axis labels */}
              <div className="absolute inset-y-0 left-0 bottom-7 top-3" style={{ width: AXIS_W }}>
                {ticks.map((t, i) => (
                  <div
                    key={i}
                    className="absolute right-3 -translate-y-1/2 text-[10px] tabular-nums"
                    style={{ top: `${(i / Y_TICKS) * 100}%`, color: "rgba(54,69,79,0.6)" }}
                  >
                    {formatCurrency(t, true)}
                  </div>
                ))}
              </div>
              {/* Gridlines */}
              <div className="absolute bottom-7 top-3 right-0" style={{ left: AXIS_W }}>
                {ticks.map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-x-0"
                    style={{
                      top: `${(i / Y_TICKS) * 100}%`,
                      borderTop: i === Y_TICKS ? `1px solid rgba(10,10,10,0.12)` : `1px dashed rgba(10,10,10,0.07)`,
                    }}
                  />
                ))}
              </div>

              {/* Bars */}
              <div
                className="absolute bottom-7 top-3 right-0 flex items-stretch gap-1.5 sm:gap-2.5"
                style={{ left: AXIS_W }}
              >
                {allBars.map((bar, idx) => {
                  const heightPct = (bar.total / maxTotal) * 100;
                  return (
                    <div key={idx} className="flex flex-1 flex-col items-center justify-end">
                      <div
                        className="relative flex w-full cursor-pointer flex-col-reverse overflow-hidden transition-all"
                        style={{
                          height: `${heightPct}%`,
                          borderTopLeftRadius: 6,
                          borderTopRightRadius: 6,
                          boxShadow: bar.isPresent
                            ? `0 -1px 0 ${PALETTE.gold} inset, 0 10px 22px -14px rgba(10,10,10,0.35)`
                            : `0 10px 22px -18px rgba(10,10,10,0.32)`,
                        }}
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
                          const isTopSeg = i === bar.stacks.length - 1;
                          return (
                            <div
                              key={s.key + i}
                              style={{
                                height: `${segPct}%`,
                                background: gradientFor((s as any).base, (s as any).top),
                                boxShadow: isTopSeg
                                  ? "inset 0 1px 0 rgba(255,255,255,0.22)"
                                  : "inset 0 1px 0 rgba(255,255,255,0.06)",
                              }}
                              className="w-full"
                            />
                          );
                        })}
                        {/* Hairline outline for premium finish */}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0"
                          style={{
                            borderTopLeftRadius: 6,
                            borderTopRightRadius: 6,
                            boxShadow: "inset 0 0 0 1px rgba(10,10,10,0.06)",
                          }}
                        />
                        <span
                          className="pointer-events-none absolute left-1/2 -top-[18px] -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums"
                          style={{
                            fontWeight: bar.isPresent ? 700 : 500,
                            color: bar.isPresent ? PALETTE.onyx : "rgba(54,69,79,0.75)",
                            letterSpacing: "0.01em",
                          }}
                        >
                          {formatCurrency(bar.total, true)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tooltip */}
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
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl px-3.5 py-2.5"
                    style={{
                      left: hover.x,
                      top: hover.y - 10,
                      background: PALETTE.onyx,
                      color: PALETTE.alabaster,
                      border: `1px solid rgba(198,155,60,0.35)`,
                      boxShadow: "0 20px 40px -20px rgba(10,10,10,0.6)",
                    }}
                  >
                    <p
                      className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: PALETTE.goldSoft }}
                    >
                      {bar.label}
                    </p>
                    <p
                      className="mt-0.5 tabular-nums"
                      style={{
                        fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                        fontSize: "1.05rem",
                        fontWeight: 500,
                      }}
                    >
                      {formatCurrency(bar.total, true)}
                    </p>
                    <p className="mt-0.5 text-[11px]" style={{ color: "rgba(244,244,244,0.72)" }}>
                      {updated}
                    </p>
                  </div>
                );
              })()}

              {/* X-axis labels */}
              <div
                className="absolute inset-x-0 bottom-0 flex gap-1.5 sm:gap-2.5"
                style={{ left: AXIS_W }}
              >
                {allBars.map((bar, idx) => (
                  <div
                    key={idx}
                    className="flex flex-1 items-center justify-center text-[10px] tabular-nums"
                    style={{
                      color: bar.isPresent ? PALETTE.onyx : "rgba(54,69,79,0.65)",
                      fontWeight: bar.isPresent ? 700 : 500,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {bar.label}
                  </div>
                ))}
              </div>

              {/* Divider between history and projection */}
              {historic.length > 0 && (
                <div
                  className="pointer-events-none absolute bottom-7 top-3 w-px"
                  style={{
                    left: `calc(${AXIS_W}px + ((${historic.length} + 0.5) / ${allBars.length}) * (100% - ${AXIS_W}px) - 0.5px)`,
                    background: `linear-gradient(180deg, transparent, ${PALETTE.gold} 20%, ${PALETTE.gold} 80%, transparent)`,
                    opacity: 0.35,
                  }}
                />
              )}
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div
        className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 pt-4"
        style={{ borderTop: `1px solid ${PALETTE.hairline}` }}
      >
        <span className="flex items-center gap-2 text-[11.5px]" style={{ color: PALETTE.charcoal }}>
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: gradientFor(HIST_COLOR, HIST_TOP), border: `1px solid ${PALETTE.hairline}` }}
          />
          History
        </span>
        {BUCKETS.map((b) => (
          <span
            key={b.key}
            className="flex items-center gap-2 text-[11.5px]"
            style={{ color: PALETTE.charcoal }}
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: gradientFor(b.base, b.top) }}
            />
            {b.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
