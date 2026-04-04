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
    <div
      className="min-h-screen bg-background"
      style={{
        background: "linear-gradient(135deg, hsl(220 27% 6%) 0%, hsl(222 28% 7.5%) 50%, hsl(220 27% 6%) 100%)",
      }}
    >
      <main className={cn(
        "transition-all duration-300",
        isMobile ? "pl-0 pt-16" : collapsed ? "pl-[68px]" : "pl-56"
      )}>
        <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}