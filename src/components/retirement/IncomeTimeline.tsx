import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { IncomeTimelinePoint } from "@/lib/retirementEngine";

const item = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface Props {
  timeline: IncomeTimelinePoint[];
  retireAge: number;
  targetIncome: number;
}

export default function IncomeTimeline({ timeline, retireAge, targetIncome }: Props) {
  const chartData = useMemo(() => {
    return timeline.filter((p) => p.age >= retireAge);
  }, [timeline, retireAge]);

  return (
    <motion.div variants={item} className="card-surface p-8 lg:p-10">
      <div className="mb-8">
        <h3 className="mb-2 text-2xl font-semibold text-foreground">Income Timeline</h3>
        <p className="text-sm text-muted-foreground">Annual income by source from age {retireAge} onward.</p>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Sources</p>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-card-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(211 51% 24%)" }} /> DC</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(211 40% 38%)" }} /> ISA</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(160 84% 39%)" }} /> DB</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(33 89% 55%)" }} /> State</span>
          <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed" style={{ borderColor: "hsl(220 8% 47%)" }} /> Target</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} stackOffset="none">
          <defs>
            <linearGradient id="dcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(211 51% 24%)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="hsl(211 51% 24%)" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="dbGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(33 89% 55%)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="hsl(33 89% 55%)" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="isaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(211 40% 38%)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="hsl(211 40% 38%)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="age"
            tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }}
            tickLine={false}
            axisLine={false}
            width={55}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const dc = (payload.find((p) => p.dataKey === "dcDrawdown")?.value as number) ?? 0;
              const isa = (payload.find((p) => p.dataKey === "isaWithdrawal")?.value as number) ?? 0;
              const db = (payload.find((p) => p.dataKey === "dbPension")?.value as number) ?? 0;
              const sp = (payload.find((p) => p.dataKey === "statePension")?.value as number) ?? 0;
              const total = dc + isa + db + sp;
              return (
                <div className="card-surface space-y-1 border border-border px-3 py-2.5 text-xs">
                  <p className="font-semibold text-card-foreground">Age {label}</p>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">DC drawdown</span>
                    <span className="tabular-nums text-card-foreground">{formatCurrency(dc)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">ISA drawdown</span>
                    <span className="tabular-nums text-card-foreground">{formatCurrency(isa)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">DB pension</span>
                    <span className="tabular-nums text-card-foreground">{formatCurrency(db)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">State pension</span>
                    <span className="tabular-nums text-card-foreground">{formatCurrency(sp)}</span>
                  </div>
                  <div className="flex justify-between gap-4 pt-1 border-t border-border">
                    <span className="font-semibold text-card-foreground">Total</span>
                    <span className="font-bold tabular-nums text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              );
            }}
          />
          <ReferenceLine
            y={targetIncome}
            stroke="hsl(220 8% 47%)"
            strokeOpacity={0.55}
            strokeDasharray="6 4"
            label={{
              value: `Target ${formatCurrency(targetIncome)}`,
              position: "right",
              fill: "hsl(220, 9%, 46%)",
              fontSize: 10,
            }}
          />
          <Area
            type="monotone"
            dataKey="statePension"
            stackId="income"
            stroke="hsl(33 89% 55%)"
            strokeWidth={1}
            fill="url(#spGrad)"
            animationDuration={1200}
          />
          <Area
            type="monotone"
            dataKey="dbPension"
            stackId="income"
            stroke="hsl(160 84% 39%)"
            strokeWidth={1}
            fill="url(#dbGrad)"
            animationDuration={1400}
          />
          <Area
            type="monotone"
            dataKey="isaWithdrawal"
            stackId="income"
            stroke="hsl(211 40% 38%)"
            strokeWidth={1}
            fill="url(#isaGrad)"
            animationDuration={1500}
          />
          <Area
            type="monotone"
            dataKey="dcDrawdown"
            stackId="income"
            stroke="hsl(211 51% 24%)"
            strokeWidth={1.5}
            fill="url(#dcGrad)"
            animationDuration={1600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
