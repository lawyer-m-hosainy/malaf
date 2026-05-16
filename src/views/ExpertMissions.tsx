import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, Calendar, Hash, FileText, User, MapPin, Phone, Building2, AlertCircle, X, Briefcase } from "lucide-react";
import { formatEGP, formatDateEG } from "@/lib/formatEG";
import { toast } from "sonner";
import { useExpertStore, ExpertMission, MissionType, MissionStatus } from "@/store/useExpertStore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

const MISSION_TYPES: Record<MissionType, string> = {
  property_valuation: 'تقييم عقاري',
  accounting_audit: 'فحص حسابي',
  technical_inspection: 'معاينة فنية',
  document_analysis: 'فحص مستندات',
  forensic_medical: 'طب شرعي',
  mixed: 'مأمورية مركبة'
};

const STATUS_LABELS: Record<MissionStatus, string> = {
  in_progress: 'جارية',
  awaiting_deposit: 'انتظار الأمانة',
  under_discussion: 'قيد المناقشة',
  report_filed: 'تم إيداع التقرير',
  completed: 'منتهية'
};

const getStatusStyle = (status: MissionStatus) => {
  switch (status) {
    case 'in_progress': return "bg-[#fff3cd] text-[#856404]";
    case 'awaiting_deposit': return "bg-[#cfe2ff] text-[#084298]";
    case 'under_discussion': return "bg-[#e2d9f3] text-[#432874]";
    case 'report_filed': return "bg-[#d1ecf1] text-[#0c5460]";
    case 'completed': return "bg-[#d4edda] text-[#155724]";
    default: return "bg-slate-100 text-slate-800";
  }
};

export default function ExpertMissions() {
  const { missions, addMission, updateMission } = useExpertStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ExpertMission>>({
    status: 'in_progress',
    mission_type: 'accounting_audit'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Select first mission if none selected
    if (missions.length > 0 && !selectedId) {
      setSelectedId(missions[0].id);
    }
  }, [missions]);

  const filteredMissions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return missions.filter(m => {
      const matchSearch = !q || 
        m.expert_name.toLowerCase().includes(q) || 
        m.case_number.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [missions, query, statusFilter]);

  const selectedMission = missions.find(m => m.id === selectedId);

  const openAddMissionModal = () => {
    setFormData({ status: 'in_progress', mission_type: 'accounting_audit' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditMissionModal = (mission: ExpertMission) => {
    setFormData(mission);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.case_number) errors.case_number = "رقم القضية مطلوب";
    if (!formData.case_year || formData.case_year.toString().length !== 4) errors.case_year = "سنة القضية مطلوبة ومكونة من 4 أرقام";
    if (!formData.court_name) errors.court_name = "اسم المحكمة مطلوب";
    if (!formData.expert_name) errors.expert_name = "اسم الخبير مطلوب";
    if (!formData.expert_registry_no) errors.expert_registry_no = "رقم القيد بجدول الخبراء مطلوب (م. 92 ق. مرافعات)";
    if (!formData.expert_specialty) errors.expert_specialty = "تخصص الخبير مطلوب";
    if (!formData.mission_type) errors.mission_type = "نوع المأمورية مطلوب";
    if (!formData.mission_scope || formData.mission_scope.length < 20) errors.mission_scope = "نطاق المأمورية يجب أن يكون مفصلاً (20 حرف على الأقل)";
    if (!formData.referral_order_date) errors.referral_order_date = "تاريخ أمر الإحالة مطلوب";
    
    if (formData.deposit_deadline && formData.referral_order_date) {
      if (new Date(formData.deposit_deadline) <= new Date(formData.referral_order_date)) {
        errors.deposit_deadline = "الأجل المحدد للإيداع يجب أن يكون بعد تاريخ الإحالة";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (formData.id) {
      updateMission(formData.id, formData);
      toast.success("✓ تم تعديل المأمورية بنجاح");
    } else {
      const newMission = {
        ...formData,
        id: `EXP-${Date.now()}`,
        case_id: formData.case_id || `C-${Date.now()}`, // Fallback for MVP
        created_at: new Date().toISOString()
      } as ExpertMission;
      addMission(newMission);
      toast.success("✓ تمت إضافة المأمورية بنجاح");
      setSelectedId(newMission.id);
    }
    setIsModalOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 h-[calc(100vh-100px)] flex flex-col pb-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">مأموريات الخبراء</h1>
          <p className="text-slate-500 mt-1">متابعة إحالات القضايا للخبراء وجلسات المناقشة وتوقيتات الإيداع.</p>
        </div>
        <div>
          <button 
            className="inline-flex items-center gap-1.5 bg-[#2d6a4f] text-white font-semibold text-sm py-2 px-4 rounded-lg cursor-pointer transition-colors hover:bg-[#1a4a35]"
            onClick={openAddMissionModal}
            dir="rtl"
          >
            <span className="text-lg leading-none font-normal">+</span>
            إضافة مأمورية
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* List Section */}
        <Card className="flex-1 lg:max-w-[400px] border-none shadow-sm dark:bg-navy-800 flex flex-col overflow-hidden">
          <CardHeader className="shrink-0 pb-4 border-b border-slate-100 dark:border-white/5">
            <CardTitle className="text-base text-navy-900 dark:text-white mb-4">قائمة المأموريات</CardTitle>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="بحث برقم القضية أو اسم الخبير..." 
                  className="pr-10 dark:bg-navy-900" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="حالة المأمورية">
                    {statusFilter && statusFilter !== 'all' ? STATUS_LABELS[statusFilter as MissionStatus] : "جميع الحالات"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {filteredMissions.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-start p-4 rounded-xl border transition-all duration-200 ${
                  selectedId === item.id
                    ? "border-[#2d6a4f] bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-primary-300"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm text-navy-900 dark:text-white">قضية رقم {item.case_number} / {item.case_year}</span>
                    <span className="text-xs text-slate-500">{MISSION_TYPES[item.mission_type]}</span>
                  </div>
                  <Badge variant="outline" className={`border-none ${getStatusStyle(item.status)}`}>
                    {STATUS_LABELS[item.status]}
                  </Badge>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-3 bg-slate-50 dark:bg-white/5 p-2 rounded-md">
                  <User size={12} className="text-slate-400" />
                  <span className="truncate flex-1">الخبير: {item.expert_name}</span>
                </div>
              </button>
            ))}
            {filteredMissions.length === 0 && (
              <div className="text-center text-slate-500 py-12 flex flex-col items-center gap-3">
                <Briefcase size={32} className="text-slate-300" />
                <p>لا توجد مأموريات مطابقة</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Section */}
        <Card className="flex-[2] border-none shadow-sm dark:bg-navy-800 overflow-y-auto custom-scrollbar">
          {!selectedMission ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <FileText size={48} className="opacity-20" />
              <p>اختر مأمورية لعرض التفاصيل</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-navy-900 dark:text-white">تفاصيل مأمورية الخبير</h2>
                    <Badge variant="outline" className={`border-none px-3 py-1 ${getStatusStyle(selectedMission.status)}`}>
                      {STATUS_LABELS[selectedMission.status]}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-sm">
                    محالة في تاريخ {formatDateEG(selectedMission.referral_order_date)}
                  </p>
                </div>
                <Button variant="outline" onClick={() => openEditMissionModal(selectedMission)} className="border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5">
                  تعديل المأمورية
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Case Info */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2 border-b pb-2 dark:border-white/5">
                    <Building2 size={18} className="text-[#2d6a4f]" />
                    بيانات القضية والمحكمة
                  </h3>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">رقم وسنة القضية</span>
                      <span className="text-sm font-bold text-navy-900 dark:text-white">{selectedMission.case_number} لسنة {selectedMission.case_year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">المحكمة</span>
                      <span className="text-sm font-bold text-navy-900 dark:text-white">{selectedMission.court_name}</span>
                    </div>
                    {selectedMission.court_chamber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">الدائرة</span>
                        <span className="text-sm font-bold text-navy-900 dark:text-white">{selectedMission.court_chamber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expert Info */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2 border-b pb-2 dark:border-white/5">
                    <User size={18} className="text-[#2d6a4f]" />
                    بيانات الخبير
                  </h3>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">الاسم</span>
                      <span className="text-sm font-bold text-navy-900 dark:text-white">{selectedMission.expert_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">التخصص</span>
                      <span className="text-sm font-bold text-navy-900 dark:text-white">{selectedMission.expert_specialty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">رقم القيد بالجدول</span>
                      <span className="text-sm font-bold text-navy-900 dark:text-white">{selectedMission.expert_registry_no}</span>
                    </div>
                    {selectedMission.expert_phone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">الهاتف</span>
                        <span className="text-sm font-bold text-navy-900 dark:text-white">{selectedMission.expert_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mission Scope */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2 border-b pb-2 dark:border-white/5">
                    <FileText size={18} className="text-[#2d6a4f]" />
                    نطاق المأمورية ومهمة الخبير
                  </h3>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-5">
                    <div className="mb-4">
                      <Badge variant="outline" className="bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                        {MISSION_TYPES[selectedMission.mission_type]}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedMission.mission_scope}
                    </p>
                    {selectedMission.estimated_fees && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
                        <span className="text-sm text-slate-500">الأتعاب المقدرة (مبدئياً):</span>
                        <span className="text-sm font-bold text-emerald-600">{formatEGP(selectedMission.estimated_fees)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates & Sessions */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2 border-b pb-2 dark:border-white/5">
                    <Calendar size={18} className="text-[#2d6a4f]" />
                    المواعيد والجلسات
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 p-4 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">تاريخ الإحالة</p>
                      <p className="font-bold text-sm text-navy-900 dark:text-white">{formatDateEG(selectedMission.referral_order_date)}</p>
                    </div>
                    {selectedMission.deposit_deadline && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-lg">
                        <p className="text-xs text-amber-700 dark:text-amber-500 mb-1">أجل إيداع الأمانة</p>
                        <p className="font-bold text-sm text-amber-800 dark:text-amber-400">{formatDateEG(selectedMission.deposit_deadline)}</p>
                      </div>
                    )}
                    {selectedMission.discussion_session && (
                      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 p-4 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-500 mb-1">جلسة المناقشة</p>
                        <p className="font-bold text-sm text-blue-800 dark:text-blue-400">{formatDateEG(selectedMission.discussion_session)}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Notes */}
                {selectedMission.notes && (
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2 border-b pb-2 dark:border-white/5">
                      ملاحظات
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 p-4 bg-slate-50 dark:bg-white/5 rounded-lg whitespace-pre-wrap">
                      {selectedMission.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="sm:max-w-[640px] max-h-[85vh] p-0 flex flex-col gap-0 border-none shadow-2xl dark:bg-navy-900"
          aria-describedby="modal-desc"
        >
          {/* Header */}
          <div className="bg-[#1a3a2a] px-6 py-4 rounded-t-lg flex items-center justify-between shrink-0">
            <DialogTitle className="text-white text-lg font-bold" id="modal-title">
              {formData.id ? "تعديل بيانات المأمورية" : "إضافة مأمورية خبير جديدة"}
            </DialogTitle>
            <button onClick={() => setIsModalOpen(false)} aria-label="إغلاق" className="text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-8" id="modal-desc">
            
            {/* Section 1 */}
            <section>
              <h3 className="text-[14px] font-bold text-[#1a3a2a] dark:text-white mb-4 border-b border-slate-200 dark:border-white/10 pb-2">1. بيانات القضية والمحكمة</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="case_number" className="text-[12px] text-slate-700 dark:text-slate-300">رقم القضية <span className="text-red-500">*</span></Label>
                  <Input id="case_number" value={formData.case_number || ''} onChange={e => setFormData({...formData, case_number: e.target.value})} className={formErrors.case_number ? "border-red-500" : ""} />
                  {formErrors.case_number && <p className="text-[11px] text-red-500">{formErrors.case_number}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="case_year" className="text-[12px] text-slate-700 dark:text-slate-300">سنة القضية <span className="text-red-500">*</span></Label>
                  <Input id="case_year" type="number" min="1900" max={new Date().getFullYear()} value={formData.case_year || ''} onChange={e => setFormData({...formData, case_year: e.target.value})} className={formErrors.case_year ? "border-red-500" : ""} />
                  {formErrors.case_year && <p className="text-[11px] text-red-500">{formErrors.case_year}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="court_name" className="text-[12px] text-slate-700 dark:text-slate-300">اسم المحكمة <span className="text-red-500">*</span></Label>
                  <Input id="court_name" value={formData.court_name || ''} onChange={e => setFormData({...formData, court_name: e.target.value})} className={formErrors.court_name ? "border-red-500" : ""} />
                  {formErrors.court_name && <p className="text-[11px] text-red-500">{formErrors.court_name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="court_chamber" className="text-[12px] text-slate-700 dark:text-slate-300">الدائرة</Label>
                  <Input id="court_chamber" value={formData.court_chamber || ''} onChange={e => setFormData({...formData, court_chamber: e.target.value})} />
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h3 className="text-[14px] font-bold text-[#1a3a2a] dark:text-white mb-4 border-b border-slate-200 dark:border-white/10 pb-2">2. بيانات الخبير (م. 92 ق. مرافعات)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expert_name" className="text-[12px] text-slate-700 dark:text-slate-300">اسم الخبير <span className="text-red-500">*</span></Label>
                  <Input id="expert_name" value={formData.expert_name || ''} onChange={e => setFormData({...formData, expert_name: e.target.value})} className={formErrors.expert_name ? "border-red-500" : ""} />
                  {formErrors.expert_name && <p className="text-[11px] text-red-500">{formErrors.expert_name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expert_registry_no" className="text-[12px] text-slate-700 dark:text-slate-300">رقم القيد بجدول وزارة العدل <span className="text-red-500">*</span></Label>
                  <Input id="expert_registry_no" value={formData.expert_registry_no || ''} onChange={e => setFormData({...formData, expert_registry_no: e.target.value})} className={formErrors.expert_registry_no ? "border-red-500" : ""} />
                  {formErrors.expert_registry_no && <p className="text-[11px] text-red-500">{formErrors.expert_registry_no}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expert_specialty" className="text-[12px] text-slate-700 dark:text-slate-300">التخصص <span className="text-red-500">*</span></Label>
                  <Input id="expert_specialty" placeholder="مثال: هندسي، زراعي..." value={formData.expert_specialty || ''} onChange={e => setFormData({...formData, expert_specialty: e.target.value})} className={formErrors.expert_specialty ? "border-red-500" : ""} />
                  {formErrors.expert_specialty && <p className="text-[11px] text-red-500">{formErrors.expert_specialty}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expert_phone" className="text-[12px] text-slate-700 dark:text-slate-300">رقم الهاتف</Label>
                  <Input id="expert_phone" dir="ltr" value={formData.expert_phone || ''} onChange={e => setFormData({...formData, expert_phone: e.target.value})} />
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className="text-[14px] font-bold text-[#1a3a2a] dark:text-white mb-4 border-b border-slate-200 dark:border-white/10 pb-2">3. نطاق المأمورية ومهمة الخبير</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[12px] text-slate-700 dark:text-slate-300">نوع المأمورية <span className="text-red-500">*</span></Label>
                    <Select value={formData.mission_type} onValueChange={v => setFormData({...formData, mission_type: v as MissionType})}>
                      <SelectTrigger className={formErrors.mission_type ? "border-red-500" : ""}>
                        <SelectValue placeholder="اختر نوع المأمورية">
                          {formData.mission_type ? MISSION_TYPES[formData.mission_type] : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MISSION_TYPES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.mission_type && <p className="text-[11px] text-red-500">{formErrors.mission_type}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="estimated_fees" className="text-[12px] text-slate-700 dark:text-slate-300">الأتعاب المقدرة (بالجنيه)</Label>
                    <Input id="estimated_fees" type="number" min="0" value={formData.estimated_fees || ''} onChange={e => setFormData({...formData, estimated_fees: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mission_scope" className="text-[12px] text-slate-700 dark:text-slate-300">وصف المأمورية (م. 140 ق. مرافعات) <span className="text-red-500">*</span></Label>
                  <Textarea id="mission_scope" rows={3} placeholder="اكتب تفاصيل وحدود مأمورية الخبير بدقة..." value={formData.mission_scope || ''} onChange={e => setFormData({...formData, mission_scope: e.target.value})} className={formErrors.mission_scope ? "border-red-500" : ""} />
                  {formErrors.mission_scope && <p className="text-[11px] text-red-500">{formErrors.mission_scope}</p>}
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h3 className="text-[14px] font-bold text-[#1a3a2a] dark:text-white mb-4 border-b border-slate-200 dark:border-white/10 pb-2">4. المواعيد والجلسات</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="referral_order_date" className="text-[12px] text-slate-700 dark:text-slate-300">تاريخ أمر الإحالة <span className="text-red-500">*</span></Label>
                  <Input id="referral_order_date" type="date" value={formData.referral_order_date || ''} onChange={e => setFormData({...formData, referral_order_date: e.target.value})} className={formErrors.referral_order_date ? "border-red-500" : ""} />
                  {formErrors.referral_order_date && <p className="text-[11px] text-red-500">{formErrors.referral_order_date}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deposit_deadline" className="text-[12px] text-slate-700 dark:text-slate-300">الأجل المحدد للإيداع</Label>
                  <Input id="deposit_deadline" type="date" value={formData.deposit_deadline || ''} onChange={e => setFormData({...formData, deposit_deadline: e.target.value})} className={formErrors.deposit_deadline ? "border-red-500" : ""} />
                  {formErrors.deposit_deadline && <p className="text-[11px] text-red-500">{formErrors.deposit_deadline}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="discussion_session" className="text-[12px] text-slate-700 dark:text-slate-300">جلسة المناقشة / الورود</Label>
                  <Input id="discussion_session" type="date" value={formData.discussion_session || ''} onChange={e => setFormData({...formData, discussion_session: e.target.value})} />
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h3 className="text-[14px] font-bold text-[#1a3a2a] dark:text-white mb-4 border-b border-slate-200 dark:border-white/10 pb-2">5. الحالة والمتابعة</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] text-slate-700 dark:text-slate-300">الحالة <span className="text-red-500">*</span></Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as MissionStatus})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة">
                        {formData.status ? STATUS_LABELS[formData.status] : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-[12px] text-slate-700 dark:text-slate-300">ملاحظات إضافية</Label>
                  <Textarea id="notes" rows={2} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </div>
            </section>

          </div>

          {/* Footer */}
          <div className="bg-slate-50 dark:bg-navy-900 border-t border-slate-200 dark:border-white/10 p-4 flex items-center justify-between shrink-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
            <div className="flex gap-2">
              <Button variant="secondary" className="bg-white dark:bg-navy-800 border-slate-200 dark:border-white/10" onClick={handleSave}>حفظ مسودة</Button>
              <Button className="bg-[#2d6a4f] hover:bg-[#1a4a35] text-white" onClick={handleSave}>
                حفظ المأمورية
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
