import { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pl-56 transition-all duration-300">
        <div className="mx-auto max-w-[1280px] px-6 py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
