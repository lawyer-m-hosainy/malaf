import { useEffect, useRef } from 'react';
import { useCasesStore } from '@/store/useCasesStore';
import { useClientsStore } from '@/store/useClientsStore';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useTeamStore } from '@/store/useTeamStore';
import { useEnforcementStore } from '@/store/useEnforcementStore';
import { fetchCases, fetchClients, fetchEnforcement, fetchTasks, fetchTeam, fetchTrustAccounts } from '@/services/legalDataService';
import { useAuthStore } from '@/store/useAuthStore';

export function AppDataLoader({ children }: { children: React.ReactNode }) {
  const hasLoadedCases = useCasesStore(state => state.hasLoaded);
  const hasLoadedClients = useClientsStore(state => state.hasLoaded);
  const isAuthenticated = useAuthStore(state => !!state.currentUser);
  const loadingRef = useRef(false);

  useEffect(() => {
    // Only load if authenticated and we haven't loaded cases yet
    if (isAuthenticated && !hasLoadedCases && !loadingRef.current) {
      loadingRef.current = true;
      
      const loadAllData = async () => {
        try {
          const [remoteClients, remoteCases, remoteTrust, remoteEnf, remoteTasks, remoteTeam] = await Promise.all([
            fetchClients(), 
            fetchCases(),
            fetchTrustAccounts(),
            fetchEnforcement(),
            fetchTasks(),
            fetchTeam()
          ]);
          
          if (remoteClients?.length > 0) useClientsStore.getState().setClients(remoteClients);
          useClientsStore.setState({ hasLoaded: true });

          if (remoteCases?.length > 0) useCasesStore.getState().setCases(remoteCases);
          useCasesStore.setState({ hasLoaded: true });

          if (remoteTrust?.length > 0) useFinanceStore.getState().setTrustAccounts(remoteTrust);
          if (remoteEnf?.length > 0) useEnforcementStore.getState().setEnforcementCases(remoteEnf);
          if (remoteTasks?.length > 0) useTeamStore.getState().setTasks(remoteTasks);
          if (remoteTeam?.length > 0) useTeamStore.getState().setTeamMembers(remoteTeam);
          
        } catch (error) {
          console.error("Failed to preload app data:", error);
        } finally {
          loadingRef.current = false;
        }
      };

      loadAllData();
    }
  }, [isAuthenticated, hasLoadedCases]);

  return <>{children}</>;
}
