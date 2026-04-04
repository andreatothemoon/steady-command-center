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

function getFilteredChart(timeRange: TimeRange) {
  switch (timeRange) {
    case "3M": return mockNetWorthHistory.slice(-3);
    case "6M": return mockNetWorthHistory.slice(-6);
    case "12M": return mockNetWorthHistory.slice(-12);
    default: return mockNetWorthHistory;
  }
}

interface Props {
  accounts: Account[];
  adultsCount: number;
  childrenCount: number;
}

export default function NetWorthHero({ accounts, adultsCount, childrenCount }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");

  const totalAssets = accounts
    .filter((a) => Number(a.current_value) > 0)
    .reduce((s, a) => s + Number(a.current_value), 0);
  const totalLiabilities = accounts
    .filter((a) => Number(a.current_value) < 0)
    .reduce((s, a) => s + Number(a.current_value), 0);
  const netWorth = totalAssets + totalLiabilities;

  const filteredChart = getFilteredChart(timeRange);
  const prevValue = filteredChart.length > 1 ? filteredChart[0].value : netWorth;
  const deltaAbs = netWorth - prevValue;
  const deltaPct = prevValue > 0 ? ((deltaAbs / prevValue) * 100).toFixed(1) : "0";
  const deltaPositive = deltaAbs >= 0;
  const lastPoint = filteredChart[filteredChart.length - 1];

  const animatedNetWorth = useAnimatedValue(netWorth);
  const animatedDelta = useAnimatedValue(deltaAbs, 800);

  return (
    <div className="hero-surface p-6 lg:p-8 relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 80% at 70% 80%, hsl(142 71% 45% / 0.04) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="label-muted" style={{ opacity: 1 }}>Household Net Worth</p>
              {(adultsCount > 0 || childrenCount > 0) && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-full">
                  <Users className="h-3 w-3" />
                  {adultsCount} adult{adultsCount !== 1 ? "s" : ""}
                  {childrenCount > 0 && ` · ${childrenCount} child${childrenCount !== 1 ? "ren" : ""}`}
                </span>
              )}
            </div>
            <h1 className="value-hero text-5xl lg:text-[3.5rem] leading-none">
              {formatCurrency(animatedNetWorth)}
            </h1>
            <motion.div
              className="flex items-center gap-3 mt-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <span className={cn("inline-flex items-center gap-1 text-sm font-bold", deltaPositive ? "text-success" : "text-destructive")}>
                {deltaPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {deltaPositive ? "+" : ""}{formatCurrency(animatedDelta)}
              </span>
              <span className="text-muted-foreground/60 text-sm">
                {deltaPositive ? "+" : ""}{deltaPct}% this period
              </span>
            </motion.div>
            {/* Assets vs Liabilities inline */}
            <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground/60">
              <span>Assets: <span className="text-card-foreground font-medium">{formatCurrency(totalAssets)}</span></span>
              <span>Liabilities: <span className="text-destructive font-medium">{formatCurrency(Math.abs(totalLiabilities))}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-0.5 backdrop-blur-sm">
            {(["3M", "6M", "12M", "ALL"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                  timeRange === range
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 -mx-2">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={filteredChart}>
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.25} />
                  <stop offset="50%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
                <filter id="glowDot">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220, 9%, 46%)" }} tickLine={false} axisLine={false} />
              <YAxis hide domain={["dataMin - 5000", "dataMax + 5000"]} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const val = payload[0].value as number;
                  return (
                    <div className="card-surface px-3 py-2 shadow-2xl border border-border/60">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(val)}</p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(142, 71%, 45%)" strokeWidth={2.5} fill="url(#heroGrad)" animationDuration={1500} animationEasing="ease-out" />
              {lastPoint && (
                <ReferenceDot x={lastPoint.month} y={lastPoint.value} r={5} fill="hsl(142, 71%, 45%)" stroke="hsl(222, 28%, 9%)" strokeWidth={2.5} filter="url(#glowDot)" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
