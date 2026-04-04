import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  User,
  Baby,
  Plus,
  Save,
  Pencil,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useHouseholdProfiles, type HouseholdProfile } from "@/hooks/useHouseholdProfiles";
import { useAccounts } from "@/hooks/useAccounts";
import {
  useTaxSummaries,
  useUpsertTaxSummary,
  computeANI,
  summaryToForm,
  emptyForm,
  type MemberFormState,
} from "@/hooks/useTaxSummaries";
import AddMemberDialog from "@/components/AddMemberDialog";
import { toast } from "sonner";
import { CurrencyField } from "@/components/tax/CurrencyField";
import { ANIBreakdown } from "@/components/tax/ANIBreakdown";

const TAX_YEAR = "2025/26";

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

type ViewMode = "household" | string;

interface Allowance {
  label: string;
  used: number;
  limit: number;
}

export default function TaxPage() {
  const { data: profiles = [], isLoading } = useHouseholdProfiles();
  const { data: accounts = [] } = useAccounts();
  const { data: taxSummaries = [] } = useTaxSummaries(TAX_YEAR);
  const upsertTax = useUpsertTaxSummary();

  const [viewMode, setViewMode] = useState<ViewMode>("household");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [formState, setFormState] = useState<MemberFormState>(emptyForm);

  const adults = profiles.filter((p) => p.role === "adult");
  const children = profiles.filter((p) => p.role === "child");

  const getAge = (dob: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    return age;
  };

  const getMemberAccounts = (profile: HouseholdProfile) =>
    accounts.filter((a) => a.owner_name.toLowerCase() === profile.name.toLowerCase());

  const getSummaryForProfile = (profileId: string) =>
    taxSummaries.find((s) => s.member_profile_id === profileId);

  const getANI = (profileId: string) => {
    const s = getSummaryForProfile(profileId);
    if (!s) return 0;
    return computeANI(summaryToForm(s)).adjusted_net_income;
  };

  const getHouseholdANI = () =>
    adults.reduce((sum, p) => sum + getANI(p.id), 0);

  const anyAdultOverThreshold = adults.some((p) => getANI(p.id) >= 100000);

  const startEditing = (profile: HouseholdProfile) => {
    const s = getSummaryForProfile(profile.id);
    setEditingProfileId(profile.id);
    setFormState(summaryToForm(s));
  };

  const cancelEditing = () => {
    setEditingProfileId(null);
    setFormState(emptyForm);
  };

  const saveForm = async (profile: HouseholdProfile) => {
    const existing = getSummaryForProfile(profile.id);
    try {
      await upsertTax.mutateAsync({
        id: existing?.id,
        member_profile_id: profile.id,
        tax_year: TAX_YEAR,
        ...formState,
      });
      toast.success(`${profile.name}'s tax data saved`);
      setEditingProfileId(null);
    } catch {
      toast.error("Failed to save tax data");
    }
  };

  const updateField = (field: keyof MemberFormState) => (v: number) =>
    setFormState((s) => ({ ...s, [field]: v }));

  const getAllowances = (profile: HouseholdProfile): Allowance[] => {
    const s = getSummaryForProfile(profile.id);
    const form = summaryToForm(s);
    const computed = computeANI(form);
    if (profile.role === "child") {
      return [{ label: "Junior ISA Allowance", used: Number(s?.isa_contributions ?? 0), limit: 9000 }];
    }
    return [
      { label: "ISA Allowance", used: Number(s?.isa_contributions ?? 0), limit: 20000 },
      { label: "Pension Annual Allowance", used: computed.pension_contributions, limit: 60000 },
      { label: "Capital Gains Allowance", used: Number(s?.capital_gains ?? 0), limit: 3000 },
      { label: "Dividend Allowance", used: form.dividend_income, limit: 500 },
    ];
  };

  const selectedProfile =
    viewMode !== "household" ? profiles.find((p) => p.id === viewMode) : null;

  const ani = selectedProfile ? getANI(selectedProfile.id) : 0;
  const aniWarning = selectedProfile
    ? ani >= 100000
    : anyAdultOverThreshold;

  const liveComputed = computeANI(formState);

  // Inline form for editing
  const renderEditForm = (profile: HouseholdProfile, inline = false) => {
    const isChild = profile.role === "child";
    return (
      <div className={cn("space-y-4", inline ? "px-5 py-4 border-b border-border bg-secondary/20" : "px-5 py-4")}>
        {/* Income section */}
        {!isChild && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Income</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <CurrencyField label="Salary" value={formState.salary} onChange={updateField("salary")} />
              <CurrencyField label="Bonus" value={formState.bonus} onChange={updateField("bonus")} />
              <CurrencyField label="Taxable Benefits (BIK)" value={formState.taxable_benefits} onChange={updateField("taxable_benefits")} />
              <CurrencyField label="Dividend Income" value={formState.dividend_income} onChange={updateField("dividend_income")} />
              <CurrencyField label="Rental Income" value={formState.rental_income} onChange={updateField("rental_income")} />
            </div>
          </div>
        )}

        {/* Pension section */}
        {!isChild && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Pension Contributions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <CurrencyField label="Salary Sacrifice" value={formState.salary_sacrifice_pension} onChange={updateField("salary_sacrifice_pension")} />
              <CurrencyField label="Employer" value={formState.employer_pension} onChange={updateField("employer_pension")} />
              <CurrencyField label="Personal (net)" value={formState.personal_pension_net} onChange={updateField("personal_pension_net")} />
            </div>
          </div>
        )}

        {/* Other deductions */}
        {!isChild && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Other Deductions</p>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyField label="Gift Aid (net)" value={formState.gift_aid} onChange={updateField("gift_aid")} />
              <CurrencyField label="Other Salary Sacrifice" value={formState.other_salary_sacrifice} onChange={updateField("other_salary_sacrifice")} />
            </div>
          </div>
        )}

        {/* Allowances */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Allowances</p>
          <div className="grid grid-cols-2 gap-3">
            <CurrencyField label={isChild ? "Junior ISA" : "ISA Contributions"} value={formState.isa_contributions} onChange={updateField("isa_contributions")} />
            {!isChild && (
              <CurrencyField label="Capital Gains" value={formState.capital_gains} onChange={updateField("capital_gains")} />
            )}
          </div>
        </div>

        {/* Live ANI breakdown */}
        {!isChild && <ANIBreakdown computed={liveComputed} />}
      </div>
    );
  };

  // Read-only display of data
  const renderReadOnlyData = (profile: HouseholdProfile) => {
    const s = getSummaryForProfile(profile.id);
    if (!s) {
      return (
        <p className="text-sm text-muted-foreground px-5 py-4">
          No income data entered yet.{" "}
          <button onClick={() => startEditing(profile)} className="text-primary hover:underline">
            Add now →
          </button>
        </p>
      );
    }
    const form = summaryToForm(s);
    const computed = computeANI(form);
    const isChild = profile.role === "child";

    return (
      <div className="px-5 py-4 space-y-4">
        {!isChild && (
          <>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Income</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <ReadOnlyField label="Salary" value={form.salary} />
                <ReadOnlyField label="Bonus" value={form.bonus} />
                <ReadOnlyField label="Taxable BIK" value={form.taxable_benefits} />
                <ReadOnlyField label="Dividends" value={form.dividend_income} />
                <ReadOnlyField label="Rental" value={form.rental_income} />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pension</p>
              <div className="grid grid-cols-3 gap-3">
                <ReadOnlyField label="Salary Sacrifice" value={form.salary_sacrifice_pension} />
                <ReadOnlyField label="Employer" value={form.employer_pension} />
                <ReadOnlyField label="Personal (net)" value={form.personal_pension_net} />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deductions</p>
              <div className="grid grid-cols-2 gap-3">
                <ReadOnlyField label="Gift Aid" value={form.gift_aid} />
                <ReadOnlyField label="Other Sacrifice" value={form.other_salary_sacrifice} />
              </div>
            </div>
          </>
        )}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Allowances</p>
          <div className="grid grid-cols-2 gap-3">
            <ReadOnlyField label={isChild ? "Junior ISA" : "ISA"} value={form.isa_contributions} />
            {!isChild && <ReadOnlyField label="Capital Gains" value={form.capital_gains} />}
          </div>
        </div>
        {!isChild && <ANIBreakdown computed={computed} />}
      </div>
    );
  };

  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tax</h1>
          <p className="label-subtle mt-1">
            Tax year {TAX_YEAR} — {viewMode === "household" ? "Household view" : selectedProfile?.name}
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
          onClick={() => { setViewMode("household"); cancelEditing(); }}
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
            onClick={() => { setViewMode(p.id); cancelEditing(); }}
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

      {/* ─── Household view ─── */}
      {viewMode === "household" ? (
        <>
          {/* Per-member ANI summary */}
          <motion.div
            variants={stagger.item}
            className={cn("p-5 rounded-xl border", aniWarning ? "card-alert" : "hero-surface")}
          >
            <div className="flex items-center gap-2 mb-3">
              {aniWarning ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-success" />
              )}
              <p className="label-muted">Adjusted Net Income (per person)</p>
            </div>
            {adults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No adults in household</p>
            ) : (
              <div className="space-y-3">
                {adults.map((p) => {
                  const memberANI = getANI(p.id);
                  const status = memberANI >= 100000 ? "danger" : memberANI > 85000 ? "warning" : "safe";
                  return (
                    <div key={p.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground">{p.name}</p>
                        <p className={cn(
                          "text-xl font-bold tabular-nums tracking-tight",
                          status === "danger" ? "text-destructive" : status === "warning" ? "text-warning" : "text-card-foreground"
                        )}>
                          {formatCurrency(memberANI)}
                        </p>
                      </div>
                      <div className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        status === "safe" && "status-safe",
                        status === "warning" && "status-warning",
                        status === "danger" && "status-danger",
                      )}>
                        {status === "safe" ? "Below £100k" : status === "warning" ? "Approaching" : "Over £100k"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="label-subtle mt-2">
              {adults.length} adult{adults.length !== 1 ? "s" : ""}
              {children.length > 0 && ` · ${children.length} child${children.length !== 1 ? "ren" : ""}`}
              {" · £100k threshold per person"}
            </p>
          </motion.div>

          {/* Per-member cards */}
          {profiles.length === 0 ? (
            <motion.div variants={stagger.item} className="card-surface p-10 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No family members added yet.</p>
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setAddMemberOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Member
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile) => {
                const isChild = profile.role === "child";
                const memberAllowances = getAllowances(profile);
                const memberAccounts = getMemberAccounts(profile);
                const totalValue = memberAccounts.reduce((s, a) => s + Number(a.current_value), 0);
                const memberANI = getANI(profile.id);
                const summary = getSummaryForProfile(profile.id);
                const isEditing = editingProfileId === profile.id;

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
                            {!isChild && ` · ANI ${formatCurrency(memberANI)}`}
                            {memberAccounts.length > 0 && ` · ${formatCurrency(totalValue)} across ${memberAccounts.length} accounts`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <button
                            onClick={() => startEditing(profile)}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                          >
                            <Pencil className="h-3 w-3" />
                            {summary ? "Edit" : "Add income"}
                          </button>
                        ) : (
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEditing}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => saveForm(profile)}
                              disabled={upsertTax.isPending}
                            >
                              <Save className="h-3 w-3" />
                              Save
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Income form (inline edit) */}
                    {isEditing && renderEditForm(profile, true)}

                    {/* Allowance bars */}
                    <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {memberAllowances.map((a) => {
                        const pct = a.limit > 0 ? Math.min((a.used / a.limit) * 100, 100) : 0;
                        const remaining = Math.max(0, a.limit - a.used);
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
        /* ─── Individual member view ─── */
        <>
          {selectedProfile && (
            <>
              {/* ANI hero for adults */}
              {selectedProfile.role === "adult" && (
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
                  {ani >= 125140 ? (
                    <p className="text-sm text-destructive mt-1">
                      Above £125,140 — full personal allowance lost
                    </p>
                  ) : aniWarning ? (
                    <p className="text-sm text-destructive mt-1">
                      Above £100k — personal allowance tapering applies
                    </p>
                  ) : (
                    <p className="label-subtle mt-1">Below £100k — no tapering</p>
                  )}
                </motion.div>
              )}

              {/* Income form card */}
              <motion.div variants={stagger.item} className="card-surface overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                  <p className="text-sm font-medium text-card-foreground">Income &amp; Deductions</p>
                  {editingProfileId !== selectedProfile.id ? (
                    <button
                      onClick={() => startEditing(selectedProfile)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEditing}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => saveForm(selectedProfile)}
                        disabled={upsertTax.isPending}
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                {editingProfileId === selectedProfile.id
                  ? renderEditForm(selectedProfile)
                  : renderReadOnlyData(selectedProfile)}
              </motion.div>

              {/* Allowance cards */}
              <motion.div variants={stagger.item} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {getAllowances(selectedProfile).map((a) => {
                  const pct = a.limit > 0 ? Math.min((a.used / a.limit) * 100, 100) : 0;
                  const remaining = Math.max(0, a.limit - a.used);
                  const isFull = remaining <= 0;

                  return (
                    <div key={a.label} className={cn("card-surface p-4", isFull && "border-warning/20")}>
                      <div className="flex justify-between items-start mb-3">
                        <p className="label-muted">{a.label}</p>
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
            </>
          )}
        </>
      )}

      <AddMemberDialog open={addMemberOpen} onOpenChange={setAddMemberOpen} />
    </motion.div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium tabular-nums">{formatCurrency(value)}</p>
    </div>
  );
}
