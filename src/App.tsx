import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import SchoolSetup from "./pages/SchoolSetup";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Finance from "./pages/Finance";
import Academics from "./pages/Academics";
import Examinations from "./pages/Examinations";
import Staff from "./pages/Staff";
import Communication from "./pages/Communication";
import Admissions from "./pages/Admissions";
import Operations from "./pages/Operations";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
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
            <Route path="/students" element={<Students />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/academics" element={<Academics />} />
            <Route path="/examinations" element={<Examinations />} />
            <Route path="/timetable" element={<Academics />} />
            <Route path="/fees" element={<Finance />} />
            <Route path="/invoices" element={<Finance />} />
            <Route path="/finance-reports" element={<Finance />} />
            <Route path="/announcements" element={<Communication />} />
            <Route path="/messaging" element={<Communication />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/transport" element={<Operations />} />
            <Route path="/library" element={<Operations />} />
            <Route path="/inventory" element={<Operations />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
