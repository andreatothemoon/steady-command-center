import { useState } from "react";
import { motion } from "framer-motion";
import { Users, User, Baby, Shield, Database, Plus, Pencil, Trash2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  useHouseholdProfiles,
  useDeleteHouseholdProfile,
  type HouseholdProfile,
} from "@/hooks/useHouseholdProfiles";
import MemberDialog from "@/components/MemberDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { usePageVisibility, ALL_TOGGLEABLE_PAGES } from "@/contexts/PageVisibilityContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

const getAge = (dob: string | null) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
};

export default function SettingsPage() {
  const { signOut } = useAuth();
  const { data: profiles = [], isLoading } = useHouseholdProfiles();
  const deleteMember = useDeleteHouseholdProfile();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<HouseholdProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HouseholdProfile | null>(null);

  const adults = profiles.filter((p) => p.role === "adult");
  const children = profiles.filter((p) => p.role === "child");

  const handleEdit = (profile: HouseholdProfile) => {
    setEditingProfile(profile);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProfile(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMember.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed`);
    } catch (e: any) {
      toast.error(e.message || "Failed to remove");
    }
    setDeleteTarget(null);
  };

  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="label-subtle mt-1">Manage your household and preferences</p>
      </motion.div>

      {/* Household Members */}
      <motion.div variants={stagger.item} className="card-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-card-foreground">Household Members</p>
              <p className="text-[11px] text-muted-foreground">
                {adults.length} adult{adults.length !== 1 ? "s" : ""}
                {children.length > 0 && ` · ${children.length} child${children.length !== 1 ? "ren" : ""}`}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add Member
          </Button>
        </div>

        {isLoading ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No members yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add adults and children to track allowances per person.</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={handleAdd}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add First Member
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {profiles.map((profile) => {
              const isChild = profile.role === "child";
              const age = getAge(profile.date_of_birth);
              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                        isChild
                          ? "bg-accent text-accent-foreground"
                          : "bg-primary/15 text-primary"
                      )}
                    >
                      {isChild ? (
                        <Baby className="h-4 w-4" />
                      ) : (
                        profile.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-card-foreground">{profile.name}</p>
                        {profile.is_primary && (
                          <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {profile.role}
                        {age !== null && ` · Age ${age}`}
                        {profile.date_of_birth && ` · Born ${new Date(profile.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(profile)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(profile)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Page Visibility */}
      <PageVisibilitySection />

      {/* Security */}
      <motion.div variants={stagger.item} className="card-surface p-5">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <p className="label-muted">Security</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="label-subtle">Manage your session</p>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </motion.div>

      {/* Data */}
      <motion.div variants={stagger.item} className="card-surface p-5">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-5 w-5 text-muted-foreground" />
          <p className="label-muted">Data</p>
        </div>
        <p className="label-subtle">Export and import options coming soon.</p>
      </motion.div>

      {/* Add/Edit dialog */}
      <MemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profile={editingProfile}
      />

      {/* Delete confirmation */}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from your household. Any accounts linked to this member will remain but won't be attributed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
