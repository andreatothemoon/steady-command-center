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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { useUpdateAccount, useDeleteAccount, useAccounts, type Account } from "@/hooks/useAccounts";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import { accountTypeLabels, wrapperLabels } from "@/data/types";
import type { AccountType, WrapperType } from "@/data/types";
import { toast } from "sonner";
import { Trash2, Link2 } from "lucide-react";
import { useState, useEffect } from "react";

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
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditAccountDialog({ account, open, onOpenChange }: Props) {
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const { data: allAccounts = [] } = useAccounts();
  const { data: profiles = [] } = useHouseholdProfiles();
  const [linkedAccountId, setLinkedAccountId] = useState<string | null>(null);

  const isMortgage = account?.account_type === "mortgage";
  const propertyAccounts = allAccounts.filter(
    (a) => a.account_type === "property" && a.id !== account?.id
  );

  useEffect(() => {
    if (account) {
      setLinkedAccountId((account as any).linked_account_id ?? null);
    }
  }, [account]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: account
      ? {
          name: account.name,
          account_type: account.account_type,
          wrapper_type: account.wrapper_type,
          current_value: Number(account.current_value),
          owner_name: account.owner_name,
        }
      : undefined,
  });

  const onSubmit = async (values: FormValues) => {
    if (!account) return;
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        name: values.name,
        account_type: values.account_type as AccountType,
        wrapper_type: values.wrapper_type as WrapperType,
        current_value: values.current_value,
        owner_name: values.owner_name,
        linked_account_id: isMortgage ? linkedAccountId : null,
      } as any);
      toast.success("Account updated");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update account");
    }
  };

  const handleDelete = async () => {
    if (!account) return;
    try {
      await deleteAccount.mutateAsync(account.id);
      toast.success("Account deleted");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete account");
    }
  };

  const handleTypeChange = (val: string) => {
    form.setValue("account_type", val);
    const autoWrapper = typeToWrapper[val as AccountType];
    if (autoWrapper) form.setValue("wrapper_type", autoWrapper);
    else form.setValue("wrapper_type", "none");
    // Clear link if switching away from mortgage
    if (val !== "mortgage") setLinkedAccountId(null);
  };

  if (!account) return null;

  const watchedType = form.watch("account_type");
  const showPropertyLink = watchedType === "mortgage";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>Update account details or remove it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Account Name</Label>
            <Input id="edit-name" placeholder="e.g. Vanguard ISA" {...form.register("name")} />
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
              <Label htmlFor="edit-value">Current Value (£)</Label>
              <Input id="edit-value" type="number" step="0.01" {...form.register("current_value")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-owner">Owner</Label>
              <Input id="edit-owner" placeholder="You" {...form.register("owner_name")} />
            </div>
          </div>

          {/* Linked Property selector for mortgages */}
          {showPropertyLink && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                Linked Property
              </Label>
              {propertyAccounts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No property accounts to link. Add a property account first.</p>
              ) : (
                <Select
                  value={linkedAccountId ?? "_none"}
                  onValueChange={(v) => setLinkedAccountId(v === "_none" ? null : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No linked property</SelectItem>
                    {propertyAccounts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove "{account.name}" and any associated data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button type="submit" disabled={updateAccount.isPending}>
              {updateAccount.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
