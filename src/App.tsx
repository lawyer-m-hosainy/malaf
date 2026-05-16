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
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { AppDataLoader } from "@/components/AppDataLoader";

const Login = lazy(() => import("./views/Login"));
const AIDocumentAnalyzer = lazy(() => import('@/views/AIDocumentAnalyzer'));
const Terms = lazy(() => import('@/views/Terms'));
const Privacy = lazy(() => import('@/views/Privacy'));
const GlobalAdmin = lazy(() => import('@/views/GlobalAdmin'));
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
const LawLibrary = lazy(() => import("./views/LawLibrary"));
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
const InternalWiki = lazy(() => import("./views/InternalWiki"));
const NotFound = lazy(() => import("./views/NotFound"));
const Billing = lazy(() => import("./views/Billing"));
const Chat = lazy(() => import("./components/chat/ChatLayout"));

// Enterprise Modules
const OnboardingFlow = lazy(() => import("./modules/onboarding/OnboardingFlow"));
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
    // R8-FIX: Only seed demo data in explicit demo mode, not on every load
    const isDemoMode = useAuthStore.getState().isDemoMode;
    const isDemoEnv = (import.meta as any).env?.VITE_ENABLE_DEMO === 'true';
    const clients = useClientsStore.getState().clients;
    
    if (isDemoEnv && clients.length === 0 && isDemoMode) {
      seedDemoData();
    }
  }, []);

  return (
    // @ts-ignore - next-themes version mismatch with React 19 types
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ErrorBoundary fallbackModule="التطبيق الرئيسي">
        <AuthProvider>

          <OfflineIndicator />
          <Toaster richColors position="top-left" />
          <BrowserRouter>
            <Suspense fallback={<RouteLoadingFallback />}>
              <AppDataLoader>
                <Routes>
                  <Route path="/" element={<Landing />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/login" element={<Login />} />
                <Route path="/onboarding" element={<OnboardingFlow />} />
                <Route path="/client-portal" element={<ClientPortal />} />
                
                <Route path="/dashboard" element={<ProtectedRoute><RouteLayoutWrapper /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="clients" element={<PermissionGate permission="view_clients"><Clients /></PermissionGate>} />
                  <Route path="poa" element={<PermissionGate permission="view_clients"><POA /></PermissionGate>} />
                <Route path="cases" element={<PermissionGate permission="view_cases"><Cases /></PermissionGate>} />
                <Route path="roll" element={<PermissionGate permission="view_cases"><SessionsRoll /></PermissionGate>} />
                <Route path="calendar" element={<PermissionGate permission="view_calendar"><Calendar /></PermissionGate>} />
                <Route path="finance" element={<PermissionGate permission="finance_basic"><Finance /></PermissionGate>} />
                <Route path="expenses" element={<PermissionGate permission="finance_basic"><Expenses /></PermissionGate>} />
                <Route path="team" element={<PermissionGate permission="org_admin"><Team /></PermissionGate>} />
                <Route path="tasks" element={<PermissionGate permission="view_tasks"><Tasks /></PermissionGate>} />
                <Route path="analytics" element={<PermissionGate permission="view_reports"><Analytics /></PermissionGate>} />
                <Route path="library" element={<PermissionGate permission="view_cases"><LegalLibrary /></PermissionGate>} />
                <Route path="law-library" element={<PermissionGate permission="view_cases"><LawLibrary /></PermissionGate>} />
                <Route path="contracts" element={<PermissionGate permission="documents"><Contracts /></PermissionGate>} />
                <Route path="documents" element={<PermissionGate permission="documents"><Documents /></PermissionGate>} />
                <Route path="ip-management" element={<PermissionGate permission="view_cases"><IPManagement /></PermissionGate>} />
                <Route path="time-tracking" element={<PermissionGate permission="view_tasks"><TimeTracking /></PermissionGate>} />
                <Route path="client-portal" element={<PermissionGate permission="org_admin"><PortalManagement /></PermissionGate>} />
                <Route path="conflict-check" element={<PermissionGate permission="conflict_check"><ConflictCheck /></PermissionGate>} />
                <Route path="enforcement" element={<PermissionGate permission="view_cases"><Enforcement /></PermissionGate>} />
                <Route path="collections" element={<PermissionGate permission="finance_basic"><Collections /></PermissionGate>} />
                <Route path="clm" element={<PermissionGate permission="documents"><CLM /></PermissionGate>} />
                <Route path="ip-operations" element={<PermissionGate permission="view_cases"><IPOperations /></PermissionGate>} />
                <Route path="specialized-tracks" element={<PermissionGate permission="view_cases"><SpecializedTracks /></PermissionGate>} />
                <Route path="audit-logs" element={<PermissionGate permission="org_admin"><AuditLogs /></PermissionGate>} />
                <Route path="ai-analyzer" element={<PermissionGate permission="documents"><AIDocumentAnalyzer /></PermissionGate>} />
                <Route path="wiki" element={<PermissionGate permission="view_wiki"><InternalWiki /></PermissionGate>} />
                <Route path="chat" element={<Chat />} />
                <Route path="field-checkins" element={<PermissionGate permission="org_admin"><FieldCheckins /></PermissionGate>} />
                <Route path="platform-admin" element={<PermissionGate permission="platform_admin"><GlobalAdmin /></PermissionGate>} />
                {/* Egyptian Modules */}
                <Route path="bar-association" element={<PermissionGate permission="view_cases"><BarAssociation /></PermissionGate>} />
                <Route path="economic-court" element={<PermissionGate permission="view_cases"><EconomicCourt /></PermissionGate>} />
                <Route path="state-council" element={<PermissionGate permission="view_cases"><StateCouncil /></PermissionGate>} />
                <Route path="experts" element={<PermissionGate permission="view_cases"><ExpertMissions /></PermissionGate>} />
                <Route path="real-estate-registry" element={<PermissionGate permission="view_cases"><RealEstateRegistry /></PermissionGate>} />
                <Route path="family-courts" element={<PermissionGate permission="view_cases"><FamilyCourts /></PermissionGate>} />
                <Route path="criminal-cases" element={<PermissionGate permission="view_cases"><CriminalCases /></PermissionGate>} />
                <Route path="eta-invoicing" element={<PermissionGate permission="finance_basic"><ETAInvoicing /></PermissionGate>} />
                <Route path="e-litigation" element={<PermissionGate permission="view_cases"><ELitigation /></PermissionGate>} />
                <Route path="settings" element={<PermissionGate permission="org_admin"><Settings /></PermissionGate>} />
                <Route path="billing" element={<PermissionGate permission="org_admin"><Billing /></PermissionGate>} />
                <Route path="global-admin" element={<GlobalAdmin />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </AppDataLoader>
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

import { FullPageLoader } from "@/components/LoadingSpinner";

function RouteLoadingFallback() {
  return <FullPageLoader text="جاري تحميل الصفحة..." />;
}
