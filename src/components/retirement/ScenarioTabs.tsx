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
    <div className="flex items-center gap-2 flex-wrap">
      {scenarios.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={cn(
            "group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            activeId === s.id
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-card-foreground border border-transparent"
          )}
        >
          {s.name}
          {scenarios.length > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onDelete(s.id);
              }}
              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </button>
      ))}

      {scenarios.length < 3 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-card-foreground">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span className="text-[11px]">Add</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
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
          className="h-7 px-3 text-[11px] ml-auto"
          onClick={onToggleCompare}
        >
          <Copy className="w-3 h-3 mr-1.5" />
          {compareMode ? "Exit Compare" : "Compare"}
        </Button>
      )}
    </div>
  );
}
