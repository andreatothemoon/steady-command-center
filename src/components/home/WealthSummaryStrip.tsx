import { Wallet, PiggyBank, CreditCard, Banknote, Home } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/hooks/useAccounts";

interface SnapshotCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  sub?: string;
  variant?: "default" | "negative";
}

function SnapshotCard({ label, value, icon, sub, variant = "default" }: SnapshotCardProps) {
  return (
    <div className="card-surface-hover min-w-[140px] flex-1 snap-start p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="rounded-2xl bg-secondary/70 p-2 text-muted-foreground/80">{icon}</div>
      </div>
      <p className={`text-3xl font-semibold tracking-tight tabular-nums ${variant === "negative" ? "text-destructive" : "text-foreground"}`}>
        {formatCurrency(value)}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

interface Props {
  accounts: Account[];
}

export default function WealthSummaryStrip({ accounts }: Props) {
  const cash = accounts
    .filter((a) => ["current_account", "savings", "cash_isa"].includes(a.account_type))
    .reduce((s, a) => s + Number(a.current_value), 0);

  const pensions = accounts
    .filter((a) => ["sipp", "workplace_pension", "db_pension"].includes(a.account_type))
    .reduce((s, a) => s + Number(a.current_value), 0);

  const isa = accounts
    .filter((a) => ["cash_isa", "stocks_and_shares_isa"].includes(a.account_type))
    .reduce((s, a) => s + Number(a.current_value), 0);

  const property = accounts
    .filter((a) => a.account_type === "property")
    .reduce((s, a) => s + Number(a.current_value), 0);

  const debt = accounts
    .filter((a) => ["mortgage", "loan", "credit_card"].includes(a.account_type))
    .reduce((s, a) => s + Math.abs(Number(a.current_value)), 0);

  const netWorth = accounts.reduce((s, a) => s + Number(a.current_value), 0);
  const totalAssets = cash + pensions + isa + property;
  const debtPct = totalAssets > 0 ? Math.round((debt / totalAssets) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="card-surface overflow-hidden p-7 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">Wealth Snapshot</p>
            <h3 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground">{formatCurrency(netWorth)}</h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              A live view of the capital supporting your retirement plan across pensions, ISA assets, cash, property, and liabilities.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] bg-secondary/65 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Assets</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(totalAssets)}</p>
            </div>
            <div className="rounded-[22px] bg-secondary/65 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Debt</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(debt)}</p>
            </div>
            <div className="rounded-[22px] bg-secondary/65 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Leverage</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{debtPct}%</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SnapshotCard label="Cash" value={cash} icon={<Banknote className="h-5 w-5" />} sub="Liquid reserves" />
        <SnapshotCard label="Pensions" value={pensions} icon={<PiggyBank className="h-5 w-5" />} sub="DC and DB balances" />
        <SnapshotCard label="ISAs" value={isa} icon={<Wallet className="h-5 w-5" />} sub="Tax-advantaged investing" />
        <SnapshotCard label="Property" value={property} icon={<Home className="h-5 w-5" />} sub="Current equity value" />
        <SnapshotCard label="Debt" value={debt} icon={<CreditCard className="h-5 w-5" />} sub="Liabilities to manage" variant="negative" />
      </div>
    </div>
  );
}
