import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Layers } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/hooks/useAccounts";

interface Props {
  accounts: Account[];
}

const CLASSES: { key: string; label: string; color: string; types: string[] }[] = [
  { key: "cash", label: "Cash", color: "#aeb7b3", types: ["current_account", "savings", "cash_isa"] },
  { key: "equities", label: "Equities", color: "#efcb68", types: ["stocks_and_shares_isa", "gia", "employer_share_scheme"] },
  { key: "property", label: "Property", color: "#895b1e", types: ["property"] },
  { key: "pension", label: "Pension", color: "#091540", types: ["sipp", "workplace_pension", "db_pension"] },
  { key: "crypto", label: "Crypto", color: "#dcf763", types: ["crypto"] },
];

export default function AssetsBreakdownRow({ accounts }: Props) {
  const navigate = useNavigate();

  const buckets = useMemo(() => {
    const mortgages = accounts.filter((a) => a.account_type === "mortgage");
    return CLASSES.map((cls) => {
      if (cls.key === "property") {
        const total = accounts
          .filter((a) => a.account_type === "property")
          .reduce((s, p) => {
            const mort = mortgages.find((m) => m.linked_account_id === p.id);
            const bal = mort ? Math.abs(Number(mort.current_value)) : 0;
            return s + Math.max(Number(p.current_value) - bal, 0);
          }, 0);
        const count = accounts.filter((a) => a.account_type === "property").length;
        return { ...cls, value: total, count };
      }
      const filtered = accounts.filter(
        (a) => cls.types.includes(a.account_type) && Number(a.current_value) > 0,
      );
      const total = filtered.reduce((s, a) => s + Number(a.current_value), 0);
      return { ...cls, value: total, count: filtered.length };
    }).filter((b) => b.value > 0);
  }, [accounts]);

  const total = buckets.reduce((s, b) => s + b.value, 0);

  return (
    <motion.button
      onClick={() => navigate("/wealth")}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="card-surface group relative flex w-full flex-col gap-5 p-6 text-left transition-shadow hover:shadow-sm md:p-8"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
            <Layers className="h-[17px] w-[17px]" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Assets
            </p>
            <p className="mt-0.5 text-[15px] font-semibold tracking-tight text-foreground">
              Breakdown by class
            </p>
          </div>
        </div>
        <motion.span
          variants={{ rest: { x: 0 }, hover: { x: 3 } }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="mt-1 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/60"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
        </motion.span>
      </div>

      {total > 0 ? (
        <>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary/60">
            {buckets.map((b) => (
              <div
                key={b.key}
                style={{ width: `${(b.value / total) * 100}%`, backgroundColor: b.color }}
                className="h-full"
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {buckets.map((b) => {
              const pct = Math.round((b.value / total) * 100);
              return (
                <div key={b.key} className="rounded-2xl bg-secondary/40 p-4">
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                    {b.label}
                  </div>
                  <p className="mt-2 text-lg font-semibold tracking-tight text-foreground tabular-nums">
                    {formatCurrency(b.value, true)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                    {pct}% · {b.count} account{b.count === 1 ? "" : "s"}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Add accounts to see your breakdown.</p>
      )}
    </motion.button>
  );
}
