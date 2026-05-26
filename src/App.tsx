/**
 * @file App.tsx
 * @description Core Layout, Routing, and Security gates for Malaf Egypt SaaS Platform.
 * @sovereignty Project architected, designed, and owned by محمد الحسيني المحامي.
 * @author محمد الحسيني المحامي
 * @copyright (c) 2026. All rights reserved.
 */

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
const RootLayout = lazy(() => import("./components/layout/RootLayout").then(m => ({ default: m.RootLayout })));
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "@/store/useAuthStore";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { AppDataLoader } from "@/components/AppDataLoader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FullPageLoader } from "@/components/LoadingSpinner";

const queryClient = new QueryClient();

const Login = lazy(() => import("./views/Login"));
const AIDocumentAnalyzer = lazy(() => import('@/views/AIDocumentAnalyzer'));
const Terms = lazy(() => import('@/views/Terms'));
const Privacy = lazy(() => import("./views/Privacy"));
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
const ImportData = lazy(() => import("./views/ImportData"));
const LegalLibrary = lazy(() => import("./views/LegalLibrary"));
const LawLibrary = lazy(() => import("./views/LawLibrary"));
const Contracts = lazy(() => import("./views/Contracts"));
const Documents = lazy(() => import("./views/Documents"));
const SystemAdmin = lazy(() => import("./views/SystemAdmin"));
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
const TrustAccountsPage = lazy(() => import("./views/TrustAccountsPage"));
const PaymentPlans = lazy(() => import("./views/PaymentPlans"));
const FinancialDashboard = lazy(() => import("@/views/FinancialDashboard"));

function PermissionGate({ children, permission, fallback = <Navigate to="/dashboard" replace /> }: { children: React.ReactNode; permission: string; fallback?: React.ReactNode }) {
  const hasPermission = useAuthStore(state => state.hasPermission);
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}

/**
 * المكون الرئيسي لمنصة ملف (App).
 * يقوم بتهيئة الموجه وموفرات السياق والتحقق من الصلاحيات والوصول للمسارات المختلفة.
 * @returns {React.ReactElement} عنصر واجهة المستخدم للتطبيق
 */
export default function App() {
  return (
    // @ts-ignore - next-themes version mismatch with React 19 types
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary fallbackModule="التطبيق الرئيسي">
          <AuthProvider>

            <OfflineIndicator />
            <Toaster richColors position="top-right" />
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
                  
                  {/* Super Admin Dashboard (مخفية) */}
                  <Route path="/system-admin" element={<ProtectedRoute><SystemAdmin /></ProtectedRoute>} />
                  
                  <Route path="/dashboard" element={<ProtectedRoute><RouteLayoutWrapper /></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="clients" element={<PermissionGate permission="view_clients"><Clients /></PermissionGate>} />
                    <Route path="poa" element={<PermissionGate permission="view_clients"><POA /></PermissionGate>} />
                  <Route path="cases" element={<PermissionGate permission="view_cases"><Cases /></PermissionGate>} />
                  <Route path="roll" element={<PermissionGate permission="view_cases"><SessionsRoll /></PermissionGate>} />
                  <Route path="calendar" element={<PermissionGate permission="view_calendar"><Calendar /></PermissionGate>} />
                    <Route path="finance-dashboard" element={<PermissionGate permission="finance_basic"><FinancialDashboard /></PermissionGate>} />
                    <Route path="finance" element={<PermissionGate permission="finance_basic"><Finance /></PermissionGate>} />
                   <Route path="expenses" element={<PermissionGate permission="finance_basic"><Expenses /></PermissionGate>} />
                   <Route path="trust" element={<PermissionGate permission="finance_basic"><TrustAccountsPage /></PermissionGate>} />
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
                    <Route path="payment-plans" element={<PermissionGate permission="finance_basic"><PaymentPlans /></PermissionGate>} />
                  <Route path="clm" element={<PermissionGate permission="documents"><CLM /></PermissionGate>} />
                  <Route path="ip-operations" element={<PermissionGate permission="view_cases"><IPOperations /></PermissionGate>} />
                  <Route path="specialized-tracks" element={<PermissionGate permission="view_cases"><SpecializedTracks /></PermissionGate>} />
                  <Route path="audit-logs" element={<PermissionGate permission="org_admin"><AuditLogs /></PermissionGate>} />
                  <Route path="ai-analyzer" element={<PermissionGate permission="documents"><AIDocumentAnalyzer /></PermissionGate>} />
                  <Route path="wiki" element={<PermissionGate permission="view_wiki"><InternalWiki /></PermissionGate>} />
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
                  <Route path="invoices/eta" element={<PermissionGate permission="finance_basic"><ETAInvoicing /></PermissionGate>} />
                  <Route path="e-litigation" element={<PermissionGate permission="view_cases"><ELitigation /></PermissionGate>} />
                  <Route path="import" element={<PermissionGate permission="org_admin"><ImportData /></PermissionGate>} />
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
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function RouteLayoutWrapper() {
  return <RootLayout />;
}

function RouteLoadingFallback() {
  return <FullPageLoader text="جاري تحميل الصفحة..." />;
}
