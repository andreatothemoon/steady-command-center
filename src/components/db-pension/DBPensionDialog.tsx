import { useState, useEffect } from "react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { DBPension, DBPensionInput } from "@/hooks/useDBPensions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pension: DBPension | null;
  onSave: (input: DBPensionInput & { id?: string }) => void;
  isPending: boolean;
}

const defaults: DBPensionInput = {
  name: "NHS Pension",
  scheme_type: "CARE",
  current_age: 35,
  retirement_age: 67,
  current_salary: 45000,
  salary_growth_rate: 0.03,
  accrual_rate: 54,
  is_active_member: true,
  revaluation_type: "CPI",
  revaluation_rate: 0.02,
  revaluation_uplift: 0.015,
  indexation_type: "CPI",
  indexation_cap: 0.05,
  existing_income: 0,
};

export default function DBPensionDialog({ open, onOpenChange, pension, onSave, isPending }: Props) {
  const [form, setForm] = useState<DBPensionInput>(defaults);

  useEffect(() => {
    if (pension) {
      setForm({
        name: pension.name,
        scheme_type: pension.scheme_type as "CARE" | "FINAL_SALARY",
        current_age: pension.current_age,
        retirement_age: pension.retirement_age,
        current_salary: Number(pension.current_salary),
        salary_growth_rate: Number(pension.salary_growth_rate),
        accrual_rate: Number(pension.accrual_rate),
        is_active_member: pension.is_active_member,
        revaluation_type: pension.revaluation_type as "CPI" | "fixed",
        revaluation_rate: Number(pension.revaluation_rate),
        revaluation_uplift: Number(pension.revaluation_uplift),
        indexation_type: pension.indexation_type as "CPI" | "capped",
        indexation_cap: Number(pension.indexation_cap),
        existing_income: Number(pension.existing_income),
      });
    } else {
      setForm(defaults);
    }
  }, [pension, open]);

  const update = <K extends keyof DBPensionInput>(key: K, val: DBPensionInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const numField = (key: keyof DBPensionInput, label: string, opts?: { prefix?: string; suffix?: string; step?: string }) => (
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
    onSave({ ...form, id: pension?.id });
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
