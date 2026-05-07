import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RootLayout } from "./components/layout/RootLayout";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { fetchCases, fetchClients, fetchEnforcement, fetchInvoices, fetchTasks, fetchTeam, fetchTrustAccounts } from "@/services/legalDataService";
import { useAuthStore } from "@/store/useAuthStore";
import { useClientsStore } from "@/store/useClientsStore";
import { useCasesStore } from "@/store/useCasesStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useInvoicesStore } from "@/store/useInvoicesStore";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useEnforcementStore } from "@/store/useEnforcementStore";

import { getCurrentTenantId } from "@/lib/tenant";
import { checkAppHealth } from "@/observability/health";
import { logEvent } from "@/observability/logger";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";

const Login = lazy(() => import("./views/Login"));
const Landing = lazy(() => import("./views/Landing"));
const Dashboard = lazy(() => import("./views/Dashboard"));
const Clients = lazy(() => import("./views/Clients"));
const Cases = lazy(() => import("./views/Cases"));
const Finance = lazy(() => import("./views/Finance"));
const Calendar = lazy(() => import("./views/Calendar"));
const Expenses = lazy(() => import("./views/Expenses"));
const POA = lazy(() => import("./views/POA"));
const Team = lazy(() => import("./views/Team"));
const Tasks = lazy(() => import("./views/Tasks"));
const SessionsRoll = lazy(() => import("./views/SessionsRoll"));
const Analytics = lazy(() => import("./views/Analytics"));
const Settings = lazy(() => import("./views/Settings"));
const LegalLibrary = lazy(() => import("./views/LegalLibrary"));
const Contracts = lazy(() => import("./views/Contracts"));
const Documents = lazy(() => import("./views/Documents"));
const IPManagement = lazy(() => import("./views/IPManagement"));
const TimeTracking = lazy(() => import("./views/TimeTracking"));
const ClientPortal = lazy(() => import("./views/ClientPortal"));
const PortalManagement = lazy(() => import("./views/PortalManagement"));
const ConflictCheck = lazy(() => import("./views/ConflictCheck"));
const Enforcement = lazy(() => import("./views/Enforcement"));
const Collections = lazy(() => import("./views/Collections"));
const CLM = lazy(() => import("./views/CLM"));
const IPOperations = lazy(() => import("./views/IPOperations"));
const SpecializedTracks = lazy(() => import("./views/SpecializedTracks"));
const AuditLogs = lazy(() => import("./views/AuditLogs"));
const AIDocumentAnalyzer = lazy(() => import("./views/AIDocumentAnalyzer"));
const InternalWiki = lazy(() => import("./views/InternalWiki"));
const NotFound = lazy(() => import("./views/NotFound"));

// Enterprise Modules
const OnboardingFlow = lazy(() => import("./modules/onboarding/OnboardingFlow"));
const GlobalAdmin = lazy(() => import("./modules/admin/GlobalAdmin"));
const WhatsAppSettings = lazy(() => import("./pages/dashboard/WhatsAppSettings").then(m => ({ default: m.WhatsAppSettings })));
const VideoRoom = lazy(() => import("./pages/dashboard/VideoRoom"));
const VideoRoomManager = lazy(() => import("./pages/dashboard/VideoRoomManager"));
const FieldCheckins = lazy(() => import("./views/FieldCheckins"));

// Egyptian Modules
const BarAssociation = lazy(() => import("./views/BarAssociation"));
const EconomicCourt = lazy(() => import("./views/EconomicCourt"));
const StateCouncil = lazy(() => import("./views/StateCouncil"));
const RealEstateRegistry = lazy(() => import("./views/RealEstateRegistry"));
const FamilyCourts = lazy(() => import("./views/FamilyCourts"));
const CriminalCases = lazy(() => import("./views/CriminalCases"));
const ETAInvoicing = lazy(() => import("./views/ETAInvoicing"));
const ELitigation = lazy(() => import("./views/ELitigation"));
const ExpertMissions = lazy(() => import("./views/ExpertMissions"));

function PermissionGate({ children, permission, fallback = <Navigate to="/dashboard" replace /> }: { children: React.ReactNode; permission: string; fallback?: React.ReactNode }) {
  const hasPermission = useAuthStore(state => state.hasPermission);
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}

import { seedDemoData } from "@/services/seedData";

export default function App() {
  const setClients = useClientsStore(state => state.setClients);
  const setCases = useCasesStore(state => state.setCases);
  const setTeamMembers = useTeamStore(state => state.setTeamMembers);
  const setTasks = useTeamStore(state => state.setTasks);
  const loadInvoices = useInvoicesStore(state => state.loadInvoices);
  const setTrustAccounts = useFinanceStore(state => state.setTrustAccounts);
  const setEnforcementCases = useEnforcementStore(state => state.setEnforcementCases);

  useEffect(() => {
    // Check if we need to seed demo data (if clients are empty)
    const clients = useClientsStore.getState().clients;
    if (clients.length === 0) {
      seedDemoData();
    }
    
    // R9: Fetching only essential dashboard data will be handled by the Dashboard component
  }, []);

  return (
    // @ts-ignore - next-themes version mismatch with React 19 types
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ErrorBoundary fallbackModule="التطبيق الرئيسي">
        <AuthProvider>
          {(import.meta as any).env?.PROD && (
            <div className="bg-primary-600 text-white text-[10px] py-1 text-center font-bold sticky top-0 z-[100] shadow-sm select-none">
              بيئة العرض التجريبي - مَلَف (لأغراض الاستعراض فقط)
            </div>
          )}
          <Toaster richColors position="top-center" />
          <BrowserRouter>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/onboarding" element={<OnboardingFlow />} />
                <Route path="/client-portal" element={<ClientPortal />} />
                
                <Route path="/dashboard" element={<ProtectedRoute><RouteLayoutWrapper /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="poa" element={<POA />} />
                <Route path="cases" element={<Cases />} />
                <Route path="roll" element={<SessionsRoll />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="finance" element={<Finance />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="team" element={<Team />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="analytics" element={<PermissionGate permission="view_reports"><Analytics /></PermissionGate>} />
                <Route path="library" element={<LegalLibrary />} />
                <Route path="contracts" element={<Contracts />} />
                <Route path="documents" element={<Documents />} />
                <Route path="ip-management" element={<IPManagement />} />
                <Route path="time-tracking" element={<TimeTracking />} />
                <Route path="client-portal" element={<PortalManagement />} />
                <Route path="conflict-check" element={<ConflictCheck />} />
                <Route path="enforcement" element={<Enforcement />} />
                <Route path="collections" element={<Collections />} />
                <Route path="clm" element={<CLM />} />
                <Route path="ip-operations" element={<IPOperations />} />
                <Route path="specialized-tracks" element={<SpecializedTracks />} />
                <Route path="audit-logs" element={<PermissionGate permission="org_admin"><AuditLogs /></PermissionGate>} />
                <Route path="ai-analyzer" element={<AIDocumentAnalyzer />} />
                <Route path="wiki" element={<InternalWiki />} />
                <Route path="whatsapp" element={<PermissionGate permission="org_admin"><WhatsAppSettings /></PermissionGate>} />
                <Route path="video-rooms" element={<VideoRoomManager />} />
                <Route path="field-checkins" element={<FieldCheckins />} />
                <Route path="video/:caseId" element={<VideoRoom />} />
                <Route path="platform-admin" element={<PermissionGate permission="platform_admin"><GlobalAdmin /></PermissionGate>} />
                {/* Egyptian Modules */}
                <Route path="bar-association" element={<BarAssociation />} />
                <Route path="economic-court" element={<EconomicCourt />} />
                <Route path="state-council" element={<StateCouncil />} />
                <Route path="experts" element={<ExpertMissions />} />
                <Route path="real-estate-registry" element={<RealEstateRegistry />} />
                <Route path="family-courts" element={<FamilyCourts />} />
                <Route path="criminal-cases" element={<CriminalCases />} />
                <Route path="eta-invoicing" element={<ETAInvoicing />} />
                <Route path="e-litigation" element={<ELitigation />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              
              {/* Redirect old routes if needed */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
        </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

function RouteLayoutWrapper() {
  return <RootLayout />;
}

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-900">
      <span className="text-sm text-slate-500 dark:text-slate-300">جاري تحميل الصفحة...</span>
    </div>
  );
}

