import { Pencil, Trash2, TrendingUp, Shield, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DBPension } from "@/hooks/useDBPensions";
import type { DBProjectionResult } from "@/lib/dbPensionEngine";

interface Props {
  pension: DBPension;
  projection: DBProjectionResult;
  onEdit: () => void;
  onDelete: () => void;
}

export default function DBPensionCard({ pension, projection, onEdit, onDelete }: Props) {
  const yearsToRetirement = Math.max(0, pension.retirement_age - pension.current_age);
  const annualAccrual = pension.is_active_member
    ? Math.round(Number(pension.current_salary) / Number(pension.accrual_rate))
    : 0;

  return (
    <div className="card-surface overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">{pension.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {pension.scheme_type === "CARE" ? "CARE" : "Final Salary"} · 1/{Number(pension.accrual_rate)} ·{" "}
              {pension.is_active_member ? "Active" : "Deferred"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onEdit} className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-secondary/50">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Current → Projected */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Current Entitlement</p>
            <p className="text-lg font-semibold text-card-foreground tabular-nums">{formatCurrency(projection.current_annual_income)}<span className="text-xs text-muted-foreground font-normal">/yr</span></p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">At Retirement (age {pension.retirement_age})</p>
            <p className="text-lg font-semibold text-primary tabular-nums">{formatCurrency(projection.projected_annual_income)}<span className="text-xs text-muted-foreground font-normal">/yr</span></p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Existing (revalued)</span>
            <span className="text-card-foreground tabular-nums font-medium">{formatCurrency(projection.breakdown.existing_entitlement)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Future accrual ({yearsToRetirement}yrs)</span>
            <span className="text-card-foreground tabular-nums font-medium">{formatCurrency(projection.breakdown.future_accrual)}</span>
          </div>
        </div>

        {/* Insights */}
        <div className="pt-2 border-t border-border space-y-1.5">
          {pension.is_active_member && (
            <div className="flex items-start gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                Currently accruing <span className="text-card-foreground font-medium">{formatCurrency(annualAccrual)}/yr</span> in new pension income
              </p>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Shield className="h-3.5 w-3.5 text-info mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Revaluation: {pension.revaluation_type === "CPI" ? `CPI + ${(Number(pension.revaluation_uplift) * 100).toFixed(1)}%` : `${(Number(pension.revaluation_rate) * 100).toFixed(1)}% fixed`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
