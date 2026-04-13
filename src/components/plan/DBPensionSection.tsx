/**
 * DB Pension section embedded in the Plan page.
 * Renders DB pension cards with full functionality.
 */
import { useState, useMemo } from "react";
import { Building2, Plus } from "lucide-react";
import { useDBPensions, useAddDBPension, useUpdateDBPension, useDeleteDBPension } from "@/hooks/useDBPensions";
import { projectDBPension } from "@/lib/dbPensionEngine";
import { toDBPensionParams } from "@/lib/dbPensionRates";
import DBPensionCard from "@/components/db-pension/DBPensionCard";
import DBPensionDialog from "@/components/db-pension/DBPensionDialog";
import type { DBPension, DBPensionInput } from "@/hooks/useDBPensions";

export default function DBPensionSection() {
  const { data: pensions = [] } = useDBPensions();
  const addMutation = useAddDBPension();
  const updateMutation = useUpdateDBPension();
  const deleteMutation = useDeleteDBPension();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPension, setEditingPension] = useState<DBPension | null>(null);

  const projections = useMemo(() => {
    return pensions.map((p) => ({
      pension: p,
      projection: projectDBPension(toDBPensionParams(p)),
    }));
  }, [pensions]);

  const handleSave = (input: DBPensionInput & { id?: string }) => {
    if (input.id) {
      updateMutation.mutate(input as DBPensionInput & { id: string }, {
        onSuccess: () => { setDialogOpen(false); setEditingPension(null); },
      });
    } else {
      addMutation.mutate(input, {
        onSuccess: () => { setDialogOpen(false); setEditingPension(null); },
      });
    }
  };

  const handleEdit = (pension: DBPension) => {
    setEditingPension(pension);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground/50" />
          <p className="label-muted" style={{ opacity: 1 }}>Defined Benefit Pensions</p>
        </div>
        <button
          onClick={() => { setEditingPension(null); setDialogOpen(true); }}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add DB Pension
        </button>
      </div>

      {pensions.length === 0 ? (
        <div className="card-surface p-5 text-center">
          <p className="text-sm text-muted-foreground">No DB pensions configured</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Add a defined benefit pension to include it in your retirement projections</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projections.map(({ pension, projection }) => (
            <DBPensionCard
              key={pension.id}
              pension={pension}
              projection={projection}
              onEdit={() => handleEdit(pension)}
              onDelete={() => handleDelete(pension.id)}
            />
          ))}
        </div>
      )}

      <DBPensionDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingPension(null); }}
        pension={editingPension}
        onSave={handleSave}
        isPending={addMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
