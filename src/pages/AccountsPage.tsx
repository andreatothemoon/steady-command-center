import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowUpDown, Clock } from "lucide-react";
import { mockAccounts } from "@/data/mockData";
import { accountTypeLabels } from "@/data/types";
import { formatCurrency, formatDate, staleness, daysAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

export default function AccountsPage() {
  const [groupBy, setGroupBy] = useState<GroupBy>("type");

  const grouped = mockAccounts.reduce<Record<string, typeof mockAccounts>>((acc, account) => {
    let key: string;
    if (groupBy === "type") key = accountTypeLabels[account.type];
    else if (groupBy === "owner") key = account.owner;
    else key = account.wrapper === "none" ? "Unwrapped" : account.wrapper.toUpperCase();
    (acc[key] ??= []).push(account);
    return acc;
  }, {});

  return (
    <motion.div className="space-y-6" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Accounts</h1>
          <p className="label-subtle mt-1">{mockAccounts.length} accounts tracked</p>
        </div>
        <Button size="sm" className="gap-2">
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

      <div className="space-y-5">
        {Object.entries(grouped)
          .sort(([, a], [, b]) => b.reduce((s, x) => s + x.value, 0) - a.reduce((s, x) => s + x.value, 0))
          .map(([group, accounts]) => {
            const groupTotal = accounts.reduce((s, a) => s + a.value, 0);
            return (
              <motion.div key={group} variants={stagger.item}>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="label-muted">{group}</h2>
                  <span className="text-sm font-medium text-muted-foreground tabular-nums">
                    {formatCurrency(groupTotal)}
                  </span>
                </div>
                <div className="card-surface divide-y divide-border overflow-hidden">
                  {accounts.map((account) => {
                    const stale = staleness(account.lastUpdated);
                    return (
                      <div
                        key={account.id}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-card-foreground truncate">
                              {account.name}
                            </p>
                            {stale === "stale" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">
                                <Clock className="h-2.5 w-2.5" />
                                {daysAgo(account.lastUpdated)}d ago
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {account.provider} · {account.owner} · {formatDate(account.lastUpdated)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              account.value < 0 ? "text-destructive" : "text-card-foreground"
                            )}
                          >
                            {formatCurrency(account.value)}
                          </p>
                          <p className="text-[10px] text-muted-foreground capitalize">{account.source}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
      </div>
    </motion.div>
  );
}
