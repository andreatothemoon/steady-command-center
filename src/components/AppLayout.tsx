import { ReactNode } from "react";
import { useSidebarCollapse } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { collapsed } = useSidebarCollapse();

  return (
    <div className="min-h-screen bg-background">
      <main className={cn("transition-all duration-300", collapsed ? "pl-[68px]" : "pl-56")}>
        <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
