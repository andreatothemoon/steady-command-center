import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";
import { Slider } from "@/components/ui/slider";

export default function RetirementPage() {
  const [currentAge, setCurrentAge] = useState(35);
  const [retireAge, setRetireAge] = useState(57);
  const [currentPot, setCurrentPot] = useState(212700);
  const [monthlyContrib, setMonthlyContrib] = useState(750);
  const [employerContrib, setEmployerContrib] = useState(500);
  const [expectedReturn, setExpectedReturn] = useState(5);
  const [inflation, setInflation] = useState(2.5);
  const [targetIncome, setTargetIncome] = useState(30000);

  const projection = useMemo(() => {
    const years = retireAge - currentAge;
    const monthlyReturn = expectedReturn / 100 / 12;
    const monthlyInflation = inflation / 100 / 12;
    const totalMonthly = monthlyContrib + employerContrib;
    const data: { age: number; nominal: number; real: number }[] = [];

    let nominal = currentPot;
    let real = currentPot;

    for (let y = 0; y <= years; y++) {
      data.push({ age: currentAge + y, nominal: Math.round(nominal), real: Math.round(real) });
      for (let m = 0; m < 12; m++) {
        nominal = nominal * (1 + monthlyReturn) + totalMonthly;
        real = real * (1 + monthlyReturn - monthlyInflation) + totalMonthly;
      }
    }
    return data;
  }, [currentAge, retireAge, currentPot, monthlyContrib, employerContrib, expectedReturn, inflation]);

  const finalNominal = projection[projection.length - 1]?.nominal ?? 0;
  const finalReal = projection[projection.length - 1]?.real ?? 0;
  const drawdownRate = 0.04;
  const estimatedIncome = Math.round(finalReal * drawdownRate);
  const gap = targetIncome - estimatedIncome;

  const sliders: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; format: (v: number) => string }[] = [
    { label: "Current Age", value: currentAge, onChange: setCurrentAge, min: 18, max: 65, step: 1, format: (v) => `${v}` },
    { label: "Retirement Age", value: retireAge, onChange: setRetireAge, min: 50, max: 75, step: 1, format: (v) => `${v}` },
    { label: "Current Pot", value: currentPot, onChange: setCurrentPot, min: 0, max: 1000000, step: 5000, format: formatCurrency },
    { label: "Your Monthly", value: monthlyContrib, onChange: setMonthlyContrib, min: 0, max: 5000, step: 50, format: formatCurrency },
    { label: "Employer Monthly", value: employerContrib, onChange: setEmployerContrib, min: 0, max: 5000, step: 50, format: formatCurrency },
    { label: "Expected Return", value: expectedReturn, onChange: setExpectedReturn, min: 1, max: 10, step: 0.5, format: (v) => `${v}%` },
    { label: "Inflation", value: inflation, onChange: setInflation, min: 0, max: 6, step: 0.5, format: (v) => `${v}%` },
    { label: "Target Income", value: targetIncome, onChange: setTargetIncome, min: 10000, max: 100000, step: 1000, format: formatCurrency },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Retirement</h1>
        <p className="text-sm text-muted-foreground mt-1">Project your pension pot and retirement income</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Projected Pot (Real)</p>
          <p className="text-2xl font-semibold text-card-foreground mt-1">{formatCurrency(finalReal)}</p>
          <p className="text-xs text-muted-foreground mt-1">Nominal: {formatCurrency(finalNominal)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Est. Annual Income</p>
          <p className="text-2xl font-semibold text-card-foreground mt-1">{formatCurrency(estimatedIncome)}</p>
          <p className="text-xs text-muted-foreground mt-1">4% drawdown rate</p>
        </div>
        <div className={`rounded-xl border p-5 ${gap > 0 ? "border-warning/30 bg-card" : "border-success/30 bg-card"}`}>
          <p className="text-sm text-muted-foreground">Income Gap</p>
          <p className={`text-2xl font-semibold mt-1 ${gap > 0 ? "text-warning" : "text-success"}`}>
            {gap > 0 ? `-${formatCurrency(gap)}` : `+${formatCurrency(Math.abs(gap))}`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {gap > 0 ? "Below target — increase contributions" : "On track to meet target"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-5"
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Pension Projection</h2>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={projection}>
              <defs>
                <linearGradient id="nomGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(200, 70%, 50%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(200, 70%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="age" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name === "nominal" ? "Nominal" : "Real (inflation-adjusted)"]}
                contentStyle={{
                  backgroundColor: "hsl(225, 20%, 11%)",
                  border: "1px solid hsl(225, 15%, 18%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(210, 20%, 92%)",
                }}
              />
              <Area type="monotone" dataKey="nominal" stroke="hsl(200, 70%, 50%)" strokeWidth={1.5} fill="url(#nomGrad)" />
              <Area type="monotone" dataKey="real" stroke="hsl(160, 60%, 45%)" strokeWidth={2} fill="url(#realGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-5 space-y-5"
        >
          <h2 className="text-sm font-medium text-muted-foreground">Assumptions</h2>
          {sliders.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className="text-xs font-medium text-card-foreground tabular-nums">{s.format(s.value)}</span>
              </div>
              <Slider
                value={[s.value]}
                onValueChange={([v]) => s.onChange(v)}
                min={s.min}
                max={s.max}
                step={s.step}
                className="w-full"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
