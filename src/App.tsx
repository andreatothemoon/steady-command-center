import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/components/AppLayout";
import OverviewPage from "@/pages/OverviewPage";
import AccountsPage from "@/pages/AccountsPage";
import ContributionsPage from "@/pages/ContributionsPage";
import DocumentsPage from "@/pages/DocumentsPage";
import TaxPage from "@/pages/TaxPage";
import RetirementPage from "@/pages/RetirementPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
