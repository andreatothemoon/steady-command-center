import { ReactNode, createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

const SidebarContext = createContext({ collapsed: false });
export const useSidebarState = () => useContext(SidebarContext);

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="transition-all duration-300 pl-56 has-[aside.w-\\[68px\\]]:pl-[68px]">
        <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
