import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowUpDown, Clock, Inbox, Link2 } from "lucide-react";
import { useAccounts, type Account } from "@/hooks/useAccounts";
import { accountTypeLabels } from "@/data/types";
import { formatCurrency, formatDate, staleness, daysAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AddAccountDialog from "@/components/AddAccountDialog";
import EditAccountDialog from "@/components/EditAccountDialog";

type GroupBy = "type" | "owner" | "wrapper";

const groupLabels: Record<GroupBy, string> = {
  type: "Account Type",
  owner: "Owner",
  wrapper: "Wrapper",
};

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

function groupAccounts(accounts: Account[], groupBy: GroupBy) {
  return accounts.reduce<Record<string, Account[]>>((acc, account) => {
    let key: string;
    if (groupBy === "type") key = accountTypeLabels[account.account_type] ?? account.account_type;
    else if (groupBy === "owner") key = account.owner_name;
    else key = account.wrapper_type === "none" ? "Unwrapped" : account.wrapper_type.toUpperCase();
    (acc[key] ??= []).push(account);
    return acc;
  }, {});
}

export default function AccountsPage() {
  const [groupBy, setGroupBy] = useState<GroupBy>("type");
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const { data: accounts = [], isLoading } = useAccounts();

  const grouped = groupAccounts(accounts, groupBy);

  return (
    <motion.div className="space-y-6" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Accounts</h1>
          <p className="label-subtle mt-1">
            {isLoading ? "Loading…" : `${accounts.length} account${accounts.length !== 1 ? "s" : ""} tracked`}
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </motion.div>

      <motion.div variants={stagger.item} className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Group by:</span>
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
          {(["type", "owner", "wrapper"] as GroupBy[]).map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                groupBy === g
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {groupLabels[g]}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <motion.div variants={stagger.item} className="card-surface p-12 flex flex-col items-center gap-3 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No accounts yet. Add your first account to get started.</p>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Account
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped)
            .sort(([, a], [, b]) =>
              b.reduce((s, x) => s + Number(x.current_value), 0) - a.reduce((s, x) => s + Number(x.current_value), 0)
            )
            .map(([group, accts]) => {
              const groupTotal = accts.reduce((s, a) => s + Number(a.current_value), 0);
              return (
                <motion.div key={group} variants={stagger.item}>
                  <div className="flex items-center justify-between mb-2.5">
                    <h2 className="label-muted">{group}</h2>
                    <span className="text-sm font-medium text-muted-foreground tabular-nums">
                      {formatCurrency(groupTotal)}
                    </span>
                  </div>
                  <div className="card-surface divide-y divide-border overflow-hidden">
                    {accts.map((account) => {
                      const stale = staleness(account.last_updated);
                      const provider = account.institutions?.name ?? "—";
                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer"
                          onClick={() => setEditAccount(account)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-card-foreground truncate">
                                {account.name}
                              </p>
                              {stale === "stale" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">
                                  <Clock className="h-2.5 w-2.5" />
                                  {daysAgo(account.last_updated)}d ago
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {provider} · {account.owner_name} · {formatDate(account.last_updated)}
                              {account.account_type === "mortgage" && (account as any).linked_account_id && (() => {
                                const linked = accounts.find((a) => a.id === (account as any).linked_account_id);
                                return linked ? (
                                  <span className="inline-flex items-center gap-0.5 ml-1.5 text-primary">
                                    <Link2 className="h-2.5 w-2.5" />
                                    {linked.name}
                                  </span>
                                ) : null;
                              })()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "text-sm font-semibold tabular-nums",
                                Number(account.current_value) < 0 ? "text-destructive" : "text-card-foreground"
                              )}
                            >
                              {formatCurrency(Number(account.current_value))}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize">{account.source_type}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      <AddAccountDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditAccountDialog account={editAccount} open={!!editAccount} onOpenChange={(o) => { if (!o) setEditAccount(null); }} />
    </motion.div>
  );
}
