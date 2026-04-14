import { NavLink, useLocation } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useApprovalStatus";
import {
  Home,
  LineChart,
  Wallet,
  Zap,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarCollapse } from "@/contexts/SidebarContext";
import { useHouseholdProfiles } from "@/hooks/useHouseholdProfiles";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/plan", label: "Plan", icon: LineChart },
  { to: "/wealth", label: "Wealth", icon: Wallet },
  { to: "/actions", label: "Actions", icon: Zap },
  { to: "/profile", label: "Profile", icon: User },
];

function SidebarContent({ collapsed, toggle, onNavigate }: { collapsed: boolean; toggle: () => void; onNavigate?: () => void }) {
  const location = useLocation();
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
        <div className="h-10 w-10 rounded-2xl bg-sidebar-primary/15 border border-sidebar-border flex items-center justify-center flex-shrink-0">
          <span className="text-sidebar-primary font-bold text-sm">W</span>
        </div>
        {!collapsed && (
          <span className="text-sidebar-accent-foreground font-semibold text-[15px] tracking-tight">
            WealthOS
          </span>
        )}
      </div>

      <nav className={cn("flex-1 space-y-0.5 pt-3", collapsed ? "px-2" : "px-3")}>
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
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
            <div className="h-8 w-8 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center flex-shrink-0">
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
          className="fixed top-4 left-4 z-50 h-11 w-11 rounded-2xl bg-card/90 backdrop-blur-md flex items-center justify-center border border-border shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-foreground" />
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
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border transition-all duration-300 backdrop-blur-xl",
        collapsed ? "w-[68px]" : "w-56"
      )}
      style={{
        background: "linear-gradient(180deg, hsl(35 29% 98% / 0.9) 0%, hsl(28 24% 97% / 0.88) 100%)",
      }}
    >
      <SidebarContent collapsed={collapsed} toggle={toggle} />
    </aside>
  );
}
