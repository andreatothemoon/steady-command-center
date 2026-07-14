import { NavLink, useLocation } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useApprovalStatus";
import {
  Home,
  Compass,
  LineChart,
  Wallet,
  Network,
  Zap,
  Receipt,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarCollapse } from "@/contexts/SidebarContext";

import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/plan", label: "Plan", icon: Compass },
  { to: "/retirement", label: "Retirement", icon: LineChart },
  { to: "/wealth", label: "Assets", icon: Wallet },
  { to: "/wealth-map", label: "Wealth map", icon: Network },
  { to: "/actions", label: "Actions", icon: Zap },
  { to: "/tax", label: "Tax", icon: Receipt },
];

function SidebarContent({ collapsed, toggle, onNavigate }: { collapsed: boolean; toggle: () => void; onNavigate?: () => void }) {
  const location = useLocation();
  const { data: isAdmin } = useIsAdmin();

  return (
    <>
      <div className={cn("flex h-24 items-center border-b border-sidebar-border/70", collapsed ? "justify-center px-4" : "px-5")}>
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#0B0F14] shadow-[0_14px_28px_-20px_rgba(0,4,17,0.45)]">
          <svg viewBox="0 0 64 64" className="h-6 w-6" fill="none">
            <path d="M8 14 L20 50 L32 28 L44 50 L56 14" stroke="#F9FAFB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="ml-3">
            <span className="text-[15px] font-semibold tracking-tight text-sidebar-accent-foreground">
              WealthOS
            </span>
            <p className="mt-0.5 text-[11px] text-sidebar-foreground">Planning workspace</p>
          </div>
        )}
      </div>

      <div className={cn("pt-4", collapsed ? "px-2" : "px-4")}>
        {!collapsed && (
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/75">
            Navigation
          </p>
        )}
      </div>

      <nav className={cn("flex-1", collapsed ? "px-2 space-y-3" : "px-3 space-y-2")}>
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                collapsed ? "flex flex-col items-center gap-1 rounded-xl p-2.5 text-[11px] transition-all" : "nav-item",
                isActive
                  ? collapsed
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "nav-item-active"
                  : collapsed
                    ? "text-sidebar-foreground hover:bg-background hover:text-sidebar-accent-foreground"
                    : "nav-item-inactive"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-2 p-3">
        {isAdmin && (
          <NavLink
            to="/admin/approvals"
            onClick={onNavigate}
            className={cn(
              collapsed ? "flex flex-col items-center gap-1 rounded-xl p-2.5 text-[11px] transition-all" : "nav-item",
              location.pathname === "/admin/approvals"
                ? collapsed
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "nav-item-active"
                : collapsed
                  ? "text-sidebar-foreground hover:bg-background hover:text-sidebar-accent-foreground"
                  : "nav-item-inactive"
            )}
            title={collapsed ? "Approvals" : undefined}
          >
            <Shield className="h-[18px] w-[18px] flex-shrink-0" />
            <span>Approvals</span>
          </NavLink>
        )}

        {!onNavigate && (
          <button
            onClick={toggle}
            className={cn(
              collapsed
                ? "flex w-full flex-col items-center gap-1 rounded-xl p-2.5 text-[11px] text-sidebar-foreground transition-all hover:bg-background hover:text-sidebar-accent-foreground"
                : "nav-item-inactive w-full justify-center"
            )}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <>
                <ChevronRight className="h-4 w-4" />
                <span>More</span>
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}

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
          className="fixed top-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card shadow-[0_10px_30px_-18px_rgba(15,23,42,0.18)]"
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
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border transition-all duration-300 shadow-[0_18px_40px_-34px_rgba(0,4,17,0.22)]",
        collapsed ? "w-20" : "w-56"
      )}
      style={{ background: "hsl(var(--sidebar-background))" }}
    >
      <SidebarContent collapsed={collapsed} toggle={toggle} />
    </aside>
  );
}
