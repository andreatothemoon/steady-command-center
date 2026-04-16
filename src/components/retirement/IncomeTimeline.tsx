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
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { IncomeTimelinePoint } from "@/lib/retirementEngine";

const item = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const chartColors = {
  dc: "#091540",
  db: "#efcb68",
  state: "#e1efe6",
  isa: "#aeb7b3",
  grid: "rgba(9, 21, 64, 0.07)",
  axis: "rgba(0, 4, 17, 0.42)",
};

interface Props {
  timeline: IncomeTimelinePoint[];
  retireAge: number;
  targetIncome: number;
}

export default function IncomeTimeline({ timeline, retireAge, targetIncome }: Props) {
  void targetIncome;
  const chartData = useMemo(() => {
    return timeline.map((point) => ({
      age: point.age,
      dc: Math.round(point.dcDrawdown / 12),
      db: Math.round(point.dbPension / 12),
      state: Math.round(point.statePension / 12),
      isa: Math.round(point.isaWithdrawal / 12),
    }));
  }, [timeline]);

  const statePensionAge = useMemo(() => {
    return timeline.find((point) => point.statePension > 0)?.age ?? 67;
  }, [timeline]);

  const yMax = useMemo(() => {
    const maxTotal = chartData.reduce((max, point) => {
      const total = point.dc + point.db + point.state + point.isa;
      return Math.max(max, total);
    }, 0);
    const step = 1500;
    return Math.max(step, Math.ceil(maxTotal / step) * step);
  }, [chartData]);

  return (
    <motion.div variants={item} className="card-surface p-8 lg:p-10">
      <div className="mb-8">
        <h3 className="mb-2 text-2xl font-semibold text-foreground">Income Timeline</h3>
        <p className="text-sm text-muted-foreground">Monthly income by source from today through retirement.</p>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <AreaChart data={chartData} margin={{ top: 18, right: 24, left: 8, bottom: 12 }}>
          <defs>
            <linearGradient id="incomeDc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.dc} stopOpacity={0.96} />
              <stop offset="55%" stopColor={chartColors.dc} stopOpacity={0.74} />
              <stop offset="95%" stopColor={chartColors.dc} stopOpacity={0.46} />
            </linearGradient>
            <linearGradient id="incomeDb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.db} stopOpacity={0.94} />
              <stop offset="55%" stopColor={chartColors.db} stopOpacity={0.74} />
              <stop offset="95%" stopColor={chartColors.db} stopOpacity={0.44} />
            </linearGradient>
            <linearGradient id="incomeState" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.state} stopOpacity={0.92} />
              <stop offset="60%" stopColor={chartColors.state} stopOpacity={0.68} />
              <stop offset="95%" stopColor={chartColors.state} stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="incomeIsa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.isa} stopOpacity={0.86} />
              <stop offset="60%" stopColor={chartColors.isa} stopOpacity={0.66} />
              <stop offset="95%" stopColor={chartColors.isa} stopOpacity={0.38} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
          <XAxis
            dataKey="age"
            stroke={chartColors.axis}
            tick={{ fill: chartColors.axis, fontSize: 12 }}
            axisLine={{ stroke: "rgba(9, 21, 64, 0.12)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, yMax]}
            stroke={chartColors.axis}
            tick={{ fill: chartColors.axis, fontSize: 12 }}
            axisLine={{ stroke: "rgba(9, 21, 64, 0.12)" }}
            tickLine={false}
            width={72}
            tickFormatter={(value) => `£${value}`}
          />
          <Tooltip
            cursor={{ stroke: chartColors.dc, strokeWidth: 1.5, strokeDasharray: "5 5" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0]?.payload as { age: number; dc: number; db: number; state: number; isa: number };
              if (!data) return null;
              const dc = data.dc ?? 0;
              const db = data.db ?? 0;
              const sp = data.state ?? 0;
              const isa = data.isa ?? 0;
              const total = dc + isa + db + sp;
              return (
                <div className="min-w-[290px] rounded-[28px] border border-[rgba(0,0,0,0.08)] bg-white px-6 py-5 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.32)]">
                  <p className="mb-5 text-[2rem] font-semibold tracking-[-0.05em] text-foreground">Age {data.age}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between gap-6">
                      <span className="text-xl text-muted-foreground">DC Pension</span>
                      <span className="text-xl font-semibold tabular-nums text-foreground">{formatCurrency(dc)}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-xl text-muted-foreground">DB Pension</span>
                      <span className="text-xl font-semibold tabular-nums text-foreground">{formatCurrency(db)}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-xl text-muted-foreground">State Pension</span>
                      <span className="text-xl font-semibold tabular-nums text-foreground">{formatCurrency(sp)}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-xl text-muted-foreground">ISA</span>
                      <span className="text-xl font-semibold tabular-nums text-foreground">{formatCurrency(isa)}</span>
                    </div>
                    <div className="mt-4 flex justify-between gap-6 border-t border-[rgba(0,0,0,0.06)] pt-4">
                      <span className="text-xl font-semibold text-foreground">Total</span>
                      <span className="text-xl font-semibold tabular-nums text-foreground">{formatCurrency(total)}/mo</span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <ReferenceLine x={retireAge} stroke={chartColors.dc} strokeDasharray="3 3" strokeWidth={2.25} />
          <ReferenceLine x={statePensionAge} stroke={chartColors.db} strokeDasharray="3 3" strokeWidth={1.75} />
          <Area
            type="monotone"
            dataKey="isa"
            stackId="income"
            stroke={chartColors.isa}
            fill="url(#incomeIsa)"
            strokeWidth={0}
            activeDot={{ r: 6, fill: chartColors.isa, stroke: "#ffffff", strokeWidth: 3 }}
          />
          <Area
            type="monotone"
            dataKey="state"
            stackId="income"
            stroke={chartColors.state}
            fill="url(#incomeState)"
            strokeWidth={0}
            activeDot={{ r: 6, fill: chartColors.state, stroke: "#ffffff", strokeWidth: 3 }}
          />
          <Area
            type="monotone"
            dataKey="db"
            stackId="income"
            stroke={chartColors.db}
            fill="url(#incomeDb)"
            strokeWidth={0}
            activeDot={{ r: 6, fill: chartColors.db, stroke: "#ffffff", strokeWidth: 3 }}
          />
          <Area
            type="monotone"
            dataKey="dc"
            stackId="income"
            stroke={chartColors.dc}
            fill="url(#incomeDc)"
            strokeWidth={0}
            activeDot={{ r: 6, fill: chartColors.dc, stroke: "#ffffff", strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-6 flex flex-wrap justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors.dc }} />
          <span className="text-sm text-muted-foreground">DC Pension</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors.db }} />
          <span className="text-sm text-muted-foreground">DB Pension</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border border-[rgba(9,21,64,0.12)]" style={{ backgroundColor: chartColors.state }} />
          <span className="text-sm text-muted-foreground">State Pension</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors.isa }} />
          <span className="text-sm text-muted-foreground">ISA Withdrawals</span>
        </div>
      </div>
    </motion.div>
  );
}
