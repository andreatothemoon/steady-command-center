import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import { Landmark, Shield, Building2, Wallet } from "lucide-react";
import type { RetirementProjection } from "@/lib/retirementEngine";
import type { DBPension } from "@/hooks/useDBPensions";
import { projectDBPension } from "@/lib/dbPensionEngine";
import { STATE_PENSION_AGE, UK_STATE_PENSION_FULL } from "@/lib/retirementEngine";

const item = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface Props {
  projection: RetirementProjection;
  dbPensions: DBPension[];
  statePensionPct: number;
  retireAge: number;
  drawdownRate: number;
}

export default function IncomeSourceCards({ projection, dbPensions, statePensionPct, retireAge, drawdownRate }: Props) {
  const dbProjections = dbPensions.map((p) =>
    projectDBPension(toDBPensionParams(p))
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* DC Pensions */}
      <motion.div variants={item} className="card-surface p-4 lg:p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-card-foreground">DC Pensions</span>
        </div>
        <div className="space-y-2.5">
          <div>
            <p className="text-[11px] text-muted-foreground">Projected pot</p>
            <p className="text-lg font-bold tabular-nums text-card-foreground">{formatCurrency(projection.dcPotAtRetirement)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Annual drawdown</p>
            <p className="text-lg font-bold tabular-nums text-primary">{formatCurrency(projection.dcDrawdown)}</p>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Drawdown rate</span>
            <span className="font-medium text-card-foreground">{(drawdownRate * 100).toFixed(0)}%</span>
          </div>
          {projection.dcDepletionAge && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Pot depletes at</span>
              <span className="font-medium text-warning">Age {projection.dcDepletionAge}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* DB Pensions */}
      <motion.div variants={item} className="card-surface p-4 lg:p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: "hsl(217, 91%, 60%, 0.1)", color: "hsl(217, 91%, 60%)" }}>
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-card-foreground">DB Pensions</span>
        </div>
        <div className="space-y-2.5">
          <div>
            <p className="text-[11px] text-muted-foreground">Projected income</p>
            <p className="text-lg font-bold tabular-nums" style={{ color: "hsl(217, 91%, 60%)" }}>{formatCurrency(projection.totalDBIncome)}</p>
          </div>
          {dbProjections.map((proj, i) => (
            <div key={dbPensions[i]?.id} className="pt-1.5 border-t border-border/50 space-y-1">
              <p className="text-[11px] font-medium text-card-foreground">{dbPensions[i]?.name}</p>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Existing</span>
                <span className="tabular-nums text-muted-foreground">{formatCurrency(proj.breakdown.existing_entitlement)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Future accrual</span>
                <span className="tabular-nums text-muted-foreground">{formatCurrency(proj.breakdown.future_accrual)}</span>
              </div>
            </div>
          ))}
          {dbPensions.length === 0 && (
            <p className="text-[11px] text-muted-foreground">No DB schemes added</p>
          )}
        </div>
      </motion.div>

      {/* State Pension */}
      <motion.div variants={item} className="card-surface p-4 lg:p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: "hsl(38, 92%, 50%, 0.1)", color: "hsl(38, 92%, 50%)" }}>
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-card-foreground">State Pension</span>
        </div>
        <div className="space-y-2.5">
          <div>
            <p className="text-[11px] text-muted-foreground">Estimated annual</p>
            <p className="text-lg font-bold tabular-nums" style={{ color: "hsl(38, 92%, 50%)" }}>{formatCurrency(projection.statePensionIncome)}</p>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Starts at</span>
            <span className="font-medium text-card-foreground">Age {STATE_PENSION_AGE}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">NI completeness</span>
            <span className="font-medium text-card-foreground">{statePensionPct}%</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Full amount</span>
            <span className="tabular-nums text-muted-foreground">{formatCurrency(UK_STATE_PENSION_FULL)}/yr</span>
          </div>
          {retireAge < STATE_PENSION_AGE && (
            <div className="mt-1 px-2 py-1.5 rounded-lg bg-warning/5 border border-warning/10">
              <p className="text-[10px] text-warning font-medium">
                {STATE_PENSION_AGE - retireAge} years before State Pension starts
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Other Income */}
      <motion.div variants={item} className="card-surface p-4 lg:p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted text-muted-foreground">
            <Landmark className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-card-foreground">Other Income</span>
        </div>
        <div className="space-y-2.5">
          <p className="text-[11px] text-muted-foreground">
            ISA withdrawals, property income, and part-time work can supplement your retirement income during bridge years.
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">ISA bridge</span>
            <span className="text-muted-foreground/70">Not configured</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Property income</span>
            <span className="text-muted-foreground/70">Not configured</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Part-time work</span>
            <span className="text-muted-foreground/70">Not configured</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
