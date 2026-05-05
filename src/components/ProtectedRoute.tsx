import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useAuthStore } from "@/store/useAuthStore";
import { hasRequiredRole, SystemRole } from "@/security/rbac";

export function ProtectedRoute({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles?: SystemRole[];
}) {
  const { user } = useAuth();
  const location = useLocation();
  const currentUser = useAuthStore(state => state.currentUser);
  const isDemoMode = useAuthStore(state => state.isDemoMode);

  if (!user && !isDemoMode) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user && isDemoMode) {
    if ((import.meta as any).env?.VITE_ENABLE_DEMO !== "true") {
      // Demo mode is disabled unless explicitly enabled via environment variable
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const demoStartedAt = parseInt(localStorage.getItem("demoStartedAt") || "0", 10);
    const DEMO_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    if (Date.now() - demoStartedAt > DEMO_TIMEOUT_MS) {
      // Demo session expired
      const setDemoMode = useAuthStore.getState().setDemoMode;
      setDemoMode(false);
      localStorage.removeItem("demoStartedAt");
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  if (!hasRequiredRole(currentUser?.role, requiredRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
