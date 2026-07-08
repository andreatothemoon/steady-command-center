import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Landmark, PiggyBank, Wallet, Home, Banknote, CreditCard, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/hooks/useAccounts";

interface Props {
  accounts: Account[];
  netWorth: number;
}

type Meta = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tintBg: string;
  tintFg: string;
};

const typeMeta: Record<string, Meta> = {
  current_account:       { label: "Current",     icon: Banknote,   tintBg: "bg-secondary",         tintFg: "text-primary" },
  savings:               { label: "Savings",     icon: Banknote,   tintBg: "bg-secondary",         tintFg: "text-primary" },
  cash_isa:              { label: "Cash ISA",    icon: Wallet,     tintBg: "bg-accent/25",         tintFg: "text-primary" },
  stocks_and_shares_isa: { label: "S&S ISA",     icon: Wallet,     tintBg: "bg-accent/25",         tintFg: "text-primary" },
  sipp:                  { label: "SIPP",        icon: PiggyBank,  tintBg: "bg-muted",             tintFg: "text-primary" },
  workplace_pension:     { label: "Workplace",   icon: PiggyBank,  tintBg: "bg-muted",             tintFg: "text-primary" },
  db_pension:            { label: "DB Pension",  icon: PiggyBank,  tintBg: "bg-muted",             tintFg: "text-primary" },
  property:              { label: "Property",    icon: Home,       tintBg: "bg-secondary",         tintFg: "text-primary" },
  mortgage:              { label: "Mortgage",    icon: Building2,  tintBg: "bg-destructive/12",    tintFg: "text-destructive" },
  loan:                  { label: "Loan",        icon: Landmark,   tintBg: "bg-destructive/12",    tintFg: "text-destructive" },
  credit_card:           { label: "Credit card", icon: CreditCard, tintBg: "bg-destructive/12",    tintFg: "text-destructive" },
};

const fallback: Meta = { label: "Account", icon: Wallet, tintBg: "bg-muted", tintFg: "text-primary" };

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
    <div className="relative pt-5">
      {/* Peek tab — Wise-style "N accounts" */}
      <button
        onClick={() => navigate("/wealth")}
        className="absolute left-6 top-0 z-10 inline-flex items-center gap-2 rounded-t-2xl bg-primary px-4 py-2.5 text-xs font-semibold tracking-tight text-primary-foreground transition-transform hover:-translate-y-0.5"
      >
        {accountsCount} accounts
        <ChevronRight className="h-3.5 w-3.5 opacity-90" strokeWidth={2.5} />
      </button>

      <button
        onClick={() => navigate("/wealth")}
        className="group relative flex w-full flex-col gap-6 overflow-hidden rounded-[28px] border border-border/60 bg-card p-7 text-left shadow-[0_2px_0_0_hsl(var(--border)/0.4)] transition-all hover:border-border hover:shadow-[0_18px_40px_-32px_hsl(var(--primary)/0.35)]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[1.35rem] font-semibold leading-tight tracking-[-0.02em] text-foreground">
              Household wealth
            </p>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              <span className="tabular-nums">{formatCurrency(netWorth)}</span>
              <span className="mx-1.5 text-muted-foreground/50">·</span>
              {currencyCount} {currencyCount === 1 ? "currency" : "currencies"}
            </p>
          </div>
          <ChevronRight
            className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            strokeWidth={2.25}
          />
        </div>

        {/* Account pills */}
        {topAccounts.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {topAccounts.map((a) => {
              const meta = typeMeta[a.account_type] ?? fallback;
              const Icon = meta.icon;
              const value = Number(a.current_value);
              const isNegative = value < 0;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-2xl bg-background/70 px-3 py-2.5 ring-1 ring-inset ring-border/50"
                >
                  <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${meta.tintBg}`}>
                    <Icon className={`h-[18px] w-[18px] ${meta.tintFg}`} strokeWidth={2} />
                  </span>
                  <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-[13px] font-medium text-foreground">
                      {a.name}
                    </span>
                    <span
                      className={`flex-shrink-0 text-[15px] font-semibold tabular-nums tracking-[-0.01em] ${
                        isNegative ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {formatCurrency(Math.abs(value))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            No accounts yet
          </div>
        )}

        {/* Footer CTA pill */}
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-2 text-[13px] font-semibold text-primary transition-colors group-hover:bg-secondary/80">
          <Landmark className="h-4 w-4" strokeWidth={2.25} />
          Account details
        </span>
      </button>
    </div>
  );
}
