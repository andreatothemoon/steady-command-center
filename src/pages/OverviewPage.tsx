import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ShieldCheck,
  ChevronRight,
  Users,
  Home,
  CreditCard,
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
import { mockNetWorthHistory } from "@/data/mockData";
import { useAccounts } from "@/hooks/useAccounts";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import { formatCurrency, staleness, daysAgo, calcMonthlyPayment } from "@/lib/format";
import { accountTypeLabels } from "@/data/types";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import AllocationDonut from "@/components/AllocationDonut";
import ActionCenter from "@/components/ActionCenter";
import TaxStatusCard from "@/components/TaxStatusCard";

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
  const { data: accounts = [] } = useAccounts();
  const { data: profiles = [] } = useHouseholdProfiles();

  const adults = profiles.filter((p) => p.role === "adult");
  const children = profiles.filter((p) => p.role === "child");

  const totalAssets = accounts
    .filter((a) => Number(a.current_value) > 0)
    .reduce((s, a) => s + Number(a.current_value), 0);
  const totalLiabilities = accounts
    .filter((a) => Number(a.current_value) < 0)
    .reduce((s, a) => s + Number(a.current_value), 0);
  const netWorth = totalAssets + totalLiabilities;

  const pensions = accounts
    .filter((a) => ["sipp", "workplace_pension", "db_pension"].includes(a.account_type))
    .reduce((s, a) => s + Number(a.current_value), 0);
  const investable = accounts
    .filter((a) =>
      ["stocks_and_shares_isa", "cash_isa", "gia", "sipp", "workplace_pension", "crypto"].includes(a.account_type)
    )
    .reduce((s, a) => s + Number(a.current_value), 0);

  const isaLimit = adults.length > 0 ? adults.length * 20000 : 20000;
  const isaUsed = 18000;
  const ani = 72000;

  const animatedNetWorth = useAnimatedValue(netWorth);
  const animatedDelta = useAnimatedValue(
    (() => {
      const fc = getFilteredChart(timeRange);
      const prev = fc.length > 1 ? fc[0].value : netWorth;
      return netWorth - prev;
    })(),
    800
  );

  const filteredChart = getFilteredChart(timeRange);

  const prevValue = filteredChart.length > 1 ? filteredChart[0].value : netWorth;
  const deltaAbs = netWorth - prevValue;
  const deltaPct = prevValue > 0 ? ((deltaAbs / prevValue) * 100).toFixed(1) : "0";
  const deltaPositive = deltaAbs >= 0;
  const lastPoint = filteredChart[filteredChart.length - 1];

  const stagger = {
    container: { transition: { staggerChildren: 0.08 } },
    item: {
      initial: { opacity: 0, y: 14 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
    },
  };

  return (
    <motion.div className="space-y-6" variants={stagger.container} initial="initial" animate="animate">
      {/* ═══ HERO: Net Worth ═══ */}
      <motion.div variants={stagger.item} className="hero-surface p-6 lg:p-8 relative">
        {/* Radial glow behind chart */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 80% at 70% 80%, hsl(160 60% 45% / 0.04) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="label-muted" style={{ opacity: 1 }}>Household Net Worth</p>
                {profiles.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-full">
                    <Users className="h-3 w-3" />
                    {adults.length} adult{adults.length !== 1 ? "s" : ""}
                    {children.length > 0 && ` · ${children.length} child${children.length !== 1 ? "ren" : ""}`}
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
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-sm font-bold",
                    deltaPositive ? "text-success" : "text-destructive"
                  )}
                >
                  {deltaPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {deltaPositive ? "+" : ""}{formatCurrency(animatedDelta)}
                </span>
                <span className="text-muted-foreground/60 text-sm">
                  {deltaPositive ? "+" : ""}{deltaPct}% this period
                </span>
              </motion.div>
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
                    <stop offset="0%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.3} />
                    <stop offset="50%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glowDot">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215, 12%, 40%)" }} tickLine={false} axisLine={false} />
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
                    r={5}
                    fill="hsl(160, 60%, 45%)"
                    stroke="hsl(228, 20%, 10%)"
                    strokeWidth={2}
                    filter="url(#glowDot)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ═══ KPI Row ═══ */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard label="Investable Assets" value={formatCurrency(investable)} sub="ISA + Pension + GIA + Crypto" icon={<Wallet className="h-4 w-4" />} />
        <KPICard label="Pensions" value={formatCurrency(pensions)} sub="SIPP + Workplace" icon={<PiggyBank className="h-4 w-4" />} />
        <KPICard
          label="Household ISA Allowance"
          value={formatCurrency(isaUsed)}
          sub={`${formatCurrency(isaLimit - isaUsed)} of ${formatCurrency(isaLimit)} remaining`}
          icon={<ShieldCheck className="h-4 w-4" />}
          progress={(isaUsed / isaLimit) * 100}
        />
      </motion.div>

      {/* ═══ Allocation + Tax Status ═══ */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AllocationDonut accounts={accounts} />
        <TaxStatusCard
          ani={ani}
          isaUsed={isaUsed}
          isaLimit={isaLimit}
          adults={adults.length || 1}
          children={children.length}
        />
      </motion.div>

      {/* ═══ Property Equity ═══ */}
      {(() => {
        const properties = accounts.filter((a) => a.account_type === "property");
        if (properties.length === 0) return null;

        const mortgages = accounts.filter((a) => a.account_type === "mortgage");

        const equityItems = properties.map((prop) => {
          const linkedMortgage = mortgages.find((m) => (m as any).linked_account_id === prop.id);
          const propertyValue = Number(prop.current_value);
          const mortgageBalance = linkedMortgage ? Math.abs(Number(linkedMortgage.current_value)) : 0;
          const equity = propertyValue - mortgageBalance;
          const ltv = propertyValue > 0 ? (mortgageBalance / propertyValue) * 100 : 0;
          return { property: prop, mortgage: linkedMortgage, propertyValue, mortgageBalance, equity, ltv };
        });

        const totalEquity = equityItems.reduce((s, e) => s + e.equity, 0);

        return (
          <motion.div variants={stagger.item} className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground/50" />
                <p className="label-muted" style={{ opacity: 1 }}>Property Equity</p>
              </div>
              <span className="text-sm font-bold tabular-nums text-card-foreground">
                {formatCurrency(totalEquity)}
              </span>
            </div>
            <div className="space-y-3">
              {equityItems.map((item) => (
                <div key={item.property.id} className="rounded-lg bg-secondary/20 px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-card-foreground">{item.property.name}</p>
                    <p className="text-sm font-bold tabular-nums text-success">
                      {formatCurrency(item.equity)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
                    <span>Value: {formatCurrency(item.propertyValue)}</span>
                    {item.mortgage ? (
                      <span>
                        Mortgage: {formatCurrency(item.mortgageBalance)} · LTV {item.ltv.toFixed(0)}%
                        {(item.mortgage as any).interest_rate != null && ` · ${Number((item.mortgage as any).interest_rate).toFixed(2)}%`}
                        {(item.mortgage as any).term_remaining_months != null && ` · ${Math.floor(Number((item.mortgage as any).term_remaining_months) / 12)}y left`}
                        {(() => {
                          const mp = calcMonthlyPayment(
                            item.mortgageBalance,
                            Number((item.mortgage as any).interest_rate ?? 0),
                            Number((item.mortgage as any).term_remaining_months ?? 0)
                          );
                          return mp ? ` · ${formatCurrency(Math.round(mp))}/mo` : "";
                        })()}
                      </span>
                    ) : (
                      <span className="text-success">No mortgage — fully owned</span>
                    )}
                  </div>
                  {item.mortgage && (
                    <div className="mt-2 h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          item.ltv > 80 ? "bg-warning" : "bg-primary"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(item.ltv, 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* ═══ Debt Summary ═══ */}
      {(() => {
        const debtTypes = ["mortgage", "loan", "credit_card"];
        const debtAccounts = accounts.filter((a) => debtTypes.includes(a.account_type));
        if (debtAccounts.length === 0) return null;

        const totalDebt = debtAccounts.reduce((s, a) => s + Math.abs(Number(a.current_value)), 0);
        const totalMonthly = debtAccounts.reduce((s, a) => {
          const mp = calcMonthlyPayment(
            Math.abs(Number(a.current_value)),
            Number((a as any).interest_rate ?? 0),
            Number((a as any).term_remaining_months ?? 0)
          );
          return s + (mp ?? 0);
        }, 0);

        const byType = debtTypes.reduce<Record<string, typeof debtAccounts>>((acc, t) => {
          const items = debtAccounts.filter((a) => a.account_type === t);
          if (items.length > 0) acc[t] = items;
          return acc;
        }, {});

        return (
          <motion.div variants={stagger.item} className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground/50" />
                <p className="label-muted" style={{ opacity: 1 }}>Debt Summary</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold tabular-nums text-destructive">
                  {formatCurrency(totalDebt)}
                </span>
                {totalMonthly > 0 && (
                  <p className="text-[10px] text-muted-foreground/60">{formatCurrency(Math.round(totalMonthly))}/mo total</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(byType).map(([type, items]) => {
                const typeTotal = items.reduce((s, a) => s + Math.abs(Number(a.current_value)), 0);
                const typeMonthly = items.reduce((s, a) => {
                  const mp = calcMonthlyPayment(
                    Math.abs(Number(a.current_value)),
                    Number((a as any).interest_rate ?? 0),
                    Number((a as any).term_remaining_months ?? 0)
                  );
                  return s + (mp ?? 0);
                }, 0);

                return (
                  <div key={type} className="rounded-lg bg-secondary/20 px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-card-foreground">
                        {accountTypeLabels[type as keyof typeof accountTypeLabels] ?? type}
                        <span className="text-[10px] text-muted-foreground/60 ml-1.5">({items.length})</span>
                      </p>
                      <p className="text-sm font-bold tabular-nums text-destructive">
                        {formatCurrency(typeTotal)}
                      </p>
                    </div>
                    {items.map((a) => {
                      const bal = Math.abs(Number(a.current_value));
                      const mp = calcMonthlyPayment(
                        bal,
                        Number((a as any).interest_rate ?? 0),
                        Number((a as any).term_remaining_months ?? 0)
                      );
                      return (
                        <div key={a.id} className="flex items-center justify-between text-[11px] text-muted-foreground/70 py-0.5">
                          <span>{a.name}</span>
                          <span className="tabular-nums">
                            {formatCurrency(bal)}
                            {(a as any).interest_rate != null && ` · ${Number((a as any).interest_rate).toFixed(2)}%`}
                            {mp ? ` · ${formatCurrency(Math.round(mp))}/mo` : ""}
                          </span>
                        </div>
                      );
                    })}
                    {typeMonthly > 0 && (
                      <div className="flex items-center justify-between text-[11px] font-medium text-card-foreground pt-1.5 mt-1.5 border-t border-border/40">
                        <span>Monthly total</span>
                        <span className="tabular-nums">{formatCurrency(Math.round(typeMonthly))}/mo</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      {/* ═══ Action Center ═══ */}
      <motion.div variants={stagger.item}>
        <ActionCenter
          accounts={accounts}
          ani={ani}
          isaUsed={isaUsed}
          isaLimit={isaLimit}
        />
      </motion.div>
    </motion.div>
  );
}

function getFilteredChart(timeRange: TimeRange) {
  switch (timeRange) {
    case "3M": return mockNetWorthHistory.slice(-3);
    case "6M": return mockNetWorthHistory.slice(-6);
    case "12M": return mockNetWorthHistory.slice(-12);
    default: return mockNetWorthHistory;
  }
}

/* ─── Sub-components ─── */

function KPICard({ label, value, sub, icon, progress }: { label: string; value: string; sub: string; icon: React.ReactNode; progress?: number }) {
  return (
    <div className="card-surface-hover p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="label-muted" style={{ opacity: 1 }}>{label}</p>
        <div className="text-muted-foreground/40">{icon}</div>
      </div>
      <p className="value-compact">{value}</p>
      {progress !== undefined && (
        <div className="mt-2.5 h-1.5 rounded-full bg-secondary/40 overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", progress > 90 ? "bg-warning" : "bg-primary")}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      )}
      <p className="text-[11px] text-muted-foreground/60 mt-1.5">{sub}</p>
    </div>
  );
}