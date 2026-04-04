import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import { User, Users } from "lucide-react";

interface Props {
  value: string; // comma-separated names
  onChange: (value: string) => void;
}

export default function OwnerMultiSelect({ value, onChange }: Props) {
  const { data: profiles = [] } = useHouseholdProfiles();

  const selected = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const toggle = (name: string) => {
    const next = selected.includes(name)
      ? selected.filter((n) => n !== name)
      : [...selected, name];
    onChange(next.join(", "));
  };

  if (profiles.length === 0) {
    return <p className="text-xs text-muted-foreground">No household members found.</p>;
  }

  return (
    <div className="space-y-1.5">
      {profiles.map((p) => {
        const checked = selected.includes(p.name);
        return (
          <label
            key={p.id}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer transition-colors",
              checked ? "bg-primary/10" : "hover:bg-secondary/40"
            )}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={() => toggle(p.name)}
            />
            <div className="flex items-center gap-1.5">
              {selected.length > 1 && checked ? (
                <Users className="h-3.5 w-3.5 text-primary" />
              ) : (
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="text-sm text-foreground">{p.name}</span>
              <span className="text-[10px] text-muted-foreground capitalize">({p.role})</span>
            </div>
          </label>
        );
      })}
      {selected.length > 1 && (
        <p className="text-[10px] text-primary px-3 pt-0.5">Joint ownership</p>
      )}
    </div>
  );
}
