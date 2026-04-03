import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowUpDown, Clock } from "lucide-react";
import { mockAccounts } from "@/data/mockData";
import { accountTypeLabels } from "@/data/types";
import { formatCurrency, formatDate, staleness } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type GroupBy = "type" | "owner" | "wrapper";

const groupLabels: Record<GroupBy, string> = {
  type: "Account Type",
  owner: "Owner",
  wrapper: "Wrapper",
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">{mockAccounts.length} accounts tracked</p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Group by:</span>
        {(["type", "owner", "wrapper"] as GroupBy[]).map((g) => (
          <button
            key={g}
            onClick={() => setGroupBy(g)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              groupBy === g
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
          >
            {groupLabels[g]}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {Object.entries(grouped)
          .sort(([, a], [, b]) => b.reduce((s, x) => s + x.value, 0) - a.reduce((s, x) => s + x.value, 0))
          .map(([group, accounts]) => {
            const groupTotal = accounts.reduce((s, a) => s + a.value, 0);
            return (
              <motion.div
                key={group}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground">{group}</h2>
                  <span className="text-sm font-medium text-muted-foreground">{formatCurrency(groupTotal)}</span>
                </div>
                <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                  {accounts.map((account) => {
                    const stale = staleness(account.lastUpdated);
                    return (
                      <div
                        key={account.id}
                        className="flex items-center justify-between px-5 py-4 hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-card-foreground truncate">{account.name}</p>
                            {stale === "stale" && (
                              <Badge variant="outline" className="text-warning border-warning/30 gap-1">
                                <Clock className="h-3 w-3" />
                                Stale
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {account.provider} · {account.owner} · Updated {formatDate(account.lastUpdated)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-semibold tabular-nums",
                            account.value < 0 ? "text-destructive" : "text-card-foreground"
                          )}>
                            {formatCurrency(account.value)}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{account.source}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}
