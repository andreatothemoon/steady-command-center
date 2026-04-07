import { useState, useEffect } from "react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { DBPension, DBPensionInput } from "@/hooks/useDBPensions";
import {
  defaultDBPensionForm,
  toDbPensionFormValues,
  toDbPensionPayload,
  type DBPensionFormValues,
} from "@/lib/dbPensionForm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pension: DBPension | null;
  onSave: (input: DBPensionInput & { id?: string }) => void;
  isPending: boolean;
}

export default function DBPensionDialog({ open, onOpenChange, pension, onSave, isPending }: Props) {
  const [form, setForm] = useState<DBPensionFormValues>(defaultDBPensionForm);

  useEffect(() => {
    if (pension) {
      setForm(toDbPensionFormValues(pension));
    } else {
      setForm(defaultDBPensionForm);
    }
  }, [pension, open]);

  const update = <K extends keyof DBPensionFormValues>(key: K, val: DBPensionFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const numField = (key: keyof DBPensionFormValues, label: string, opts?: { prefix?: string; suffix?: string; step?: string }) => (
    <div>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <div className="relative mt-1">
        {opts?.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{opts.prefix}</span>}
        <Input
          type="number"
          step={opts?.step ?? "1"}
          value={form[key] as number}
          onChange={(e) => update(key, parseFloat(e.target.value) || 0)}
          className={opts?.prefix ? "pl-7" : ""}
        />
        {opts?.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{opts.suffix}</span>}
      </div>
    </div>
  );

  const handleSubmit = () => {
    onSave({ ...toDbPensionPayload(form), id: pension?.id });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{pension ? "Edit" : "Add"} DB Pension</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-4 px-1 max-h-[60vh] overflow-y-auto">
          {/* Name & scheme */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground">Scheme Name</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Scheme Type</Label>
              <Select value={form.scheme_type} onValueChange={(v) => update("scheme_type", v as "CARE" | "FINAL_SALARY")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARE">CARE</SelectItem>
                  <SelectItem value="FINAL_SALARY">Final Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ages */}
          <div className="grid grid-cols-2 gap-3">
            {numField("current_age", "Current Age")}
            {numField("retirement_age", "Retirement Age")}
          </div>

          {/* Salary */}
          <div className="grid grid-cols-2 gap-3">
            {numField("current_salary", "Current Salary", { prefix: "£" })}
            {numField("salary_growth_rate", "Salary Growth", { suffix: "%", step: "0.005" })}
          </div>

          {/* Accrual */}
          <div className="grid grid-cols-2 gap-3">
            {numField("accrual_rate", "Accrual Rate (1/X)", { step: "1" })}
            {numField("existing_income", "Accrued Income (£/yr)", { prefix: "£" })}
          </div>

          {/* Active */}
          <div className="flex items-center justify-between py-2">
            <Label className="text-[11px] text-muted-foreground">Active Member</Label>
            <Switch checked={form.is_active_member} onCheckedChange={(v) => update("is_active_member", v)} />
          </div>

          {/* Revaluation */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Revaluation</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">Type</Label>
                <Select value={form.revaluation_type} onValueChange={(v) => update("revaluation_type", v as "CPI" | "fixed")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPI">CPI-linked</SelectItem>
                    <SelectItem value="fixed">Fixed Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.revaluation_type === "fixed"
                ? numField("revaluation_rate", "Fixed Rate", { suffix: "%", step: "0.005" })
                : numField("revaluation_uplift", "CPI Uplift", { suffix: "%", step: "0.005" })
              }
            </div>
          </div>

          {/* Early Retirement */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Early Retirement</p>
            <div className="grid grid-cols-1 gap-3">
              {numField("early_retirement_factor", "Penalty per year early (%)", { suffix: "%", step: "0.5" })}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Percentage reduction applied for each year you retire before the scheme's normal retirement age.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {pension ? "Update" : "Add"} Scheme
          </Button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
