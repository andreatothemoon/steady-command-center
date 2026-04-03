import { motion } from "framer-motion";
import { TrendingUp, Wallet, PiggyBank, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MetricCard from "@/components/MetricCard";
import { mockAccounts, mockNetWorthHistory } from "@/data/mockData";
import { formatCurrency, staleness } from "@/lib/format";

export default function OverviewPage() {
  const totalAssets = mockAccounts.filter(a => a.value > 0).reduce((s, a) => s + a.value, 0);
  const totalLiabilities = mockAccounts.filter(a => a.value < 0).reduce((s, a) => s + a.value, 0);
  const netWorth = totalAssets + totalLiabilities;
  const pensions = mockAccounts.filter(a => ["sipp", "workplace_pension", "db_pension"].includes(a.type)).reduce((s, a) => s + a.value, 0);
  const investable = mockAccounts.filter(a => ["stocks_and_shares_isa", "cash_isa", "gia", "sipp", "workplace_pension", "crypto"].includes(a.type)).reduce((s, a) => s + a.value, 0);
  const isaUsed = 18000; // mock
  const isaLimit = 20000;
  const ani = 72000; // mock

  const staleAccounts = mockAccounts.filter(a => staleness(a.lastUpdated) === "stale");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Your financial position at a glance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Net Worth"
          value={formatCurrency(netWorth)}
          trend={{ value: "2.1% this year", positive: true }}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          label="Investable Assets"
          value={formatCurrency(investable)}
          sub="Excl. property & cash"
          icon={<Wallet className="h-4 w-4" />}
        />
        <MetricCard
          label="Pensions"
          value={formatCurrency(pensions)}
          sub="SIPP + Workplace"
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <MetricCard
          label="ISA Used"
          value={`${formatCurrency(isaUsed)} / ${formatCurrency(isaLimit)}`}
          sub={`${formatCurrency(isaLimit - isaUsed)} remaining`}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground">Net Worth Over Time</h2>
            <span className="text-xs text-muted-foreground">18 months</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mockNetWorthHistory}>
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
              <YAxis
                tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={55}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Net Worth"]}
                contentStyle={{
                  backgroundColor: "hsl(225, 20%, 11%)",
                  border: "1px solid hsl(225, 15%, 18%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(210, 20%, 92%)",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(160, 60%, 45%)"
                strokeWidth={2}
                fill="url(#netWorthGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Tax Position</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-card-foreground">Est. ANI</span>
                <span className="text-sm font-medium text-card-foreground">{formatCurrency(ani)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-card-foreground">Pension Relief</span>
                <span className="text-sm font-medium text-success">40%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-card-foreground">Retirement</span>
                <span className="text-sm font-medium text-warning">62%</span>
              </div>
            </div>
          </div>

          {staleAccounts.length > 0 && (
            <div className="rounded-xl border border-warning/30 bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h2 className="text-sm font-medium text-warning">Stale Data</h2>
              </div>
              <div className="space-y-2">
                {staleAccounts.map(a => (
                  <div key={a.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{a.name} ({a.provider})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
