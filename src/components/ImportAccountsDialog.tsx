import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseCsv, type ParsedRow } from "@/lib/csvAccounts";
import { accountTypeLabels, wrapperLabels } from "@/data/types";
import { useAddAccount } from "@/hooks/useAccounts";
import { toast } from "sonner";
import { Upload, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportAccountsDialog({ open, onOpenChange }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const addAccount = useAddAccount();

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setRows(parseCsv(text));
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRows(parseCsv(reader.result as string));
    reader.readAsText(file);
  }, []);

  const validRows = rows.filter((r) => r._errors.length === 0);
  const errorRows = rows.filter((r) => r._errors.length > 0);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    let success = 0;
    for (const row of validRows) {
      try {
        await addAccount.mutateAsync({
          name: row.name,
          account_type: row.account_type,
          wrapper_type: row.wrapper_type,
          current_value: row.current_value,
          owner_name: row.owner_name,
          interest_rate: row.interest_rate,
          term_remaining_months: row.term_remaining_months,
        });
        success++;
      } catch {
        // continue with others
      }
    }
    setImporting(false);
    toast.success(`Imported ${success} of ${validRows.length} accounts`);
    setRows([]);
    onOpenChange(false);
  };

  const reset = () => {
    setRows([]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Accounts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: Name, Account Type, Wrapper, Current Value, Owner, Interest Rate (%), Term Remaining (months).
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 text-center hover:border-primary/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Drag & drop a CSV file here, or click to browse
            </p>
            <label>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
              <Button variant="outline" size="sm" asChild>
                <span>Choose File</span>
              </Button>
            </label>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {validRows.length} valid
              </span>
              {errorRows.length > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errorRows.length} with errors
                </span>
              )}
            </div>

            <div className="overflow-auto flex-1 rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Wrapper</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Value</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Owner</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className={cn(
                        "border-t border-border",
                        row._errors.length > 0 && "bg-destructive/5"
                      )}
                    >
                      <td className="px-3 py-2 text-card-foreground">{row.name || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {accountTypeLabels[row.account_type] ?? row.account_type}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {wrapperLabels[row.wrapper_type] ?? row.wrapper_type}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-card-foreground">
                        {row.current_value.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{row.owner_name}</td>
                      <td className="px-3 py-2">
                        {row._errors.length > 0 ? (
                          <span className="text-destructive" title={row._errors.join("; ")}>
                            {row._errors[0]}
                          </span>
                        ) : (
                          <span className="text-success">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button variant="ghost" size="sm" onClick={reset}>
                Choose different file
              </Button>
              <Button
                size="sm"
                disabled={validRows.length === 0 || importing}
                onClick={handleImport}
              >
                {importing ? "Importing…" : `Import ${validRows.length} Account${validRows.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
