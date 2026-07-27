import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface SubNavItem {
  to: string;
  label: string;
  end?: boolean;
}

export default function SubNav({ items }: { items: SubNavItem[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-border/60 pb-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
