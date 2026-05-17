import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { DashboardLayout } from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentsImport from "./pages/StudentsImport";
import StudentProfile from "./pages/StudentProfile";
import AdmissionWizard from "./pages/AdmissionWizard";
import Finance from "./pages/Finance";
import MobileMoney from "./pages/MobileMoney";
import WhatsApp from "./pages/WhatsApp";
import Academics from "./pages/Academics";
import Examinations from "./pages/Examinations";
import Attendance from "./pages/Attendance";
import Staff from "./pages/Staff";
import StaffProfile from "./pages/StaffProfile";
import Communication from "./pages/Communication";
import Admissions from "./pages/Admissions";
import Operations from "./pages/Operations";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import SchoolSetup from "./pages/SchoolSetup";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout><Dashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/students" element={<ProtectedRoute><DashboardLayout><Students /></DashboardLayout></ProtectedRoute>} />
      <Route path="/students/import" element={<ProtectedRoute><DashboardLayout><StudentsImport /></DashboardLayout></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute><DashboardLayout><StudentProfile /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admissions/new" element={<ProtectedRoute><DashboardLayout><AdmissionWizard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admissions" element={<ProtectedRoute><DashboardLayout><Admissions /></DashboardLayout></ProtectedRoute>} />
      <Route path="/academics" element={<ProtectedRoute><DashboardLayout><Academics /></DashboardLayout></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><DashboardLayout><Attendance /></DashboardLayout></ProtectedRoute>} />
      <Route path="/examinations" element={<ProtectedRoute><DashboardLayout><Examinations /></DashboardLayout></ProtectedRoute>} />
      <Route path="/timetable" element={<ProtectedRoute><DashboardLayout><Academics /></DashboardLayout></ProtectedRoute>} />
      <Route path="/fees" element={<ProtectedRoute><DashboardLayout><Finance /></DashboardLayout></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><DashboardLayout><Finance /></DashboardLayout></ProtectedRoute>} />
      <Route path="/finance-reports" element={<ProtectedRoute><DashboardLayout><Finance /></DashboardLayout></ProtectedRoute>} />
      <Route path="/finance/mobile-money" element={<ProtectedRoute><DashboardLayout><MobileMoney /></DashboardLayout></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><DashboardLayout><Communication /></DashboardLayout></ProtectedRoute>} />
      <Route path="/messaging" element={<ProtectedRoute><DashboardLayout><Communication /></DashboardLayout></ProtectedRoute>} />
      <Route path="/communication/whatsapp" element={<ProtectedRoute><DashboardLayout><WhatsApp /></DashboardLayout></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute><DashboardLayout><Staff /></DashboardLayout></ProtectedRoute>} />
      <Route path="/staff/:id" element={<ProtectedRoute><DashboardLayout><StaffProfile /></DashboardLayout></ProtectedRoute>} />
      <Route path="/transport" element={<ProtectedRoute><DashboardLayout><Operations /></DashboardLayout></ProtectedRoute>} />
      <Route path="/library" element={<ProtectedRoute><DashboardLayout><Operations /></DashboardLayout></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><DashboardLayout><Operations /></DashboardLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/setup" element={<ProtectedRoute><DashboardLayout><SchoolSetup /></DashboardLayout></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <AppRoutes />
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
