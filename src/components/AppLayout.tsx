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
        background: `
          radial-gradient(circle at top left, hsl(145 72% 92% / 0.55), transparent 26%),
          radial-gradient(circle at top right, hsl(340 88% 92% / 0.55), transparent 24%),
          linear-gradient(180deg, hsl(36 33% 98%) 0%, hsl(28 25% 97%) 100%)
        `,
      }}
    >
      <main className={cn(
        "transition-all duration-300",
        isMobile ? "pl-0 pt-16" : collapsed ? "pl-[68px]" : "pl-56"
      )}>
        <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
