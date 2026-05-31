// ============================================================
// منصة "ملف" - خدمات قاعدة البيانات (Services)
// ============================================================
import { supabase } from './supabase';
import type {
  Organization, Profile, Client, Case, CaseSession,
  Document, Invoice, InvoiceItem, Expense,
  TrustAccount, TrustTransaction, PaymentPlan, PaymentInstallment,
  Collection, Task, TimeEntry, Contract, ContractReview,
  IPAsset, IPOperation, CalendarEvent, EnforcementCase,
  AuditLog, ETAInvoice, ExpertMission, POA,
} from '../types/database.types';

// ============================================================
// المساعدات العامة
// ============================================================
function handleError(error: unknown, context: string): never {
  console.error(`[Malaf/${context}]`, error);
  throw error;
}

// ============================================================
// خدمة المنظمات
// ============================================================
export const OrganizationService = {
  async get(): Promise<Organization | null> {
    const { data, error } = await (supabase as any)
      .from('organizations')
      .select('*')
      .single();
    if (error && error.code !== 'PGRST116') handleError(error, 'OrganizationService.get');
    return data;
  },

  async update(id: string, updates: Partial<Organization>): Promise<Organization> {
    const { data, error } = await (supabase as any)
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'OrganizationService.update');
    return data!;
  },
};

// ============================================================
// خدمة الملفات الشخصية
// ============================================================
export const ProfileService = {
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) handleError(error, 'ProfileService.getCurrentProfile');
    return data;
  },

  async getAll(): Promise<Profile[]> {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .order('full_name');
    if (error) handleError(error, 'ProfileService.getAll');
    return data ?? [];
  },

  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'ProfileService.update');
    return data!;
  },
};

// ============================================================
// خدمة العملاء
// ============================================================
export const ClientService = {
  async getAll(filters?: { type?: string; is_active?: boolean }): Promise<Client[]> {
    let query = (supabase as any).from('clients').select('*').order('name');
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    const { data, error } = await query;
    if (error) handleError(error, 'ClientService.getAll');
    return data ?? [];
  },

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await (supabase as any)
      .from('clients')
      .select('*, cases(*), invoices(*), documents(*)')
      .eq('id', id)
      .single();
    if (error) handleError(error, 'ClientService.getById');
    return data;
  },

  async create(payload: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const { data, error } = await (supabase as any)
      .from('clients')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'ClientService.create');
    return data!;
  },

  async update(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await (supabase as any)
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'ClientService.update');
    return data!;
  },

  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any).from('clients').delete().eq('id', id);
    if (error) handleError(error, 'ClientService.delete');
  },

  async search(term: string): Promise<Client[]> {
    const { data, error } = await (supabase as any)
      .from('clients')
      .select('*')
      .or(`name.ilike.%${term}%,national_id.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
      .limit(20);
    if (error) handleError(error, 'ClientService.search');
    return data ?? [];
  },
};

// ============================================================
// خدمة القضايا
// ============================================================
export const CaseService = {
  async getAll(filters?: {
    status?: string;
    type?: string;
    client_id?: string;
    priority?: string;
  }): Promise<Case[]> {
    let query = (supabase as any)
      .from('cases')
      .select('*, clients(name, type), profiles!created_by(full_name)')
      .order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.client_id) query = query.eq('client_id', filters.client_id);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    const { data, error } = await query;
    if (error) handleError(error, 'CaseService.getAll');
    return data ?? [];
  },

  async getById(id: string): Promise<Case | null> {
    const { data, error } = await (supabase as any)
      .from('cases')
      .select(`
        *,
        clients(name, type, phone, email),
        case_sessions(*, profiles!created_by(full_name)),
        documents(*),
        tasks(*),
        time_entries(*),
        case_lawyers(*, profiles(full_name, role))
      `)
      .eq('id', id)
      .single();
    if (error) handleError(error, 'CaseService.getById');
    return data;
  },

  async create(payload: Omit<Case, 'id' | 'created_at' | 'updated_at'>): Promise<Case> {
    const { data, error } = await (supabase as any)
      .from('cases')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'CaseService.create');
    return data!;
  },

  async update(id: string, updates: Partial<Case>): Promise<Case> {
    const { data, error } = await (supabase as any)
      .from('cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'CaseService.update');
    return data!;
  },

  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any).from('cases').delete().eq('id', id);
    if (error) handleError(error, 'CaseService.delete');
  },

  async getStats(): Promise<{
    total: number; open: number; closed: number; pending: number;
  }> {
    const { data, error } = await (supabase as any)
      .from('cases')
      .select('status');
    if (error) handleError(error, 'CaseService.getStats');
    const rows = data ?? [];
    return {
      total: rows.length,
      open: rows.filter((r: any) => r.status === 'open').length,
      closed: rows.filter((r: any) => r.status === 'closed').length,
      pending: rows.filter((r: any) => r.status === 'pending').length,
    };
  },
};

// ============================================================
// خدمة جلسات القضايا
// ============================================================
export const SessionService = {
  async getByCaseId(caseId: string): Promise<CaseSession[]> {
    const { data, error } = await (supabase as any)
      .from('case_sessions')
      .select('*, profiles!created_by(full_name)')
      .eq('case_id', caseId)
      .order('session_date', { ascending: false });
    if (error) handleError(error, 'SessionService.getByCaseId');
    return data ?? [];
  },

  async getUpcoming(days = 30): Promise<CaseSession[]> {
    const now = new Date().toISOString();
    const future = new Date(Date.now() + days * 86400000).toISOString();
    const { data, error } = await (supabase as any)
      .from('case_sessions')
      .select('*, cases(title, case_number)')
      .gte('session_date', now)
      .lte('session_date', future)
      .order('session_date');
    if (error) handleError(error, 'SessionService.getUpcoming');
    return data ?? [];
  },

  async create(payload: Omit<CaseSession, 'id' | 'created_at' | 'updated_at'>): Promise<CaseSession> {
    const { data, error } = await (supabase as any)
      .from('case_sessions')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'SessionService.create');
    return data!;
  },

  async update(id: string, updates: Partial<CaseSession>): Promise<CaseSession> {
    const { data, error } = await (supabase as any)
      .from('case_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'SessionService.update');
    return data!;
  },

  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any).from('case_sessions').delete().eq('id', id);
    if (error) handleError(error, 'SessionService.delete');
  },
};

// ============================================================
// خدمة المستندات
// ============================================================
export const DocumentService = {
  async getAll(filters?: { case_id?: string; client_id?: string }): Promise<Document[]> {
    let query = (supabase as any)
      .from('documents')
      .select('*, profiles!uploaded_by(full_name)')
      .order('created_at', { ascending: false });
    if (filters?.case_id) query = query.eq('case_id', filters.case_id);
    if (filters?.client_id) query = query.eq('client_id', filters.client_id);
    const { data, error } = await query;
    if (error) handleError(error, 'DocumentService.getAll');
    return data ?? [];
  },

  async upload(file: File, metadata: Omit<Document, 'id' | 'created_at' | 'file_path' | 'file_size'>): Promise<Document> {
    const ext = file.name.split('.').pop();
    const filePath = `${metadata.org_id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { upsert: false });
    if (uploadError) handleError(uploadError, 'DocumentService.upload');

    const { data, error } = await (supabase as any)
      .from('documents')
      .insert({ ...metadata, file_path: filePath, file_size: file.size })
      .select()
      .single();
    if (error) handleError(error, 'DocumentService.upload.insert');
    return data!;
  },

  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expiresIn);
    if (error) handleError(error, 'DocumentService.getSignedUrl');
    return data!.signedUrl;
  },

  async delete(id: string, filePath: string): Promise<void> {
    await supabase.storage.from('documents').remove([filePath]);
    const { error } = await (supabase as any).from('documents').delete().eq('id', id);
    if (error) handleError(error, 'DocumentService.delete');
  },
};

// ============================================================
// خدمة الفواتير
// ============================================================
export const InvoiceService = {
  async getAll(filters?: { status?: string; client_id?: string }): Promise<Invoice[]> {
    let query = (supabase as any)
      .from('invoices')
      .select('*, clients(name), invoice_items(*)')
      .order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.client_id) query = query.eq('client_id', filters.client_id);
    const { data, error } = await query;
    if (error) handleError(error, 'InvoiceService.getAll');
    return data ?? [];
  },

  async getById(id: string): Promise<Invoice | null> {
    const { data, error } = await (supabase as any)
      .from('invoices')
      .select('*, clients(name, address, tax_id), invoice_items(*)')
      .eq('id', id)
      .single();
    if (error) handleError(error, 'InvoiceService.getById');
    return data;
  },

  async create(
    invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>,
    items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[]
  ): Promise<Invoice> {
    const { data, error } = await (supabase as any)
      .from('invoices')
      .insert(invoice)
      .select()
      .single();
    if (error) handleError(error, 'InvoiceService.create');

    if (items.length > 0) {
      const { error: itemsError } = await (supabase as any)
        .from('invoice_items')
        .insert(items.map(i => ({ ...i, invoice_id: data!.id })));
      if (itemsError) handleError(itemsError, 'InvoiceService.create.items');
    }
    return data!;
  },

  async update(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await (supabase as any)
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'InvoiceService.update');
    return data!;
  },

  async getFinancialSummary(): Promise<{
    totalBilled: number; totalPaid: number; totalOverdue: number;
  }> {
    const { data, error } = await (supabase as any)
      .from('invoices')
      .select('total_amount, paid_amount, status');
    if (error) handleError(error, 'InvoiceService.getFinancialSummary');
    const rows = data ?? [];
    return {
      totalBilled: rows.reduce((s: number, r: any) => s + Number(r.total_amount), 0),
      totalPaid: rows.reduce((s: number, r: any) => s + Number(r.paid_amount), 0),
      totalOverdue: rows.filter((r: any) => r.status === 'overdue').reduce((s: number, r: any) => s + Number(r.total_amount) - Number(r.paid_amount), 0),
    };
  },
};

// ============================================================
// خدمة المصاريف
// ============================================================
export const ExpenseService = {
  async getAll(filters?: { case_id?: string; client_id?: string }): Promise<Expense[]> {
    let query = (supabase as any)
      .from('expenses')
      .select('*, profiles!created_by(full_name)')
      .order('date', { ascending: false });
    if (filters?.case_id) query = query.eq('case_id', filters.case_id);
    if (filters?.client_id) query = query.eq('client_id', filters.client_id);
    const { data, error } = await query;
    if (error) handleError(error, 'ExpenseService.getAll');
    return data ?? [];
  },

  async create(payload: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<Expense> {
    const { data, error } = await (supabase as any)
      .from('expenses')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'ExpenseService.create');
    return data!;
  },

  async update(id: string, updates: Partial<Expense>): Promise<Expense> {
    const { data, error } = await (supabase as any)
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'ExpenseService.update');
    return data!;
  },

  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any).from('expenses').delete().eq('id', id);
    if (error) handleError(error, 'ExpenseService.delete');
  },
};

// ============================================================
// خدمة حسابات الثقة
// ============================================================
export const TrustAccountService = {
  async getAll(): Promise<TrustAccount[]> {
    const { data, error } = await (supabase as any)
      .from('trust_accounts')
      .select('*, clients(name)')
      .eq('is_active', true)
      .order('created_at');
    if (error) handleError(error, 'TrustAccountService.getAll');
    return data ?? [];
  },

  async getTransactions(accountId: string): Promise<TrustTransaction[]> {
    const { data, error } = await (supabase as any)
      .from('trust_transactions')
      .select('*, profiles!created_by(full_name)')
      .eq('trust_account_id', accountId)
      .order('transaction_date', { ascending: false });
    if (error) handleError(error, 'TrustAccountService.getTransactions');
    return data ?? [];
  },

  async createAccount(payload: Omit<TrustAccount, 'id' | 'created_at' | 'updated_at' | 'balance'>): Promise<TrustAccount> {
    const { data, error } = await (supabase as any)
      .from('trust_accounts')
      .insert({ ...payload, balance: 0 })
      .select()
      .single();
    if (error) handleError(error, 'TrustAccountService.createAccount');
    return data!;
  },

  async addTransaction(payload: Omit<TrustTransaction, 'id' | 'created_at'>): Promise<TrustTransaction> {
    const { data, error } = await (supabase as any)
      .from('trust_transactions')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'TrustAccountService.addTransaction');
    return data!;
  },
};

// ============================================================
// خدمة المهام
// ============================================================
export const TaskService = {
  async getAll(filters?: { assigned_to?: string; status?: string; case_id?: string }): Promise<Task[]> {
    let query = (supabase as any)
      .from('tasks')
      .select('*, profiles!assigned_to(full_name), cases(title)')
      .order('due_date', { ascending: true, nullsFirst: false });
    if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.case_id) query = query.eq('case_id', filters.case_id);
    const { data, error } = await query;
    if (error) handleError(error, 'TaskService.getAll');
    return data ?? [];
  },

  async create(payload: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await (supabase as any)
      .from('tasks')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'TaskService.create');
    return data!;
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await (supabase as any)
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'TaskService.update');
    return data!;
  },

  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any).from('tasks').delete().eq('id', id);
    if (error) handleError(error, 'TaskService.delete');
  },
};

// ============================================================
// خدمة تتبع الوقت
// ============================================================
export const TimeTrackingService = {
  async getAll(filters?: { user_id?: string; case_id?: string; date_from?: string; date_to?: string }): Promise<TimeEntry[]> {
    let query = (supabase as any)
      .from('time_entries')
      .select('*, cases(title), profiles!user_id(full_name)')
      .order('date', { ascending: false });
    if (filters?.user_id) query = query.eq('user_id', filters.user_id);
    if (filters?.case_id) query = query.eq('case_id', filters.case_id);
    if (filters?.date_from) query = query.gte('date', filters.date_from);
    if (filters?.date_to) query = query.lte('date', filters.date_to);
    const { data, error } = await query;
    if (error) handleError(error, 'TimeTrackingService.getAll');
    return data ?? [];
  },

  async create(payload: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>): Promise<TimeEntry> {
    const { data, error } = await (supabase as any)
      .from('time_entries')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'TimeTrackingService.create');
    return data!;
  },

  async update(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
    const { data, error } = await (supabase as any)
      .from('time_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'TimeTrackingService.update');
    return data!;
  },

  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any).from('time_entries').delete().eq('id', id);
    if (error) handleError(error, 'TimeTrackingService.delete');
  },

  async getSummary(caseId?: string): Promise<{ total_minutes: number; billable_minutes: number }> {
    let query = (supabase as any).from('time_entries').select('duration_minutes, billable');
    if (caseId) query = query.eq('case_id', caseId);
    const { data, error } = await query;
    if (error) handleError(error, 'TimeTrackingService.getSummary');
    const rows = data ?? [];
    return {
      total_minutes: rows.reduce((s: number, r: any) => s + r.duration_minutes, 0),
      billable_minutes: rows.filter((r: any) => r.billable).reduce((s: number, r: any) => s + r.duration_minutes, 0),
    };
  },
};

// ============================================================
// خدمة العقود
// ============================================================
export const ContractService = {
  async getAll(filters?: { status?: string; client_id?: string }): Promise<Contract[]> {
    let query = (supabase as any)
      .from('contracts')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.client_id) query = query.eq('client_id', filters.client_id);
    const { data, error } = await query;
    if (error) handleError(error, 'ContractService.getAll');
    return data ?? [];
  },

  async create(payload: Omit<Contract, 'id' | 'created_at' | 'updated_at'>): Promise<Contract> {
    const { data, error } = await (supabase as any)
      .from('contracts')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'ContractService.create');
    return data!;
  },

  async update(id: string, updates: Partial<Contract>): Promise<Contract> {
    const { data, error } = await (supabase as any)
      .from('contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'ContractService.update');
    return data!;
  },

  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any).from('contracts').delete().eq('id', id);
    if (error) handleError(error, 'ContractService.delete');
  },
};

// ============================================================
// خدمة الملكية الفكرية
// ============================================================
export const IPAssetService = {
  async getAll(filters?: { type?: string; status?: string; client_id?: string }): Promise<IPAsset[]> {
    let query = (supabase as any)
      .from('ip_assets')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.client_id) query = query.eq('client_id', filters.client_id);
    const { data, error } = await query;
    if (error) handleError(error, 'IPAssetService.getAll');
    return data ?? [];
  },

  async create(payload: Omit<IPAsset, 'id' | 'created_at' | 'updated_at'>): Promise<IPAsset> {
    const { data, error } = await (supabase as any)
      .from('ip_assets')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'IPAssetService.create');
    return data!;
  },

  async update(id: string, updates: Partial<IPAsset>): Promise<IPAsset> {
    const { data, error } = await (supabase as any)
      .from('ip_assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'IPAssetService.update');
    return data!;
  },

  async getExpiringAssets(days = 90): Promise<IPAsset[]> {
    const future = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await (supabase as any)
      .from('ip_assets')
      .select('*, clients(name)')
      .gte('expiry_date', today)
      .lte('expiry_date', future)
      .order('expiry_date');
    if (error) handleError(error, 'IPAssetService.getExpiringAssets');
    return data ?? [];
  },
};

// ============================================================
// خدمة التقويم
// ============================================================
export const CalendarService = {
  async getEvents(from: string, to: string): Promise<CalendarEvent[]> {
    const { data, error } = await (supabase as any)
      .from('calendar_events')
      .select('*, cases(title, case_number)')
      .gte('start_time', from)
      .lte('start_time', to)
      .order('start_time');
    if (error) handleError(error, 'CalendarService.getEvents');
    return data ?? [];
  },

  async create(payload: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
    const { data, error } = await (supabase as any)
      .from('calendar_events')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'CalendarService.create');
    return data!;
  },

  async update(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const { data, error } = await (supabase as any)
      .from('calendar_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'CalendarService.update');
    return data!;
  },

  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any).from('calendar_events').delete().eq('id', id);
    if (error) handleError(error, 'CalendarService.delete');
  },
};

// ============================================================
// خدمة فحص التعارض (Conflict Check)
// ============================================================
export const ConflictCheckService = {
  async check(term: string): Promise<{
    clients: Client[];
    opposingParties: Case[];
    hasConflict: boolean;
  }> {
    const [clientsResult, casesResult] = await Promise.all([
      (supabase as any)
        .from('clients')
        .select('id, name, type, national_id')
        .ilike('name', `%${term}%`),
      (supabase as any)
        .from('cases')
        .select('id, title, case_number, opposing_party, opposing_lawyer')
        .or(`opposing_party.ilike.%${term}%,opposing_lawyer.ilike.%${term}%`),
    ]);

    const clients = clientsResult.data ?? [];
    const cases = casesResult.data ?? [];

    // تسجيل نتيجة الفحص
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await (supabase as any).from('profiles').select('org_id').eq('id', user.id).single();
      if (profile.data?.org_id) {
        await (supabase as any).from('conflict_checks').insert({
          org_id: profile.data.org_id,
          checked_by: user.id,
          search_term: term,
          check_type: 'client',
          has_conflict: clients.length > 0 || cases.length > 0,
          results: { clients, cases },
        });
      }
    }

    return {
      clients: clients as Client[],
      opposingParties: cases as Case[],
      hasConflict: clients.length > 0 || cases.length > 0,
    };
  },
};

// ============================================================
// خدمة سجلات التدقيق
// ============================================================
export const AuditLogService = {
  async log(payload: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    await (supabase as any).from('audit_logs').insert(payload);
  },

  async getAll(filters?: { entity_type?: string; user_id?: string }): Promise<AuditLog[]> {
    let query = (supabase as any)
      .from('audit_logs')
      .select('*, profiles!user_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (filters?.entity_type) query = query.eq('entity_type', filters.entity_type);
    if (filters?.user_id) query = query.eq('user_id', filters.user_id);
    const { data, error } = await query;
    if (error) handleError(error, 'AuditLogService.getAll');
    return data ?? [];
  },
};

// ============================================================
// خدمة POA
// ============================================================
export const POAService = {
  async getAll(clientId?: string): Promise<POA[]> {
    let query = (supabase as any)
      .from('poa')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });
    if (clientId) query = query.eq('client_id', clientId);
    const { data, error } = await query;
    if (error) handleError(error, 'POAService.getAll');
    return data ?? [];
  },

  async create(payload: Omit<POA, 'id' | 'created_at' | 'updated_at'>): Promise<POA> {
    const { data, error } = await (supabase as any)
      .from('poa')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'POAService.create');
    return data!;
  },

  async update(id: string, updates: Partial<POA>): Promise<POA> {
    const { data, error } = await (supabase as any)
      .from('poa')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'POAService.update');
    return data!;
  },
};

// ============================================================
// خدمة التنفيذ القضائي
// ============================================================
export const EnforcementService = {
  async getAll(): Promise<EnforcementCase[]> {
    const { data, error } = await (supabase as any)
      .from('enforcement_cases')
      .select('*, clients(name), cases(title)')
      .order('created_at', { ascending: false });
    if (error) handleError(error, 'EnforcementService.getAll');
    return data ?? [];
  },

  async create(payload: Omit<EnforcementCase, 'id' | 'created_at' | 'updated_at'>): Promise<EnforcementCase> {
    const { data, error } = await (supabase as any)
      .from('enforcement_cases')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'EnforcementService.create');
    return data!;
  },

  async update(id: string, updates: Partial<EnforcementCase>): Promise<EnforcementCase> {
    const { data, error } = await (supabase as any)
      .from('enforcement_cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'EnforcementService.update');
    return data!;
  },
};

// ============================================================
// خدمة مهام الخبراء
// ============================================================
export const ExpertMissionService = {
  async getAll(caseId?: string): Promise<ExpertMission[]> {
    let query = (supabase as any)
      .from('expert_missions')
      .select('*, clients(name), cases(title)')
      .order('created_at', { ascending: false });
    if (caseId) query = query.eq('case_id', caseId);
    const { data, error } = await query;
    if (error) handleError(error, 'ExpertMissionService.getAll');
    return data ?? [];
  },

  async create(payload: Omit<ExpertMission, 'id' | 'created_at' | 'updated_at'>): Promise<ExpertMission> {
    const { data, error } = await (supabase as any)
      .from('expert_missions')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'ExpertMissionService.create');
    return data!;
  },

  async update(id: string, updates: Partial<ExpertMission>): Promise<ExpertMission> {
    const { data, error } = await (supabase as any)
      .from('expert_missions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'ExpertMissionService.update');
    return data!;
  },
};

// ============================================================
// خدمة ETA (الفواتير الإلكترونية)
// ============================================================
export const ETAService = {
  async getAll(): Promise<ETAInvoice[]> {
    const { data, error } = await (supabase as any)
      .from('eta_invoices')
      .select('*, invoices(invoice_number, total_amount)')
      .order('created_at', { ascending: false });
    if (error) handleError(error, 'ETAService.getAll');
    return data ?? [];
  },

  async create(payload: Omit<ETAInvoice, 'id' | 'created_at' | 'updated_at'>): Promise<ETAInvoice> {
    const { data, error } = await (supabase as any)
      .from('eta_invoices')
      .insert(payload)
      .select()
      .single();
    if (error) handleError(error, 'ETAService.create');
    return data!;
  },

  async updateStatus(id: string, status: ETAInvoice['eta_status'], responseData?: Record<string, unknown>): Promise<ETAInvoice> {
    const { data, error } = await (supabase as any)
      .from('eta_invoices')
      .update({ eta_status: status, response_data: responseData, submission_date: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'ETAService.updateStatus');
    return data!;
  },
};
