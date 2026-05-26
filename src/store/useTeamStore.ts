import { create } from 'zustand';
import { TeamMember, Task, TaskActivityLog } from '../types';


interface TeamState {
  teamMembers: TeamMember[];
  tasks: Task[];
  setTeamMembers: (members: TeamMember[]) => void;
  setTasks: (tasks: Task[]) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  addTask: (task: Task) => void;
  /** تحديث حالة المهمة مع سجل النشاط */
  updateTaskStatus: (id: string, status: Task['status'], performedBy?: string, performedByName?: string, notes?: string) => void;
  /** تحديث تفاصيل المهمة */
  updateTask: (id: string, updates: Partial<Task>) => void;
  /** تحديث نسبة الإنجاز */
  updateTaskProgress: (id: string, progress: number, performedBy?: string, performedByName?: string) => void;
  /** الحصول على إحصائيات المحامي */
  getLawyerStats: (memberId: string) => { total: number; completed: number; inProgress: number; overdue: number; completionRate: number };
  fetchTeamMembers: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  hasLoaded: boolean;
  reset: () => void;
}

const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "U-001",
    name: "عبدالله العتيبي",
    email: "a.mahmoud@malaf.app",
    role: "محامي شريك",
    avatar: "/avatars/a-otaibi.jpg",
    status: "نشط",
    activeCases: 5,
    pendingTasks: 3,
    completedTasks: 10,
    joinDate: "2020-01-15"
  },
  {
    id: "U-002",
    name: "سارة الخالد",
    email: "s.hassan@malaf.app",
    role: "محامي",
    avatar: "/avatars/s-alkhaled.jpg",
    status: "نشط",
    activeCases: 8,
    pendingTasks: 5,
    completedTasks: 22,
    joinDate: "2021-06-01"
  },
  {
    id: "U-003",
    name: "محمد الدوسري",
    email: "m.ibrahim@malaf.app",
    role: "محامي مستشار",
    avatar: "/avatars/m-aldosari.jpg",
    status: "نشط",
    activeCases: 3,
    pendingTasks: 1,
    completedTasks: 45,
    joinDate: "2019-11-20"
  }
];

export const useTeamStore = create<TeamState>((set, get) => ({
  teamMembers: [],
  tasks: [],
  hasLoaded: false,

  reset: () => set({ teamMembers: [], tasks: [], hasLoaded: false }),

  setTeamMembers: (teamMembers) => set({ teamMembers, hasLoaded: true }),
  setTasks: (tasks) => set({ tasks, hasLoaded: true }),
  addTeamMember: (member) => set((state) => ({ teamMembers: [...state.teamMembers, member] })),
  updateTeamMember: (id, updates) => set((state) => ({
    teamMembers: state.teamMembers.map(m => m.id === id ? { ...m, ...updates } : m)
  })),
  removeTeamMember: (id) => set((state) => ({ teamMembers: state.teamMembers.filter(m => m.id !== id) })),
  
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, {
      ...task,
      status: task.status || 'جديدة',
      progress: task.progress ?? 0,
      createdAt: task.createdAt || new Date().toISOString(),
      activityLog: task.activityLog || [{
        id: `LOG-${Date.now()}`,
        taskId: task.id,
        action: 'إنشاء المهمة',
        toStatus: task.status || 'جديدة',
        performedBy: task.assignedTo,
        performedByName: task.assignedToName || 'النظام',
        date: new Date().toISOString(),
      }],
    }]
  })),
  
  updateTaskStatus: (id, status, performedBy, performedByName, notes) => set((state) => ({
    tasks: state.tasks.map(t => {
      if (t.id !== id) return t;
      
      const logEntry: TaskActivityLog = {
        id: `LOG-${Date.now()}`,
        taskId: id,
        action: `تغيير الحالة`,
        fromStatus: t.status,
        toStatus: status,
        performedBy: performedBy || t.assignedTo,
        performedByName: performedByName || 'المستخدم',
        date: new Date().toISOString(),
        notes,
      };

      // Auto-calculate progress based on status
      let progress = t.progress || 0;
      if (status === 'جديدة') progress = 0;
      else if (status === 'قيد التنفيذ') progress = Math.max(progress, 25);
      else if (status === 'مراجعة') progress = Math.max(progress, 75);
      else if (status === 'مكتملة') progress = 100;

      return { 
        ...t, 
        status, 
        progress,
        completedAt: status === 'مكتملة' ? new Date().toISOString() : t.completedAt,
        activityLog: [...(t.activityLog || []), logEntry],
      };
    })
  })),

  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
  })),

  updateTaskProgress: (id, progress, performedBy, performedByName) => set((state) => ({
    tasks: state.tasks.map(t => {
      if (t.id !== id) return t;
      const logEntry: TaskActivityLog = {
        id: `LOG-${Date.now()}`,
        taskId: id,
        action: `تحديث الإنجاز إلى ${progress}%`,
        performedBy: performedBy || t.assignedTo,
        performedByName: performedByName || 'المستخدم',
        date: new Date().toISOString(),
      };
      return { ...t, progress, activityLog: [...(t.activityLog || []), logEntry] };
    })
  })),

  getLawyerStats: (memberId: string) => {
    const tasks = get().tasks;
    const memberTasks = tasks.filter(t => t.assignedTo === memberId);
    const now = new Date();
    return {
      total: memberTasks.length,
      completed: memberTasks.filter(t => t.status === 'مكتملة').length,
      inProgress: memberTasks.filter(t => t.status === 'قيد التنفيذ' || t.status === 'مراجعة').length,
      overdue: memberTasks.filter(t => t.status !== 'مكتملة' && new Date(t.dueDate) < now).length,
      completionRate: memberTasks.length > 0 
        ? Math.round((memberTasks.filter(t => t.status === 'مكتملة').length / memberTasks.length) * 100) 
        : 0,
    };
  },

  fetchTeamMembers: async () => {
    set({ teamMembers: MOCK_TEAM_MEMBERS, hasLoaded: true });
  },
  fetchTasks: async () => {
    // In a real app, this calls legalDataService.fetchTasks()
    set({ hasLoaded: true });
  },
}));
