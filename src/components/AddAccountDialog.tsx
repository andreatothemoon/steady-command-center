import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useAddAccount } from "@/hooks/useAccounts";
import { accountTypeLabels, wrapperLabels } from "@/data/types";
import type { AccountType, WrapperType } from "@/data/types";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  account_type: z.string().min(1, "Select a type"),
  wrapper_type: z.string().min(1, "Select a wrapper"),
  current_value: z.coerce.number(),
  owner_name: z.string().trim().min(1, "Owner is required").max(50),
});

type FormValues = z.infer<typeof schema>;

const typeToWrapper: Partial<Record<AccountType, WrapperType>> = {
  cash_isa: "isa",
  stocks_and_shares_isa: "isa",
  sipp: "sipp",
  workplace_pension: "workplace_pension",
  db_pension: "db_pension",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddAccountDialog({ open, onOpenChange }: Props) {
  const addAccount = useAddAccount();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      account_type: "",
      wrapper_type: "none",
      current_value: 0,
      owner_name: "You",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await addAccount.mutateAsync({
        name: values.name,
        account_type: values.account_type as AccountType,
        wrapper_type: values.wrapper_type as WrapperType,
        current_value: values.current_value,
        owner_name: values.owner_name,
      });
      toast.success("Account added");
      form.reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to add account");
    }
  };

  const handleTypeChange = (val: string) => {
    form.setValue("account_type", val);
    const autoWrapper = typeToWrapper[val as AccountType];
    if (autoWrapper) form.setValue("wrapper_type", autoWrapper);
    else form.setValue("wrapper_type", "none");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
          <DialogDescription>Track a new financial account.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input id="name" placeholder="e.g. Vanguard ISA" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select onValueChange={handleTypeChange} value={form.watch("account_type")}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(accountTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.account_type && (
                <p className="text-xs text-destructive">{form.formState.errors.account_type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Wrapper</Label>
              <Select onValueChange={(v) => form.setValue("wrapper_type", v)} value={form.watch("wrapper_type")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(wrapperLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="current_value">Current Value (£)</Label>
              <Input id="current_value" type="number" step="0.01" {...form.register("current_value")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name">Owner</Label>
              <Input id="owner_name" placeholder="You" {...form.register("owner_name")} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={addAccount.isPending}>
            {addAccount.isPending ? "Adding…" : "Add Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
