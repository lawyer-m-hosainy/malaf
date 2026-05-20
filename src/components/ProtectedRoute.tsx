import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useAuthStore } from "@/store/useAuthStore";
import { hasRequiredRole, SystemRole } from "@/security/rbac";
import { supabase } from "@/lib/supabase";
import { TrialExpiredLockScreen } from "./TrialExpiredLockScreen";
import { InstapayCheckout } from "@/components/InstapayCheckout";
import { PLANS } from "@/modules/subscriptions/subscriptionService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const FREE_TRIAL_DAYS = 7;

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
  const orgId = currentUser?.orgId;

  const [trialExpired, setTrialExpired] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    plan: "basic" | "advanced" | "enterprise";
    amount: number;
    billingCycle: "monthly" | "yearly";
  } | null>(null);

  // Check subscription status on mount and when orgId changes
  useEffect(() => {
    if (!user || isDemoMode || !orgId) {
      setCheckingSubscription(false);
      return;
    }

    checkSubscriptionStatus();
  }, [user, orgId, isDemoMode]);

  async function checkSubscriptionStatus() {
    setCheckingSubscription(true);
    try {
      // 1. Check if there's an active paid subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end, trial_ends_at")
        .eq("organization_id", orgId)
        .in("status", ["active", "trial"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // If there's an active paid subscription, allow access
      if (sub && sub.status === "active" && sub.plan !== "free") {
        setTrialExpired(false);
        setCheckingSubscription(false);
        return;
      }

      // 2. Check trial expiry: look at the organization's created_at
      const { data: org } = await supabase
        .from("organizations")
        .select("created_at, plan")
        .eq("id", orgId)
        .single();

      if (!org) {
        setCheckingSubscription(false);
        return;
      }

      // If org has a paid plan (set by admin), allow access
      if (org.plan && org.plan !== "free") {
        setTrialExpired(false);
        setCheckingSubscription(false);
        return;
      }

      // 3. Check if trial has a specific end date
      if (sub?.trial_ends_at) {
        const trialEnd = new Date(sub.trial_ends_at);
        if (Date.now() > trialEnd.getTime()) {
          // Mark subscription as expired in DB
          await supabase
            .from("subscriptions")
            .update({ status: "expired" })
            .eq("organization_id", orgId)
            .eq("status", "trial");
          setTrialExpired(true);
          setCheckingSubscription(false);
          return;
        }
      }

      // 4. Calculate trial based on org creation date
      const orgCreatedAt = new Date(org.created_at);
      const trialEndDate = new Date(orgCreatedAt.getTime() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now > trialEndDate) {
        // Trial has expired — update status in DB if subscription row exists
        if (sub) {
          await supabase
            .from("subscriptions")
            .update({ status: "expired" })
            .eq("organization_id", orgId)
            .in("status", ["trial", "active"]);
        }
        setTrialExpired(true);
      } else {
        setTrialExpired(false);
      }
    } catch (error) {
      console.error("[ProtectedRoute] Subscription check failed:", error);
      // Fail open — don't lock out users due to network errors
      setTrialExpired(false);
    } finally {
      setCheckingSubscription(false);
    }
  }

  // --- Authentication checks ---
  if (!user && !isDemoMode) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user && isDemoMode) {
    if ((import.meta as any).env?.VITE_ENABLE_DEMO !== "true") {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const demoStartedAt = parseInt(localStorage.getItem("demoStartedAt") || "0", 10);
    const DEMO_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    if (Date.now() - demoStartedAt > DEMO_TIMEOUT_MS) {
      setTimeout(() => {
        useAuthStore.getState().setDemoMode(false);
        localStorage.removeItem("demoStartedAt");
      }, 0);
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  if (!hasRequiredRole(currentUser?.role, requiredRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  // --- Loading subscription check ---
  if (checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // --- Trial expired lockscreen (demo mode bypasses this) ---
  if (trialExpired && !isDemoMode) {
    return (
      <>
        <TrialExpiredLockScreen
          onUpgradeStart={(planKey) => {
            const plan = PLANS[planKey as keyof typeof PLANS];
            if (plan) {
              setSelectedPlan({
                plan: planKey as "basic" | "advanced" | "enterprise",
                amount: plan.priceMonthly,
                billingCycle: "monthly",
              });
              setCheckoutOpen(true);
            }
          }}
        />
        <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إتمام الاشتراك</DialogTitle>
            </DialogHeader>
            {selectedPlan && (
              <InstapayCheckout
                {...selectedPlan}
                onSuccess={() => {
                  setCheckoutOpen(false);
                  setTrialExpired(false);
                  checkSubscriptionStatus();
                }}
                onCancel={() => setCheckoutOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return <>{children}</>;
}
