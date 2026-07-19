/**
 * Wealth Page — Assets mapped to retirement income contribution
 * Groups: Guaranteed Income, Growth Assets, Safety Net, Property & Debt
 * DB Pensions are managed here with full scheme configuration.
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { projectDBPension } from "@/lib/dbPensionEngine";
import { toDBPensionParams } from "@/lib/dbPensionRates";
import {
  Plus, Upload, Download, Inbox, Clock, Link2, Shield,
  TrendingUp, Landmark, Home as HomeIcon, Building2,
} from "lucide-react";
import { useAccounts, type Account } from "@/hooks/useAccounts";
import { useDBPensions, useUpsertDBPension } from "@/hooks/useDBPensions";
import type { DBPension, DBPensionInput } from "@/hooks/useDBPensions";
import { accountTypeLabels } from "@/data/types";
import { formatCurrency, staleness, daysAgo, calcMonthlyPayment } from "@/lib/format";
import { formatOwnerGroup } from "@/lib/accountOwners";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AllocationDonut from "@/components/AllocationDonut";
import AddAccountDialog from "@/components/AddAccountDialog";
import EditAccountDialog from "@/components/EditAccountDialog";
import ImportAccountsDialog from "@/components/ImportAccountsDialog";
import DBPensionDialog from "@/components/db-pension/DBPensionDialog";
import { exportAccountsCsv } from "@/lib/csvAccounts";
import { DEFAULT_DRAWDOWN_RATE, UK_STATE_PENSION_FULL } from "@/lib/retirementEngine";

/* ─── bucket definitions ─── */
type Bucket = "guaranteed" | "growth" | "safety" | "property";

const bucketMeta: Record<Bucket, { label: string; icon: typeof Shield; color: string; description: string }> = {
  guaranteed: { label: "Guaranteed Income", icon: Shield, color: "text-success", description: "Pensions & annuities — income you can count on" },
  growth:     { label: "Growth Assets",     icon: TrendingUp, color: "text-primary", description: "Invested assets generating retirement drawdown" },
  safety:     { label: "Safety Net",        icon: Landmark, color: "text-chart-3", description: "Cash & savings for short-term needs" },
  property:   { label: "Property & Debt",   icon: HomeIcon, color: "text-chart-4", description: "Property equity & liabilities" },
};

function toBucket(type: string): Bucket {
  switch (type) {
    case "db_pension": case "workplace_pension": case "sipp":
      return "guaranteed";
    case "stocks_and_shares_isa": case "cash_isa": case "gia": case "crypto": case "employer_share_scheme":
      return "growth";
    case "current_account": case "savings":
      return "safety";
    case "property": case "mortgage": case "loan": case "credit_card":
      return "property";
    default:
      return "growth";
  }
}

function estimateIncome(account: Account, dbPensionIncome?: number): number | null {
  const val = Number(account.current_value);
  if (["db_pension"].includes(account.account_type)) return dbPensionIncome ?? null;
  if (val <= 0) return null;
  if (["sipp", "workplace_pension"].includes(account.account_type)) return Math.round(val * DEFAULT_DRAWDOWN_RATE);
  if (["stocks_and_shares_isa", "cash_isa", "gia", "crypto", "employer_share_scheme"].includes(account.account_type)) return Math.round(val * DEFAULT_DRAWDOWN_RATE);
  return null;
}

import { stagger } from "@/lib/animation";

export default function WealthPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: dbPensions = [] } = useDBPensions();
  const upsertMutation = useUpsertDBPension();
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // DB pension dialog state
  const [dbDialogOpen, setDbDialogOpen] = useState(false);
  const [editingDbPension, setEditingDbPension] = useState<DBPension | null>(null);

  const buckets = useMemo(() => {
    const groups: Record<Bucket, Account[]> = { guaranteed: [], growth: [], safety: [], property: [] };
    accounts.forEach((a) => groups[toBucket(a.account_type)].push(a));
    return groups;
  }, [accounts]);

  // Summary metrics
  const totalAssets = accounts.filter(a => Number(a.current_value) > 0).reduce((s, a) => s + Number(a.current_value), 0);
  const totalLiabilities = accounts.filter(a => Number(a.current_value) < 0).reduce((s, a) => s + Number(a.current_value), 0);
  const netWorth = totalAssets + totalLiabilities;

  // DB pension projections keyed by account_id
  const dbProjections = useMemo(() => {
    const map: Record<string, { pension: DBPension; projected: number }> = {};
    dbPensions.forEach((p) => {
      if (p.account_id) {
        const params = toDBPensionParams(p);
        const result = projectDBPension(params);
        map[p.account_id] = { pension: p, projected: result.projected_annual_income };
      }
    });
    return map;
  }, [dbPensions]);



  // DB pension handlers
  const handleDbSave = (input: DBPensionInput & { id?: string }) => {
    upsertMutation.mutate(input, {
      onSuccess: () => { setDbDialogOpen(false); setEditingDbPension(null); },
    });
  };

  const handleAccountClick = (account: Account) => {
    if (account.account_type === "db_pension") {
      // Find the linked DB pension record and open the DB pension dialog
      const dbInfo = dbProjections[account.id];
      if (dbInfo) {
        setEditingDbPension(dbInfo.pension);
        setDbDialogOpen(true);
      }
      return;
    }
    setEditAccount(account);
  };

  // Get display value for DB pensions (projected income, not £0)
  const getDisplayValue = (account: Account): number => {
    if (account.account_type === "db_pension") {
      const dbInfo = dbProjections[account.id];
      return dbInfo ? dbInfo.projected : 0;
    }
    return Number(account.current_value);
  };

  return (
    <motion.div className="space-y-8" variants={stagger.container} initial="initial" animate="animate">
      <motion.section variants={stagger.item} className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total assets</p>
            <h1 className="mt-1 text-[2.5rem] font-semibold tracking-tight text-foreground sm:text-[2.75rem]">
              {isLoading ? "…" : formatCurrency(netWorth)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {accounts.length} account{accounts.length === 1 ? "" : "s"}
              {!isLoading && (
                <>
                  {" · "}
                  <span className="text-foreground/80 tabular-nums">{formatCurrency(totalAssets, true)}</span> assets
                  {totalLiabilities < 0 && (
                    <>
                      {" · "}
                      <span className="text-destructive tabular-nums">{formatCurrency(totalLiabilities, true)}</span> liabilities
                    </>
                  )}
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="gap-2 rounded-xl" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" /> Import
            </Button>
            {accounts.length > 0 && (
              <Button size="sm" variant="outline" className="gap-2 rounded-xl" onClick={() => exportAccountsCsv(accounts)}>
                <Download className="h-4 w-4" /> Export
              </Button>
            )}
            <Button size="sm" className="gap-2 rounded-xl" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add Account
            </Button>
          </div>
        </div>
      </motion.section>


      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : accounts.length === 0 ? (
        <motion.div variants={stagger.item} className="card-surface p-12 flex flex-col items-center gap-3 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No accounts yet. Add your first account to get started.</p>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Account</Button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {(["guaranteed", "growth", "safety", "property"] as Bucket[]).map((bucket) => {
            const items = buckets[bucket];
            const meta = bucketMeta[bucket];
            const Icon = meta.icon;

            if (items.length === 0) return null;

            const bucketTotal = items.reduce((s, a) => {
              if (a.account_type === "db_pension") {
                return s + (dbProjections[a.id]?.projected ?? 0);
              }
              if (bucket === "guaranteed") {
                const val = Number(a.current_value);
                return val > 0 ? s + Math.round(val * DEFAULT_DRAWDOWN_RATE) : s;
              }
              return s + Number(a.current_value);
            }, 0);

            return (
              <motion.div key={bucket} variants={stagger.item}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
                    <Icon className={cn("h-4 w-4", meta.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-foreground">{meta.label}</h2>
                      <span className="text-base font-semibold text-foreground tabular-nums">
                        {bucket === "guaranteed"
                          ? `${formatCurrency(bucketTotal)}/yr`
                          : formatCurrency(bucketTotal)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{meta.description}</p>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="card-surface overflow-hidden">
                    {items
                      .sort((a, b) => Math.abs(getDisplayValue(b)) - Math.abs(getDisplayValue(a)))
                      .map((account, index) => {
                        const stale = staleness(account.last_updated);
                        const income = estimateIncome(account, dbProjections[account.id]?.projected);
                        const displayVal = getDisplayValue(account);
                        const isDbPension = account.account_type === "db_pension";
                        const dbInfo = isDbPension ? dbProjections[account.id] : null;

                        return (
                          <div
                            key={account.id}
                            className={cn(
                              "flex items-center justify-between px-6 py-4 transition-colors cursor-pointer hover:bg-secondary/50",
                              index !== items.length - 1 && "border-b border-border"
                            )}
                            onClick={() => handleAccountClick(account)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {isDbPension && (
                                  <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                )}
                                <p className="text-base font-semibold text-card-foreground truncate">{account.name}</p>
                                {isDbPension && dbInfo && (
                                  <span className="text-[10px] font-medium text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                                    {dbInfo.pension.scheme_type === "CARE" ? "CARE" : "Final Salary"} · 1/{Number(dbInfo.pension.accrual_rate)}
                                  </span>
                                )}
                                {stale === "stale" && !isDbPension && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">
                                    <Clock className="h-2.5 w-2.5" />{daysAgo(account.last_updated)}d ago
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {isDbPension ? (
                                  <>
                                    {formatOwnerGroup(account.owner_name)} · {dbInfo?.pension.is_active_member ? "Active" : "Deferred"}
                                    {dbInfo && <span className="ml-1.5">· Retires at {dbInfo.pension.retirement_age}</span>}
                                  </>
                                ) : (
                                  <>
                                    {formatOwnerGroup(account.owner_name)} · {accountTypeLabels[account.account_type] ?? account.account_type}
                                    {["mortgage", "loan", "credit_card"].includes(account.account_type) && account.interest_rate != null && (
                                      <span className="ml-1.5">{Number(account.interest_rate).toFixed(2)}%</span>
                                    )}
                                    {["mortgage", "loan", "credit_card"].includes(account.account_type) && account.term_remaining_months != null && (
                                      <span className="ml-1">· {Math.floor(Number(account.term_remaining_months) / 12)}y {Number(account.term_remaining_months) % 12}m left</span>
                                    )}
                                    {(() => {
                                      const mp = calcMonthlyPayment(Math.abs(Number(account.current_value)), Number(account.interest_rate ?? 0), Number(account.term_remaining_months ?? 0));
                                      return mp ? <span className="ml-1">· {formatCurrency(Math.round(mp))}/mo</span> : null;
                                    })()}
                                    {account.account_type === "mortgage" && account.linked_account_id && (() => {
                                      const linked = accounts.find((a) => a.id === account.linked_account_id);
                                      return linked ? <span className="inline-flex items-center gap-0.5 ml-1.5 text-primary"><Link2 className="h-2.5 w-2.5" />{linked.name}</span> : null;
                                    })()}
                                  </>
                                )}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {isDbPension ? (
                                <>
                                  <p className="text-sm font-semibold tabular-nums text-primary">
                                    {formatCurrency(displayVal)}<span className="text-[10px] font-normal text-muted-foreground">/yr</span>
                                  </p>
                                  <p className="text-[10px] text-primary/70 tabular-nums">
                                    ≈ {formatCurrency(Math.round(displayVal / 12))}/mo at retirement
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className={cn("text-sm font-semibold tabular-nums", displayVal < 0 ? "text-destructive" : "text-card-foreground")}>
                                    {formatCurrency(displayVal)}
                                  </p>
                                  {income != null && (
                                    <p className="text-[10px] text-primary tabular-nums">
                                      +{formatCurrency(Math.round(income / 12))}/mo income
                                    </p>
                                  )}
                                  {income == null && <p className="text-[10px] text-muted-foreground capitalize">{account.source_type}</p>}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <AddAccountDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditAccountDialog account={editAccount} open={!!editAccount} onOpenChange={(o) => { if (!o) setEditAccount(null); }} />
      <ImportAccountsDialog open={importOpen} onOpenChange={setImportOpen} />
      <DBPensionDialog
        open={dbDialogOpen}
        onOpenChange={(open) => { setDbDialogOpen(open); if (!open) setEditingDbPension(null); }}
        pension={editingDbPension}
        onSave={handleDbSave}
        isPending={upsertMutation.isPending}
      />
    </motion.div>
  );
}
