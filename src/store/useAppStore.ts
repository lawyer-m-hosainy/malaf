import { useAuthStore } from './useAuthStore';
import { useCasesStore } from './useCasesStore';
import { useClientsStore } from './useClientsStore';
import { useFinanceStore } from './useFinanceStore';
import { useTeamStore } from './useTeamStore';
import { useEnforcementStore } from './useEnforcementStore';
import { useAdvisoryStore } from './useAdvisoryStore';
import { useCLMStore } from './useCLMStore';
import { useIPStore } from './useIPStore';
import { useComplianceStore } from './useComplianceStore';
import { useUIStore } from './useUIStore';
import { useAnalyticsStore } from './useAnalyticsStore';

/**
 * @deprecated This composite store pattern causes full component re-renders whenever any unrelated domain state changes.
 * Please use individual domain stores instead (e.g., useCasesStore, useClientsStore, useAuthStore).
 */
export function useAppStore<T = any>(selector?: (state: any) => T): any {
  const auth = useAuthStore();
  const cases = useCasesStore();
  const clients = useClientsStore();
  const finance = useFinanceStore();
  const team = useTeamStore();
  const enforcement = useEnforcementStore();
  const advisory = useAdvisoryStore();
  const clm = useCLMStore();
  const ip = useIPStore();
  const compliance = useComplianceStore();
  const ui = useUIStore();
  const analytics = useAnalyticsStore();

  const combinedState = {
    ...auth,
    ...cases,
    ...clients,
    ...finance,
    ...team,
    ...enforcement,
    ...advisory,
    ...clm,
    ...ip,
    ...compliance,
    ...ui,
    ...analytics,
  };

  return selector ? selector(combinedState) : combinedState;
}

// In case some components import useAppStore.getState(), we attach a getState mock on the function itself
useAppStore.getState = (): any => {
  return {
    ...useAuthStore.getState(),
    ...useCasesStore.getState(),
    ...useClientsStore.getState(),
    ...useFinanceStore.getState(),
    ...useTeamStore.getState(),
    ...useEnforcementStore.getState(),
    ...useAdvisoryStore.getState(),
    ...useCLMStore.getState(),
    ...useIPStore.getState(),
    ...useComplianceStore.getState(),
    ...useUIStore.getState(),
    ...useAnalyticsStore.getState(),
  };
};
