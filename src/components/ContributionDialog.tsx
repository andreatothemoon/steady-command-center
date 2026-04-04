import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddCashFlow, useUpdateCashFlow, type CashFlow } from "@/hooks/useCashFlows";
import { useAccounts } from "@/hooks/useAccounts";

const schema = z.object({
  description: z.string().trim().min(1, "Required").max(200),
  amount: z.coerce.number().positive("Must be positive"),
  flow_date: z.string().min(1, "Required"),
  flow_type: z.string().min(1, "Required"),
  tag: z.string().optional(),
  account_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const FLOW_TYPES = [
  { value: "pension_employee", label: "Pension (Employee)" },
  { value: "pension_employer", label: "Pension (Employer)" },
  { value: "isa_contribution", label: "ISA Contribution" },
  { value: "mortgage_overpayment", label: "Mortgage Overpayment" },
  { value: "bonus", label: "Bonus / Lump Sum" },
  { value: "dividend", label: "Dividend" },
  { value: "other", label: "Other" },
];

const TAGS = [
  { value: "pension", label: "Pension" },
  { value: "isa", label: "ISA" },
  { value: "mortgage", label: "Mortgage" },
  { value: "savings", label: "Savings" },
  { value: "other", label: "Other" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: CashFlow | null;
}

export default function ContributionDialog({ open, onOpenChange, editItem }: Props) {
  const addMut = useAddCashFlow();
  const updateMut = useUpdateCashFlow();
  const { data: accounts = [] } = useAccounts();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editItem
      ? {
          description: editItem.description ?? "",
          amount: Math.abs(Number(editItem.amount)),
          flow_date: editItem.flow_date,
          flow_type: editItem.flow_type,
          tag: editItem.tag ?? "",
          account_id: editItem.account_id ?? "",
        }
      : {
          description: "",
          amount: 0,
          flow_date: new Date().toISOString().slice(0, 10),
          flow_type: "",
          tag: "",
          account_id: "",
        },
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      description: values.description,
      amount: values.amount,
      flow_date: values.flow_date,
      flow_type: values.flow_type,
      tag: values.tag || null,
      account_id: values.account_id || null,
    };

    if (editItem) {
      updateMut.mutate({ id: editItem.id, ...payload }, {
        onSuccess: () => { onOpenChange(false); reset(); },
      });
    } else {
      addMut.mutate(payload, {
        onSuccess: () => { onOpenChange(false); reset(); },
      });
    }
  };

  const isPending = addMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit Contribution" : "Add Contribution"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} placeholder="e.g. Monthly pension contribution" />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount">Amount (£)</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <Label htmlFor="flow_date">Date</Label>
              <Input id="flow_date" type="date" {...register("flow_date")} />
              {errors.flow_date && <p className="text-xs text-destructive mt-1">{errors.flow_date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={watch("flow_type")} onValueChange={(v) => setValue("flow_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {FLOW_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.flow_type && <p className="text-xs text-destructive mt-1">{errors.flow_type.message}</p>}
            </div>
            <div>
              <Label>Tag</Label>
              <Select value={watch("tag") ?? ""} onValueChange={(v) => setValue("tag", v)}>
                <SelectTrigger><SelectValue placeholder="Select tag" /></SelectTrigger>
                <SelectContent>
                  {TAGS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Linked Account (optional)</Label>
            <Select value={watch("account_id") ?? ""} onValueChange={(v) => setValue("account_id", v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : editItem ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
