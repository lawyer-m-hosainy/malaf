export type UserRole = 'مدير مكتب' | 'محامي' | 'سكرتير' | 'محامي شريك' | 'محامي مستشار' | 'محامي متدرب';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: 'مذكرة' | 'لائحة' | 'حكم' | 'أخرى';
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface OfficeSettings {
  name: string;
  vatNumber: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  steps: {
    order: number;
    action: string;
    assignedTo: string;
  }[];
  isActive: boolean;
}

export interface AdvisoryOpinion {
  id: string;
  requestId: string;
  content: string;
  authorId: string;
  createdAt: string;
}

export interface ApprovalFlow {
  id: string;
  requestId: string;
  approverId: string;
  approverName: string;
  status: 'بانتظار الاعتماد' | 'معتمد' | 'مرفوض';
  decidedAt?: string;
  notes?: string;
}

export interface AdvisoryRequest {
  id: string;
  tenantId?: string;
  title: string;
  clientName: string;
  requestedBy: string;
  assignedTo: string;
  status: 'جديد' | 'قيد المراجعة' | 'مسودة رأي' | 'اعتماد شريك' | 'مغلق';
  priority: 'منخفض' | 'متوسط' | 'عالي';
  slaDueAt: string;
  createdAt: string;
  closedAt?: string;
  opinions: AdvisoryOpinion[];
  approvals: ApprovalFlow[];
}

export interface QAReview {
  id: string;
  caseId: string;
  documentId?: string;
  reviewerId: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'RequiresChanges';
  checklist: {
    id: string;
    requirement: string;
    isMet: boolean;
    comment?: string;
  }[];
  overallComment?: string;
  completedAt?: string;
  partnerOverride?: boolean;
}

export interface KnowledgeAsset {
  id: string;
  title: string;
  category: 'Research' | 'Precedent' | 'Procedure' | 'Template';
  tags: string[];
  contentUrl: string;
  version: number;
  authorId: string;
  isVerified: boolean;
  verifiedBy?: string;
  linkedCaseIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPathway {
  id: string;
  userId: string;
  title: string;
  description: string;
  modules: {
    id: string;
    title: string;
    status: 'NotStarted' | 'InProgress' | 'Completed';
    completedAt?: string;
    score?: number;
  }[];
  mentorId: string;
  overallProgress: number; // 0-100
  startDate: string;
  endDate?: string;
}

export interface EgyptAssessment {
  id: string;
  pathwayId: string;
  title: string;
  questions: {
    id: string;
    text: string;
    options: string[];
    correctOption: number;
    userAnswer?: number;
  }[];
  passingScore: number;
  userScore?: number;
  isPassed?: boolean;
}

/** @deprecated Use EgyptAssessment instead */
export type KSAAssessment = EgyptAssessment;
