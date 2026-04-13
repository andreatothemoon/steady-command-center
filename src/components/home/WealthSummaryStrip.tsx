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
    <div className="card-surface-hover p-4 min-w-[140px] flex-1 snap-start">
      <div className="flex items-center justify-between mb-2">
        <p className="label-muted text-[11px]" style={{ opacity: 1 }}>{label}</p>
        <div className="text-muted-foreground/40">{icon}</div>
      </div>
      <p className={`value-compact tabular-nums ${variant === "negative" ? "text-destructive" : ""}`}>
        {formatCurrency(value)}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="label-muted">Wealth Summary</p>
        <p className="text-sm font-bold tabular-nums text-card-foreground">
          Net Worth: {formatCurrency(netWorth)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SnapshotCard label="Cash" value={cash} icon={<Banknote className="h-4 w-4" />} />
        <SnapshotCard label="Pensions" value={pensions} icon={<PiggyBank className="h-4 w-4" />} />
        <SnapshotCard label="ISAs" value={isa} icon={<Wallet className="h-4 w-4" />} />
        <SnapshotCard label="Property" value={property} icon={<Home className="h-4 w-4" />} />
        <SnapshotCard label="Debt" value={debt} icon={<CreditCard className="h-4 w-4" />} variant="negative" />
      </div>
    </div>
  );
}
