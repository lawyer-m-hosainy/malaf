// ============================================================
// منصة "ملف" - أنواع TypeScript لجميع جداول قاعدة البيانات
// ============================================================

export type UserRole =
  | 'محامي'
  | 'مدير_مكتب'
  | 'مساعد_محامي'
  | 'محاسب'
  | 'super_admin'
  | 'عميل_بوابة';

export type PlanType = 'free' | 'pro' | 'enterprise';

export type CaseType =
  | 'civil'
  | 'criminal'
  | 'family'
  | 'commercial'
  | 'labor'
  | 'administrative'
  | 'constitutional'
  | 'real_estate'
  | 'intellectual_property'
  | 'enforcement';

export type CaseStatus = 'open' | 'closed' | 'pending' | 'on_hold' | 'appealed' | 'settled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
export type ContractStatus = 'draft' | 'under_review' | 'active' | 'expired' | 'terminated' | 'renewed';
export type IPAssetType = 'trademark' | 'patent' | 'copyright' | 'trade_secret' | 'domain';
export type IPAssetStatus = 'pending' | 'registered' | 'expired' | 'opposed' | 'cancelled' | 'renewed';

// ============================================================
// الجداول الأساسية
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  plan: PlanType;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  bar_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  org_id: string | null;
  full_name: string | null;
  role: UserRole;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bar_number: string | null;
  linked_client_id: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// العملاء
// ============================================================

export type ClientType = 'individual' | 'company';

export interface Client {
  id: string;
  org_id: string;
  type: ClientType;
  name: string;
  national_id: string | null;
  company_reg_number: string | null;
  tax_id: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  notes: string | null;
  tags: string[] | null;
  is_active: boolean;
  portal_access: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface POA {
  id: string;
  org_id: string;
  client_id: string;
  poa_number: string;
  issue_date: string | null;
  expiry_date: string | null;
  type: string | null;
  description: string | null;
  document_id: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// المستندات
// ============================================================

export interface Document {
  id: string;
  org_id: string;
  case_id: string | null;
  client_id: string | null;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  is_template: boolean;
  tags: string[] | null;
  ai_summary: string | null;
  uploaded_by: string;
  created_at: string;
}

// ============================================================
// القضايا
// ============================================================

export interface Case {
  id: string;
  org_id: string;
  client_id: string;
  case_number: string;
  title: string;
  type: CaseType;
  status: CaseStatus;
  court: string | null;
  court_circuit: string | null;
  judge: string | null;
  opposing_party: string | null;
  opposing_lawyer: string | null;
  description: string | null;
  priority: Priority;
  start_date: string | null;
  end_date: string | null;
  estimated_value: number | null;
  fee_arrangement: string | null;
  agreed_fee: number | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CaseSession {
  id: string;
  org_id: string;
  case_id: string;
  session_date: string;
  location: string | null;
  notes: string | null;
  outcome: string | null;
  next_session_date: string | null;
  session_type: string | null;
  judge: string | null;
  attendees: string[] | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CaseLawyer {
  id: string;
  org_id: string;
  case_id: string;
  profile_id: string;
  role: 'lead_lawyer' | 'assisting_lawyer' | 'trainee';
  created_at: string;
}

// ============================================================
// المالية
// ============================================================

export interface Invoice {
  id: string;
  org_id: string;
  client_id: string;
  case_id: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  total_amount: number;
  tax_amount: number;
  discount: number;
  paid_amount: number;
  status: InvoiceStatus;
  currency: string;
  notes: string | null;
  eta_invoice_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  tax_rate: number;
  created_at: string;
}

export interface Expense {
  id: string;
  org_id: string;
  case_id: string | null;
  client_id: string | null;
  date: string;
  category: string;
  description: string;
  amount: number;
  is_billable: boolean;
  is_reimbursed: boolean;
  receipt_document_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TrustAccount {
  id: string;
  org_id: string;
  client_id: string;
  account_name: string;
  balance: number;
  currency: string;
  is_active: boolean;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TrustTransaction {
  id: string;
  org_id: string;
  trust_account_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  reference: string | null;
  transaction_date: string;
  document_id: string | null;
  created_by: string;
  created_at: string;
}

export interface PaymentPlan {
  id: string;
  org_id: string;
  invoice_id: string;
  client_id: string;
  total_amount: number;
  installments: number;
  status: 'active' | 'completed' | 'defaulted';
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentInstallment {
  id: string;
  org_id: string;
  payment_plan_id: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  org_id: string;
  invoice_id: string;
  client_id: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'check' | 'online';
  reference: string | null;
  payment_date: string;
  notes: string | null;
  document_id: string | null;
  created_by: string;
  created_at: string;
}

// ============================================================
// المهام وتتبع الوقت
// ============================================================

export interface Task {
  id: string;
  org_id: string;
  case_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  completed_at: string | null;
  tags: string[] | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  org_id: string;
  user_id: string;
  case_id: string | null;
  task_id: string | null;
  description: string;
  duration_minutes: number;
  date: string;
  billable: boolean;
  hourly_rate: number | null;
  invoiced: boolean;
  invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// العقود
// ============================================================

export interface Contract {
  id: string;
  org_id: string;
  client_id: string;
  title: string;
  contract_number: string;
  type: string | null;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  value: number | null;
  document_id: string | null;
  description: string | null;
  parties: Record<string, unknown> | null;
  milestones: Record<string, unknown> | null;
  renewal_notice_days: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContractReview {
  id: string;
  org_id: string;
  contract_id: string;
  reviewer_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// ============================================================
// الملكية الفكرية
// ============================================================

export interface IPAsset {
  id: string;
  org_id: string;
  client_id: string;
  type: IPAssetType;
  title: string;
  registration_no: string | null;
  application_date: string | null;
  registration_date: string | null;
  expiry_date: string | null;
  status: IPAssetStatus;
  jurisdiction: string | null;
  classes: string[] | null;
  description: string | null;
  document_id: string | null;
  renewal_reminder_days: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface IPOperation {
  id: string;
  org_id: string;
  ip_asset_id: string;
  type: 'renewal' | 'opposition' | 'assignment' | 'license' | 'watch';
  date: string;
  status: string;
  description: string | null;
  fees: number | null;
  document_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// التقويم
// ============================================================

export interface CalendarEvent {
  id: string;
  org_id: string;
  case_id: string | null;
  session_id: string | null;
  created_by: string;
  title: string;
  description: string | null;
  event_type: 'general' | 'court_session' | 'deadline' | 'meeting' | 'reminder' | 'task';
  start_time: string;
  end_time: string;
  location: string | null;
  all_day: boolean;
  reminder_minutes: number | null;
  attendees: string[] | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// الوحدات المصرية المتخصصة
// ============================================================

export interface FamilyCourtCase {
  id: string;
  org_id: string;
  case_id: string;
  case_subtype: 'divorce' | 'alimony' | 'custody' | 'guardianship' | 'inheritance' | 'khol' | 'reconciliation';
  personal_status: string | null;
  party_a: Record<string, unknown> | null;
  party_b: Record<string, unknown> | null;
  children: Record<string, unknown> | null;
  alimony_amount: number | null;
  custody_details: string | null;
  created_at: string;
  updated_at: string;
}

export interface CriminalCase {
  id: string;
  org_id: string;
  case_id: string;
  crime_type: string;
  accusation: string | null;
  penalty_code: string | null;
  detention_status: 'detained' | 'released' | 'bail' | null;
  bail_amount: number | null;
  victims: Record<string, unknown> | null;
  witnesses: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface EnforcementCase {
  id: string;
  org_id: string;
  case_id: string | null;
  client_id: string;
  enforcement_no: string;
  enforcement_type: 'judgment' | 'arbitral_award' | 'deed';
  debtor_name: string;
  debt_amount: number;
  collected_amount: number;
  status: string;
  court: string | null;
  filing_date: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ETAInvoice {
  id: string;
  org_id: string;
  invoice_id: string;
  eta_uuid: string | null;
  eta_submission_id: string | null;
  eta_long_id: string | null;
  issuer_tin: string;
  receiver_tin: string | null;
  eta_status: 'pending' | 'submitted' | 'valid' | 'invalid' | 'cancelled';
  submission_date: string | null;
  response_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ExpertMission {
  id: string;
  org_id: string;
  case_id: string | null;
  client_id: string;
  expert_name: string;
  expert_type: 'accounting' | 'engineering' | 'medical' | 'handwriting';
  mission_date: string | null;
  report_date: string | null;
  status: 'pending' | 'in_progress' | 'report_submitted' | 'contested' | 'final';
  fees: number | null;
  notes: string | null;
  document_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// سجلات التدقيق
// ============================================================

export interface AuditLog {
  id: string;
  org_id: string;
  user_id: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export';
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================================
// نوع قاعدة البيانات الكاملة (لـ Supabase Client)
// ============================================================

export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Organization> };
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at' | 'updated_at'>; Update: Partial<Profile> };
      clients: { Row: Client; Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Client> };
      poa: { Row: POA; Insert: Omit<POA, 'id' | 'created_at' | 'updated_at'>; Update: Partial<POA> };
      cases: { Row: Case; Insert: Omit<Case, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Case> };
      case_sessions: { Row: CaseSession; Insert: Omit<CaseSession, 'id' | 'created_at' | 'updated_at'>; Update: Partial<CaseSession> };
      case_lawyers: { Row: CaseLawyer; Insert: Omit<CaseLawyer, 'id' | 'created_at'>; Update: Partial<CaseLawyer> };
      documents: { Row: Document; Insert: Omit<Document, 'id' | 'created_at'>; Update: Partial<Document> };
      invoices: { Row: Invoice; Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Invoice> };
      invoice_items: { Row: InvoiceItem; Insert: Omit<InvoiceItem, 'id' | 'created_at'>; Update: Partial<InvoiceItem> };
      expenses: { Row: Expense; Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Expense> };
      trust_accounts: { Row: TrustAccount; Insert: Omit<TrustAccount, 'id' | 'created_at' | 'updated_at'>; Update: Partial<TrustAccount> };
      trust_transactions: { Row: TrustTransaction; Insert: Omit<TrustTransaction, 'id' | 'created_at'>; Update: Partial<TrustTransaction> };
      payment_plans: { Row: PaymentPlan; Insert: Omit<PaymentPlan, 'id' | 'created_at' | 'updated_at'>; Update: Partial<PaymentPlan> };
      payment_installments: { Row: PaymentInstallment; Insert: Omit<PaymentInstallment, 'id' | 'created_at' | 'updated_at'>; Update: Partial<PaymentInstallment> };
      collections: { Row: Collection; Insert: Omit<Collection, 'id' | 'created_at'>; Update: Partial<Collection> };
      tasks: { Row: Task; Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Task> };
      time_entries: { Row: TimeEntry; Insert: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>; Update: Partial<TimeEntry> };
      contracts: { Row: Contract; Insert: Omit<Contract, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Contract> };
      contract_reviews: { Row: ContractReview; Insert: Omit<ContractReview, 'id' | 'created_at'>; Update: Partial<ContractReview> };
      ip_assets: { Row: IPAsset; Insert: Omit<IPAsset, 'id' | 'created_at' | 'updated_at'>; Update: Partial<IPAsset> };
      ip_operations: { Row: IPOperation; Insert: Omit<IPOperation, 'id' | 'created_at' | 'updated_at'>; Update: Partial<IPOperation> };
      enforcement_cases: { Row: EnforcementCase; Insert: Omit<EnforcementCase, 'id' | 'created_at' | 'updated_at'>; Update: Partial<EnforcementCase> };
      calendar_events: { Row: CalendarEvent; Insert: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>; Update: Partial<CalendarEvent> };
      audit_logs: { Row: AuditLog; Insert: Omit<AuditLog, 'id' | 'created_at'>; Update: never };
      eta_invoices: { Row: ETAInvoice; Insert: Omit<ETAInvoice, 'id' | 'created_at' | 'updated_at'>; Update: Partial<ETAInvoice> };
      expert_missions: { Row: ExpertMission; Insert: Omit<ExpertMission, 'id' | 'created_at' | 'updated_at'>; Update: Partial<ExpertMission> };
    };
    Functions: {
      get_user_org_id: { Args: Record<never, never>; Returns: string };
      is_super_admin: { Args: Record<never, never>; Returns: boolean };
      has_role: { Args: { required_role: string }; Returns: boolean };
      calculate_trust_balance: { Args: { account_id: string }; Returns: number };
    };
  };
}
