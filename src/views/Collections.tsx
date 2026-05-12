import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertTriangle, BarChart3, FileWarning, HandCoins, Plus } from "lucide-react";
import { useFinanceStore } from '@/store/useFinanceStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatEGP, formatDateEG } from "@/lib/formatEG";
import { fetchReceivables, saveReceivable, saveCollectionAction } from "@/services/legalDataService";
import { useEffect } from "react";

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchReceivables();
    setReceivablesStore(data.map((d: any) => ({
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
  };

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

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader><CardTitle className="text-base">أداء التحصيل</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {receivables.map((r) => (
            <div key={r.id} className="p-3 border rounded-md">
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
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
