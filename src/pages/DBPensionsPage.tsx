import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Building2, TrendingUp, Shield } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceDot } from "recharts";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDBPensions, useUpsertDBPension, useDeleteDBPension, type DBPension, type DBPensionInput } from "@/hooks/useDBPensions";
import { projectDBPension, type DBPensionParams } from "@/lib/dbPensionEngine";
import { normalizeRate } from "@/lib/dbPensionRates";
import { toast } from "sonner";
import DBPensionDialog from "@/components/db-pension/DBPensionDialog";
import DBPensionCard from "@/components/db-pension/DBPensionCard";

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

export default function DBPensionsPage() {
  const { data: pensions = [], isLoading } = useDBPensions();
  const upsert = useUpsertDBPension();
  const deletePension = useDeleteDBPension();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPension, setEditingPension] = useState<DBPension | null>(null);

  const projections = useMemo(() => {
    return pensions.map((p) => {
      const params = toDBPensionParams(p);
      return { pension: p, projection: projectDBPension(params) };
    });
  }, [pensions]);

  const totalCurrentIncome = projections.reduce((s, p) => s + p.projection.current_annual_income, 0);
  const totalProjectedIncome = projections.reduce((s, p) => s + p.projection.projected_annual_income, 0);
  const totalExisting = projections.reduce((s, p) => s + p.projection.breakdown.existing_entitlement, 0);
  const totalFutureAccrual = projections.reduce((s, p) => s + p.projection.breakdown.future_accrual, 0);

  // Combined projection chart data
  const combinedProjection = useMemo(() => {
    if (projections.length === 0) return [];
    const maxLen = Math.max(...projections.map((p) => p.projection.yearly_projection.length));
    const combined: { age: number; total_income: number }[] = [];
    for (let i = 0; i < maxLen; i++) {
      let total = 0;
      let age = 0;
      for (const { projection } of projections) {
        if (i < projection.yearly_projection.length) {
          total += projection.yearly_projection[i].total_income;
          age = projection.yearly_projection[i].age;
        } else {
          total += projection.projected_annual_income;
        }
      }
      combined.push({ age, total_income: total });
    }
    return combined;
  }, [projections]);

  const handleSave = async (input: DBPensionInput & { id?: string }) => {
    try {
      await upsert.mutateAsync(input);
      toast.success(input.id ? "Pension updated" : "Pension added");
      setDialogOpen(false);
      setEditingPension(null);
    } catch {
      toast.error("Failed to save pension");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePension.mutateAsync(id);
      toast.success("Pension removed");
    } catch {
      toast.error("Failed to delete pension");
    }
  };

  const openEdit = (pension: DBPension) => {
    setEditingPension(pension);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingPension(null);
    setDialogOpen(true);
  };

  const lastPoint = combinedProjection[combinedProjection.length - 1];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">DB Pensions</h1>
          <p className="label-subtle mt-1">Defined Benefit pension income projections</p>
        </div>
        <Button size="sm" className="gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Scheme
        </Button>
      </motion.div>

      {/* Hero metrics */}
      {pensions.length > 0 && (
        <motion.div variants={stagger.item} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="card-surface p-4">
            <p className="label-muted">Current Entitlement</p>
            <p className="value-large mt-1.5">{formatCurrency(totalCurrentIncome)}<span className="text-xs text-muted-foreground font-normal">/yr</span></p>
          </div>
          <div className="hero-surface p-4">
            <p className="label-muted">Projected at Retirement</p>
            <p className="value-large mt-1.5 text-primary">{formatCurrency(totalProjectedIncome)}<span className="text-xs text-muted-foreground font-normal">/yr</span></p>
          </div>
          <div className="card-surface p-4">
            <p className="label-muted">Breakdown</p>
            <div className="mt-1.5 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-[11px] text-muted-foreground">Existing (revalued)</span>
                <span className="text-[11px] font-semibold text-card-foreground tabular-nums">{formatCurrency(totalExisting)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] text-muted-foreground">Future accrual</span>
                <span className="text-[11px] font-semibold text-card-foreground tabular-nums">{formatCurrency(totalFutureAccrual)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Projection chart */}
      {combinedProjection.length > 1 && (
        <motion.div variants={stagger.item} className="hero-surface p-5">
          <p className="label-muted mb-4">Combined DB Income Projection</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={combinedProjection}>
              <defs>
                <linearGradient id="dbGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="age" tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} tickLine={false} axisLine={false} width={55} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="card-surface px-3 py-2 shadow-xl border border-border">
                      <p className="text-xs text-muted-foreground">Age {label}</p>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(payload[0]?.value as number)}/yr</p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="total_income" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#dbGrad)" animationDuration={1200} />
              {lastPoint && (
                <ReferenceDot x={lastPoint.age} y={lastPoint.total_income} r={4} fill="hsl(var(--primary))" stroke="hsl(222, 28%, 9%)" strokeWidth={2.5} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Pension cards */}
      {pensions.length === 0 ? (
        <motion.div variants={stagger.item} className="card-surface p-10 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No DB pension schemes added yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Add your CARE or Final Salary pension to project your retirement income.</p>
          <Button size="sm" variant="outline" className="mt-4 gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Scheme
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {projections.map(({ pension, projection }) => (
            <motion.div key={pension.id} variants={stagger.item}>
              <DBPensionCard
                pension={pension}
                projection={projection}
                onEdit={() => openEdit(pension)}
                onDelete={() => handleDelete(pension.id)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <DBPensionDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingPension(null); }}
        pension={editingPension}
        onSave={handleSave}
        isPending={upsert.isPending}
      />
    </motion.div>
  );
}
