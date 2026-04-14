import { motion } from "framer-motion";
import { Wallet, PiggyBank, CreditCard, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/hooks/useAccounts";

interface SnapshotCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant?: "default" | "negative";
}

function SnapshotCard({ label, value, icon, variant = "default" }: SnapshotCardProps) {
  return (
    <div className="card-surface-hover p-5 min-w-[160px] flex-1 snap-start">
      <div className="flex items-center justify-between mb-3">
        <p className="label-muted text-[11px] text-foreground/55" style={{ opacity: 1 }}>{label}</p>
        <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center text-foreground/60">{icon}</div>
      </div>
      <p className={`value-compact tabular-nums ${variant === "negative" ? "text-destructive" : ""}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

interface Props {
  accounts: Account[];
}

export default function SnapshotRow({ accounts }: Props) {
  const cash = accounts
    .filter((a) => ["current_account", "savings", "cash_isa"].includes(a.account_type))
    .reduce((s, a) => s + Number(a.current_value), 0);

  const investable = accounts
    .filter((a) => ["stocks_and_shares_isa", "gia", "sipp", "workplace_pension", "crypto", "employer_share_scheme"].includes(a.account_type))
    .reduce((s, a) => s + Number(a.current_value), 0);

  const pensions = accounts
    .filter((a) => ["sipp", "workplace_pension", "db_pension"].includes(a.account_type))
    .reduce((s, a) => s + Number(a.current_value), 0);

  const debt = accounts
    .filter((a) => ["mortgage", "loan", "credit_card"].includes(a.account_type))
    .reduce((s, a) => s + Math.abs(Number(a.current_value)), 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 overflow-x-auto snap-x">
      <SnapshotCard label="Cash & Savings" value={cash} icon={<Banknote className="h-4 w-4" />} />
      <SnapshotCard label="Investable" value={investable} icon={<Wallet className="h-4 w-4" />} />
      <SnapshotCard label="Pensions" value={pensions} icon={<PiggyBank className="h-4 w-4" />} />
      <SnapshotCard label="Total Debt" value={debt} icon={<CreditCard className="h-4 w-4" />} variant="negative" />
    </div>
  );
}
