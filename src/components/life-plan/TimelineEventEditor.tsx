import { useEffect, useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Copy, Trash2 } from "lucide-react";
import type { PlanEvent } from "@/planning/types";
import { usePlan } from "@/planning/store/PlanContext";
import { projectScenario, diffProjections } from "@/planning/engine";
import { formatCurrency } from "@/lib/format";

interface Props {
  event: PlanEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TimelineEventEditor({ event, open, onOpenChange }: Props) {
  const { activeScenario, scenarioEvents, upsertEvent, deleteEvent, duplicateEvent, projection } = usePlan();
  const [draft, setDraft] = useState<PlanEvent | null>(event);

  useEffect(() => setDraft(event), [event]);

  if (!draft) return null;

  const year = new Date(draft.date).getFullYear();

  // Preview projection with draft substituted
  const previewEvents = scenarioEvents.map((e) => (e.id === draft.id ? draft : e));
  const previewProjection = projectScenario(activeScenario, previewEvents);
  const impact = diffProjections(projection, previewProjection);

  const changed = event ? JSON.stringify(event) !== JSON.stringify(draft) : false;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{draft.title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Event in the {activeScenario.name} scenario
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-6 px-1 pb-2">
          <div className="space-y-2">

          <Label>Title</Label>
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Year</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => {
                const y = Number(e.target.value);
                if (!Number.isFinite(y)) return;
                const iso = draft.date.replace(/^\d{4}/, String(y));
                setDraft({ ...draft, date: iso });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Probability: {Math.round(draft.probability * 100)}%</Label>
            <Slider
              value={[draft.probability * 100]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => setDraft({ ...draft, probability: v / 100 })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={draft.notes ?? ""}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="Why this matters to you…"
          />
        </div>

        {changed && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 animate-fade-in">
            <p className="text-[11px] font-medium uppercase tracking-widest text-primary">Impact of this change</p>
            <p className="mt-2 text-sm font-medium text-foreground">{impact.headline}</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <ImpactPair label="FI year" before={impact.fiYear.before} after={impact.fiYear.after} />
              <ImpactPair
                label="Monthly income"
                before={formatCurrency(impact.retirementMonthlyIncome.before)}
                after={formatCurrency(impact.retirementMonthlyIncome.after)}
              />
              <ImpactPair
                label="Confidence"
                before={`${Math.round(impact.confidence.before * 100)}%`}
                after={`${Math.round(impact.confidence.after * 100)}%`}
              />
            </div>
            {impact.mitigation && (
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Suggested mitigation:</span> {impact.mitigation}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                duplicateEvent(draft.id);
                onOpenChange(false);
              }}
            >
              <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                deleteEvent(draft.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                upsertEvent(draft);
                onOpenChange(false);
              }}
            >
              Save
            </Button>
          </div>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>

  );
}

function ImpactPair({ label, before, after }: { label: string; before: string | number; after: string | number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">
        <span className="text-muted-foreground">{before}</span>
        <span className="mx-1 text-muted-foreground">→</span>
        <span className="text-foreground">{after}</span>
      </p>
    </div>
  );
}
