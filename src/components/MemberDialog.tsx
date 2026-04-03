import { useEffect } from "react";
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
import {
  useAddHouseholdProfile,
  useUpdateHouseholdProfile,
  type HouseholdProfile,
} from "@/hooks/useHouseholdProfiles";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  role: z.enum(["adult", "child"]),
  date_of_birth: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: HouseholdProfile | null;
}

export default function MemberDialog({ open, onOpenChange, profile }: Props) {
  const addProfile = useAddHouseholdProfile();
  const updateProfile = useUpdateHouseholdProfile();
  const isEdit = !!profile;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", role: "adult", date_of_birth: "" },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        role: profile.role as "adult" | "child",
        date_of_birth: profile.date_of_birth ?? "",
      });
    } else {
      form.reset({ name: "", role: "adult", date_of_birth: "" });
    }
  }, [profile, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && profile) {
        await updateProfile.mutateAsync({
          id: profile.id,
          name: values.name,
          role: values.role,
          date_of_birth: values.date_of_birth || null,
        });
        toast.success("Member updated");
      } else {
        await addProfile.mutateAsync({
          name: values.name,
          role: values.role,
          date_of_birth: values.date_of_birth || null,
        });
        toast.success("Member added");
      }
      form.reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const isPending = addProfile.isPending || updateProfile.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Member" : "Add Family Member"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this member's details." : "Add an adult or child to your household."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="member-name">Name</Label>
            <Input id="member-name" placeholder="e.g. Sarah" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select onValueChange={(v) => form.setValue("role", v as "adult" | "child")} value={form.watch("role")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="adult">Adult</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" {...form.register("date_of_birth")} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Member"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
