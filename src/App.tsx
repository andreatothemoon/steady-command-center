import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useApprovalStatus, useIsAdmin } from "@/hooks/useApprovalStatus";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/components/AppLayout";
import HomePage from "@/pages/HomePage";
import PlanPage from "@/pages/PlanPage";
import WealthPage from "@/pages/WealthPage";
import ActionsPage from "@/pages/ActionsPage";
import ProfilePage from "@/pages/ProfilePage";
import AuthPage from "@/pages/AuthPage";
import AcceptInvitePage from "@/pages/AcceptInvitePage";
import PendingApprovalPage from "@/pages/PendingApprovalPage";
import AdminApprovalsPage from "@/pages/AdminApprovalsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const { data: approvalStatus, isLoading: approvalLoading } = useApprovalStatus();
  const { data: isAdmin } = useIsAdmin();

  if (loading || approvalLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border border-border bg-card animate-pulse" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (approvalStatus && approvalStatus !== "approved") {
    return <PendingApprovalPage />;
  }

  return (
    <SidebarProvider>
      <div>
        <AppSidebar />
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/wealth" element={<WealthPage />} />
            <Route path="/actions" element={<ActionsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {isAdmin && (
              <Route path="/admin/approvals" element={<AdminApprovalsPage />} />
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </div>
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
            <Route path="/invite/:token" element={<AcceptInvitePage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
