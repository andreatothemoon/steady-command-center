import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Account } from "@/hooks/useAccounts";

const ASSET_CLASSES: { key: string; label: string; color: string; types: string[] }[] = [
  { key: "cash", label: "Cash", color: "hsl(174, 58%, 39%)", types: ["current_account", "savings", "cash_isa"] },
  { key: "equities", label: "Equities", color: "hsl(142, 71%, 45%)", types: ["stocks_and_shares_isa", "gia", "employer_share_scheme"] },
  { key: "property", label: "Property", color: "hsl(38, 80%, 50%)", types: ["property"] },
  { key: "pension", label: "Pension", color: "hsl(258, 52%, 55%)", types: ["sipp", "workplace_pension", "db_pension"] },
  { key: "crypto", label: "Crypto", color: "hsl(48, 88%, 50%)", types: ["crypto"] },
];

interface Props {
  accounts: Account[];
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 2}
      outerRadius={outerRadius + 4}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
};

export default function AllocationDonut({ accounts }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = useMemo(() => {
    return ASSET_CLASSES
      .map((cls) => {
        const total = accounts
          .filter((a) => cls.types.includes(a.account_type) && Number(a.current_value) > 0)
          .reduce((s, a) => s + Number(a.current_value), 0);
        return { name: cls.label, value: total, color: cls.color, key: cls.key };
      })
      .filter((d) => d.value > 0);
  }, [accounts]);

  const grandTotal = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="card-surface p-5 flex items-center justify-center h-full min-h-[200px]">
        <p className="text-sm text-muted-foreground">Add accounts to see your allocation breakdown</p>
      </div>
    );
  }

  const hoveredItem = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="card-surface p-5">
      <p className="label-muted mb-4" style={{ opacity: 1 }}>Asset Allocation</p>
      <div className="flex items-center gap-4">
        {/* Chart */}
        <div className="relative w-[160px] h-[160px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {hoveredItem ? (
              <>
                <span className="text-xs text-muted-foreground">{hoveredItem.name}</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {((hoveredItem.value / grandTotal) * 100).toFixed(0)}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] text-muted-foreground">Total</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {formatCurrency(grandTotal, true)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 min-w-0">
          {data.map((item, i) => {
            const pct = ((item.value / grandTotal) * 100).toFixed(1);
            return (
              <div
                key={item.key}
                className={cn(
                  "flex items-center justify-between py-1 px-2 -mx-2 rounded-md transition-colors cursor-default",
                  activeIndex === i && "bg-secondary/40"
                )}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-card-foreground truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                  <span className="text-xs font-medium text-card-foreground tabular-nums w-16 text-right">
                    {formatCurrency(item.value, true)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
