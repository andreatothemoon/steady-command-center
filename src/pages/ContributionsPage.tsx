import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCashFlows, useDeleteCashFlow, type CashFlow } from "@/hooks/useCashFlows";
import ContributionDialog from "@/components/ContributionDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const tagColors: Record<string, string> = {
  pension: "bg-chart-1/10 text-chart-1",
  isa: "bg-chart-2/10 text-chart-2",
  mortgage: "bg-chart-4/10 text-chart-4",
  savings: "bg-chart-3/10 text-chart-3",
};

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

export default function ContributionsPage() {
  const { data: flows = [], isLoading } = useCashFlows();
  const deleteMut = useDeleteCashFlow();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CashFlow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CashFlow | null>(null);

  // Summaries by tag for current tax year (approx Apr–Apr)
  const currentYear = new Date().getFullYear();
  const taxYearStart = `${currentYear - 1}-04-06`;
  const thisYearFlows = flows.filter((f) => f.flow_date >= taxYearStart);

  const sumByTag = (tag: string) =>
    thisYearFlows.filter((f) => f.tag === tag).reduce((s, f) => s + Number(f.amount), 0);

  const pensionTotal = sumByTag("pension");
  const isaTotal = sumByTag("isa");
  const mortgageTotal = sumByTag("mortgage");

  const handleEdit = (item: CashFlow) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contributions</h1>
          <p className="label-subtle mt-1">Track meaningful cash flows</p>
        </div>
        <Button size="sm" className="gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          Add Contribution
        </Button>
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card-surface p-4">
          <p className="label-muted">Pension (This Year)</p>
          <p className="value-compact mt-1.5">{formatCurrency(pensionTotal)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Employee + Employer</p>
        </div>
        <div className="card-surface p-4">
          <p className="label-muted">ISA (This Year)</p>
          <p className="value-compact mt-1.5">{formatCurrency(isaTotal)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Across all ISA accounts</p>
        </div>
        <div className="card-surface p-4">
          <p className="label-muted">Mortgage Overpayments</p>
          <p className="value-compact mt-1.5">{formatCurrency(mortgageTotal)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">This tax year</p>
        </div>
      </motion.div>

      <motion.div variants={stagger.item} className="card-surface overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <p className="label-muted">Recent Contributions</p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && flows.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">No contributions yet — add your first one above</p>
          </div>
        )}

        <div className="divide-y divide-border">
          {flows.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    c.flow_type.includes("employer") ? "bg-success/10" : "bg-primary/10"
                  )}
                >
                  {Number(c.amount) > 0 ? (
                    <ArrowUpRight
                      className={cn(
                        "h-4 w-4",
                        c.flow_type.includes("employer") ? "text-success" : "text-primary"
                      )}
                    />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">
                    {c.description || c.flow_type.replace(/_/g, " ")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(c.flow_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.tag && (
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide",
                      tagColors[c.tag] || "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {c.tag}
                  </span>
                )}
                <span className="text-sm font-semibold tabular-nums text-card-foreground min-w-[70px] text-right">
                  {formatCurrency(Number(c.amount))}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleEdit(c)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(c)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Add/Edit dialog */}
      <ContributionDialog
        key={editItem?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editItem={editItem}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove contribution?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.description || "this contribution"}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteMut.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
