import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Landmark, PiggyBank, Wallet, Home, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/hooks/useAccounts";

interface Props {
  accounts: Account[];
  netWorth: number;
}

const typeMeta: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; tint: string }> = {
  current_account: { label: "Current", icon: Banknote, tint: "bg-secondary/70" },
  savings: { label: "Savings", icon: Banknote, tint: "bg-secondary/70" },
  cash_isa: { label: "Cash ISA", icon: Wallet, tint: "bg-accent/20" },
  stocks_and_shares_isa: { label: "S&S ISA", icon: Wallet, tint: "bg-accent/20" },
  sipp: { label: "SIPP", icon: PiggyBank, tint: "bg-primary/10" },
  workplace_pension: { label: "Workplace", icon: PiggyBank, tint: "bg-primary/10" },
  db_pension: { label: "DB Pension", icon: PiggyBank, tint: "bg-primary/10" },
  property: { label: "Property", icon: Home, tint: "bg-secondary/70" },
  mortgage: { label: "Mortgage", icon: Landmark, tint: "bg-destructive/10" },
  loan: { label: "Loan", icon: Landmark, tint: "bg-destructive/10" },
  credit_card: { label: "Credit card", icon: Landmark, tint: "bg-destructive/10" },
};

export default function AccountsStackCard({ accounts, netWorth }: Props) {
  const navigate = useNavigate();

  const topAccounts = useMemo(
    () =>
      [...accounts]
        .sort((a, b) => Math.abs(Number(b.current_value)) - Math.abs(Number(a.current_value)))
        .slice(0, 4),
    [accounts],
  );

  const currencyCount = new Set(accounts.map((a) => (a as unknown as { currency?: string }).currency ?? "GBP")).size;
  const accountsCount = accounts.length;

  return (
    <div className="relative">
      {/* Peek card behind — Wise-style "2 cards" tab */}
      <button
        onClick={() => navigate("/wealth")}
        className="absolute -top-4 left-6 z-10 inline-flex items-center gap-1.5 rounded-t-2xl rounded-b-none bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[0_-6px_18px_-12px_rgba(15,23,42,0.35)]"
      >
        {accountsCount} accounts
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={() => navigate("/wealth")}
        className="card-surface group relative flex w-full flex-col gap-5 overflow-hidden p-6 text-left transition-shadow hover:shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-foreground">Household wealth</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatCurrency(netWorth)} · {currencyCount} {currencyCount === 1 ? "currency" : "currencies"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {topAccounts.map((a) => {
            const meta = typeMeta[a.account_type] ?? { label: a.account_type, icon: Wallet, tint: "bg-secondary/70" };
            const Icon = meta.icon;
            const isNegative = Number(a.current_value) < 0;
            return (
              <div
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-border/50 bg-background/60 px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${meta.tint}`}>
                    <Icon className="h-4 w-4 text-foreground" />
                  </span>
                  <span className="min-w-0 truncate text-xs font-medium text-foreground">{a.name}</span>
                </div>
                <span className={`flex-shrink-0 text-sm font-semibold tabular-nums ${isNegative ? "text-destructive" : "text-foreground"}`}>
                  {formatCurrency(Math.abs(Number(a.current_value)))}
                </span>
              </div>
            );
          })}
          {topAccounts.length === 0 && (
            <div className="col-span-2 rounded-2xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
              No accounts yet
            </div>
          )}
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary/70 px-3.5 py-1.5 text-xs font-semibold text-foreground">
          <Landmark className="h-3.5 w-3.5" /> Account details
        </span>
      </button>
    </div>
  );
}
