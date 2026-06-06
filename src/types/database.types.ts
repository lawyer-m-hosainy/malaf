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
// Supabase Database Type — مطلوب لـ createClient<Database>
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          plan: string;
          logo_url: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          tax_id: string | null;
          bar_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          plan?: string;
          logo_url?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          tax_id?: string | null;
          bar_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          full_name: string | null;
          role: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          bar_number: string | null;
          linked_client_id: string | null;
          is_active: boolean;
          onboarding_completed: boolean | null;
          bar_association_number: string | null;
          address: string | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          full_name?: string | null;
          role?: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          bar_number?: string | null;
          linked_client_id?: string | null;
          is_active?: boolean;
          onboarding_completed?: boolean | null;
          bar_association_number?: string | null;
          address?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          org_id: string;
          organization_id: string | null;
          type: string;
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
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          organization_id?: string | null;
          type: string;
          name: string;
          national_id?: string | null;
          company_reg_number?: string | null;
          tax_id?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          nationality?: string | null;
          date_of_birth?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          is_active?: boolean;
          portal_access?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      cases: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          case_number: string | null;
          first_instance_number: string | null;
          title: string;
          type: string;
          status: string;
          priority: string | null;
          client_id: string | null;
          court: string | null;
          judge: string | null;
          opponent: string | null;
          opponent_lawyer: string | null;
          description: string | null;
          notes: string | null;
          filing_date: string | null;
          next_session: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          case_number?: string | null;
          first_instance_number?: string | null;
          title: string;
          type: string;
          status?: string;
          priority?: string | null;
          client_id?: string | null;
          court?: string | null;
          judge?: string | null;
          opponent?: string | null;
          opponent_lawyer?: string | null;
          description?: string | null;
          notes?: string | null;
          filing_date?: string | null;
          next_session?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['cases']['Insert']>;
      };
      case_sessions: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          case_id: string;
          date: string;
          time: string | null;
          court: string | null;
          circuit: string | null;
          notes: string | null;
          outcome: string | null;
          next_session: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          case_id: string;
          date: string;
          time?: string | null;
          court?: string | null;
          circuit?: string | null;
          notes?: string | null;
          outcome?: string | null;
          next_session?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['case_sessions']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          client_id: string | null;
          case_id: string | null;
          invoice_number: string | null;
          amount: number;
          vat_amount: number | null;
          total: number;
          status: string;
          date: string | null;
          due_date: string | null;
          notes: string | null;
          is_billed: boolean | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          client_id?: string | null;
          case_id?: string | null;
          invoice_number?: string | null;
          amount: number;
          vat_amount?: number | null;
          total: number;
          status?: string;
          date?: string | null;
          due_date?: string | null;
          notes?: string | null;
          is_billed?: boolean | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity?: number;
          unit_price: number;
          amount: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['invoice_items']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          case_id: string | null;
          client_id: string | null;
          amount: number;
          category: string | null;
          description: string | null;
          status: string | null;
          date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          case_id?: string | null;
          client_id?: string | null;
          amount: number;
          category?: string | null;
          description?: string | null;
          status?: string | null;
          date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
      trust_accounts: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          client_id: string | null;
          case_id: string | null;
          balance: number;
          currency: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          client_id?: string | null;
          case_id?: string | null;
          balance?: number;
          currency?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['trust_accounts']['Insert']>;
      };
      trust_transactions: {
        Row: {
          id: string;
          trust_account_id: string | null;
          org_id: string | null;
          organization_id: string | null;
          amount: number;
          transaction_type: string;
          description: string | null;
          reference: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trust_account_id?: string | null;
          org_id?: string | null;
          organization_id?: string | null;
          amount: number;
          transaction_type: string;
          description?: string | null;
          reference?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['trust_transactions']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          case_id: string | null;
          title: string;
          description: string | null;
          status: string;
          priority: string | null;
          due_date: string | null;
          assigned_to: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          case_id?: string | null;
          title: string;
          description?: string | null;
          status?: string;
          priority?: string | null;
          due_date?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          case_id: string | null;
          client_id: string | null;
          name: string;
          file_url: string | null;
          file_type: string | null;
          file_size: number | null;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          case_id?: string | null;
          client_id?: string | null;
          name: string;
          file_url?: string | null;
          file_type?: string | null;
          file_size?: number | null;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      poa: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          client_id: string | null;
          poa_number: string | null;
          type: string | null;
          start_date: string | null;
          end_date: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          client_id?: string | null;
          poa_number?: string | null;
          type?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['poa']['Insert']>;
      };
      calendar_events: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          case_id: string | null;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string | null;
          event_type: string | null;
          location: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          case_id?: string | null;
          title: string;
          description?: string | null;
          start_time: string;
          end_time?: string | null;
          event_type?: string | null;
          location?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['calendar_events']['Insert']>;
      };
      payment_plans: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          client_id: string | null;
          case_id: string | null;
          total_amount: number;
          paid_amount: number;
          status: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          client_id?: string | null;
          case_id?: string | null;
          total_amount: number;
          paid_amount?: number;
          status?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payment_plans']['Insert']>;
      };
      payment_installments: {
        Row: {
          id: string;
          plan_id: string;
          due_date: string;
          amount: number;
          paid_amount: number | null;
          paid_date: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          due_date: string;
          amount: number;
          paid_amount?: number | null;
          paid_date?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payment_installments']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          user_id: string | null;
          action: string;
          table_name: string | null;
          record_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          user_id?: string | null;
          action: string;
          table_name?: string | null;
          record_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      time_entries: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          case_id: string | null;
          user_id: string | null;
          duration_minutes: number;
          description: string | null;
          billable: boolean;
          date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          case_id?: string | null;
          user_id?: string | null;
          duration_minutes: number;
          description?: string | null;
          billable?: boolean;
          date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['time_entries']['Insert']>;
      };
      contracts: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          client_id: string | null;
          title: string;
          type: string | null;
          status: string;
          start_date: string | null;
          end_date: string | null;
          value: number | null;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          client_id?: string | null;
          title: string;
          type?: string | null;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          value?: number | null;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contracts']['Insert']>;
      };
      enforcement_cases: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          case_id: string | null;
          client_id: string | null;
          enforcement_number: string | null;
          status: string;
          amount: number | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          case_id?: string | null;
          client_id?: string | null;
          enforcement_number?: string | null;
          status?: string;
          amount?: number | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['enforcement_cases']['Insert']>;
      };
      conflict_checks: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          client_name: string;
          opponent_name: string | null;
          result: string | null;
          has_conflict: boolean | null;
          details: Json | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          client_name: string;
          opponent_name?: string | null;
          result?: string | null;
          has_conflict?: boolean | null;
          details?: Json | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['conflict_checks']['Insert']>;
      };
      ip_assets: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          client_id: string | null;
          name: string;
          type: string;
          status: string;
          registration_number: string | null;
          filing_date: string | null;
          expiry_date: string | null;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          client_id?: string | null;
          name: string;
          type: string;
          status?: string;
          registration_number?: string | null;
          filing_date?: string | null;
          expiry_date?: string | null;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ip_assets']['Insert']>;
      };
      eta_invoices: {
        Row: {
          id: string;
          org_id: string | null;
          organization_id: string | null;
          invoice_id: string | null;
          eta_uuid: string | null;
          status: string;
          submission_date: string | null;
          response_data: Json | null;
          is_billed: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          organization_id?: string | null;
          invoice_id?: string | null;
          eta_uuid?: string | null;
          status?: string;
          submission_date?: string | null;
          response_data?: Json | null;
          is_billed?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['eta_invoices']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string | null;
          org_id: string | null;
          plan: string;
          status: string;
          trial_ends_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          cancel_at_period_end: boolean | null;
          auto_renew: boolean | null;
          cancelled_at: string | null;
          max_cases: number | null;
          max_users: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          org_id?: string | null;
          plan?: string;
          status?: string;
          trial_ends_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          cancel_at_period_end?: boolean | null;
          auto_renew?: boolean | null;
          cancelled_at?: string | null;
          max_cases?: number | null;
          max_users?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          endpoint: string;
          p256dh: string | null;
          auth: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id?: string | null;
          endpoint: string;
          p256dh?: string | null;
          auth?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Insert']>;
      };
      team_invitations: {
        Row: {
          id: string;
          organization_id: string | null;
          org_id: string | null;
          email: string;
          role: string;
          token: string | null;
          status: string;
          invited_by: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          org_id?: string | null;
          email: string;
          role?: string;
          token?: string | null;
          status?: string;
          invited_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['team_invitations']['Insert']>;
      };
      sessions: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          organization_id: string | null;
          invoice_id: string | null;
          amount: number;
          method: string | null;
          status: string;
          reference: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          invoice_id?: string | null;
          amount: number;
          method?: string | null;
          status?: string;
          reference?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      payment_transactions: {
        Row: {
          id: string;
          organization_id: string | null;
          amount: number;
          transaction_type: string;
          status: string | null;
          reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          amount: number;
          transaction_type: string;
          status?: string | null;
          reference?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payment_transactions']['Insert']>;
      };
      manual_payment_requests: {
        Row: {
          id: string;
          organization_id: string | null;
          amount: number;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          amount: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['manual_payment_requests']['Insert']>;
      };
      plan_limits: {
        Row: {
          id: string;
          plan: string;
          max_cases: number | null;
          max_users: number | null;
          max_storage_gb: number | null;
          features: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan: string;
          max_cases?: number | null;
          max_users?: number | null;
          max_storage_gb?: number | null;
          features?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['plan_limits']['Insert']>;
      };
      import_batches: {
        Row: {
          id: string;
          organization_id: string | null;
          status: string;
          imported_records: Json | null;
          imported_ids: Json | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          status?: string;
          imported_records?: Json | null;
          imported_ids?: Json | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['import_batches']['Insert']>;
      };
      slo_metrics: {
        Row: {
          id: string;
          organization_id: string | null;
          metric_name: string;
          value: number;
          last_value: number | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          metric_name: string;
          value: number;
          last_value?: number | null;
          recorded_at?: string;
        };
        Update: Partial<Database['public']['Tables']['slo_metrics']['Insert']>;
      };
      slo_incidents: {
        Row: {
          id: string;
          organization_id: string | null;
          type: string;
          description: string | null;
          severity: string | null;
          started_at: string;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          type: string;
          description?: string | null;
          severity?: string | null;
          started_at: string;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['slo_incidents']['Insert']>;
      };
      sequence_numbers: {
        Row: {
          id: string;
          organization_id: string | null;
          type: string;
          last_value: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          type: string;
          last_value?: number;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sequence_numbers']['Insert']>;
      };
      chat_rooms: {
        Row: {
          id: string;
          room_id: string | null;
          organization_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id?: string | null;
          organization_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['chat_rooms']['Insert']>;
      };
      chat_messages: {
        Row: {
          id: string;
          room_id: string | null;
          sender_id: string | null;
          content: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id?: string | null;
          sender_id?: string | null;
          content: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_org_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
