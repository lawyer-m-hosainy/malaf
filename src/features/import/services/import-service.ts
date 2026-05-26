/**
 * Import Service — malaf.pro
 * ═══════════════════════════
 * محرك ترحيل واستيراد البيانات المتكامل.
 * يدعم تحليل الملفات، التحقق والـ Dry Run، الإدراج المتسلسل، والتراجع (Rollback).
 */

import { supabase } from '@/lib/supabase';
import { requireOrgId, logAuditAction } from '@/services/utils';
import { encryptField } from '@/lib/encryption';
import {
  ClientImportSchema,
  CaseImportSchema,
  SessionImportSchema,
  normalizeColumnName,
  type ClientImportRow,
  type CaseImportRow,
  type SessionImportRow,
} from '../schemas/import-schemas';

// نوع الاستيراد
export type ImportType = 'clients' | 'cases' | 'sessions';

// بنية تقرير التحقق
export interface ValidationError {
  row: number;
  column?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface DryRunReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningsCount: number;
  errorsCount: number;
  errors: ValidationError[];
  preview: any[];
}

export interface ImportBatchResult {
  batchId: string;
  clientsCount: number;
  casesCount: number;
  sessionsCount: number;
}

interface ValidationContext {
  rawRow: Record<string, any>;
  rowNum: number;
  importType: ImportType;
  existingClients: any[];
  existingCases: any[];
}

/**
 * تحليل سطر واحد من ملف CSV مع مراعاة الاقتباس.
 * @param {string} rowText - نص السطر الواحد
 * @returns {string[]} الحقول المحللة للسطر
 */
function parseCSVRow(rowText: string): string[] {
  const row: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  row.push(currentValue.trim());
  return row;
}

/**
 * دالة مساعدة لتقسيم النص وتحليله كـ CSV مع مراعاة الحقول المحاطة بعلامات اقتباس.
 * @param {string} text - النص الكامل لملف CSV
 * @returns {string[][]} مصفوفة الأسطر والحقول المحللة
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  const rows = text.split(/\r?\n/);
  for (const rawRow of rows) {
    if (!rawRow.trim()) continue;
    const parsedRow = parseCSVRow(rawRow);
    if (parsedRow.length > 0 && parsedRow.some(val => val !== '')) {
      lines.push(parsedRow);
    }
  }
  return lines;
}

/**
 * تحليل ملف CSV أو JSON إلى مصفوفة كائنات مسطحة مع تطبيع أسماء الحقول.
 * @param {string} content - محتوى الملف النصي
 * @param {'csv' | 'json'} type - نوع الملف
 * @param {ImportType} importType - نوع البيانات المستوردة
 * @returns {{ headers: string[]; rows: Record<string, any>[] }} الأعمدة والصفوف المحللة والمطبعة
 */
export function parseAndNormalizeFile(
  content: string,
  type: 'csv' | 'json',
  importType: ImportType
): { headers: string[]; rows: Record<string, any>[] } {
  if (type === 'json') {
    const parsed = JSON.parse(content);
    const rawRows = Array.isArray(parsed) ? parsed : [parsed];
    if (rawRows.length === 0) return { headers: [], rows: [] };
    
    const headers = Object.keys(rawRows[0]);
    const rows = rawRows.map(row => {
      const normalizedRow: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        normalizedRow[normalizeColumnName(k)] = v;
      }
      return normalizedRow;
    });
    return { headers, rows };
  } else {
    const parsedLines = parseCSV(content);
    if (parsedLines.length <= 1) return { headers: [], rows: [] };

    const rawHeaders = parsedLines[0];
    const normalizedHeaders = rawHeaders.map(h => normalizeColumnName(h));
    
    const rows = parsedLines.slice(1).map(line => {
      const row: Record<string, any> = {};
      normalizedHeaders.forEach((header, index) => {
        row[header] = line[index] !== undefined ? line[index] : '';
      });
      return row;
    });

    return { headers: rawHeaders, rows };
  }
}

/**
 * جلب البيانات الحالية من قاعدة البيانات لربط العلاقات وتجنب التكرار.
 * @param {string} orgId - معرف المكتب المستأجر
 * @param {ImportType} importType - نوع الاستيراد
 * @returns {Promise<{ existingClients: any[]; existingCases: any[] }>} الموكلين والقضايا الحالية
 */
async function fetchExistingData(orgId: string, importType: ImportType) {
  let existingClients: { id: string; name: string }[] = [];
  let existingCases: { id: string; first_instance_number: string }[] = [];

  if (importType === 'cases' || importType === 'sessions') {
    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .eq('organization_id', orgId)
      .is('deleted_at', null);
    existingClients = data || [];
  }

  if (importType === 'sessions') {
    const { data } = await supabase
      .from('cases')
      .select('id, first_instance_number')
      .eq('organization_id', orgId)
      .is('deleted_at', null);
    existingCases = data || [];
  }

  return { existingClients, existingCases };
}

/**
 * التحقق من منطق الموكلين لمنع التكرار بالاسم.
 * @param {any} client - بيانات الموكل
 * @param {number} rowNum - رقم السطر
 * @param {any[]} existingClients - قائمة الموكلين الحاليين
 * @param {ValidationError[]} errors - مصفوفة لتسجيل الأخطاء
 * @returns {void}
 */
function validateClientLogic(client: any, rowNum: number, existingClients: any[], errors: ValidationError[]) {
  const existsInDb = existingClients.some(c => c.name.toLowerCase() === client.name.toLowerCase());
  if (existsInDb) {
    errors.push({
      row: rowNum,
      column: 'name',
      message: `الموكل "${client.name}" موجود بالفعل في النظام، سيتم ربط القضايا الجديدة به في حال استيراد قضايا.`,
      severity: 'warning',
    });
  }
}

/**
 * التحقق من منطق القضايا والتنبيه لإنشاء موكل تلقائي.
 * @param {any} item - بيانات القضية
 * @param {number} rowNum - رقم السطر
 * @param {any[]} existingClients - قائمة الموكلين الحاليين
 * @param {ValidationError[]} errors - مصفوفة لتسجيل الأخطاء
 * @returns {void}
 */
function validateCaseLogic(item: any, rowNum: number, existingClients: any[], errors: ValidationError[]) {
  const clientExists = existingClients.some(c => c.name.toLowerCase() === item.client_name.toLowerCase());
  if (!clientExists) {
    errors.push({
      row: rowNum,
      column: 'client_name',
      message: `الموكل "${item.client_name}" غير مسجل. سيقوم النظام بإنشائه تلقائياً كـ (فرد).`,
      severity: 'warning',
    });
  }
}

/**
 * التحقق من منطق الجلسات للتأكد من وجود القضية المطلوبة.
 * @param {any} session - بيانات الجلسة
 * @param {number} rowNum - رقم السطر
 * @param {any[]} existingCases - قائمة القضايا الحالية
 * @param {ValidationError[]} errors - مصفوفة لتسجيل الأخطاء
 * @returns {void}
 */
function validateSessionLogic(session: any, rowNum: number, existingCases: any[], errors: ValidationError[]) {
  const caseExists = existingCases.some(
    c => c.first_instance_number.trim() === session.case_number.trim()
  );
  if (!caseExists) {
    errors.push({
      row: rowNum,
      column: 'case_number',
      message: `رقم القضية "${session.case_number}" غير موجود في النظام. لا يمكن ربط جلسة بقضية غير موجودة.`,
      severity: 'error',
    });
  }
}

/**
 * فحص سطر واحد منطقياً وحسب الـ Zod schema.
 * @param {ValidationContext} ctx - سياق الفحص للسطر
 * @returns {{ validatedData: any; errors: ValidationError[] }} السجل الذي تم التحقق منه والأخطاء إن وجدت
 */
function validateRow(ctx: ValidationContext): { validatedData: any; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  let schema: any;

  if (ctx.importType === 'clients') schema = ClientImportSchema;
  else if (ctx.importType === 'cases') schema = CaseImportSchema;
  else schema = SessionImportSchema;

  const result = schema.safeParse(ctx.rawRow);

  if (!result.success) {
    const validationErrors = result.error.issues.map((issue: any) => ({
      row: ctx.rowNum,
      column: issue.path.join('.'),
      message: issue.message,
      severity: 'error' as const,
    }));
    return { validatedData: null, errors: validationErrors };
  }

  const validatedData = result.data;
  
  if (ctx.importType === 'clients') {
    validateClientLogic(validatedData, ctx.rowNum, ctx.existingClients, errors);
  } else if (ctx.importType === 'cases') {
    validateCaseLogic(validatedData, ctx.rowNum, ctx.existingClients, errors);
  } else if (ctx.importType === 'sessions') {
    validateSessionLogic(validatedData, ctx.rowNum, ctx.existingCases, errors);
  }

  return { validatedData, errors };
}

/**
 * فحص البيانات قبل الاستيراد (Dry Run Mode).
 * @param {Record<string, any>[]} rows - صفوف البيانات المستوردة
 * @param {ImportType} importType - نوع الاستيراد
 * @returns {Promise<DryRunReport>} تقرير فحص البيانات المفصل
 */
export async function runDryRun(
  rows: Record<string, any>[],
  importType: ImportType
): Promise<DryRunReport> {
  const orgId = requireOrgId();
  const errors: ValidationError[] = [];
  let validRows = 0;
  let invalidRows = 0;
  let warningsCount = 0;
  let errorsCount = 0;

  const { existingClients, existingCases } = await fetchExistingData(orgId, importType);
  const previewList: any[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const rowNum = idx + 2; 
    const rawRow = rows[idx];
    
    const rowReport = validateRow({ rawRow, rowNum, importType, existingClients, existingCases });
    
    if (rowReport.errors.length === 0) {
      validRows++;
      if (previewList.length < 5) previewList.push({ rowNum, ...rowReport.validatedData });
      continue;
    }

    errors.push(...rowReport.errors);
    
    const hasError = rowReport.errors.some(e => e.severity === 'error');
    if (hasError) {
      invalidRows++;
      errorsCount += rowReport.errors.filter(e => e.severity === 'error').length;
    }
    
    const hasWarning = rowReport.errors.some(e => e.severity === 'warning');
    if (hasWarning) {
      warningsCount += rowReport.errors.filter(e => e.severity === 'warning').length;
    }
    
    if (!hasError) {
      validRows++;
      if (previewList.length < 5) previewList.push({ rowNum, ...rowReport.validatedData });
    }
  }

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    warningsCount,
    errorsCount,
    errors,
    preview: previewList,
  };
}

/**
 * فلترة واستخلاص الصفوف الصالحة للاستيراد فقط بعد المطابقة.
 * @param {Record<string, any>[]} rows - صفوف البيانات
 * @param {ImportType} importType - نوع الاستيراد
 * @returns {any[]} الصفوف الصالحة
 */
function filterValidRows(rows: Record<string, any>[], importType: ImportType): any[] {
  const validRowsToInsert: any[] = [];
  let schema: any;
  if (importType === 'clients') schema = ClientImportSchema;
  else if (importType === 'cases') schema = CaseImportSchema;
  else schema = SessionImportSchema;

  for (const rawRow of rows) {
    const result = schema.safeParse(rawRow);
    if (result.success) {
      validRowsToInsert.push(result.data);
    }
  }
  return validRowsToInsert;
}

/**
 * إنشاء سجل دفعة جديد في وضع التحضير (dry_run).
 * @param {string} orgId - معرف المستأجر
 * @param {ImportType} importType - نوع الاستيراد
 * @param {string} fileName - اسم الملف
 * @returns {Promise<string>} معرف الدفعة المستوردة الجديد
 */
async function createImportBatch(orgId: string, importType: ImportType, fileName: string): Promise<string> {
  const { data, error } = await supabase
    .from('import_batches')
    .insert({
      organization_id: orgId,
      file_name: fileName,
      status: 'dry_run',
      record_type: importType,
      imported_records: { clients: 0, cases: 0, sessions: 0 },
      imported_ids: { clients: [], cases: [], sessions: [] },
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`فشل إنشاء دفعة الاستيراد: ${error?.message}`);
  }
  return data.id;
}

/**
 * تنفيذ استيراد الموكلين وتشفير بياناتهم الحساسة.
 * @param {ClientImportRow[]} clients - صفوف الموكلين
 * @param {string} orgId - معرف المستأجر
 * @param {any} importedIds - المعرفات المدرجة للتتبع
 * @returns {Promise<void>}
 */
async function executeClientsImport(clients: ClientImportRow[], orgId: string, importedIds: any): Promise<void> {
  for (const client of clients) {
    const encryptedNationalId = client.national_id ? await encryptField(client.national_id) : null;
    const encryptedCommercialReg = client.commercial_registration
      ? await encryptField(client.commercial_registration)
      : null;

    const { data: newClient, error: insErr } = await supabase
      .from('clients')
      .insert({
        organization_id: orgId,
        type: client.type,
        name: client.name,
        national_id_encrypted: encryptedNationalId,
        commercial_registration_encrypted: encryptedCommercialReg,
        phone: client.phone,
        governorate: client.governorate,
        notes: client.notes,
      })
      .select('id')
      .single();

    if (insErr) throw insErr;
    if (newClient) importedIds.clients.push(newClient.id);
  }
}

/**
 * حل ومعرفة معرف الموكل بالاسم، وإنشائه تلقائياً إذا غاب.
 * @param {string} clientName - الاسم الكامل للموكل
 * @param {string} orgId - معرف المكتب المستأجر
 * @param {Map<string, string>} clientMap - خريطة أسماء الموكلين بالمعرفات
 * @param {any} importedIds - المعرفات التراكمية المستوردة
 * @returns {Promise<string>} معرف الموكل
 */
async function resolveClientId(
  clientName: string, 
  orgId: string, 
  clientMap: Map<string, string>, 
  importedIds: any
): Promise<string> {
  const clientId = clientMap.get(clientName.toLowerCase());
  if (clientId) return clientId;

  const { data: newClient, error: clientErr } = await supabase
    .from('clients')
    .insert({
      organization_id: orgId,
      type: 'فرد',
      name: clientName,
    })
    .select('id')
    .single();

  if (clientErr || !newClient) {
    throw new Error(`فشل إنشاء الموكل التلقائي: ${clientErr?.message || 'غير محدد'}`);
  }

  importedIds.clients.push(newClient.id);
  clientMap.set(clientName.toLowerCase(), newClient.id);
  return newClient.id;
}

/**
 * تنفيذ استيراد القضايا مع إمكانية الإنشاء التلقائي للموكل غير المسجل.
 * @param {CaseImportRow[]} cases - صفوف القضايا
 * @param {string} orgId - معرف المستأجر
 * @param {any} importedIds - المعرفات المدرجة للتتبع
 * @returns {Promise<void>}
 */
async function executeCasesImport(cases: CaseImportRow[], orgId: string, importedIds: any): Promise<void> {
  const { data: clientsDb } = await supabase
    .from('clients')
    .select('id, name')
    .eq('organization_id', orgId)
    .is('deleted_at', null);
  const clientMap = new Map<string, string>((clientsDb || []).map(c => [c.name.toLowerCase(), c.id]));

  for (const item of cases) {
    const clientId = await resolveClientId(item.client_name, orgId, clientMap, importedIds);
    const filingDateStr = item.filing_date ? item.filing_date.toISOString() : new Date().toISOString();

    const { data: newCase, error: caseErr } = await supabase
      .from('cases')
      .insert({
        organization_id: orgId,
        client_id: clientId,
        type: item.type,
        court: item.court_name || 'غير محدد',
        status: item.status,
        plaintiff: item.plaintiff,
        defendant: item.defendant,
        first_instance_number: item.case_number,
        created_at: filingDateStr,
      })
      .select('id')
      .single();

    if (caseErr) throw caseErr;
    if (newCase) importedIds.cases.push(newCase.id);
  }
}

/**
 * تنفيذ استيراد الجلسات وتأكيد ربطها بالقضايا المعرفة مسبقاً.
 * @param {SessionImportRow[]} sessions - صفوف الجلسات
 * @param {string} orgId - معرف المستأجر
 * @param {any} importedIds - المعرفات المدرجة للتتبع
 * @returns {Promise<void>}
 */
async function executeSessionsImport(sessions: SessionImportRow[], orgId: string, importedIds: any): Promise<void> {
  const { data: casesDb } = await supabase
    .from('cases')
    .select('id, first_instance_number')
    .eq('organization_id', orgId)
    .is('deleted_at', null);
  const caseMap = new Map<string, string>((casesDb || []).map(c => [c.first_instance_number.trim(), c.id]));

  for (const s of sessions) {
    const caseId = caseMap.get(s.case_number.trim());
    if (!caseId) continue;

    const { data: newSession, error: sErr } = await supabase
      .from('sessions')
      .insert({
        organization_id: orgId,
        case_id: caseId,
        date: s.date,
        time: s.time ? `${s.time}:00` : '09:00:00',
        court: s.court || 'غير محدد',
        circuit: s.circuit,
        status: s.status,
        previous_decision: s.previous_decision,
        notes: s.notes,
      })
      .select('id')
      .single();

    if (sErr) throw sErr;
    if (newSession) importedIds.sessions.push(newSession.id);
  }
}

/**
 * تحديث حالة الدفعة المستوردة لـ مكتمل (completed).
 * @param {string} batchId - معرف الدفعة
 * @param {string} orgId - معرف المستأجر
 * @param {any} importedIds - معرفات العناصر المستوردة
 * @param {string} fileName - اسم الملف
 * @returns {Promise<void>}
 */
async function updateBatchSuccess(batchId: string, orgId: string, importedIds: any, fileName: string): Promise<void> {
  const { error: updError } = await supabase
    .from('import_batches')
    .update({
      status: 'completed',
      imported_records: {
        clients: importedIds.clients.length,
        cases: importedIds.cases.length,
        sessions: importedIds.sessions.length,
      },
      imported_ids: importedIds,
    })
    .eq('id', batchId);

  if (updError) throw updError;

  await logAuditAction(
    'IMPORT',
    'import_batches',
    batchId,
    `استيراد ${fileName} بنجاح: ${importedIds.clients.length} موكل، ${importedIds.cases.length} قضية، ${importedIds.sessions.length} جلسة`
  );
}

/**
 * الحذف المتسلسل الآمن لدفعة مستوردة لإلغائها تماماً.
 * @param {any} importedIds - المعرفات المستهدفة بالحذف
 * @param {string} batchId - معرف الدفعة
 * @returns {Promise<void>}
 */
async function rollbackImportIds(importedIds: any, batchId: string): Promise<void> {
  if (importedIds.sessions.length > 0) {
    await supabase.from('sessions').delete().in('id', importedIds.sessions);
  }
  if (importedIds.cases.length > 0) {
    await supabase.from('cases').delete().in('id', importedIds.cases);
  }
  if (importedIds.clients.length > 0) {
    await supabase.from('clients').delete().in('id', importedIds.clients);
  }
  await supabase.from('import_batches').delete().eq('id', batchId);
}

/**
 * تنفيذ الاستيراد الفعلي للبيانات.
 * @param {Record<string, any>[]} rows - صفوف البيانات الكاملة
 * @param {ImportType} importType - نوع الاستيراد
 * @param {string} fileName - اسم الملف المستورد
 * @returns {Promise<ImportBatchResult>} نتائج الاستيراد من قاعدة البيانات
 */
export async function executeImport(
  rows: Record<string, any>[],
  importType: ImportType,
  fileName: string
): Promise<ImportBatchResult> {
  const orgId = requireOrgId();
  
  const report = await runDryRun(rows, importType);
  if (report.validRows === 0) {
    throw new Error('لا توجد صفوف صالحة للاستيراد في الملف.');
  }

  const batchId = await createImportBatch(orgId, importType, fileName);
  const importedIds = { clients: [] as string[], cases: [] as string[], sessions: [] as string[] };
  
  try {
    const validRowsToInsert = filterValidRows(rows, importType);

    if (importType === 'clients') {
      await executeClientsImport(validRowsToInsert, orgId, importedIds);
    } else if (importType === 'cases') {
      await executeCasesImport(validRowsToInsert, orgId, importedIds);
    } else if (importType === 'sessions') {
      await executeSessionsImport(validRowsToInsert, orgId, importedIds);
    }

    await updateBatchSuccess(batchId, orgId, importedIds, fileName);

    return {
      batchId,
      clientsCount: importedIds.clients.length,
      casesCount: importedIds.cases.length,
      sessionsCount: importedIds.sessions.length,
    };
  } catch (error: any) {
    await rollbackImportIds(importedIds, batchId);
    throw new Error(`فشل استيراد البيانات وتم التراجع تلقائياً: ${error.message}`);
  }
}

/**
 * جلب تفاصيل دفعة الاستيراد للتراجع عنها.
 * @param {string} batchId - معرف الدفعة
 * @param {string} orgId - معرف المستأجر
 * @returns {Promise<any>} كائن الدفعة
 */
async function fetchBatch(batchId: string, orgId: string): Promise<any> {
  const { data, error } = await supabase
    .from('import_batches')
    .select('*')
    .eq('id', batchId)
    .eq('organization_id', orgId)
    .single();

  if (error || !data) {
    throw new Error(`لم يتم العثور على دفعة الاستيراد: ${error?.message || 'غير موجودة'}`);
  }
  return data;
}

/**
 * الحذف الفعلي بالتسلسل الصحيح لسجلات الدفعة.
 * @param {string[]} clients - معرفات الموكلين
 * @param {string[]} cases - معرفات القضايا
 * @param {string[]} sessions - معرفات الجلسات
 * @returns {Promise<void>}
 */
async function performRollbackDeletions(clients: string[], cases: string[], sessions: string[]): Promise<void> {
  if (sessions.length > 0) {
    const { error: sErr } = await supabase
      .from('sessions')
      .delete()
      .in('id', sessions);
    if (sErr) throw sErr;
  }

  if (cases.length > 0) {
    const { error: cErr } = await supabase
      .from('cases')
      .delete()
      .in('id', cases);
    if (cErr) throw cErr;
  }

  if (clients.length > 0) {
    const { error: clErr } = await supabase
      .from('clients')
      .delete()
      .in('id', clients);
    if (clErr) throw clErr;
  }
}

/**
 * وسم الدفعة كـ ملغاة (rolled_back).
 * @param {string} batchId - معرف الدفعة
 * @param {string} fileName - اسم الملف المرفق
 * @returns {Promise<void>}
 */
async function markBatchRolledBack(batchId: string, fileName: string): Promise<void> {
  const { error } = await supabase
    .from('import_batches')
    .update({ status: 'rolled_back' })
    .eq('id', batchId);
  if (error) throw error;

  await logAuditAction(
    'ROLLBACK_IMPORT',
    'import_batches',
    batchId,
    `تم التراجع بنجاح عن استيراد الملف: ${fileName}`
  );
}

/**
 * التراجع عن دفعة مستوردة بالكامل (Batch Rollback).
 * @param {string} batchId - معرف دفعة الاستيراد
 * @returns {Promise<void>}
 */
export async function rollbackBatch(batchId: string): Promise<void> {
  const orgId = requireOrgId();
  const batch = await fetchBatch(batchId, orgId);

  if (batch.status === 'rolled_back') {
    throw new Error('تم التراجع عن هذه الدفعة بالفعل مسبقاً.');
  }

  const { clients = [], cases = [], sessions = [] } = batch.imported_ids || {};

  try {
    await performRollbackDeletions(clients, cases, sessions);
    await markBatchRolledBack(batchId, batch.file_name);
  } catch (error: any) {
    throw new Error(`فشل التراجع عن دفعة الاستيراد: ${error.message}`);
  }
}

/**
 * تحميل مكتبة SheetJS ديناميكياً لتجنب تضخيم حجم الكود النهائي (Bundle Size).
 * @returns {Promise<any>} كائن مكتبة XLSX
 */
export async function loadSheetJS(): Promise<any> {
  if ((window as any).XLSX) return (window as any).XLSX;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = () => resolve((window as any).XLSX);
    script.onerror = () => reject(new Error('فشل تحميل مكتبة معالجة ملفات Excel.'));
    document.head.appendChild(script);
  });
}

/**
 * تحليل ملف Excel باستخدام SheetJS وإرجاع الأعمدة والصفوف.
 * @param {File} file - ملف Excel
 * @returns {Promise<{ headers: string[]; rows: Record<string, any>[] }>} الأعمدة والصفوف المقروءة
 */
export async function parseExcel(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  const XLSX = await loadSheetJS();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rawJson.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }

        const rawHeaders = rawJson[0].map(h => String(h || '').trim());
        const normalizedHeaders = rawHeaders.map(h => normalizeColumnName(h));

        const rows: Record<string, any>[] = [];
        for (let i = 1; i < rawJson.length; i++) {
          const line = rawJson[i];
          if (!line || line.length === 0 || line.every((val: any) => val === null || val === undefined || val === '')) continue;
          
          const row: Record<string, any> = {};
          normalizedHeaders.forEach((header, index) => {
            row[header] = line[index] !== undefined && line[index] !== null ? line[index] : '';
          });
          rows.push(row);
        }

        resolve({ headers: rawHeaders, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف.'));
    reader.readAsArrayBuffer(file);
  });
}
