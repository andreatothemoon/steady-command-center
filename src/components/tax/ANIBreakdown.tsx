import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TrendingDown } from "lucide-react";

interface ANIResult {
  gross_income: number;
  dividend_income?: number;
  rental_income?: number;
  salary_sacrifice_total: number;
  grossed_up_personal_pension: number;
  grossed_up_gift_aid: number;
  adjusted_net_income: number;
  pension_contributions: number;
  buffer_100k: number;
  buffer_125k: number;
}

export function ANIBreakdown({ computed }: { computed: ANIResult }) {
  const ani = computed.adjusted_net_income;
  const status: "safe" | "warning" | "danger" =
    ani >= 125140 ? "danger" : ani >= 100000 ? "danger" : ani >= 85000 ? "warning" : "safe";

  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        ANI Calculation
      </p>

      <div className="space-y-1 text-sm tabular-nums">
        <Row label="Gross Income" value={computed.gross_income} />
        {(computed.dividend_income ?? 0) > 0 && (
          <Row label="  incl. Dividends" value={computed.dividend_income!} />
        )}
        {computed.salary_sacrifice_total > 0 && (
          <Row label="Less: Salary Sacrifice" value={-computed.salary_sacrifice_total} negative />
        )}
        {computed.grossed_up_personal_pension > 0 && (
          <Row label="Less: Personal Pension (grossed up)" value={-computed.grossed_up_personal_pension} negative />
        )}
        {computed.grossed_up_gift_aid > 0 && (
          <Row label="Less: Gift Aid (grossed up)" value={-computed.grossed_up_gift_aid} negative />
        )}
        <div className="border-t border-border pt-1.5 mt-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold text-foreground">Adjusted Net Income</span>
            <span className={cn(
              "font-bold",
              status === "danger" ? "text-destructive" : status === "warning" ? "text-warning" : "text-foreground"
            )}>
              {formatCurrency(ani)}
            </span>
          </div>
        </div>
      </div>

      {/* Thresholds */}
      <div className="flex flex-wrap gap-2 pt-1">
        <ThresholdBadge label="£100k" buffer={computed.buffer_100k} />
        <ThresholdBadge label="£125,140" buffer={computed.buffer_125k} />
      </div>

      {/* Pension total */}
      {computed.pension_contributions > 0 && (
        <div className="pt-2 border-t border-border/40">
          <div className="flex items-start gap-2">
            <TrendingDown className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Total pension contributions (for AA): <span className="font-medium text-foreground">{formatCurrency(computed.pension_contributions)}</span> of £60,000
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs", negative ? "text-muted-foreground" : "text-foreground")}>
        {negative ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
      </span>
    </div>
  );
}

function ThresholdBadge({ label, buffer }: { label: string; buffer: number }) {
  const status = buffer <= 0 ? "danger" : buffer < 15000 ? "warning" : "safe";
  return (
    <span className={cn(
      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
      status === "safe" && "status-safe",
      status === "warning" && "status-warning",
      status === "danger" && "status-danger",
    )}>
      {label}: {buffer <= 0 ? "Exceeded" : `${formatCurrency(buffer)} buffer`}
    </span>
  );
}
