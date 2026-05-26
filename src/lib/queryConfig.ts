import { useQueryClient } from "@tanstack/react-query";

// Export كل queryKey كـ const منفصل لتجنب typos
export const CASES_KEY = "cases";
export const COURTS_KEY = "courts";
export const SESSIONS_KEY = "sessions";
export const CLIENTS_KEY = "clients";
export const DOCUMENTS_KEY = "documents";
export const FINANCES_KEY = "finances";
export const DASHBOARD_KEY = "dashboard";
export const AI_GENERATIONS_KEY = "aiGenerations";

// queryConfig object يشمل كافة مفاتيح البيانات الجوهرية
export const queryConfig = {
  cases: {
    queryKey: [CASES_KEY],
    staleTime: 1000 * 60 * 5, // 5 دقائق
    cacheTime: 1000 * 60 * 30, // 30 دقيقة
    invalidateOn: ["case:created", "case:updated", "case:deleted"],
  },
  courts: {
    queryKey: [COURTS_KEY],
    staleTime: 1000 * 60 * 60 * 24, // يوم كامل
    cacheTime: Infinity,
    invalidateOn: ["settings:updated"],
  },
  sessions: {
    queryKey: [SESSIONS_KEY],
    staleTime: 1000 * 60 * 2, // دقيقتان
    cacheTime: 1000 * 60 * 15,
    invalidateOn: ["session:created", "session:updated", "session:deleted", "case:deleted"],
  },
  clients: {
    queryKey: [CLIENTS_KEY],
    staleTime: 1000 * 60 * 10, // 10 دقائق
    cacheTime: 1000 * 60 * 60,
    invalidateOn: ["client:created", "client:updated", "client:deleted"],
  },
  documents: {
    queryKey: [DOCUMENTS_KEY],
    staleTime: 1000 * 60 * 30, // 30 دقيقة
    cacheTime: 1000 * 60 * 120,
    invalidateOn: ["document:uploaded", "document:deleted", "case:deleted"],
  },
  finances: {
    queryKey: [FINANCES_KEY],
    staleTime: 1000 * 60 * 1, // دقيقة واحدة
    cacheTime: 1000 * 60 * 10,
    invalidateOn: ["invoice:created", "invoice:paid", "expense:added"],
  },
  dashboard: {
    queryKey: [DASHBOARD_KEY],
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    invalidateOn: ["case:created", "session:created", "invoice:paid", "client:created"],
  },
  aiGenerations: {
    queryKey: [AI_GENERATIONS_KEY],
    staleTime: 0,
    cacheTime: 1000 * 60 * 5,
    invalidateOn: [],
  },
};

// دالة useInvalidateRelated تُلغي الـ keys المرتبطة بالحدث
export function useInvalidateRelated() {
  const queryClient = useQueryClient();

  return (event: string) => {
    Object.values(queryConfig).forEach((config) => {
      if (config.invalidateOn.includes(event)) {
        queryClient.invalidateQueries({ queryKey: config.queryKey });
      }
    });
  };
}
