import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Users } from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceDot,
} from "recharts";
import { useNetWorthHistory, filterByTimeRange } from "@/hooks/useNetWorthHistory";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Account } from "@/hooks/useAccounts";

type TimeRange = "3M" | "6M" | "12M" | "ALL";

function useAnimatedValue(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animFrame = useRef<number>(0);
  useEffect(() => {
    startTime.current = null;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) animFrame.current = requestAnimationFrame(animate);
    };
    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, [target, duration]);
  return value;
}

function getFilteredChart(allPoints: { month: string; value: number }[], timeRange: TimeRange) {
  return filterByTimeRange(allPoints, timeRange);
}

interface Props {
  accounts: Account[];
  adultsCount: number;
  childrenCount: number;
}

export default function NetWorthHero({ accounts, adultsCount, childrenCount }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");

  const { data: historyPoints = [] } = useNetWorthHistory(accounts);

  const totalAssets = accounts
    .filter((a) => Number(a.current_value) > 0)
    .reduce((s, a) => s + Number(a.current_value), 0);
  const totalLiabilities = accounts
    .filter((a) => Number(a.current_value) < 0)
    .reduce((s, a) => s + Number(a.current_value), 0);
  const netWorth = totalAssets + totalLiabilities;

  const filteredChart = getFilteredChart(historyPoints, timeRange);
  const prevValue = filteredChart.length > 1 ? filteredChart[0].value : netWorth;
  const deltaAbs = netWorth - prevValue;
  const deltaPct = prevValue > 0 ? ((deltaAbs / prevValue) * 100).toFixed(1) : "0";
  const deltaPositive = deltaAbs >= 0;
  const lastPoint = filteredChart[filteredChart.length - 1];

  const animatedNetWorth = useAnimatedValue(netWorth);
  const animatedDelta = useAnimatedValue(deltaAbs, 800);

  return (
    <div className="hero-surface p-7 lg:p-10 relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 18% 18%, hsl(141 30% 91% / 0.95), transparent 26%),
            radial-gradient(circle at 88% 18%, hsl(44 81% 67% / 0.2), transparent 24%)
          `,
        }}
      />
      <div className="relative z-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <p className="label-muted text-foreground/60" style={{ opacity: 1 }}>Household Net Worth</p>
              {(adultsCount > 0 || childrenCount > 0) && (
                <span className="inline-flex items-center gap-1 text-[10px] text-foreground/65 bg-white/70 px-2.5 py-1 rounded-full border border-border/80">
                  <Users className="h-3 w-3" />
                  {adultsCount} adult{adultsCount !== 1 ? "s" : ""}
                  {childrenCount > 0 && ` · ${childrenCount} child${childrenCount !== 1 ? "ren" : ""}`}
                </span>
              )}
            </div>
            <h1 className="value-hero text-[3.6rem] lg:text-[5.5rem] leading-[0.95]">
              {formatCurrency(animatedNetWorth)}
            </h1>
            <motion.div
              className="flex flex-wrap items-center gap-3 mt-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <span className={cn(
                "inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border",
                deltaPositive
                  ? "text-success border-emerald-200 bg-emerald-50"
                  : "text-destructive border-rose-200 bg-rose-50"
              )}>
                {deltaPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {deltaPositive ? "+" : ""}{formatCurrency(animatedDelta)}
              </span>
              <span className="text-muted-foreground text-sm">
                {deltaPositive ? "+" : ""}{deltaPct}% this period
              </span>
            </motion.div>
            <div className="grid grid-cols-2 gap-3 mt-6 max-w-xl">
              <div className="rounded-3xl border border-border/80 bg-white/72 px-4 py-3">
                <p className="label-muted text-foreground/55">Assets</p>
                <p className="value-compact mt-1">{formatCurrency(totalAssets)}</p>
              </div>
              <div className="rounded-3xl border border-border/80 bg-white/72 px-4 py-3">
                <p className="label-muted text-foreground/55">Liabilities</p>
                <p className="value-compact mt-1 text-destructive">{formatCurrency(Math.abs(totalLiabilities))}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 self-start bg-white/72 rounded-full p-1 border border-border/80 shadow-sm">
            {(["3M", "6M", "12M", "ALL"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200",
                  timeRange === range
                    ? "bg-foreground text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 -mx-1 rounded-[28px] border border-border/70 bg-white/68 px-2 py-4">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={filteredChart}>
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(44 81% 67%)" stopOpacity={0.28} />
                  <stop offset="65%" stopColor="hsl(44 81% 67%)" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="hsl(44 81% 67%)" stopOpacity={0} />
                </linearGradient>
                <filter id="glowDot">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(153 6% 42%)" }} tickLine={false} axisLine={false} />
              <YAxis hide domain={["dataMin - 5000", "dataMax + 5000"]} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const val = payload[0].value as number;
                  return (
                    <div className="rounded-3xl bg-white px-3 py-2 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.28)] border border-border/80">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(val)}</p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(227 75% 14%)" strokeWidth={2.25} fill="url(#heroGrad)" animationDuration={1500} animationEasing="ease-out" />
              {lastPoint && (
                <ReferenceDot x={lastPoint.month} y={lastPoint.value} r={4} fill="hsl(44 81% 67%)" stroke="white" strokeWidth={2} filter="url(#glowDot)" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
