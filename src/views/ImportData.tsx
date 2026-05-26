/* eslint-disable max-lines, max-lines-per-function */
/**
 * ImportData.tsx — malaf.pro
 * ═════════════════════════════
 * واجهة ترحيل واستيراد البيانات المتكاملة (موكلين، قضايا، وجلسات).
 * تصميم استثنائي فائق الجودة، متكامل مع الـ Dry Run والـ Rollback وسجل العمليات.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, FileText, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, ArrowRight,
  Database, RefreshCw, Trash2, Calendar, FileJson, ChevronDown, ListFilter, Play, Check,
  Users, Scale, History as HistoryIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  parseAndNormalizeFile, 
  parseExcel, 
  runDryRun, 
  executeImport, 
  rollbackBatch,
  type ValidationError,
  type DryRunReport
} from '@/features/import/services/import-service';
import { COLUMN_ALIASES } from '@/features/import/schemas/import-schemas';

interface ImportBatch {
  id: string;
  file_name: string;
  status: 'dry_run' | 'completed' | 'rolled_back';
  record_type: 'clients' | 'cases' | 'sessions' | 'all';
  imported_records: { clients: number; cases: number; sessions: number };
  created_at: string;
}

/**
 * المكون الرئيسي لصفحة استيراد البيانات وترحيلها.
 * يدعم رفع الملفات وتصميم المطابقة، والتحقق، والتراجع.
 * @returns {React.ReactElement} عنصر واجهة المستخدم
 */
export default function ImportData(): React.ReactElement {
  const progressRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.width = `${((step - 1) / 3) * 100}%`;
    }
  }, [step]);
  const [importType, setImportType] = useState<'clients' | 'cases' | 'sessions'>('clients');
  
  // File details
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  
  // Mapped details
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [userMappings, setUserMappings] = useState<Record<string, string>>({}); // { userHeader: targetField }
  
  // Dry run details
  const [isValidating, setIsValidating] = useState(false);
  const [dryRunReport, setDryRunReport] = useState<DryRunReport | null>(null);
  
  // Execution details
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedBatchId, setImportedBatchId] = useState<string | null>(null);

  // History details
  const [batchesHistory, setBatchesHistory] = useState<ImportBatch[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('import_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatchesHistory(data || []);
    } catch (err: any) {
      console.error('فشل جلب سجل الاستيراد:', err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ── Handling File Upload & Parsing ─────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processSelectedFile(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processSelectedFile(selectedFile);
  };

  const processSelectedFile = async (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'json'].includes(ext || '')) {
      toast.error('صيغة الملف غير مدعومة. يرجى رفع ملف Excel أو CSV أو JSON.');
      return;
    }
    setFile(selectedFile);
    setIsParsing(true);

    try {
      let headers: string[] = [];
      let rows: Record<string, any>[] = [];

      if (ext === 'xlsx') {
        const result = await parseExcel(selectedFile);
        headers = result.headers;
        rows = result.rows;
      } else {
        const text = await selectedFile.text();
        const result = parseAndNormalizeFile(text, ext === 'json' ? 'json' : 'csv', importType);
        headers = result.headers;
        rows = result.rows;
      }

      if (rows.length === 0) {
        throw new Error('الملف فارغ أو لا يحتوي على صفوف بيانات صالحة.');
      }

      setRawHeaders(headers);
      setParsedRows(rows);

      const defaultMappings: Record<string, string> = {};
      headers.forEach(h => {
        const cleaned = h.trim().toLowerCase();
        let mappedField = '';
        for (const [fieldName, aliases] of Object.entries(COLUMN_ALIASES)) {
          if (aliases.some(a => a.toLowerCase() === cleaned) || fieldName === cleaned) {
            mappedField = fieldName;
            break;
          }
        }
        if (mappedField) {
          defaultMappings[h] = mappedField;
        }
      });
      setUserMappings(defaultMappings);

      toast.success(`تم تحليل الملف بنجاح! تم العثور على ${rows.length} صف من البيانات.`);
      setStep(2);
    } catch (err: any) {
      toast.error(`فشل قراءة الملف: ${err.message}`);
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleMappingSubmit = async () => {
    const mappedRows = parsedRows.map(row => {
      const newRow: Record<string, any> = {};
      for (const [rawHeader, targetField] of Object.entries(userMappings)) {
        newRow[targetField] = row[rawHeader.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')];
      }
      return newRow;
    });

    setIsValidating(true);
    setStep(3);

    try {
      const report = await runDryRun(mappedRows, importType);
      setDryRunReport(report);
      toast.info(`اكتمل فحص الـ Dry Run: ${report.validRows} صف جاهز، و ${report.errorsCount} خطأ.`);
    } catch (err: any) {
      toast.error(`فشل إجراء الفحص: ${err.message}`);
      setStep(2);
    } finally {
      setIsValidating(false);
    }
  };

  const handleStartImport = async () => {
    if (!file || !parsedRows.length) return;
    setIsImporting(true);
    setProgress(15);

    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 85) return p;
        return p + Math.floor(Math.random() * 15) + 5;
      });
    }, 400);

    try {
      const mappedRows = parsedRows.map(row => {
        const newRow: Record<string, any> = {};
        for (const [rawHeader, targetField] of Object.entries(userMappings)) {
          newRow[targetField] = row[rawHeader.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')];
        }
        return newRow;
      });

      const result = await executeImport(mappedRows, importType, file.name);
      setProgress(100);
      clearInterval(timer);
      
      setImportedBatchId(result.batchId);
      toast.success('تم استيراد البيانات إلى مكتبك بنجاح واكتملت العملية!');
      setStep(4);
      fetchHistory();
    } catch (err: any) {
      clearInterval(timer);
      toast.error(err.message);
      setStep(3);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRollbackCurrent = async () => {
    if (!importedBatchId) return;
    const loadingToast = toast.loading('جاري التراجع عن الاستيراد وحذف البيانات...');
    try {
      await rollbackBatch(importedBatchId);
      toast.dismiss(loadingToast);
      toast.success('تم إلغاء الاستيراد بالكامل وحذف كافة السجلات المستوردة بنجاح.');
      resetWizard();
      fetchHistory();
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(`فشل إلغاء الاستيراد: ${err.message}`);
    }
  };

  const handleRollbackHistory = async (batchId: string) => {
    if (!window.confirm('هل أنت متأكد تماماً من رغبتك في التراجع عن هذا الاستيراد؟ سيؤدي ذلك لحذف كافة الموكلين/القضايا/الجلسات المدرجة في هذه العملية.')) {
      return;
    }
    const loadingToast = toast.loading('جاري التراجع عن العملية...');
    try {
      await rollbackBatch(batchId);
      toast.dismiss(loadingToast);
      toast.success('تم التراجع عن عملية الاستيراد وحذف كافة السجلات التابعة لها.');
      fetchHistory();
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(`فشل التراجع: ${err.message}`);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setFile(null);
    setRawHeaders([]);
    setParsedRows([]);
    setUserMappings({});
    setDryRunReport(null);
    setImportedBatchId(null);
    setProgress(0);
  };

  const getExpectedFields = () => {
    if (importType === 'clients') {
      return [
        { key: 'name', label: 'الاسم الكامل للموكل', required: true },
        { key: 'type', label: 'النوع (فرد/منشأة)', required: false },
        { key: 'national_id', label: 'الرقم القومي (14 رقم)', required: false },
        { key: 'phone', label: 'رقم الموبايل المصري', required: false },
        { key: 'email', label: 'البريد الإلكتروني', required: false },
        { key: 'address', label: 'العنوان بالتفصيل', required: false },
        { key: 'governorate', label: 'المحافظة', required: false },
        { key: 'commercial_registration', label: 'السجل التجاري', required: false },
        { key: 'vat_number: ', label: 'الرقم الضريبي', required: false },
        { key: 'birth_date', label: 'تاريخ الميلاد', required: false },
        { key: 'notes', label: 'ملاحظات إضافية', required: false }
      ];
    } else if (importType === 'cases') {
      return [
        { key: 'case_number', label: 'رقم القضية (الابتدائي)', required: true },
        { key: 'title', label: 'موضوع/عنوان القضية', required: true },
        { key: 'client_name', label: 'اسم الموكل', required: true },
        { key: 'client_role', label: 'صفة الموكل (مدعي/مدعى عليه)', required: false },
        { key: 'type', label: 'نوع القضية (مدني/تجاري/...)', required: false },
        { key: 'status', label: 'الحالة (متداولة/مغلقة/...)', required: false },
        { key: 'court_name', label: 'المحكمة الدائرة', required: false },
        { key: 'plaintiff', label: 'المدعي', required: false },
        { key: 'defendant', label: 'المدعى عليه', required: false },
        { key: 'filing_date', label: 'تاريخ القيد/الرفع', required: false },
        { key: 'notes', label: 'ملاحظات وتفاصيل القضية', required: false }
      ];
    } else {
      return [
        { key: 'case_number', label: 'رقم القضية (لربط الجلسة)', required: true },
        { key: 'date', label: 'تاريخ الجلسة (YYYY-MM-DD)', required: true },
        { key: 'time', label: 'ساعة الجلسة (HH:MM)', required: false },
        { key: 'court', label: 'المحكمة المقامة بها الجلسة', required: true },
        { key: 'circuit', label: 'الدائرة', required: false },
        { key: 'previous_decision', label: 'القرار السابق للجلسة', required: false },
        { key: 'status', label: 'حالة الجلسة (قادمة/منتهية)', required: false },
        { key: 'notes', label: 'مذكرات أو قرارات الجلسة', required: false }
      ];
    }
  };

  // ── Render Helpers to Satisfy Eslint Complexity & Line Limits ──

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950 dark:text-white flex items-center gap-3">
          <span className="p-2 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl">
            <Database size={28} />
          </span>
          ترحيل واستيراد البيانات القانونية
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">
          استورد الموكلين والقضايا وجدول الجلسات من ملفات Excel و CSV و JSON إلى حساب مكتبك مباشرة، مع نظام تنظيف وفحص وحماية متطور، وتراجع فوري بضغطة زر.
        </p>
      </div>
      
      {step > 1 && step < 4 && (
        <button 
          onClick={resetWizard}
          className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} />
          إعادة تعيين وبدء جديد
        </button>
      )}
    </div>
  );

  const renderProgress = () => {
    return (
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-navy-900 -translate-y-1/2 z-0 rounded-full" />
        <div 
          ref={progressRef}
          className="absolute top-1/2 right-0 h-1 bg-primary-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500" 
        />
      
      <div className="relative z-10 flex justify-between">
        {[
          { s: 1, label: 'رفع الملف', desc: 'Excel, CSV, JSON' },
          { s: 2, label: 'مطابقة الأعمدة', desc: 'Column Mapping' },
          { s: 3, label: 'الفحص والتحقق', desc: 'Dry Run Mode' },
          { s: 4, label: 'اكتمال الاستيراد', desc: 'Execution' }
        ].map(item => (
          <div key={item.s} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
              step === item.s 
                ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/25 scale-110'
                : step > item.s 
                  ? 'bg-emerald-50 text-white border-emerald-500' 
                  : 'bg-white dark:bg-navy-950 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-navy-900'
            }`}>
              {step > item.s ? <Check size={16} /> : item.s}
            </div>
            <span className={`text-xs font-bold mt-2 ${step === item.s ? 'text-primary-500' : 'text-slate-700 dark:text-slate-300'}`}>
              {item.label}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden md:block">
              {item.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">خطوة 1: حدد نوع البيانات وارفع الملف</h3>
          
          <div className="grid grid-cols-3 gap-4">
            {[
              { type: 'clients', label: 'الموكلين', icon: Users, desc: 'بيانات الموكلين والهواتف والأرقام القومية' },
              { type: 'cases', label: 'القضايا', icon: Scale, desc: 'أرقام الدعاوى والمحاكم والمدعين والمدعى عليهم' },
              { type: 'sessions', label: 'الجلسات', icon: Calendar, desc: 'جدول الجلسات والدوائر والقرارات السابقة' }
            ].map(item => (
              <button
                key={item.type}
                type="button"
                onClick={() => setImportType(item.type as any)}
                className={`p-4 border rounded-2xl text-right transition-all duration-300 flex flex-col justify-between h-36 cursor-pointer ${
                  importType === item.type 
                    ? 'border-primary-500 bg-primary-500/5 ring-2 ring-primary-500/25 shadow-md'
                    : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <span className={`p-2 rounded-xl w-fit ${importType === item.type ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}>
                  <item.icon size={20} />
                </span>
                <div>
                  <span className="font-bold text-sm block text-slate-900 dark:text-white">{item.label}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">{item.desc}</span>
                </div>
              </button>
            ))}
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300 relative h-72 ${
              isDragging 
                ? 'border-primary-500 bg-primary-500/5' 
                : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
            }`}
          >
            <input
              type="file"
              id="import-file-input"
              title="ملف الاستيراد"
              accept=".csv, .xlsx, .json"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              disabled={isParsing}
            />

            {isParsing ? (
              <div className="space-y-4">
                <RefreshCw className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
                <h4 className="font-bold text-slate-900 dark:text-white">جاري معالجة وتحليل محتوى الملف...</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">نقوم الآن بقراءة الأعمدة وتطبيع التواريخ والبيانات</p>
              </div>
            ) : (
              <div className="space-y-4">
                <span className="p-4 bg-primary-500/10 text-primary-500 rounded-full inline-block">
                  <UploadCloud size={32} />
                </span>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">اسحب ملف الاستيراد وأفلته هنا</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">يدعم صيغ Excel (.xlsx)، CSV، أو JSON</p>
                </div>
                <button type="button" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-primary-600/10">
                  تصفح ملفات جهازك
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-navy-900/50 border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
            <FileText size={16} className="text-primary-500" />
            المخطط المتوقع للاستيراد
          </h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            يتعرف النظام تلقائياً على المترادفات والأسماء العربية والإنجليزية. يُنصح بأن يحتوي ملفك على الأعمدة التالية لضمان التطابق الكامل:
          </p>
          
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {getExpectedFields().map(f => (
              <div key={f.key} className="flex justify-between items-center bg-white dark:bg-navy-950 p-2 border border-slate-100 dark:border-white/5 rounded-lg text-xs">
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{f.key}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">{f.label}</span>
                {f.required ? (
                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 rounded text-[8px] font-black">إلزامي</span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-500 rounded text-[8px]">اختياري</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">خطوة 2: مطابقة وتعيين أعمدة الملف مع حقول النظام</h3>
        <p className="text-xs text-slate-500 mt-1">لقد قمنا بربط الأعمدة المتشابهة تلقائياً. يرجى تأكيد الربط أو تعديله لضمان وضع كل قيمة في حقلها الصحيح.</p>
      </div>

      <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-navy-950">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-navy-900 text-slate-700 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="p-4">اسم العمود في ملفك</th>
              <th className="p-4">عينة من بيانات أول سطر</th>
              <th className="p-4 text-center">أيقونة الربط</th>
              <th className="p-4">الحقل المستهدف في النظام</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {rawHeaders.map(header => {
              const sampleVal = parsedRows[0]?.[header.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')] || '—';
              const currentMapping = userMappings[header] || '';

              return (
                <tr key={header} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{header}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 max-w-xs truncate font-mono">{String(sampleVal)}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex p-1.5 rounded-full ${currentMapping ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'}`}>
                      {currentMapping ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      title="تحديد الحقل المستهدف"
                      value={currentMapping}
                      onChange={(e) => setUserMappings(prev => ({ ...prev, [header]: e.target.value }))}
                      className="px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-950 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-64 font-bold"
                    >
                      <option value="">-- تجاهل هذا العمود --</option>
                      {getExpectedFields().map(opt => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label} ({opt.key}) {opt.required ? '*' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-white/10">
        <button
          onClick={resetWizard}
          className="px-6 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={14} />
          السابق (تغيير الملف)
        </button>

        <button
          onClick={handleMappingSubmit}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-primary-600/15 cursor-pointer"
        >
          المتابعة لفحص البيانات
          <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white font-sans">خطوة 3: تقرير التحقق وفحص البيانات (Dry Run Report)</h3>
        <p className="text-xs text-slate-500 mt-1">لقد قمنا بمطابقة وفحص كافة الأسطر في قاعدة البيانات بشكل تجريبي ودون تعديل أي سجلات حقيقية.</p>
      </div>

      {isValidating ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <RefreshCw className="w-16 h-16 text-primary-500 animate-spin" />
          <h4 className="font-bold text-slate-900 dark:text-white">جاري فحص وتطهير البيانات...</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">نطابق التواريخ والأسماء ونفحص عدم وجود تكرار</p>
        </div>
      ) : (
        dryRunReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-navy-900/40 p-4 border border-slate-100 dark:border-white/5 rounded-2xl text-right">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase">إجمالي الصفوف</span>
                <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 block">{dryRunReport.totalRows}</span>
              </div>

              <div className="bg-emerald-500/5 p-4 border border-emerald-500/10 rounded-2xl text-right">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  صفوف صالحة للاستيراد
                </span>
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-500 mt-1 block">{dryRunReport.validRows}</span>
              </div>

              <div className="bg-amber-500/5 p-4 border border-amber-500/10 rounded-2xl text-right">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block uppercase flex items-center gap-1">
                  <AlertTriangle size={12} />
                  تحذيرات منطقية
                </span>
                <span className="text-3xl font-black text-amber-600 dark:text-amber-500 mt-1 block">{dryRunReport.warningsCount}</span>
              </div>

              <div className="bg-rose-500/5 p-4 border border-rose-500/10 rounded-2xl text-right">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block uppercase flex items-center gap-1">
                  <XCircle size={12} />
                  أخطاء فادحة
                </span>
                <span className="text-3xl font-black text-rose-600 dark:text-rose-500 mt-1 block">{dryRunReport.errorsCount}</span>
              </div>
            </div>

            {dryRunReport.errors.length > 0 ? (
              <div className="border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-navy-950 overflow-hidden">
                <div className="bg-slate-50 dark:bg-navy-900 px-4 py-3 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">سجل المشاكل المكتشفة وتنبيهات التدقيق</span>
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold">
                    {dryRunReport.errors.length} تنبيه
                  </span>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-72 overflow-y-auto">
                  {dryRunReport.errors.map((err, i) => (
                    <div key={i} className="p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition text-xs">
                      {err.severity === 'error' ? (
                        <span className="p-1 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg">
                          <XCircle size={14} />
                        </span>
                      ) : (
                        <span className="p-1 bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 rounded-lg">
                          <AlertTriangle size={14} />
                        </span>
                      )}
                      
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 dark:text-white">{err.message}</p>
                        <div className="flex gap-4 text-[10px] text-slate-400">
                          <span>السطر في ملفك: <strong className="text-slate-700 dark:text-slate-300 font-mono">{err.row}</strong></span>
                          {err.column && <span>الحقل المعين: <strong className="text-slate-700 dark:text-slate-300 font-mono">{err.column}</strong></span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl flex items-center gap-4">
                <span className="p-3 bg-emerald-500 text-white rounded-full">
                  <CheckCircle2 size={24} />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-400">تهانينا! الملف نظيف تماماً</h4>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500/80 mt-1">
                    لا توجد أي أخطاء أو تحذيرات. جميع الأسطر جاهزة بنسبة 100% للاستيراد لقاعدة البيانات.
                  </p>
                </div>
              </div>
            )}

            {dryRunReport.preview.length > 0 && (
              <div className="border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-navy-950 overflow-hidden">
                <div className="bg-slate-50 dark:bg-navy-900 px-4 py-3 border-b border-slate-200 dark:border-white/10">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">معاينة أول 5 أسطر مطهرة وصالحة للاستيراد</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-navy-900 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5 font-bold">
                      <tr>
                        <th className="p-3">رقم السطر</th>
                        {Object.keys(dryRunReport.preview[0]).filter(k => k !== 'rowNum').slice(0, 5).map(key => (
                          <th key={key} className="p-3 font-mono">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {dryRunReport.preview.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                          <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">{row.rowNum}</td>
                          {Object.entries(row).filter(([k]) => k !== 'rowNum').slice(0, 5).map(([k, v]) => (
                            <td key={k} className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                              {v instanceof Date ? v.toLocaleDateString('ar-EG') : String(v || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => setStep(2)}
                disabled={isImporting}
                className="px-6 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft size={14} />
                السابق (تعديل الربط)
              </button>

              <button
                onClick={handleStartImport}
                disabled={isImporting || dryRunReport.validRows === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/15 cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    جاري استيراد البيانات ({progress}%)
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    بدء إدراج واستيراد البيانات الآن
                  </>
                )}
              </button>
            </div>
          </div>
        )
      )}
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center p-10 space-y-6"
    >
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
        <CheckCircle2 size={48} />
      </div>

      <div className="space-y-2 max-w-lg mx-auto">
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">تم استيراد البيانات وترحيلها بنجاح!</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          تم الانتهاء من عملية ترحيل السجلات وتخزينها بأمان في قاعدة بيانات مكتبك بعد فك التشفير والتطهير الكاملين.
        </p>
      </div>

      {dryRunReport && (
        <div className="bg-slate-50 dark:bg-navy-900 border border-slate-100 dark:border-white/5 p-4 rounded-2xl max-w-sm mx-auto grid grid-cols-3 gap-2 divide-x divide-x-reverse divide-slate-200 dark:divide-white/5">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-bold">موكلين</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {importType === 'clients' ? dryRunReport.validRows : 0}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-bold">قضايا</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {importType === 'cases' ? dryRunReport.validRows : 0}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-bold">جلسات</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {importType === 'sessions' ? dryRunReport.validRows : 0}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4 pt-4">
        <button
          type="button"
          onClick={resetWizard}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-primary-600/10 cursor-pointer"
        >
          الرجوع للرئيسية والبدء من جديد
        </button>

        <button
          type="button"
          onClick={handleRollbackCurrent}
          className="px-6 py-2.5 border border-rose-200 dark:border-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/10 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        >
          <Trash2 size={14} />
          تراجع عن الاستيراد (Rollback)
        </button>
      </div>
    </motion.div>
  );

  const renderHistoryStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactElement> = {
      completed: <span className="px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg font-bold text-[10px]">مكتمل بنجاح</span>,
      rolled_back: <span className="px-2 py-1 bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-500 rounded-lg text-[10px]">ملغي ومتراجع عنه</span>,
      dry_run: <span className="px-2 py-1 bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 rounded-lg text-[10px]">فحص فقط</span>
    };
    return badges[status] || <span />;
  };

  const renderHistoryAction = (id: string, status: string) => {
    if (status !== 'completed') return <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">—</span>;
    return (
      <button
        onClick={() => handleRollbackHistory(id)}
        className="px-3 py-1.5 border border-rose-200 dark:border-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/10 rounded-lg font-bold text-[10px] inline-flex items-center gap-1.5 transition cursor-pointer"
      >
        <Trash2 size={12} />
        تراجع (Rollback)
      </button>
    );
  };

  const renderHistoryRow = (batch: ImportBatch) => {
    const recordTypeMap: Record<string, string> = {
      clients: 'موكلين',
      cases: 'قضايا',
      sessions: 'جلسات'
    };
    const recordTypeLabel = recordTypeMap[batch.record_type] || 'أخرى';

    const recordsCount = batch.imported_records 
      ? (batch.imported_records[batch.record_type as keyof typeof batch.imported_records] || 0)
      : 0;

    return (
      <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
        <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText size={16} className="text-slate-400" />
          {batch.file_name}
        </td>
        <td className="p-4 font-bold">{recordTypeLabel}</td>
        <td className="p-4 text-slate-500 dark:text-slate-400">
          {new Date(batch.created_at).toLocaleString('ar-EG')}
        </td>
        <td className="p-4 text-center font-bold font-mono">{recordsCount} صف</td>
        <td className="p-4">
          {renderHistoryStatusBadge(batch.status)}
        </td>
        <td className="p-4 text-center">
          {renderHistoryAction(batch.id, batch.status)}
        </td>
      </tr>
    );
  };

  const renderHistory = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
        <HistoryIcon size={20} className="text-primary-500" />
        سجل عمليات الاستيراد السابقة للمكتب (Audit Log History)
      </h3>

      {isLoadingHistory ? (
        <div className="flex items-center justify-center p-12 text-slate-500 bg-white dark:bg-navy-950 border border-slate-100 dark:border-white/5 rounded-2xl">
          <RefreshCw size={24} className="animate-spin text-primary-500 mr-2" />
          جاري تحميل سجل الاستيراد...
        </div>
      ) : batchesHistory.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-navy-950 border border-slate-100 dark:border-white/5 rounded-2xl">
          لم يقم مكتبك بإجراء أي عمليات استيراد للبيانات مسبقاً.
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-navy-950">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-navy-900 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 font-bold">
              <tr>
                <th className="p-4">اسم الملف المرفوع</th>
                <th className="p-4">نوع البيانات</th>
                <th className="p-4">تاريخ العملية</th>
                <th className="p-4 text-center">الصفوف المستوردة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {batchesHistory.map(renderHistoryRow)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 font-sans" dir="rtl">
      {renderHeader()}
      {renderProgress()}

      <div className="bg-white dark:bg-navy-950 border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </AnimatePresence>
      </div>

      {renderHistory()}
    </div>
  );
}
