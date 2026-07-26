import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Home,
  Baby,
  Heart,
  Briefcase,
  Landmark,
  GraduationCap,
  Globe,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from "@/components/ui/responsive-dialog";
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
import { cn } from "@/lib/utils";
import {
  useLifeEvents,
  useUpsertLifeEvent,
  useDeleteLifeEvent,
  type LifeEventWithEffects,
  type EffectInput,
  type LifeEventInput,
} from "@/hooks/useLifeEvents";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";

const EVENT_TYPES: { value: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "home_purchase", label: "Home purchase", icon: Home },
  { value: "property_sale", label: "Property sale", icon: Home },
  { value: "child", label: "New child", icon: Baby },
  { value: "marriage", label: "Marriage", icon: Heart },
  { value: "salary_change", label: "Salary change", icon: Briefcase },
  { value: "retirement", label: "Retirement", icon: Landmark },
  { value: "semi_retirement", label: "Semi-retirement", icon: Landmark },
  { value: "inheritance", label: "Inheritance", icon: Sparkles },
  { value: "large_expense", label: "Large expense", icon: TrendingDown },
  { value: "investment_contribution", label: "Investment contribution", icon: TrendingUp },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "move_abroad", label: "Move abroad", icon: Globe },
  { value: "business_acquisition", label: "Buy a business", icon: Briefcase },
  { value: "business_sale", label: "Sell a business", icon: Briefcase },
  { value: "custom", label: "Custom", icon: Sparkles },
];

const EFFECT_KINDS: { value: string; label: string }[] = [
  { value: "cash_delta", label: "One-off cash impact" },
  { value: "recurring_income", label: "Recurring income" },
  { value: "recurring_expense", label: "Recurring expense" },
  { value: "asset_delta", label: "Asset change" },
  { value: "liability_delta", label: "Liability change" },
  { value: "salary_delta", label: "Salary change" },
  { value: "pension_contribution_delta", label: "Pension contribution" },
];

const STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const iconForType = (type: string) =>
  EVENT_TYPES.find((t) => t.value === type)?.icon ?? Sparkles;

const labelForType = (type: string) =>
  EVENT_TYPES.find((t) => t.value === type)?.label ?? type;

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);

interface EditorState {
  id?: string;
  title: string;
  event_type: string;
  event_date: string;
  probability: number;
  status: string;
  notes: string;
  profile_id: string | null;
  effects: (EffectInput & { _key: string })[];
}

const emptyEditor = (): EditorState => ({
  title: "",
  event_type: "custom",
  event_date: format(new Date(), "yyyy-MM-dd"),
  probability: 1,
  status: "planned",
  notes: "",
  profile_id: null,
  effects: [],
});

function fromEvent(e: LifeEventWithEffects): EditorState {
  return {
    id: e.id,
    title: e.title,
    event_type: e.event_type,
    event_date: e.event_date,
    probability: Number(e.probability),
    status: e.status,
    notes: e.notes ?? "",
    profile_id: e.profile_id ?? null,
    effects: (e.effects ?? []).map((ef, i) => ({
      _key: `${ef.id}-${i}`,
      kind: ef.kind,
      amount: Number(ef.amount),
      frequency: ef.frequency ?? null,
      start_year: ef.start_year,
      end_year: ef.end_year ?? null,
      label: ef.label,
    })),
  };
}

export default function LifeEventsPage() {
  const { data: events = [], isLoading } = useLifeEvents();
  const { data: profiles = [] } = useHouseholdProfiles();
  const upsert = useUpsertLifeEvent();
  const remove = useDeleteLifeEvent();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(emptyEditor());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<number, LifeEventWithEffects[]>();
    for (const e of events) {
      const year = new Date(e.event_date).getFullYear();
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [events]);

  const openCreate = () => {
    setEditor(emptyEditor());
    setEditorOpen(true);
  };

  const openEdit = (e: LifeEventWithEffects) => {
    setEditor(fromEvent(e));
    setEditorOpen(true);
  };

  const addEffect = () => {
    const startYear = new Date(editor.event_date).getFullYear();
    setEditor((s) => ({
      ...s,
      effects: [
        ...s.effects,
        {
          _key: `new-${Date.now()}-${s.effects.length}`,
          kind: "cash_delta",
          amount: 0,
          frequency: "one_off",
          start_year: startYear,
          end_year: null,
          label: "",
        },
      ],
    }));
  };

  const updateEffect = (key: string, patch: Partial<EffectInput>) => {
    setEditor((s) => ({
      ...s,
      effects: s.effects.map((e) => (e._key === key ? { ...e, ...patch } : e)),
    }));
  };

  const removeEffect = (key: string) => {
    setEditor((s) => ({ ...s, effects: s.effects.filter((e) => e._key !== key) }));
  };

  const save = () => {
    if (!editor.title.trim()) return;
    const payload: LifeEventInput & { id?: string } = {
      id: editor.id,
      title: editor.title.trim(),
      event_type: editor.event_type,
      event_date: editor.event_date,
      probability: Math.max(0, Math.min(1, editor.probability)),
      status: editor.status,
      notes: editor.notes.trim() || null,
      profile_id: editor.profile_id,
      effects: editor.effects.map(({ _key, ...rest }) => rest),
    };
    upsert.mutate(payload, {
      onSuccess: () => setEditorOpen(false),
    });
  };

  const doDelete = () => {
    if (!confirmDeleteId) return;
    remove.mutate(confirmDeleteId, {
      onSuccess: () => setConfirmDeleteId(null),
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 md:px-8 md:pt-12">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Household journey
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Life events
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Capture the moments that will shape your finances — buying a home, a new child, retirement.
            Each event can carry financial effects that feed your plan.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start md:self-auto">
          <Plus className="h-4 w-4" />
          Add event
        </Button>
      </header>

      {isLoading ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading your life events…
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
          <CalendarDays className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Your timeline is empty</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Add your first life event to start mapping out how the future affects your wealth.
          </p>
          <Button onClick={openCreate} className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Add your first event
          </Button>
        </div>
      ) : (
        <div className="relative pl-6 md:pl-8">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border md:left-3" />
          {grouped.map(([year, yearEvents]) => (
            <section key={year} className="mb-10">
              <div className="mb-4 flex items-center gap-3">
                <span className="relative -ml-6 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background md:-ml-8">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </span>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">{year}</h2>
                <span className="text-xs text-muted-foreground">
                  {yearEvents.length} event{yearEvents.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="space-y-3">
                {yearEvents
                  .slice()
                  .sort((a, b) => a.event_date.localeCompare(b.event_date))
                  .map((e) => {
                    const Icon = iconForType(e.event_type);
                    const owner = profiles.find((p) => p.id === e.profile_id)?.name;
                    return (
                      <article
                        key={e.id}
                        className={cn(
                          "group rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-[0_18px_40px_-30px_rgba(0,4,17,0.35)] md:p-5",
                          e.status === "cancelled" && "opacity-60"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-foreground">{e.title}</h3>
                              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                                {labelForType(e.event_type)}
                              </Badge>
                              {e.status !== "planned" && (
                                <Badge
                                  variant={e.status === "confirmed" ? "default" : "outline"}
                                  className="text-[10px] uppercase tracking-wide"
                                >
                                  {e.status}
                                </Badge>
                              )}
                              {Number(e.probability) < 1 && (
                                <span className="text-[11px] text-muted-foreground">
                                  {Math.round(Number(e.probability) * 100)}% likely
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {format(parseISO(e.event_date), "d MMM yyyy")}
                              {owner ? ` · ${owner}` : ""}
                            </p>
                            {e.notes && (
                              <p className="mt-2 text-sm text-muted-foreground">{e.notes}</p>
                            )}
                            {e.effects && e.effects.length > 0 && (
                              <ul className="mt-3 space-y-1">
                                {e.effects.map((ef) => (
                                  <li
                                    key={ef.id}
                                    className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-1.5 text-xs"
                                  >
                                    <span className="truncate text-foreground">
                                      {ef.label || EFFECT_KINDS.find((k) => k.value === ef.kind)?.label}
                                    </span>
                                    <span
                                      className={cn(
                                        "font-medium tabular-nums",
                                        Number(ef.amount) < 0 ? "text-destructive" : "text-foreground"
                                      )}
                                    >
                                      {gbp(Number(ef.amount))}
                                      {ef.frequency && ef.frequency !== "one_off"
                                        ? ` / ${ef.frequency === "monthly" ? "mo" : "yr"}`
                                        : ""}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(e)}
                              aria-label="Edit event"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmDeleteId(e.id)}
                              aria-label="Delete event"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      )}

      <ResponsiveDialog open={editorOpen} onOpenChange={setEditorOpen}>
        <ResponsiveDialogContent className="sm:max-w-2xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {editor.id ? "Edit life event" : "Add a life event"}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Describe the event and any financial effects it will have.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="space-y-5 px-1 pt-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editor.title}
                  onChange={(e) => setEditor((s) => ({ ...s, title: e.target.value }))}
                  placeholder="e.g. Buy first flat"
                />
              </div>

              <div>
                <Label>Type</Label>
                <Select
                  value={editor.event_type}
                  onValueChange={(v) => setEditor((s) => ({ ...s, event_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="event_date">Date</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={editor.event_date}
                  onChange={(e) => setEditor((s) => ({ ...s, event_date: e.target.value }))}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={editor.status}
                  onValueChange={(v) => setEditor((s) => ({ ...s, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="probability">Probability</Label>
                <Input
                  id="probability"
                  type="number"
                  step="0.05"
                  min={0}
                  max={1}
                  value={editor.probability}
                  onChange={(e) =>
                    setEditor((s) => ({ ...s, probability: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <Label>Who does this involve?</Label>
                <Select
                  value={editor.profile_id ?? "__none__"}
                  onValueChange={(v) =>
                    setEditor((s) => ({ ...s, profile_id: v === "__none__" ? null : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Whole household" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Whole household</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editor.notes}
                  onChange={(e) => setEditor((s) => ({ ...s, notes: e.target.value }))}
                  placeholder="Anything worth remembering about this event"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Financial effects</h3>
                  <p className="text-xs text-muted-foreground">
                    Amounts feed your plan projections. Use negatives for outflows.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={addEffect} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add effect
                </Button>
              </div>

              {editor.effects.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  No financial effects yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {editor.effects.map((ef) => (
                    <div
                      key={ef._key}
                      className="rounded-xl border border-border bg-background p-3"
                    >
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                        <div className="col-span-2 md:col-span-2">
                          <Label className="text-[11px]">Label</Label>
                          <Input
                            value={ef.label}
                            onChange={(e) => updateEffect(ef._key, { label: e.target.value })}
                            placeholder="e.g. Deposit"
                          />
                        </div>
                        <div className="col-span-2 md:col-span-2">
                          <Label className="text-[11px]">Kind</Label>
                          <Select
                            value={ef.kind}
                            onValueChange={(v) => updateEffect(ef._key, { kind: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EFFECT_KINDS.map((k) => (
                                <SelectItem key={k.value} value={k.value}>
                                  {k.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[11px]">Amount (£)</Label>
                          <Input
                            type="number"
                            value={ef.amount}
                            onChange={(e) =>
                              updateEffect(ef._key, { amount: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-[11px]">Frequency</Label>
                          <Select
                            value={ef.frequency ?? "one_off"}
                            onValueChange={(v) => updateEffect(ef._key, { frequency: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="one_off">One-off</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[11px]">Start year</Label>
                          <Input
                            type="number"
                            value={ef.start_year}
                            onChange={(e) =>
                              updateEffect(ef._key, { start_year: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-[11px]">End year</Label>
                          <Input
                            type="number"
                            value={ef.end_year ?? ""}
                            onChange={(e) =>
                              updateEffect(ef._key, {
                                end_year: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            placeholder="—"
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEffect(ef._key)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 md:flex-row md:justify-end">
              <Button variant="ghost" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={upsert.isPending || !editor.title.trim()}>
                {upsert.isPending ? "Saving…" : editor.id ? "Save changes" : "Create event"}
              </Button>
            </div>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this life event?</AlertDialogTitle>
            <AlertDialogDescription>
              This also removes its financial effects. You can't undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
