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
              <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.84} />
              <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0.32} />
            </linearGradient>
            <linearGradient id="incomeDb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b5f8a" stopOpacity={0.82} />
              <stop offset="95%" stopColor="#3b5f8a" stopOpacity={0.28} />
            </linearGradient>
            <linearGradient id="incomeState" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5a7fa8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#5a7fa8" stopOpacity={0.26} />
            </linearGradient>
            <linearGradient id="incomeIsa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a8c5e2" stopOpacity={0.82} />
              <stop offset="95%" stopColor="#a8c5e2" stopOpacity={0.34} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
          <XAxis
            dataKey="age"
            stroke="#666666"
            tick={{ fill: "#666666", fontSize: 12 }}
            axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, yMax]}
            stroke="#666666"
            tick={{ fill: "#666666", fontSize: 12 }}
            axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
            tickLine={false}
            width={72}
            tickFormatter={(value) => `£${value}`}
          />
          <Tooltip
            cursor={{ stroke: "#1e3a5f", strokeWidth: 1.5, strokeDasharray: "5 5" }}
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
          <ReferenceLine x={retireAge} stroke="#1e3a5f" strokeDasharray="3 3" strokeWidth={2} />
          <ReferenceLine x={statePensionAge} stroke="#5a7fa8" strokeDasharray="3 3" strokeWidth={1.5} />
          <Area
            type="monotone"
            dataKey="isa"
            stackId="income"
            stroke="#a8c5e2"
            fill="url(#incomeIsa)"
            strokeWidth={0}
            activeDot={{ r: 6, fill: "#a8c5e2", stroke: "#ffffff", strokeWidth: 3 }}
          />
          <Area
            type="monotone"
            dataKey="state"
            stackId="income"
            stroke="#5a7fa8"
            fill="url(#incomeState)"
            strokeWidth={0}
            activeDot={{ r: 6, fill: "#5a7fa8", stroke: "#ffffff", strokeWidth: 3 }}
          />
          <Area
            type="monotone"
            dataKey="db"
            stackId="income"
            stroke="#3b5f8a"
            fill="url(#incomeDb)"
            strokeWidth={0}
            activeDot={{ r: 6, fill: "#3b5f8a", stroke: "#ffffff", strokeWidth: 3 }}
          />
          <Area
            type="monotone"
            dataKey="dc"
            stackId="income"
            stroke="#1e3a5f"
            fill="url(#incomeDc)"
            strokeWidth={0}
            activeDot={{ r: 6, fill: "#1e3a5f", stroke: "#ffffff", strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-6 flex flex-wrap justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#1e3a5f]" />
          <span className="text-sm text-muted-foreground">DC Pension</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#3b5f8a]" />
          <span className="text-sm text-muted-foreground">DB Pension</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#5a7fa8]" />
          <span className="text-sm text-muted-foreground">State Pension</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#a8c5e2]" />
          <span className="text-sm text-muted-foreground">ISA Withdrawals</span>
        </div>
      </div>
    </motion.div>
  );
}
