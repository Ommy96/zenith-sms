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
import ExamGradeEntry from "./pages/ExamGradeEntry";
import CbcAssessment from "./pages/CbcAssessment";
import ReportCards from "./pages/ReportCards";
import Timetable from "./pages/Timetable";
import SchemesOfWork from "./pages/SchemesOfWork";
import LessonPlans from "./pages/LessonPlans";
import Attendance from "./pages/Attendance";
import Staff from "./pages/Staff";
import StaffProfile from "./pages/StaffProfile";
import Communication from "./pages/Communication";
import Messaging from "./pages/Messaging";
import Admissions from "./pages/Admissions";
import Operations from "./pages/Operations";
import Transport from "./pages/Transport";
import Discipline from "./pages/Discipline";
import Health from "./pages/Health";
import Events from "./pages/Events";
import Library from "./pages/Library";
import Inventory from "./pages/Inventory";
import Hostel from "./pages/Hostel";
import Reports from "./pages/Reports";
import Documents from "./pages/Documents";
import Copilot from "./pages/Copilot";
import FeeRisk from "./pages/FeeRisk";
import OcrGrader from "./pages/OcrGrader";
import AdmissionScreener from "./pages/AdmissionScreener";
import FaceAttendance from "./pages/FaceAttendance";
import NemisPage from "./pages/integrations/Nemis";
import TscPage from "./pages/integrations/Tsc";
import StatutoryFilingsPage from "./pages/integrations/StatutoryFilings";
import UgandaPage from "./pages/integrations/Uganda";
import TanzaniaPage from "./pages/integrations/Tanzania";
import RwandaPage from "./pages/integrations/Rwanda";
import EthiopiaPage from "./pages/integrations/Ethiopia";
import SettingsPage from "./pages/Settings";
import SchoolSetup from "./pages/SchoolSetup";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import { PortalProvider } from "@/contexts/PortalContext";
import { PortalLayout } from "@/components/portal/PortalLayout";
import PortalLogin from "./pages/portal/PortalLogin";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalFees from "./pages/portal/PortalFees";
import PortalAcademics from "./pages/portal/PortalAcademics";
import PortalMessages from "./pages/portal/PortalMessages";
import PortalProfile from "./pages/portal/PortalProfile";
import PortalCalendar from "./pages/portal/PortalCalendar";
import PortalAnnouncements from "./pages/portal/PortalAnnouncements";
import PortalNotifications from "./pages/portal/PortalNotifications";
import PortalStudyBuddy from "./pages/portal/PortalStudyBuddy";

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

function PortalProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/portal/login" replace />;
  return (
    <PortalProvider>
      <PortalLayout>{children}</PortalLayout>
    </PortalProvider>
  );
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

      {/* Parent Portal */}
      <Route path="/portal/login" element={<PortalLogin />} />
      <Route path="/portal" element={<PortalProtectedRoute><PortalDashboard /></PortalProtectedRoute>} />
      <Route path="/portal/fees" element={<PortalProtectedRoute><PortalFees /></PortalProtectedRoute>} />
      <Route path="/portal/academics" element={<PortalProtectedRoute><PortalAcademics /></PortalProtectedRoute>} />
      <Route path="/portal/messages" element={<PortalProtectedRoute><PortalMessages /></PortalProtectedRoute>} />
      <Route path="/portal/profile" element={<PortalProtectedRoute><PortalProfile /></PortalProtectedRoute>} />
      <Route path="/portal/calendar" element={<PortalProtectedRoute><PortalCalendar /></PortalProtectedRoute>} />
      <Route path="/portal/announcements" element={<PortalProtectedRoute><PortalAnnouncements /></PortalProtectedRoute>} />
      <Route path="/portal/notifications" element={<PortalProtectedRoute><PortalNotifications /></PortalProtectedRoute>} />
      <Route path="/portal/study-buddy" element={<PortalProtectedRoute><PortalStudyBuddy /></PortalProtectedRoute>} />

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
      <Route path="/examinations/:examId/entry" element={<ProtectedRoute><DashboardLayout><ExamGradeEntry /></DashboardLayout></ProtectedRoute>} />
      <Route path="/cbc/assess" element={<ProtectedRoute><DashboardLayout><CbcAssessment /></DashboardLayout></ProtectedRoute>} />
      <Route path="/report-cards" element={<ProtectedRoute><DashboardLayout><ReportCards /></DashboardLayout></ProtectedRoute>} />
      <Route path="/timetable" element={<ProtectedRoute><DashboardLayout><Timetable /></DashboardLayout></ProtectedRoute>} />
      <Route path="/schemes" element={<ProtectedRoute><DashboardLayout><SchemesOfWork /></DashboardLayout></ProtectedRoute>} />
      <Route path="/lesson-plans" element={<ProtectedRoute><DashboardLayout><LessonPlans /></DashboardLayout></ProtectedRoute>} />
      <Route path="/fees" element={<ProtectedRoute><DashboardLayout><Finance /></DashboardLayout></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><DashboardLayout><Finance /></DashboardLayout></ProtectedRoute>} />
      <Route path="/finance-reports" element={<ProtectedRoute><DashboardLayout><Finance /></DashboardLayout></ProtectedRoute>} />
      <Route path="/finance/mobile-money" element={<ProtectedRoute><DashboardLayout><MobileMoney /></DashboardLayout></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><DashboardLayout><Communication /></DashboardLayout></ProtectedRoute>} />
      <Route path="/messaging" element={<ProtectedRoute><DashboardLayout><Messaging /></DashboardLayout></ProtectedRoute>} />
      <Route path="/communication/whatsapp" element={<ProtectedRoute><DashboardLayout><WhatsApp /></DashboardLayout></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute><DashboardLayout><Staff /></DashboardLayout></ProtectedRoute>} />
      <Route path="/staff/:id" element={<ProtectedRoute><DashboardLayout><StaffProfile /></DashboardLayout></ProtectedRoute>} />
      <Route path="/transport" element={<ProtectedRoute><DashboardLayout><Transport /></DashboardLayout></ProtectedRoute>} />
      <Route path="/library" element={<ProtectedRoute><DashboardLayout><Library /></DashboardLayout></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><DashboardLayout><Inventory /></DashboardLayout></ProtectedRoute>} />
      <Route path="/discipline" element={<ProtectedRoute><DashboardLayout><Discipline /></DashboardLayout></ProtectedRoute>} />
      <Route path="/health" element={<ProtectedRoute><DashboardLayout><Health /></DashboardLayout></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><DashboardLayout><Events /></DashboardLayout></ProtectedRoute>} />
      <Route path="/hostel" element={<ProtectedRoute><DashboardLayout><Hostel /></DashboardLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DashboardLayout><Documents /></DashboardLayout></ProtectedRoute>} />
      <Route path="/copilot" element={<ProtectedRoute><DashboardLayout><Copilot /></DashboardLayout></ProtectedRoute>} />
      <Route path="/fees/risk" element={<ProtectedRoute><DashboardLayout><FeeRisk /></DashboardLayout></ProtectedRoute>} />
      <Route path="/examinations/ocr" element={<ProtectedRoute><DashboardLayout><OcrGrader /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admissions/screener" element={<ProtectedRoute><DashboardLayout><AdmissionScreener /></DashboardLayout></ProtectedRoute>} />
      <Route path="/attendance/face" element={<ProtectedRoute><DashboardLayout><FaceAttendance /></DashboardLayout></ProtectedRoute>} />
      <Route path="/integrations/nemis" element={<ProtectedRoute><DashboardLayout><NemisPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/integrations/tsc" element={<ProtectedRoute><DashboardLayout><TscPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/integrations/uganda" element={<ProtectedRoute><DashboardLayout><UgandaPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/integrations/tanzania" element={<ProtectedRoute><DashboardLayout><TanzaniaPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/integrations/rwanda" element={<ProtectedRoute><DashboardLayout><RwandaPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/integrations/ethiopia" element={<ProtectedRoute><DashboardLayout><EthiopiaPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/compliance/statutory" element={<ProtectedRoute><DashboardLayout><StatutoryFilingsPage /></DashboardLayout></ProtectedRoute>} />
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
