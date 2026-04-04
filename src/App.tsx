import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { PageVisibilityProvider } from "@/contexts/PageVisibilityContext";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/components/AppLayout";
import OverviewPage from "@/pages/OverviewPage";
import AccountsPage from "@/pages/AccountsPage";
import ContributionsPage from "@/pages/ContributionsPage";
import DocumentsPage from "@/pages/DocumentsPage";
import TaxPage from "@/pages/TaxPage";
import RetirementPage from "@/pages/RetirementPage";
import SettingsPage from "@/pages/SettingsPage";
import DBPensionsPage from "@/pages/DBPensionsPage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-lg bg-primary animate-pulse" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <SidebarProvider>
      <PageVisibilityProvider>
        <div className="dark">
          <AppSidebar />
          <AppLayout>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/contributions" element={<ContributionsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/tax" element={<TaxPage />} />
              <Route path="/retirement" element={<RetirementPage />} />
              <Route path="/db-pensions" element={<DBPensionsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </div>
      </PageVisibilityProvider>
    </SidebarProvider>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
