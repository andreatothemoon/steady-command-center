import { NavLink, useLocation } from "react-router-dom";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import { useIsAdmin } from "@/hooks/useApprovalStatus";
import {
  LayoutDashboard,
  Wallet,
  ArrowUpDown,
  FileText,
  Receipt,
  TrendingUp,
  Building2,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarCollapse } from "@/contexts/SidebarContext";
import { usePageVisibility } from "@/contexts/PageVisibilityContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, key: null },
  { to: "/accounts", label: "Accounts", icon: Wallet, key: "accounts" as const },
  { to: "/contributions", label: "Contributions", icon: ArrowUpDown, key: "contributions" as const },
  { to: "/documents", label: "Documents", icon: FileText, key: "documents" as const },
  { to: "/tax", label: "Tax", icon: Receipt, key: "tax" as const },
  { to: "/retirement", label: "Retirement", icon: TrendingUp, key: "retirement" as const },
  { to: "/db-pensions", label: "DB Pensions", icon: Building2, key: "db-pensions" as const },
];

function SidebarContent({ collapsed, toggle, onNavigate }: { collapsed: boolean; toggle: () => void; onNavigate?: () => void }) {
  const location = useLocation();
  const { isPageVisible } = usePageVisibility();
  const { data: profiles = [] } = useHouseholdProfiles();
  const { data: isAdmin } = useIsAdmin();
  const adults = profiles.filter((p) => p.role === "adult");
  const initials = adults.length > 0
    ? adults.map((p) => p.name.charAt(0).toUpperCase()).join("")
    : "?";
  const householdLabel = adults.length > 0
    ? adults.map((p) => p.name).join(" & ")
    : "My Household";

  return (
    <>
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

      <nav className={cn("flex-1 space-y-0.5 pt-3", collapsed ? "px-2" : "px-3")}>
        {navItems.filter(({ key }) => key === null || isPageVisible(key)).map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={isActive ? "nav-item-active" : "nav-item-inactive"}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-2 p-3">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={location.pathname === "/settings" ? "nav-item-active" : "nav-item-inactive"}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin/approvals"
            onClick={onNavigate}
            className={location.pathname === "/admin/approvals" ? "nav-item-active" : "nav-item-inactive"}
            title={collapsed ? "Approvals" : undefined}
          >
            <Shield className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && <span>Approvals</span>}
          </NavLink>
        )}

        {!onNavigate && (
          <button
            onClick={toggle}
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
        )}

        <div className={cn(
          "border-t border-sidebar-border pt-3 mt-2",
          collapsed ? "flex justify-center" : ""
        )}>
          <div className={cn("flex items-center", collapsed ? "" : "gap-3 px-1")}>
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-semibold text-sidebar-accent-foreground">{initials.slice(0, 2)}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-sidebar-accent-foreground truncate">{householdLabel}</p>
                <p className="text-[11px] text-sidebar-foreground truncate">Household</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function AppSidebar() {
  const isMobile = useIsMobile();
  const { collapsed, toggle } = useSidebarCollapse();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 h-10 w-10 rounded-xl bg-sidebar flex items-center justify-center border border-sidebar-border shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-sidebar-accent-foreground" />
        </button>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-full flex-col">
              <SidebarContent collapsed={false} toggle={toggle} onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[68px]" : "w-56"
      )}
      style={{
        background: "linear-gradient(180deg, hsl(225 30% 5%) 0%, hsl(225 30% 3.5%) 100%)",
      }}
    >
      <SidebarContent collapsed={collapsed} toggle={toggle} />
    </aside>
  );
}
