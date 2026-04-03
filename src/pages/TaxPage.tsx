import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  User,
  Baby,
  Plus,
  ChevronDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useHouseholdProfiles, type HouseholdProfile } from "@/hooks/useHouseholdProfiles";
import { useAccounts } from "@/hooks/useAccounts";
import AddMemberDialog from "@/components/AddMemberDialog";

const taxYear = "2025/26";

interface Allowance {
  label: string;
  used: number;
  limit: number;
  warning?: string;
}

// UK tax allowances for 2025/26
const adultAllowances: Allowance[] = [
  { label: "ISA Allowance", used: 0, limit: 20000 },
  { label: "Pension Annual Allowance", used: 0, limit: 60000 },
  { label: "Capital Gains Allowance", used: 0, limit: 3000 },
  { label: "Dividend Allowance", used: 0, limit: 500 },
];

const childAllowances: Allowance[] = [
  { label: "Junior ISA Allowance", used: 0, limit: 9000 },
];

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

type ViewMode = "household" | string; // string = profile ID

export default function TaxPage() {
  const { data: profiles = [], isLoading } = useHouseholdProfiles();
  const { data: accounts = [] } = useAccounts();
  const [viewMode, setViewMode] = useState<ViewMode>("household");
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const adults = profiles.filter((p) => p.role === "adult");
  const children = profiles.filter((p) => p.role === "child");

  // Calculate age from DOB
  const getAge = (dob: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    return age;
  };

  // Derive per-member account totals from owner_name matching profile name
  const getMemberAccounts = (profile: HouseholdProfile) =>
    accounts.filter(
      (a) => a.owner_name.toLowerCase() === profile.name.toLowerCase()
    );

  const getHouseholdANI = () => {
    // Simplified: sum all investable accounts across household
    return 72000; // placeholder — would come from tax_year_summaries
  };

  const getMemberANI = (_profile: HouseholdProfile) => {
    return 72000; // placeholder
  };

  const selectedProfile =
    viewMode !== "household" ? profiles.find((p) => p.id === viewMode) : null;

  const currentAllowances =
    selectedProfile?.role === "child"
      ? childAllowances
      : selectedProfile?.role === "adult"
        ? adultAllowances
        : null; // household = show all members

  const ani = selectedProfile ? getMemberANI(selectedProfile) : getHouseholdANI();
  const aniWarning = ani >= 100000;

  return (
    <motion.div
      className="space-y-5"
      variants={stagger.container}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tax</h1>
          <p className="label-subtle mt-1">
            Tax year {taxYear} — {viewMode === "household" ? "Household view" : selectedProfile?.name}
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setAddMemberOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </motion.div>

      {/* Member selector tabs */}
      <motion.div variants={stagger.item} className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setViewMode("household")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
            viewMode === "household"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary/50 text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-3.5 w-3.5" />
          Household
        </button>
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => setViewMode(p.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
              viewMode === p.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            )}
          >
            {p.role === "child" ? <Baby className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            {p.name}
            {p.date_of_birth && (
              <span className="text-[10px] opacity-70">({getAge(p.date_of_birth)})</span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Household view: show all members' allowances */}
      {viewMode === "household" ? (
        <>
          {/* Combined ANI hero */}
          <motion.div
            variants={stagger.item}
            className={cn("p-5 rounded-xl border", aniWarning ? "card-alert" : "hero-surface")}
          >
            <div className="flex items-center gap-2 mb-2">
              {aniWarning ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-success" />
              )}
              <p className="label-muted">Combined Household ANI</p>
            </div>
            <p className="value-hero text-3xl">{formatCurrency(ani)}</p>
            <p className="label-subtle mt-1">
              {adults.length} adult{adults.length !== 1 ? "s" : ""}
              {children.length > 0 && ` · ${children.length} child${children.length !== 1 ? "ren" : ""}`}
            </p>
          </motion.div>

          {/* Per-member breakdown cards */}
          {profiles.length === 0 ? (
            <motion.div variants={stagger.item} className="card-surface p-10 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No family members added yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Add members to track individual tax allowances.</p>
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setAddMemberOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Member
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile) => {
                const isChild = profile.role === "child";
                const memberAllowances = isChild ? childAllowances : adultAllowances;
                const memberAccounts = getMemberAccounts(profile);
                const totalValue = memberAccounts.reduce((s, a) => s + Number(a.current_value), 0);

                return (
                  <motion.div key={profile.id} variants={stagger.item} className="card-surface overflow-hidden">
                    {/* Member header */}
                    <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold",
                          isChild ? "bg-accent text-accent-foreground" : "bg-primary/15 text-primary"
                        )}>
                          {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{profile.name}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">
                            {profile.role}
                            {profile.date_of_birth && ` · Age ${getAge(profile.date_of_birth)}`}
                            {memberAccounts.length > 0 && ` · ${formatCurrency(totalValue)} across ${memberAccounts.length} accounts`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setViewMode(profile.id)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        View detail →
                      </button>
                    </div>
                    {/* Compact allowance bars */}
                    <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {memberAllowances.map((a) => {
                        const pct = Math.min((a.used / a.limit) * 100, 100);
                        const remaining = a.limit - a.used;
                        return (
                          <div key={a.label}>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-[11px] text-muted-foreground">{a.label}</span>
                              <span className="text-[11px] text-muted-foreground tabular-nums">
                                {formatCurrency(remaining)} left
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                              <motion.div
                                className={cn(
                                  "h-full rounded-full",
                                  pct >= 100 ? "bg-warning" : pct > 80 ? "bg-warning" : "bg-primary"
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Individual member view */
        <>
          {selectedProfile && selectedProfile.role === "adult" && (
            <motion.div
              variants={stagger.item}
              className={cn("p-5 rounded-xl border", aniWarning ? "card-alert" : "hero-surface")}
            >
              <div className="flex items-center gap-2 mb-2">
                {aniWarning ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-success" />
                )}
                <p className="label-muted">{selectedProfile.name}'s Adjusted Net Income</p>
              </div>
              <p className="value-hero text-3xl">{formatCurrency(ani)}</p>
              {aniWarning ? (
                <p className="text-sm text-destructive mt-1">
                  Above £100k — personal allowance tapering applies
                </p>
              ) : (
                <p className="label-subtle mt-1">Below £100k — no tapering</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-2">
                Higher-rate (40%) taxpayer · Consider salary sacrifice to reduce ANI
              </p>
            </motion.div>
          )}

          {currentAllowances && (
            <motion.div
              variants={stagger.item}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {currentAllowances.map((a) => {
                const pct = Math.min((a.used / a.limit) * 100, 100);
                const remaining = a.limit - a.used;
                const isFull = remaining <= 0;

                return (
                  <div
                    key={a.label}
                    className={cn("card-surface p-4", isFull && "border-warning/20")}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <p className="label-muted">{a.label}</p>
                      {a.warning && (
                        <span className="text-[10px] font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          {a.warning}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="value-compact">{formatCurrency(a.used)}</span>
                      <span className="text-sm text-muted-foreground">of {formatCurrency(a.limit)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          isFull ? "bg-warning" : pct > 80 ? "bg-warning" : "bg-primary"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                      />
                    </div>
                    {!isFull && (
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        {formatCurrency(remaining)} remaining
                      </p>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </>
      )}

      <AddMemberDialog open={addMemberOpen} onOpenChange={setAddMemberOpen} />
    </motion.div>
  );
}
