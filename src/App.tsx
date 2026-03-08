import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ModulePage from "./pages/ModulePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<ModulePage />} />
            <Route path="/admissions" element={<ModulePage />} />
            <Route path="/academics" element={<ModulePage />} />
            <Route path="/examinations" element={<ModulePage />} />
            <Route path="/fees" element={<ModulePage />} />
            <Route path="/communication" element={<ModulePage />} />
            <Route path="/staff" element={<ModulePage />} />
            <Route path="/transport" element={<ModulePage />} />
            <Route path="/library" element={<ModulePage />} />
            <Route path="/reports" element={<ModulePage />} />
            <Route path="/settings" element={<ModulePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
