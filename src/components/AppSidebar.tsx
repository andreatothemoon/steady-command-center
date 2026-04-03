import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  ArrowUpDown,
  FileText,
  Receipt,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/contributions", label: "Contributions", icon: ArrowUpDown },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/tax", label: "Tax", icon: Receipt },
  { to: "/retirement", label: "Retirement", icon: TrendingUp },
];

export default function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[68px]" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-16 items-center gap-2.5", collapsed ? "px-4 justify-center" : "px-5")}>
        <div className="h-9 w-9 rounded-xl bg-sidebar-primary/90 flex items-center justify-center flex-shrink-0">
          <span className="text-sidebar-primary-foreground font-bold text-sm">W</span>
        </div>
        {!collapsed && (
          <span className="text-sidebar-accent-foreground font-semibold text-[15px] tracking-tight">
            WealthOS
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-0.5 pt-3", collapsed ? "px-2" : "px-3")}>
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={isActive ? "nav-item-active" : "nav-item-inactive"}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="space-y-2 p-3">
        <NavLink
          to="/settings"
          className={location.pathname === "/settings" ? "nav-item-active" : "nav-item-inactive"}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="nav-item-inactive w-full justify-center"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>

        <div className={cn(
          "border-t border-sidebar-border pt-3 mt-2",
          collapsed ? "flex justify-center" : ""
        )}>
          <div className={cn("flex items-center", collapsed ? "" : "gap-3 px-1")}>
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-semibold text-sidebar-accent-foreground">JS</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-sidebar-accent-foreground truncate">
                  James & Sarah
                </p>
                <p className="text-[11px] text-sidebar-foreground truncate">Household</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
