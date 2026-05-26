import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Bell, CalendarClock, HandCoins, Scale, ShieldAlert, Plus, Briefcase, FileText, Hash, Link2, ClipboardList, ArrowUpCircle } from "lucide-react";
import { useEnforcementStore } from '@/store/useEnforcementStore';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import NewEnforcementDialog from "./enforcement-components/NewEnforcementDialog";
import UpdateStageDialog from "./enforcement-components/UpdateStageDialog";
import { formatEGP, formatDateEG } from "@/lib/formatEG";

function statusClass(status: string) {
  if (status === "مفتوح") return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300";
  if (status === "استلام الصيغة") return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
  if (status === "إعلان السند") return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400";
  if (status === "توكيل المحضر") return "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400";
  if (status === "إشكال في التنفيذ") return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
  if (status === "منفذ") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
  return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300";
}

function sourceClass(source: string) {
  if (source === "قضية_مكتب") return "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400";
  return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
}

export default function Enforcement() {
  const enforcementCases = useEnforcementStore((state) => state.enforcementCases);
  const addAuditLog = useUIStore((state) => state.addAuditLog);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(enforcementCases[0]?.id || null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return enforcementCases;
    return enforcementCases.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.fileNumber?.toLowerCase().includes(q) ||
        e.caseId.toLowerCase().includes(q) ||
        e.clientName.toLowerCase().includes(q) ||
        e.debtorName.toLowerCase().includes(q)
    );
  }, [enforcementCases, query]);

  const selected = filtered.find((x) => x.id === selectedId) || filtered[0];

  const isSlaRisk = (date?: string) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return diff <= 3 * 24 * 60 * 60 * 1000;
  };

  const logSensitiveAction = () => {
    if (!selected) return;
    addAuditLog({
      id: `AL-ENF-${Date.now()}`,
      userId: currentUser?.id || "unknown",
      userName: currentUser?.name || "unknown",
      action: "View Enforcement Details",
      module: "enforcement",
      details: `Viewed enforcement case ${selected.id}`,
      timestamp: new Date().toISOString(),
    });
    toast.success("تم تسجيل عملية التدقيق بنجاح");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">إدارة التنفيذ</h1>
          <p className="text-slate-500 mt-1">متابعة قلم المحضرين وتسلسل إجراءات تنفيذ الأحكام.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-primary-500 hover:bg-primary-600 text-white gap-2 shadow-lg shadow-primary-500/20" onClick={() => setIsAddOpen(true)}>
            <Plus size={16} />
            إضافة ملف تنفيذ
          </Button>
        </div>
      </div>

      <NewEnforcementDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <UpdateStageDialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen} enforcementCase={selected || null} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-none shadow-sm dark:bg-navy-800">
          <CardHeader>
            <CardTitle className="text-base">قائمة ملفات التنفيذ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث برقم الملف/القضية/العميل..."
              aria-label="بحث ملفات التنفيذ"
              className="bg-white dark:bg-slate-800"
            />
            <div className="space-y-2 max-h-[420px] overflow-auto pe-1">
              {filtered.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Scale size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">لا توجد ملفات تنفيذ</p>
                </div>
              )}
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-start p-3.5 rounded-lg border-2 transition-all duration-200 ${
                    selected?.id === item.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md shadow-primary-500/10"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300 hover:shadow-sm dark:bg-navy-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded">{item.fileNumber || item.id}</span>
                      <Badge className={sourceClass(item.source || 'حكم_خارجي') + " text-[9px] gap-1"}>
                        {item.source === 'قضية_مكتب' ? <><Briefcase size={10} /> مكتب</> : <><FileText size={10} /> خارجي</>}
                      </Badge>
                    </div>
                    <Badge className={statusClass(item.status) + " text-[10px]"}>{item.status}</Badge>
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.clientName} <span className="text-slate-400 dark:text-slate-500">ضد</span> {item.debtorName}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <HandCoins size={12} />
                      {formatEGP(item.amountClaimed)}
                    </span>
                    {item.stageDeadline && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <CalendarClock size={12} />
                        {formatDateEG(item.stageDeadline)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm dark:bg-navy-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-navy-900 dark:text-white">تفاصيل ملف التنفيذ</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white gap-1.5 shadow-md shadow-primary-500/20" onClick={() => setIsUpdateOpen(true)} disabled={!selected || selected.status === 'منفذ'}>
                <ArrowUpCircle size={14} />
                تحديث المرحلة
              </Button>
              <Button size="sm" variant="outline" className="dark:border-white/20 dark:text-white dark:hover:bg-white/10" onClick={logSensitiveAction} disabled={!selected}>تسجيل تدقيق</Button>
            </div>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-slate-500 dark:text-slate-400">لا توجد بيانات تنفيذ.</p>
            ) : (
              <div className="space-y-5">
                {/* File info header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5">
                    <Hash size={14} className="text-slate-400" />
                    <span className="font-mono text-sm font-bold text-navy-900 dark:text-white">{selected.fileNumber || selected.id}</span>
                  </div>
                  <Badge className={sourceClass(selected.source || 'حكم_خارجي') + " gap-1"}>
                    {selected.source === 'قضية_مكتب' ? <><Briefcase size={12} /> قضية مكتب</> : <><FileText size={12} /> حكم خارجي</>}
                  </Badge>
                  {selected.linkedCaseId && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/20 text-xs text-primary-700 dark:text-primary-400">
                      <Link2 size={12} />
                      مرتبط بالقضية: <span className="font-bold">{selected.linkedCaseRef || selected.linkedCaseId}</span>
                    </div>
                  )}
                </div>

                {/* Financial info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-md bg-slate-50 dark:bg-white/5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">المطالبة</p>
                    <p className="font-bold text-navy-900 dark:text-white">{formatEGP(selected.amountClaimed)}</p>
                  </div>
                  <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">المحصل</p>
                    <p className="font-bold text-emerald-700 dark:text-emerald-300">{formatEGP(selected.amountCollected)}</p>
                  </div>
                  <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-xs text-blue-600 dark:text-blue-400">نوع السند التنفيذي</p>
                    <p className="font-bold text-blue-700 dark:text-blue-300">{selected.executionType || '-'}</p>
                  </div>
                </div>

                {/* Judgment details */}
                {(selected.judgmentNumber || selected.judgmentCourt) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-md bg-purple-50 dark:bg-purple-900/20">
                      <p className="text-xs text-purple-600 dark:text-purple-400">رقم الحكم</p>
                      <p className="font-bold text-purple-700 dark:text-purple-300">{selected.judgmentNumber || '-'}</p>
                    </div>
                    <div className="p-3 rounded-md bg-purple-50 dark:bg-purple-900/20">
                      <p className="text-xs text-purple-600 dark:text-purple-400">تاريخ الحكم</p>
                      <p className="font-bold text-purple-700 dark:text-purple-300">{formatDateEG(selected.judgmentDate)}</p>
                    </div>
                    <div className="p-3 rounded-md bg-purple-50 dark:bg-purple-900/20">
                      <p className="text-xs text-purple-600 dark:text-purple-400">المحكمة المُصدِرة</p>
                      <p className="font-bold text-purple-700 dark:text-purple-300">{selected.judgmentCourt || '-'}</p>
                    </div>
                  </div>
                )}

                {/* SLA */}
                <div className="flex items-center gap-2 text-sm text-navy-900 dark:text-slate-300">
                  <CalendarClock size={16} />
                  <span>مهلة المرحلة:</span>
                  <span className="font-bold">{formatDateEG(selected.stageDeadline)}</span>
                  {isSlaRisk(selected.stageDeadline) && (
                    <Badge className="bg-amber-100 text-amber-700 gap-1"><Bell size={12} /> تنبيه SLA</Badge>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2 text-navy-900 dark:text-white"><Scale size={16} /> تسلسل الإجراءات</h3>
                  <div className="space-y-2 border-s ps-4 border-slate-100 dark:border-white/10">
                    {selected.actions.map((a) => (
                      <div key={a.id} className="p-2 rounded-md bg-slate-50 dark:bg-white/5">
                        <p className="text-sm font-bold text-navy-900 dark:text-white">{a.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateEG(a.date)} • {a.type} • بواسطة {a.performedBy}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workflow Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-navy-900 dark:text-white"><ClipboardList size={16} /> مراحل التنفيذ (قلم المحضرين)</h3>
                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className={`p-3 rounded-md border ${selected.currentStep >= 1 ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-100 dark:border-white/10 opacity-50'}`}>
                        <p className="font-bold text-sm text-navy-900 dark:text-white mb-1">1. استلام الصيغة التنفيذية</p>
                        <div className="text-xs text-slate-500 dark:text-slate-400 grid grid-cols-3 gap-2">
                          <span>رقم الحكم: {selected.judgmentNumber || '-'}</span>
                          <span>المحكمة: {selected.judgmentCourt || '-'}</span>
                          <span>تاريخ الصدور: {formatDateEG(selected.judgmentDate)}</span>
                        </div>
                      </div>
                      
                      {/* Step 2 */}
                      <div className={`p-3 rounded-md border ${selected.currentStep >= 2 ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-100 dark:border-white/10 opacity-50'}`}>
                        <p className="font-bold text-sm text-navy-900 dark:text-white mb-1">2. إعلان السند التنفيذي</p>
                        <div className="text-xs text-slate-500 dark:text-slate-400 grid grid-cols-3 gap-2">
                          <span>اسم المحضر: {selected.bailiffName || '-'}</span>
                          <span>تاريخ الإعلان: {formatDateEG(selected.announcementDate)}</span>
                          <span>رقم المحضر: {selected.bailiffRecordNumber || '-'}</span>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className={`p-3 rounded-md border ${selected.currentStep >= 3 ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-100 dark:border-white/10 opacity-50'}`}>
                        <p className="font-bold text-sm text-navy-900 dark:text-white mb-1">3. توكيل المحضر للتنفيذ</p>
                        <div className="text-xs text-slate-500 dark:text-slate-400 grid grid-cols-3 gap-2">
                          <span>اسم المحضر: {selected.bailiffName || '-'}</span>
                          <span>المحكمة: {selected.judgmentCourt || '-'}</span>
                          <span>تاريخ الإيداع: {formatDateEG(selected.poaDate)}</span>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className={`p-3 rounded-md border ${selected.currentStep === 4 ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : selected.currentStep > 4 ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-100 dark:border-white/10 opacity-50'}`}>
                        <p className="font-bold text-sm text-navy-900 dark:text-white mb-1">4. الإشكال في التنفيذ {selected.hasObjection ? '(موجود)' : '(لا يوجد)'}</p>
                        {selected.hasObjection && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 grid grid-cols-3 gap-2">
                            <span>النوع: {selected.objectionType || '-'}</span>
                            <span>جلسة الإشكال: {formatDateEG(selected.objectionSessionDate)}</span>
                            <span>الطرف المشكل: {selected.objectingParty || '-'}</span>
                          </div>
                        )}
                      </div>

                      {/* Step 5 */}
                      <div className={`p-3 rounded-md border ${selected.currentStep >= 5 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-white/10 opacity-50'}`}>
                        <p className="font-bold text-sm text-navy-900 dark:text-white mb-1">5. انتهاء التنفيذ</p>
                        <div className="text-xs text-slate-500 dark:text-slate-400 grid grid-cols-2 gap-2">
                          <span>نتيجة التنفيذ: {selected.executionResult || '-'}</span>
                          <span>المبلغ المحصل: {formatEGP(selected.amountCollected)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
