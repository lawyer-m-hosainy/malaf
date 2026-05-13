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

import { mockTasks, mockTeamMembers } from "@/mocks/data";

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



// Enterprise Modules

const OnboardingFlow = lazy(() => import("./modules/onboarding/OnboardingFlow"));

const GlobalAdmin = lazy(() => import("./modules/admin/GlobalAdmin"));



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



export default function App() {

  const setClients = useClientsStore(state => state.setClients);

  const setCases = useCasesStore(state => state.setCases);

  const setTeamMembers = useTeamStore(state => state.setTeamMembers);

  const setTasks = useTeamStore(state => state.setTasks);

  const loadInvoices = useInvoicesStore(state => state.loadInvoices);

  const setTrustAccounts = useFinanceStore(state => state.setTrustAccounts);

  const setEnforcementCases = useEnforcementStore(state => state.setEnforcementCases);



  useEffect(() => {

    // R9: Fetching only essential dashboard data will be handled by the Dashboard component

    // to avoid loading everything on initial app load.

  }, []);



  return "HELLO WORLD - SIMPLE TEST";

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



