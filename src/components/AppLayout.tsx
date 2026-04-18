import { ReactNode } from "react";
import { useSidebarCollapse } from "@/contexts/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { collapsed } = useSidebarCollapse();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <main className={cn(
        "transition-all duration-300",
        isMobile ? "pl-0 pt-20" : collapsed ? "pl-20" : "pl-56"
      )}>
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}
