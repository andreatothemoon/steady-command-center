/**
 * DB Pension section embedded in the Plan page.
 * Reuses existing DBPensionCard/Dialog components.
 */
import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { useDBPensions } from "@/hooks/useDBPensions";
import DBPensionCard from "@/components/db-pension/DBPensionCard";
import DBPensionDialog from "@/components/db-pension/DBPensionDialog";

export default function DBPensionSection() {
  const { data: pensions = [] } = useDBPensions();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground/50" />
          <p className="label-muted" style={{ opacity: 1 }}>Defined Benefit Pensions</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
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
          {pensions.map((p) => (
            <DBPensionCard key={p.id} pension={p} />
          ))}
        </div>
      )}

      <DBPensionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
