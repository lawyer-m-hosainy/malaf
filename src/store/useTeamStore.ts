import { create } from 'zustand';
import { TeamMember, Task } from '../types';


interface TeamState {
  teamMembers: TeamMember[];
  tasks: Task[];
  setTeamMembers: (members: TeamMember[]) => void;
  setTasks: (tasks: Task[]) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  addTask: (task: Task) => void;
  updateTaskStatus: (id: string, status: 'pending' | 'completed') => void;
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

export const useTeamStore = create<TeamState>((set) => ({
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
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTaskStatus: (id, status) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, status } : t)
  })),
}));
