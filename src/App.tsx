import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import { DashboardLayout } from "./components/DashboardLayout";
import { lazy, Suspense } from "react";
import { ConsentBanner } from "@/components/ConsentBanner";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import { PortalProvider } from "@/contexts/PortalContext";
import { PortalLayout } from "@/components/portal/PortalLayout";
import PortalLogin from "./pages/portal/PortalLogin";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TwoFactorGate } from "@/components/auth/TwoFactorGate";

const Landing = lazy(() => import("./pages/Landing"));
// Lazy-loaded admin pages (code splitting)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Students = lazy(() => import("./pages/Students"));
const StudentsImport = lazy(() => import("./pages/StudentsImport"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const StudentEdit = lazy(() => import("./pages/StudentEdit"));
const AdmissionWizard = lazy(() => import("./pages/AdmissionWizard"));
const Finance = lazy(() => import("./pages/Finance"));
const MobileMoney = lazy(() => import("./pages/MobileMoney"));
const WhatsApp = lazy(() => import("./pages/WhatsApp"));
const Academics = lazy(() => import("./pages/Academics"));
const Examinations = lazy(() => import("./pages/Examinations"));
const ExamGradeEntry = lazy(() => import("./pages/ExamGradeEntry"));
const CbcAssessment = lazy(() => import("./pages/CbcAssessment"));
const ReportCards = lazy(() => import("./pages/ReportCards"));
const Timetable = lazy(() => import("./pages/Timetable"));
const SchemesOfWork = lazy(() => import("./pages/SchemesOfWork"));
const LessonPlans = lazy(() => import("./pages/LessonPlans"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Staff = lazy(() => import("./pages/Staff"));
const StaffProfile = lazy(() => import("./pages/StaffProfile"));
const Communication = lazy(() => import("./pages/Communication"));
const Messaging = lazy(() => import("./pages/Messaging"));
const Admissions = lazy(() => import("./pages/Admissions"));
const Transport = lazy(() => import("./pages/Transport"));
const TransportLive = lazy(() => import("./pages/TransportLive"));
const Driver = lazy(() => import("./pages/Driver"));
const Discipline = lazy(() => import("./pages/Discipline"));
const Health = lazy(() => import("./pages/Health"));
const Events = lazy(() => import("./pages/Events"));
const Library = lazy(() => import("./pages/Library"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Hostel = lazy(() => import("./pages/Hostel"));
const Reports = lazy(() => import("./pages/Reports"));
const Documents = lazy(() => import("./pages/Documents"));
const Copilot = lazy(() => import("./pages/Copilot"));
const FeeRisk = lazy(() => import("./pages/FeeRisk"));
const OcrGrader = lazy(() => import("./pages/OcrGrader"));
const AdmissionScreener = lazy(() => import("./pages/AdmissionScreener"));
const FaceAttendance = lazy(() => import("./pages/FaceAttendance"));
const NemisPage = lazy(() => import("./pages/integrations/Nemis"));
const TscPage = lazy(() => import("./pages/integrations/Tsc"));
const StatutoryFilingsPage = lazy(() => import("./pages/integrations/StatutoryFilings"));
const UgandaPage = lazy(() => import("./pages/integrations/Uganda"));
const TanzaniaPage = lazy(() => import("./pages/integrations/Tanzania"));
const RwandaPage = lazy(() => import("./pages/integrations/Rwanda"));
const EthiopiaPage = lazy(() => import("./pages/integrations/Ethiopia"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const SchoolSetup = lazy(() => import("./pages/SchoolSetup"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const DataProtection = lazy(() => import("./pages/dpa/DataProtection"));
const SubjectRequests = lazy(() => import("./pages/dpa/SubjectRequests"));
const ErasureRequests = lazy(() => import("./pages/dpa/ErasureRequests"));
const Policies = lazy(() => import("./pages/dpa/Policies"));
const AuditReports = lazy(() => import("./pages/compliance/AuditReports"));
const ExamBodies = lazy(() => import("./pages/compliance/ExamBodies"));
const Billing = lazy(() => import("./pages/Billing"));
const SuperAdminTenants = lazy(() => import("./pages/admin/SuperAdminTenants"));
const SuperAdminAudit = lazy(() => import("./pages/admin/SuperAdminAudit"));
const TwoFactorPage = lazy(() => import("./pages/settings/TwoFactor"));

// Lazy-loaded parent portal pages
const PortalDashboard = lazy(() => import("./pages/portal/PortalDashboard"));
const PortalFees = lazy(() => import("./pages/portal/PortalFees"));
const PortalAcademics = lazy(() => import("./pages/portal/PortalAcademics"));
const PortalMessages = lazy(() => import("./pages/portal/PortalMessages"));
const PortalProfile = lazy(() => import("./pages/portal/PortalProfile"));
const PortalCalendar = lazy(() => import("./pages/portal/PortalCalendar"));
const PortalAnnouncements = lazy(() => import("./pages/portal/PortalAnnouncements"));
const PortalNotifications = lazy(() => import("./pages/portal/PortalNotifications"));
const PortalStudyBuddy = lazy(() => import("./pages/portal/PortalStudyBuddy"));

// Tuned cache defaults — fewer redundant refetches on focus/navigation.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function TenantErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-lg border border-destructive/30 bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-foreground mb-2">We couldn't load your workspace</h1>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
          <a
            href="/login"
            onClick={async (e) => { e.preventDefault(); const { supabase } = await import("@/integrations/supabase/client"); await supabase.auth.signOut(); window.location.href = "/login"; }}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Sign out
          </a>
        </div>
      </div>
    </div>
  );
}

function RequireAuth({ children, requireTenant = true }: { children: React.ReactNode; requireTenant?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();

  if (authLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!requireTenant) return <TwoFactorGate>{children}</TwoFactorGate>;
  if (tenantLoading) return <FullPageSpinner />;
  if (tenantError) return <TenantErrorScreen error={tenantError} />;
  if (!tenant) return <Navigate to="/onboarding" replace />;
  return <TwoFactorGate>{children}</TwoFactorGate>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

function PortalProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/portal/login" replace />;
  return (
    <PortalProvider>
      <PortalLayout>{children}</PortalLayout>
    </PortalProvider>
  );
}

function PublicAuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function RootRoute() {
  const { user, loading: authLoading } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  if (authLoading) return <FullPageSpinner />;
  if (!user) return <Landing />;
  if (tenantLoading) return <FullPageSpinner />;
  if (!tenant) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/app" replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Root — landing for guests, /app for authed-with-tenant, /onboarding otherwise */}
      <Route path="/" element={<RootRoute />} />

      {/* Public routes */}
      <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
      <Route path="/signup" element={<PublicAuthRoute><Signup /></PublicAuthRoute>} />
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
      <Route path="/app" element={
        <ProtectedRoute>
          <DashboardLayout><Dashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/students" element={<ProtectedRoute><DashboardLayout><Students /></DashboardLayout></ProtectedRoute>} />
      <Route path="/students/import" element={<ProtectedRoute><DashboardLayout><StudentsImport /></DashboardLayout></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute><DashboardLayout><StudentProfile /></DashboardLayout></ProtectedRoute>} />
      <Route path="/students/:id/edit" element={<ProtectedRoute><DashboardLayout><StudentEdit /></DashboardLayout></ProtectedRoute>} />
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
      <Route path="/transport/live" element={<ProtectedRoute><DashboardLayout><TransportLive /></DashboardLayout></ProtectedRoute>} />
      <Route path="/driver" element={<ProtectedRoute><Driver /></ProtectedRoute>} />
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
      <Route path="/dpa" element={<ProtectedRoute><DashboardLayout><DataProtection /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dpa/requests" element={<ProtectedRoute><DashboardLayout><SubjectRequests /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dpa/erasure" element={<ProtectedRoute><DashboardLayout><ErasureRequests /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dpa/policies" element={<ProtectedRoute><DashboardLayout><Policies /></DashboardLayout></ProtectedRoute>} />
      <Route path="/compliance/audit-reports" element={<ProtectedRoute><DashboardLayout><AuditReports /></DashboardLayout></ProtectedRoute>} />
      <Route path="/compliance/exam-bodies" element={<ProtectedRoute><DashboardLayout><ExamBodies /></DashboardLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/settings/security/2fa" element={<ProtectedRoute><DashboardLayout><TwoFactorPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/setup" element={<ProtectedRoute><DashboardLayout><SchoolSetup /></DashboardLayout></ProtectedRoute>} />
      <Route path="/onboarding" element={<RequireAuth requireTenant={false}><Onboarding /></RequireAuth>} />
      <Route path="/billing" element={<ProtectedRoute><DashboardLayout><Billing /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/tenants" element={<ProtectedRoute><DashboardLayout><SuperAdminTenants /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute><DashboardLayout><SuperAdminAudit /></DashboardLayout></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <AppRoutes />
            <ConsentBanner />
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
