import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { mockAccounts, mockNetWorthHistory } from "@/data/mockData";
import { formatCurrency, staleness, daysAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// Animated counter hook
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

type TimeRange = "3M" | "6M" | "12M" | "ALL";

export default function OverviewPage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");

  const totalAssets = mockAccounts
    .filter((a) => a.value > 0)
    .reduce((s, a) => s + a.value, 0);
  const totalLiabilities = mockAccounts
    .filter((a) => a.value < 0)
    .reduce((s, a) => s + a.value, 0);
  const netWorth = totalAssets + totalLiabilities;
  const pensions = mockAccounts
    .filter((a) =>
      ["sipp", "workplace_pension", "db_pension"].includes(a.type)
    )
    .reduce((s, a) => s + a.value, 0);
  const investable = mockAccounts
    .filter((a) =>
      [
        "stocks_and_shares_isa",
        "cash_isa",
        "gia",
        "sipp",
        "workplace_pension",
        "crypto",
      ].includes(a.type)
    )
    .reduce((s, a) => s + a.value, 0);
  const isaUsed = 18000;
  const isaLimit = 20000;
  const ani = 72000;

  const staleAccounts = mockAccounts.filter(
    (a) => staleness(a.lastUpdated) === "stale"
  );

  const animatedNetWorth = useAnimatedValue(netWorth);

  // Filter chart data by time range
  const filteredChart = (() => {
    const len = mockNetWorthHistory.length;
    switch (timeRange) {
      case "3M":
        return mockNetWorthHistory.slice(-3);
      case "6M":
        return mockNetWorthHistory.slice(-6);
      case "12M":
        return mockNetWorthHistory.slice(-12);
      default:
        return mockNetWorthHistory;
    }
  })();

  const prevValue = filteredChart.length > 1 ? filteredChart[0].value : netWorth;
  const deltaAbs = netWorth - prevValue;
  const deltaPct = prevValue > 0 ? ((deltaAbs / prevValue) * 100).toFixed(1) : "0";
  const deltaPositive = deltaAbs >= 0;

  const lastPoint = filteredChart[filteredChart.length - 1];

  const stagger = {
    container: { transition: { staggerChildren: 0.08 } },
    item: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
    },
  };

  return (
    <motion.div
      className="space-y-5"
      variants={stagger.container}
      initial="initial"
      animate="animate"
    >
      {/* Hero Net Worth */}
      <motion.div variants={stagger.item} className="hero-surface p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="label-muted mb-2">Net Worth</p>
            <h1 className="value-hero text-5xl lg:text-[3.5rem] leading-none">
              {formatCurrency(animatedNetWorth)}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-semibold",
                  deltaPositive ? "text-success" : "text-destructive"
                )}
              >
                {deltaPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {deltaPositive ? "+" : ""}
                {formatCurrency(deltaAbs)}
              </span>
              <span className="text-muted-foreground text-sm">
                {deltaPositive ? "+" : ""}
                {deltaPct}% this period
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg p-0.5">
            {(["3M", "6M", "12M", "ALL"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                  timeRange === range
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Inline sparkline / chart */}
        <div className="mt-5 -mx-2">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={filteredChart}>
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(160, 60%, 45%)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(160, 60%, 45%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(215, 12%, 48%)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide domain={["dataMin - 5000", "dataMax + 5000"]} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const val = payload[0].value as number;
                  return (
                    <div className="card-surface px-3 py-2 shadow-xl border border-border">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(val)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(160, 60%, 45%)"
                strokeWidth={2.5}
                fill="url(#heroGrad)"
                animationDuration={1500}
                animationEasing="ease-out"
              />
              {lastPoint && (
                <ReferenceDot
                  x={lastPoint.month}
                  y={lastPoint.value}
                  r={4}
                  fill="hsl(160, 60%, 45%)"
                  stroke="hsl(228, 20%, 10%)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Compact KPI Row */}
      <motion.div
        variants={stagger.item}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <KPICard
          label="Investable Assets"
          value={formatCurrency(investable)}
          sub="ISA + Pension + GIA + Crypto"
          icon={<Wallet className="h-4 w-4" />}
        />
        <KPICard
          label="Pensions"
          value={formatCurrency(pensions)}
          sub="SIPP + Workplace"
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <KPICard
          label="ISA Allowance"
          value={`${formatCurrency(isaUsed)}`}
          sub={`${formatCurrency(isaLimit - isaUsed)} of ${formatCurrency(isaLimit)} remaining`}
          icon={<ShieldCheck className="h-4 w-4" />}
          progress={(isaUsed / isaLimit) * 100}
        />
      </motion.div>

      {/* Insights Row */}
      <motion.div
        variants={stagger.item}
        className="grid grid-cols-1 gap-3 lg:grid-cols-2"
      >
        {/* Tax Position */}
        <div className="card-insight p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="label-muted">Tax Position</p>
            <button
              onClick={() => navigate("/tax")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
            >
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            <TaxRow label="Est. ANI" value={formatCurrency(ani)} status={ani >= 100000 ? "danger" : "ok"} />
            <TaxRow label="Tax Band" value="Higher (40%)" status="neutral" />
            <TaxRow label="Retirement Progress" value="62%" status="warning" />
          </div>
        </div>

        {/* Stale Data — Actionable */}
        {staleAccounts.length > 0 ? (
          <div className="card-alert p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="label-muted text-warning">
                {staleAccounts.length} account{staleAccounts.length > 1 ? "s" : ""} need updating
              </p>
            </div>
            <div className="space-y-1">
              {staleAccounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate("/accounts")}
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 -mx-1 hover:bg-warning/5 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-3.5 w-3.5 text-warning/70" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-card-foreground">
                        {a.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {a.provider} · {daysAgo(a.lastUpdated)} days ago
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-warning opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Update <ArrowUpRight className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="card-insight p-5 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">All accounts up to date ✓</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Sub-components ─── */

function KPICard({
  label,
  value,
  sub,
  icon,
  progress,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  progress?: number;
}) {
  return (
    <div className="card-surface-hover p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="label-muted">{label}</p>
        <div className="text-muted-foreground/60">{icon}</div>
      </div>
      <p className="value-compact">{value}</p>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              progress > 90 ? "bg-warning" : "bg-primary"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      )}
      <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>
    </div>
  );
}

function TaxRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "ok" | "warning" | "danger" | "neutral";
}) {
  const colors = {
    ok: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    neutral: "text-card-foreground",
  };
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", colors[status])}>
        {value}
      </span>
    </div>
  );
}
