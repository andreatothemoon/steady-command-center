import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Home, CreditCard, PieChart } from "lucide-react";
import { formatCurrency, calcMonthlyPayment } from "@/lib/format";
import { accountTypeLabels } from "@/data/types";
import { cn } from "@/lib/utils";
import AllocationDonut from "@/components/AllocationDonut";
import type { Account } from "@/hooks/useAccounts";

interface Props {
  accounts: Account[];
}

export default function CollapsibleInsights({ accounts }: Props) {
  const [open, setOpen] = useState(false);

  const properties = accounts.filter((a) => a.account_type === "property");
  const mortgages = accounts.filter((a) => a.account_type === "mortgage");
  const debtTypes = ["mortgage", "loan", "credit_card"];
  const debtAccounts = accounts.filter((a) => debtTypes.includes(a.account_type));
  const hasContent = properties.length > 0 || debtAccounts.length > 0 || accounts.length > 0;

  if (!hasContent) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors text-sm text-muted-foreground"
      >
        <span className="font-medium">More Insights</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {/* Asset Allocation */}
              <AllocationDonut accounts={accounts} />

              {/* Property Equity */}
              {properties.length > 0 && (
                <PropertyEquity properties={properties} mortgages={mortgages} />
              )}

              {/* Debt Summary */}
              {debtAccounts.length > 0 && (
                <DebtSummary accounts={debtAccounts} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PropertyEquity({ properties, mortgages }: { properties: Account[]; mortgages: Account[] }) {
  const equityItems = properties.map((prop) => {
    const linkedMortgage = mortgages.find((m) => m.linked_account_id === prop.id);
    const propertyValue = Number(prop.current_value);
    const mortgageBalance = linkedMortgage ? Math.abs(Number(linkedMortgage.current_value)) : 0;
    const equity = propertyValue - mortgageBalance;
    const ltv = propertyValue > 0 ? (mortgageBalance / propertyValue) * 100 : 0;
    return { property: prop, mortgage: linkedMortgage, propertyValue, mortgageBalance, equity, ltv };
  });
  const totalEquity = equityItems.reduce((s, e) => s + e.equity, 0);

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground/50" />
          <p className="label-muted" style={{ opacity: 1 }}>Property Equity</p>
        </div>
        <span className="text-sm font-bold tabular-nums text-card-foreground">{formatCurrency(totalEquity)}</span>
      </div>
      <div className="space-y-3">
        {equityItems.map((item) => (
          <div key={item.property.id} className="rounded-lg bg-secondary/20 px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-medium text-card-foreground">{item.property.name}</p>
              <p className="text-sm font-bold tabular-nums text-success">{formatCurrency(item.equity)}</p>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
              <span>Value: {formatCurrency(item.propertyValue)}</span>
              {item.mortgage ? (
                <span>
                  Mortgage: {formatCurrency(item.mortgageBalance)} · LTV {item.ltv.toFixed(0)}%
                </span>
              ) : (
                <span className="text-success">Fully owned</span>
              )}
            </div>
            {item.mortgage && (
              <div className="mt-2 h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", item.ltv > 80 ? "bg-warning" : "bg-primary")}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(item.ltv, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DebtSummary({ accounts }: { accounts: Account[] }) {
  const totalDebt = accounts.reduce((s, a) => s + Math.abs(Number(a.current_value)), 0);
  const byType = ["mortgage", "loan", "credit_card"].reduce<Record<string, Account[]>>((acc, t) => {
    const items = accounts.filter((a) => a.account_type === t);
    if (items.length > 0) acc[t] = items;
    return acc;
  }, {});

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground/50" />
          <p className="label-muted" style={{ opacity: 1 }}>Debt Summary</p>
        </div>
        <span className="text-sm font-bold tabular-nums text-destructive">{formatCurrency(totalDebt)}</span>
      </div>
      <div className="space-y-3">
        {Object.entries(byType).map(([type, items]) => {
          const typeTotal = items.reduce((s, a) => s + Math.abs(Number(a.current_value)), 0);
          return (
            <div key={type} className="rounded-lg bg-secondary/20 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium text-card-foreground">
                  {accountTypeLabels[type as keyof typeof accountTypeLabels] ?? type}
                  <span className="text-[10px] text-muted-foreground/60 ml-1.5">({items.length})</span>
                </p>
                <p className="text-sm font-bold tabular-nums text-destructive">{formatCurrency(typeTotal)}</p>
              </div>
              {items.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-[11px] text-muted-foreground/70 py-0.5">
                  <span>{a.name}</span>
                  <span className="tabular-nums">{formatCurrency(Math.abs(Number(a.current_value)))}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
