import { Plus, X, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ScenarioMeta {
  id: string;
  name: string;
  isTemplate?: boolean;
}

interface Props {
  scenarios: ScenarioMeta[];
  activeId: string;
  compareMode: boolean;
  onSelect: (id: string) => void;
  onAdd: (template: "blank" | "early" | "higher") => void;
  onDelete: (id: string) => void;
  onToggleCompare: () => void;
}

const templates = [
  { key: "blank" as const, label: "Blank Scenario", desc: "Start from current values" },
  { key: "early" as const, label: "Early Retirement", desc: "Retire 5 years earlier" },
  { key: "higher" as const, label: "Higher Contributions", desc: "+50% monthly contributions" },
];

export default function ScenarioTabs({
  scenarios,
  activeId,
  compareMode,
  onSelect,
  onAdd,
  onDelete,
  onToggleCompare,
}: Props) {
  return (
    <div className="card-surface p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Scenario Workspace</p>
          <p className="mt-1 text-sm text-muted-foreground">Switch between scenarios, duplicate ideas, and compare outcomes side by side.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {scenarios.length < 3 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 rounded-2xl px-4 text-muted-foreground hover:text-card-foreground">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  <span className="text-sm">Add Scenario</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {templates.map((t) => (
                  <DropdownMenuItem key={t.key} onClick={() => onAdd(t.key)}>
                    <div>
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {scenarios.length >= 2 && (
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              className="h-10 rounded-2xl px-4 text-sm"
              onClick={onToggleCompare}
            >
              <Copy className="mr-1.5 h-3 w-3" />
              {compareMode ? "Exit Compare" : "Compare"}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              "group relative flex items-center gap-1.5 rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
              activeId === s.id
                ? "border-primary/20 bg-primary/10 text-primary shadow-[0_12px_28px_-20px_hsl(var(--primary)/0.45)]"
                : "border-transparent bg-secondary/70 text-muted-foreground hover:border-border/70 hover:bg-secondary hover:text-card-foreground"
            )}
          >
            {s.name}
            {activeId === s.id && (
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                Active
              </span>
            )}
            {scenarios.length > 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s.id);
                }}
                className="ml-1 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
