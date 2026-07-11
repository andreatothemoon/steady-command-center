import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Landmark,
  PiggyBank,
  Wallet,
  Home,
  Banknote,
  CreditCard,
  Building2,
} from "lucide-react";
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
  current_account:       { label: "Current",     icon: Banknote,   tintBg: "bg-secondary",      tintFg: "text-primary" },
  savings:               { label: "Savings",     icon: Banknote,   tintBg: "bg-secondary",      tintFg: "text-primary" },
  cash_isa:              { label: "Cash ISA",    icon: Wallet,     tintBg: "bg-accent/30",      tintFg: "text-primary" },
  stocks_and_shares_isa: { label: "S&S ISA",     icon: Wallet,     tintBg: "bg-accent/30",      tintFg: "text-primary" },
  sipp:                  { label: "SIPP",        icon: PiggyBank,  tintBg: "bg-muted",          tintFg: "text-primary" },
  workplace_pension:     { label: "Workplace",   icon: PiggyBank,  tintBg: "bg-muted",          tintFg: "text-primary" },
  db_pension:            { label: "DB Pension",  icon: PiggyBank,  tintBg: "bg-muted",          tintFg: "text-primary" },
  property:              { label: "Property",    icon: Home,       tintBg: "bg-secondary",      tintFg: "text-primary" },
  mortgage:              { label: "Mortgage",    icon: Building2,  tintBg: "bg-destructive/12", tintFg: "text-destructive" },
  loan:                  { label: "Loan",        icon: Landmark,   tintBg: "bg-destructive/12", tintFg: "text-destructive" },
  credit_card:           { label: "Credit card", icon: CreditCard, tintBg: "bg-destructive/12", tintFg: "text-destructive" },
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

  const currencyCount = new Set(
    accounts.map((a) => (a as unknown as { currency?: string }).currency ?? "GBP"),
  ).size;
  const accountsCount = accounts.length;

  return (
    <motion.button
      onClick={() => navigate("/wealth")}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="group relative block w-full overflow-hidden rounded-[32px] bg-card text-left shadow-[0_1px_0_0_hsl(var(--border)/0.6),0_20px_50px_-32px_hsl(var(--primary)/0.25)] ring-1 ring-border/50 transition-shadow hover:shadow-[0_1px_0_0_hsl(var(--border)/0.6),0_28px_60px_-30px_hsl(var(--primary)/0.35)]"
    >
      {/* Colored header band with integrated peek tab */}
      <motion.div
        variants={{ rest: { height: 88 }, hover: { height: 96 } }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="relative w-full bg-secondary"
      >
        <div className="flex h-full items-center justify-between px-6">
          <motion.span
            variants={{ rest: { x: 0 }, hover: { x: 2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-primary"
          >
            {accountsCount} accounts
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </motion.span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[13px] font-bold text-primary">
            £
          </span>
        </div>
        {/* Scalloped notch cut into the body */}
        <svg
          className="pointer-events-none absolute -bottom-px left-0 w-full text-card"
          height="26"
          viewBox="0 0 400 26"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0,26 L0,26 C0,26 80,26 130,26 C160,26 170,6 200,6 C230,6 240,26 270,26 C320,26 400,26 400,26 L400,26 L0,26 Z"
            fill="currentColor"
          />
        </svg>
      </motion.div>

      {/* Body */}
      <div className="flex flex-col gap-5 px-6 pb-6 pt-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-tight tracking-tight text-foreground">
              Household wealth
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              <span className="tabular-nums">{formatCurrency(netWorth)}</span>
              <span className="mx-1.5 text-muted-foreground/50">·</span>
              {currencyCount} {currencyCount === 1 ? "currency" : "currencies"}
            </p>
          </div>
          <motion.span
            variants={{ rest: { x: 0 }, hover: { x: 3 } }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="mt-1 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/70"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          </motion.span>
        </div>

        {/* Account rows */}
        {topAccounts.length > 0 ? (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-1">
            {topAccounts.map((a) => {
              const meta = typeMeta[a.account_type] ?? fallback;
              const Icon = meta.icon;
              const value = Number(a.current_value);
              const isNegative = value < 0;
              return (
                <li
                  key={a.id}
                  className="group/row flex items-center gap-3 rounded-xl px-1 py-2 transition-colors hover:bg-secondary/40"
                >
                  <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${meta.tintBg}`}>
                    <Icon className={`h-[17px] w-[17px] ${meta.tintFg}`} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-foreground">
                    {a.name}
                  </span>
                  <span
                    className={`flex-shrink-0 text-[14px] font-semibold tabular-nums tracking-[-0.01em] ${
                      isNegative ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {formatCurrency(Math.abs(value))}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-all group-hover/row:translate-x-0.5 group-hover/row:text-muted-foreground"
                    strokeWidth={2.25}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            No accounts yet
          </div>
        )}

        {/* Footer CTA */}
        <div className="pt-1">
          <motion.span
            variants={{ rest: { x: 0 }, hover: { x: 2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-2 text-[13px] font-semibold text-primary"
          >
            <Landmark className="h-4 w-4" strokeWidth={2.25} />
            Account details
          </motion.span>
        </div>
      </div>
    </motion.button>
  );
}
