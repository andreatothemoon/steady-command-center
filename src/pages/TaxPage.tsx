import { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHouseholdProfiles, type HouseholdProfile } from "@/hooks/useHouseholdProfiles";
import { useAccounts } from "@/hooks/useAccounts";
import { useTaxSummaries, useUpsertTaxSummary } from "@/hooks/useTaxSummaries";
import AddMemberDialog from "@/components/AddMemberDialog";
import { toast } from "sonner";

const TAX_YEAR = "2025/26";

interface Allowance {
  label: string;
  used: number;
  limit: number;
  warning?: string;
}

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

type ViewMode = "household" | string;

// Currency input helper — strips non-numeric chars for controlled input
function parseCurrencyInput(val: string): number {
  const cleaned = val.replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : Math.max(0, n);
}

function CurrencyField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [raw, setRaw] = useState(value > 0 ? String(value) : "");

  useEffect(() => {
    setRaw(value > 0 ? String(value) : "");
  }, [value]);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">£</span>
        <Input
          type="text"
          inputMode="decimal"
          disabled={disabled}
          className="pl-7 tabular-nums text-sm"
          placeholder="0"
          value={raw}
          onChange={(e) => {
            const v = e.target.value;
            // Allow only digits, one dot, max 2 decimals, max 10 digits
            if (/^[0-9]*\.?[0-9]{0,2}$/.test(v) && v.length <= 12) {
              setRaw(v);
              onChange(parseCurrencyInput(v));
            }
          }}
          onBlur={() => {
            const n = parseCurrencyInput(raw);
            setRaw(n > 0 ? String(n) : "");
            onChange(n);
          }}
        />
      </div>
    </div>
  );
}

interface MemberFormState {
  gross_income: number;
  pension_contributions: number;
  isa_contributions: number;
  capital_gains: number;
}

const emptyForm: MemberFormState = {
  gross_income: 0,
  pension_contributions: 0,
  isa_contributions: 0,
  capital_gains: 0,
};

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
    return Math.max(0, Number(s.gross_income ?? 0) - Number(s.pension_contributions ?? 0));
  };

  const getHouseholdANI = () =>
    adults.reduce((sum, p) => sum + getANI(p.id), 0);

  const startEditing = (profile: HouseholdProfile) => {
    const s = getSummaryForProfile(profile.id);
    setEditingProfileId(profile.id);
    setFormState({
      gross_income: Number(s?.gross_income ?? 0),
      pension_contributions: Number(s?.pension_contributions ?? 0),
      isa_contributions: Number(s?.isa_contributions ?? 0),
      capital_gains: Number(s?.capital_gains ?? 0),
    });
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

  const getAllowances = (profile: HouseholdProfile): Allowance[] => {
    const s = getSummaryForProfile(profile.id);
    if (profile.role === "child") {
      return [
        { label: "Junior ISA Allowance", used: Number(s?.isa_contributions ?? 0), limit: 9000 },
      ];
    }
    return [
      { label: "ISA Allowance", used: Number(s?.isa_contributions ?? 0), limit: 20000 },
      { label: "Pension Annual Allowance", used: Number(s?.pension_contributions ?? 0), limit: 60000 },
      { label: "Capital Gains Allowance", used: Number(s?.capital_gains ?? 0), limit: 3000 },
      { label: "Dividend Allowance", used: 0, limit: 500 },
    ];
  };

  const selectedProfile =
    viewMode !== "household" ? profiles.find((p) => p.id === viewMode) : null;

  const ani = selectedProfile ? getANI(selectedProfile.id) : getHouseholdANI();
  const aniWarning = ani >= 100000;

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
                    {isEditing && (
                      <div className="px-5 py-4 border-b border-border bg-secondary/20">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <CurrencyField
                            label="Gross Income"
                            value={formState.gross_income}
                            onChange={(v) => setFormState((s) => ({ ...s, gross_income: v }))}
                          />
                          <CurrencyField
                            label="Pension Contributions"
                            value={formState.pension_contributions}
                            onChange={(v) => setFormState((s) => ({ ...s, pension_contributions: v }))}
                          />
                          <CurrencyField
                            label={isChild ? "Junior ISA" : "ISA Contributions"}
                            value={formState.isa_contributions}
                            onChange={(v) => setFormState((s) => ({ ...s, isa_contributions: v }))}
                          />
                          {!isChild && (
                            <CurrencyField
                              label="Capital Gains"
                              value={formState.capital_gains}
                              onChange={(v) => setFormState((s) => ({ ...s, capital_gains: v }))}
                            />
                          )}
                        </div>
                        {!isChild && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground">Estimated ANI:</span>
                            <span className={cn(
                              "text-sm font-semibold tabular-nums",
                              (formState.gross_income - formState.pension_contributions) >= 100000
                                ? "text-destructive"
                                : "text-foreground"
                            )}>
                              {formatCurrency(Math.max(0, formState.gross_income - formState.pension_contributions))}
                            </span>
                            {(formState.gross_income - formState.pension_contributions) >= 100000 && (
                              <span className="text-[10px] text-destructive">⚠ above £100k</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

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
                  {aniWarning ? (
                    <p className="text-sm text-destructive mt-1">
                      Above £100k — personal allowance tapering applies
                    </p>
                  ) : (
                    <p className="label-subtle mt-1">Below £100k — no tapering</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2">
                    ANI = Gross Income − Pension Contributions
                  </p>
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

                {editingProfileId === selectedProfile.id ? (
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <CurrencyField
                        label="Gross Income"
                        value={formState.gross_income}
                        onChange={(v) => setFormState((s) => ({ ...s, gross_income: v }))}
                      />
                      <CurrencyField
                        label="Pension Contributions"
                        value={formState.pension_contributions}
                        onChange={(v) => setFormState((s) => ({ ...s, pension_contributions: v }))}
                      />
                      <CurrencyField
                        label={selectedProfile.role === "child" ? "Junior ISA" : "ISA Contributions"}
                        value={formState.isa_contributions}
                        onChange={(v) => setFormState((s) => ({ ...s, isa_contributions: v }))}
                      />
                      {selectedProfile.role !== "child" && (
                        <CurrencyField
                          label="Capital Gains"
                          value={formState.capital_gains}
                          onChange={(v) => setFormState((s) => ({ ...s, capital_gains: v }))}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-4">
                    {(() => {
                      const s = getSummaryForProfile(selectedProfile.id);
                      if (!s) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            No income data entered yet.{" "}
                            <button
                              onClick={() => startEditing(selectedProfile)}
                              className="text-primary hover:underline"
                            >
                              Add now →
                            </button>
                          </p>
                        );
                      }
                      const items = [
                        { label: "Gross Income", value: Number(s.gross_income ?? 0) },
                        { label: "Pension Contributions", value: Number(s.pension_contributions ?? 0) },
                        { label: "ISA Contributions", value: Number(s.isa_contributions ?? 0) },
                        ...(selectedProfile.role !== "child"
                          ? [{ label: "Capital Gains", value: Number(s.capital_gains ?? 0) }]
                          : []),
                      ];
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {items.map((item) => (
                            <div key={item.label}>
                              <p className="text-[11px] text-muted-foreground mb-0.5">{item.label}</p>
                              <p className="text-sm font-medium tabular-nums">{formatCurrency(item.value)}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
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
