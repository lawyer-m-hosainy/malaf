import { UserProfile } from './common';

export interface Task {
  id: string;
  caseId: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface TeamMember extends UserProfile {
  activeCases: number;
  pendingTasks: number;
  completedTasks: number;
  joinDate: string;
  status: 'نشط' | 'في إجازة' | 'غير نشط';
}
