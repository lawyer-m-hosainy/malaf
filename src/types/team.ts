import { UserProfile } from './common';

export interface TaskActivityLog {
  id: string;
  taskId: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  performedBy: string;
  performedByName: string;
  date: string;
  notes?: string;
}

export interface Task {
  id: string;
  caseId: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedToName?: string;
  dueDate: string;
  status: 'جديدة' | 'قيد التنفيذ' | 'مراجعة' | 'مكتملة' | 'مؤجلة';
  priority: 'low' | 'medium' | 'high';
  /** نسبة الإنجاز */
  progress?: number; // 0-100
  createdAt?: string;
  completedAt?: string;
  /** سجل النشاط */
  activityLog?: TaskActivityLog[];
}

export interface TeamMember extends UserProfile {
  activeCases: number;
  pendingTasks: number;
  completedTasks: number;
  joinDate: string;
  status: 'نشط' | 'في إجازة' | 'غير نشط';
}
