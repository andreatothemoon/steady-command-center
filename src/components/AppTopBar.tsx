import { NavLink } from "react-router-dom";
import { ChevronRight, Sparkles, Plus } from "lucide-react";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import { cn } from "@/lib/utils";

export default function AppTopBar() {
  const { data: profiles = [] } = useHouseholdProfiles();
  const adults = profiles.filter((p) => p.role === "adult");
  const initials =
    adults.length > 0
      ? adults.map((p) => p.name.charAt(0).toUpperCase()).join("").slice(0, 2)
      : "?";
  const name =
    adults.length > 0 ? adults.map((p) => p.name).join(" & ") : "My Household";

  return (
    <div className="flex items-center justify-end gap-2 pb-6">
      <NavLink
        to="/actions"
        className={cn(
          "hidden items-center gap-1.5 rounded-full bg-secondary/80 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary sm:inline-flex",
        )}
      >
        <Sparkles className="h-4 w-4 text-primary" />
        Actions
      </NavLink>
      <NavLink
        to="/wealth"
        className="hidden items-center gap-1.5 rounded-full bg-secondary/80 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary sm:inline-flex"
      >
        <Plus className="h-4 w-4 text-primary" />
        Add
      </NavLink>
      <NavLink
        to="/profile"
        aria-label={`Open profile for ${name}`}
        className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-2 py-1.5 pr-3 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)] transition-colors hover:bg-secondary/50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-foreground">
          {initials}
        </span>
        <span className="max-w-[10rem] truncate text-sm font-medium text-foreground">
          {name}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </NavLink>
    </div>
  );
}
