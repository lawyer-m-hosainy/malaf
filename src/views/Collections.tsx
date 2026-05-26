import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertTriangle, BarChart3, FileWarning, HandCoins, Plus, Receipt } from "lucide-react";
import { useFinanceStore } from '@/store/useFinanceStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatEGP, formatDateEG } from "@/lib/formatEG";
import { fetchReceivables, saveReceivable, saveCollectionAction, fetchExpenses } from "@/services/legalDataService";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import PaymentPlans from "./PaymentPlans";

function daysPastDue(dueDate: string) {
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function agingBucket(days: number) {
  if (days <= 0) return "حالي";
  if (days <= 30) return "1-30 يوم";
  if (days <= 60) return "31-60 يوم";
  if (days <= 90) return "61-90 يوم";
  return "+90 يوم";
}

export default function Collections() {
  const receivables = useFinanceStore((state) => state.receivables);
  const currentUser = useAuthStore((state) => state.currentUser);
  const addCollectionAction = useFinanceStore((state) => state.addCollectionAction);
  const reconcileReceivableStore = useFinanceStore((state) => state.reconcileReceivable);
  const closeReceivableStore = useFinanceStore((state) => state.closeReceivable);
  const addReceivableStore = useFinanceStore((state) => state.addReceivable);
  const setReceivablesStore = useFinanceStore((state) => state.setReceivables);
  const addAuditLog = useUIStore((state) => state.addAuditLog);
  const setExpenses = useFinanceStore((state) => state.setExpenses);
  const expenses = useFinanceStore((state) => state.expenses) || [];

  const [activeTab, setActiveTab] = useState<'receivables' | 'court_fees' | 'payment_plans'>('receivables');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recData, expData] = await Promise.all([
        fetchReceivables(),
        fetchExpenses()
      ]);

      setReceivablesStore(recData.map((d: any) => ({
        id: d.id,
        clientId: d.client_id,
        clientName: d.client_name,
        caseId: d.case_id,
        totalAmount: d.total_amount,
        collectedAmount: d.collected_amount,
        outstandingAmount: d.outstanding_amount,
        dueDate: d.due_date,
        status: d.status,
        isReconciled: d.is_reconciled,
        createdAt: d.created_at,
        actions: []
      })));

      setExpenses(expData);
    } catch (e) {
      console.error("Failed to load collections data:", e);
    }
  };

  const courtFeesExpenses = useMemo(() => {
    return expenses.filter(exp => 
      exp.status === 'معلق' && 
      ['رسوم قضائية', 'أمانة خبير', 'رسم إعلان (محضر)'].includes(exp.category)
    );
  }, [expenses]);

  // Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRec, setNewRec] = useState({
    clientName: "",
    amount: "",
    dueDate: "",
  });

  const aging = useMemo(() => {
    const buckets = { Current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 } as Record<string, number>;
    for (const r of receivables) {
      const days = daysPastDue(r.dueDate);
      const bucket = agingBucket(days);
      buckets[bucket] += r.outstandingAmount;
    }
    return buckets;
  }, [receivables]);

  const totalOutstanding = receivables.reduce((s, r) => s + r.outstandingAmount, 0);
  const settledCount = receivables.filter((r) => r.status === "مسوى" || r.status === "مغلق").length;

  const recordAction = async (receivableId: string, type: "إصدار مطالبة" | "إنذار رسمي" | "جدولة سداد" | "تسوية" | "متابعة") => {
    const actionId = `CA-${Date.now()}`;
    addCollectionAction(receivableId, {
      id: actionId,
      receivableId,
      type,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id || "unknown",
      notes: `تم تنفيذ إجراء ${type} من لوحة التحصيل`,
    });
    
    try {
      await saveCollectionAction({
        id: actionId,
        receivable_id: receivableId,
        type: type,
        notes: `تم تنفيذ إجراء ${type} من لوحة التحصيل`,
        created_by: currentUser?.id || "unknown",
      });
    } catch (e) {
      console.error("Failed to save action to DB");
    }

    addAuditLog({
      id: `AL-COL-${Date.now()}`,
      userId: currentUser?.id || "unknown",
      userName: currentUser?.name || "unknown",
      action: "إجراء تحصيل",
      module: "collections",
      details: `مطالبة ${receivableId}: ${type}`,
      timestamp: new Date().toISOString(),
    });
    toast.success(`تم تسجيل إجراء: ${type}`);
  };

  const tryClose = async (receivableId: string) => {
    const item = receivables.find((r) => r.id === receivableId);
    if (!item) return;
    if (!item.isReconciled) {
      toast.error("لا يمكن إغلاق الملف المالي قبل إتمام المطابقة المحاسبية");
      return;
    }
    closeReceivableStore(receivableId);
    
    try {
      if (!receivableId.startsWith("REC-")) {
        await saveReceivable({ id: receivableId, status: "مغلق" });
      }
    } catch (e) {
      console.error("Failed to save close status");
    }

    addAuditLog({
      id: `AL-COL-CLOSE-${Date.now()}`,
      userId: currentUser?.id || "unknown",
      userName: currentUser?.name || "unknown",
      action: "إغلاق مطالبة",
      module: "collections",
      details: `تم إغلاق المطالبة ${receivableId}`,
      timestamp: new Date().toISOString(),
    });
    toast.success("تم إغلاق الملف المالي");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRec.clientName || !newRec.amount || !newRec.dueDate) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    
    const loadingToast = toast.loading("جاري الإضافة...");
    const newReceivable = {
      id: `REC-${Math.floor(Math.random() * 90000)}`,
      clientId: `C-${Math.floor(Math.random() * 90000)}`,
      clientName: newRec.clientName,
      caseId: `C-${Math.floor(Math.random() * 90000)}`,
      totalAmount: Number(newRec.amount),
      collectedAmount: 0,
      outstandingAmount: Number(newRec.amount),
      dueDate: new Date(newRec.dueDate).toISOString(),
      createdAt: new Date().toISOString(),
      status: "مفتوح",
      isReconciled: false,
      actions: []
    };
    
    try {
      await saveReceivable({
        client_id: newReceivable.clientId,
        client_name: newReceivable.clientName,
        case_id: newReceivable.caseId,
        total_amount: newReceivable.totalAmount,
        collected_amount: newReceivable.collectedAmount,
        outstanding_amount: newReceivable.outstandingAmount,
        due_date: newReceivable.dueDate,
        status: newReceivable.status,
        is_reconciled: newReceivable.isReconciled
      });
      loadData();
      toast.success("تم إضافة المطالبة بنجاح", { id: loadingToast });
      setIsAddOpen(false);
      setNewRec({ clientName: "", amount: "", dueDate: "" });
    } catch (err) {
      toast.error("فشل إضافة المطالبة", { id: loadingToast });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">التحصيل والذمم</h1>
          <p className="text-slate-500 mt-1">إدارة المطالبات، الإنذارات، جداول السداد والتسويات مع ضوابط مالية.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-primary-100 text-primary-700 hidden sm:inline-flex">ذمم مدينة</Badge>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="bg-primary-500 hover:bg-primary-600 text-white gap-2" />}>
              <Plus size={16} />
              إضافة مطالبة
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>إضافة مطالبة مالية جديدة</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم العميل (المدين)</label>
                  <Input 
                    placeholder="مثال: شركة العزم" 
                    value={newRec.clientName}
                    onChange={(e) => setNewRec(prev => ({...prev, clientName: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">مبلغ المطالبة (جنيه)</label>
                  <Input 
                    type="number" 
                    placeholder="25000" 
                    value={newRec.amount}
                    onChange={(e) => setNewRec(prev => ({...prev, amount: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">تاريخ الاستحقاق</label>
                  <Input 
                    type="date" 
                    value={newRec.dueDate}
                    onChange={(e) => setNewRec(prev => ({...prev, dueDate: e.target.value}))}
                  />
                </div>
                <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white mt-4">
                  إضافة وإصدار مطالبة
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><HandCoins size={16} /> إجمالي المتأخرات</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatEGP(totalOutstanding)}</p></CardContent>
        </Card>
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 size={16} /> معدل التسوية</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{receivables.length ? Math.round((settledCount / receivables.length) * 100) : 0}%</p></CardContent>
        </Card>
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle size={16} /> ملفات غير مسواة</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{receivables.filter((r) => !r.isReconciled).length}</p></CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileWarning size={16} /> تقرير أعمار الذمم</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(aging).map(([bucket, amount]) => (
            <div key={bucket} className="p-3 rounded-md bg-slate-50">
              <p className="text-xs text-slate-500">{bucket}</p>
              <p className="font-bold">{formatEGP(amount)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-white/5 gap-6">
        <button
          className={cn(
            "pb-3 text-sm font-bold border-b-2 px-1 transition-colors",
            activeTab === 'receivables' 
              ? "border-green-600 text-green-600 dark:text-green-400" 
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
          onClick={() => setActiveTab('receivables')}
        >
          المطالبات بالأتعاب (الذمم المدينة)
        </button>
        <button
          className={cn(
            "pb-3 text-sm font-bold border-b-2 px-1 transition-colors",
            activeTab === 'court_fees' 
              ? "border-green-600 text-green-600 dark:text-green-400" 
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
          onClick={() => setActiveTab('court_fees')}
        >
          الرسوم القضائية المستحقة ({courtFeesExpenses.length.toLocaleString('ar-EG')})
        </button>
        <button
          className={cn(
            "pb-3 text-sm font-bold border-b-2 px-1 transition-colors",
            activeTab === 'payment_plans' 
              ? "border-green-600 text-green-600 dark:text-green-400" 
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
          onClick={() => setActiveTab('payment_plans')}
        >
          خطط الدفع والأقساط
        </button>
      </div>

      {activeTab === 'receivables' ? (
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader><CardTitle className="text-base">أداء تحصيل الأتعاب</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {receivables.length > 0 ? (
              receivables.map((r) => (
                <div key={r.id} className="p-3 border dark:border-white/10 rounded-md">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm">{r.id} • {r.clientName}</p>
                    <Badge className={r.status === "مغلق" ? "bg-emerald-100 text-emerald-700" : r.status === "متأخر" ? "bg-destructive/10 text-destructive" : "bg-blue-100 text-blue-700"}>
                      {r.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">المتبقي: {formatEGP(r.outstandingAmount)} • الاستحقاق: {formatDateEG(r.dueDate)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => recordAction(r.id, "إصدار مطالبة")}>إصدار مطالبة</Button>
                    <Button size="sm" variant="outline" onClick={() => recordAction(r.id, "إنذار رسمي")}>إنذار قانوني</Button>
                    <Button size="sm" variant="outline" onClick={() => recordAction(r.id, "جدولة سداد")}>جدولة سداد</Button>
                    <Button size="sm" variant="outline" onClick={() => recordAction(r.id, "تسوية")}>تسوية</Button>
                    <Button size="sm" variant="outline" onClick={async () => { 
                      reconcileReceivableStore(r.id); 
                      try {
                        if (!r.id.startsWith("REC-")) {
                          await saveReceivable({ id: r.id, is_reconciled: true });
                        }
                        toast.success("تمت المطابقة المحاسبية");
                      } catch (e) {
                        toast.error("فشل التحديث");
                      }
                    }}>مطابقة محاسبية</Button>
                    <Button size="sm" onClick={() => tryClose(r.id)}>إغلاق مالي</Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400">لا توجد مطالبات أتعاب حالية</div>
            )}
          </CardContent>
        </Card>
      ) : activeTab === 'court_fees' ? (
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt size={18} className="text-green-600" />
              الرسوم القضائية المستحقة على الموكلين (الممولة من جيب المكتب)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {courtFeesExpenses.length > 0 ? (
              courtFeesExpenses.map((exp) => (
                <div key={exp.id} className="p-4 border dark:border-white/10 rounded-xl bg-white dark:bg-navy-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-900 dark:text-white">{exp.clientName}</span>
                      <Badge variant="outline" className="text-xs font-bold border-green-200 dark:border-white/10 text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-white/5">
                        {exp.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      القضية: <span className="font-bold text-slate-700 dark:text-slate-300">{exp.caseName || "غير محددة"}</span> • التاريخ: {formatDateEG(exp.date)}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xl italic">
                        الوصف: {exp.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 justify-between md:justify-end">
                    <span className="text-lg font-bold text-navy-900 dark:text-white font-mono">
                      {exp.amount.toLocaleString('ar-EG')} ج.م
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigate("/dashboard/invoices/eta", {
                          state: {
                            prefill: {
                              clientName: exp.clientName,
                              baseAmount: exp.amount,
                              serviceDescription: `استرداد رسوم قضائية — ${exp.category} — ${exp.description || ""}`,
                              expenseId: exp.id
                            }
                          }
                        });
                        toast.info("تم توجيهك لإنشاء فاتورة إلكترونية بالرسوم القضائية");
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold gap-1 text-xs"
                    >
                      <Plus size={14} />
                      أضف لفاتورة
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
                <Receipt size={48} className="stroke-[1.5]" />
                <p className="font-bold text-lg mt-2">لا توجد رسوم قضائية مستحقة</p>
                <p className="text-xs text-slate-500">تمت تسوية أو استرداد كافة الرسوم القضائية ومصاريف الموكلين بنجاح.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <PaymentPlans hideHeader={true} />
      )}
    </motion.div>
  );
}
