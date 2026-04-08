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
    <motion.div variants={item} className="hero-surface p-5 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label-muted">Retirement Income Timeline</p>
          <p className="text-[11px] text-muted-foreground mt-1">Annual income by source from age {retireAge} to 90</p>
        </div>
        <div className="flex items-center gap-5 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(142, 71%, 45%)" }} /><span className="font-medium text-card-foreground">DC Drawdown</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(217, 91%, 60%)" }} /><span className="font-medium text-card-foreground">DB Pension</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(38, 92%, 50%)" }} /><span className="font-medium text-card-foreground">State Pension</span></span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-0 border-t border-dashed" style={{ borderColor: "hsl(0, 0%, 100%, 0.4)" }} /><span className="font-medium text-card-foreground">Target</span></span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} stackOffset="none">
          <defs>
            <linearGradient id="dcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="dbGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.02} />
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
              const db = (payload.find((p) => p.dataKey === "dbPension")?.value as number) ?? 0;
              const sp = (payload.find((p) => p.dataKey === "statePension")?.value as number) ?? 0;
              const total = dc + db + sp;
              return (
                <div className="card-surface px-3 py-2.5 shadow-xl border border-border text-xs space-y-1">
                  <p className="font-semibold text-card-foreground">Age {label}</p>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">DC drawdown</span>
                    <span className="tabular-nums text-card-foreground">{formatCurrency(dc)}</span>
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
            stroke="hsl(0, 0%, 100%)"
            strokeOpacity={0.2}
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
            stroke="hsl(38, 92%, 50%)"
            strokeWidth={1}
            fill="url(#spGrad)"
            animationDuration={1200}
          />
          <Area
            type="monotone"
            dataKey="dbPension"
            stackId="income"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth={1}
            fill="url(#dbGrad)"
            animationDuration={1400}
          />
          <Area
            type="monotone"
            dataKey="dcDrawdown"
            stackId="income"
            stroke="hsl(142, 71%, 45%)"
            strokeWidth={1.5}
            fill="url(#dcGrad)"
            animationDuration={1600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
