import { motion } from "motion/react";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, Plus, Search, Filter, CheckCircle2, AlertCircle, 
  Clock, DollarSign, Wallet, CreditCard, ChevronLeft, RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useClientsStore } from "@/store/useClientsStore";
import { useCasesStore } from "@/store/useCasesStore";
import { formatEGP, formatDateEG } from "@/lib/formatEG";

export default function PaymentPlans({ hideHeader = false }: { hideHeader?: boolean }) {
  const paymentPlans = useFinanceStore((state) => state.paymentPlans) || [];
  const loadPaymentPlans = useFinanceStore((state) => state.loadPaymentPlans);
  const createPaymentPlan = useFinanceStore((state) => state.createPaymentPlan);
  const payInstallment = useFinanceStore((state) => state.payInstallment);
  const plansLoading = useFinanceStore((state) => state.plansLoading);

  const clients = useClientsStore((state) => state.clients) || [];
  const cases = useCasesStore((state) => state.cases) || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Form State for creating a new plan
  const [newPlan, setNewPlan] = useState({
    clientId: "",
    caseId: "",
    totalAmount: "",
    installmentsCount: "4",
    startDate: new Date().toISOString().split("T")[0],
    interval: "monthly", // monthly, weekly
    description: ""
  });

  // Form State for recording a payment
  const [paymentForm, setPaymentForm] = useState({
    installmentId: "",
    amount: 0,
    paidDate: new Date().toISOString().split("T")[0],
    notes: ""
  });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    loadPaymentPlans();
  }, []);

  // Filter payment plans
  const filteredPlans = useMemo(() => {
    return paymentPlans.filter((plan) => {
      const matchesSearch =
        plan.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.caseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.planDescription?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [paymentPlans, searchQuery, statusFilter]);

  // Statistics
  const totalPlanned = useMemo(() => paymentPlans.reduce((s, p) => s + p.totalAmount, 0), [paymentPlans]);
  const totalCollected = useMemo(() => paymentPlans.reduce((s, p) => s + p.paidAmount, 0), [paymentPlans]);
  const totalOutstanding = totalPlanned - totalCollected;
  const activePlansCount = useMemo(() => paymentPlans.filter((p) => p.status === "active").length, [paymentPlans]);

  // Preview generated installments
  const previewInstallments = useMemo(() => {
    const total = parseFloat(newPlan.totalAmount);
    const count = parseInt(newPlan.installmentsCount);
    if (isNaN(total) || total <= 0 || isNaN(count) || count <= 0) return [];

    const list = [];
    const installmentAmount = parseFloat((total / count).toFixed(2));
    const start = new Date(newPlan.startDate);

    for (let i = 0; i < count; i++) {
      const dueDate = new Date(start);
      if (newPlan.interval === "monthly") {
        dueDate.setMonth(start.getMonth() + i);
      } else if (newPlan.interval === "weekly") {
        dueDate.setDate(start.getDate() + i * 7);
      }
      
      // Handle the last installment decimal rounding differences
      const amount = i === count - 1 ? parseFloat((total - installmentAmount * (count - 1)).toFixed(2)) : installmentAmount;

      list.push({
        dueDate: dueDate.toISOString().split("T")[0],
        amount,
        status: "pending" as const
      });
    }
    return list;
  }, [newPlan.totalAmount, newPlan.installmentsCount, newPlan.startDate, newPlan.interval]);

  // Handle plan submit
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.clientId || !newPlan.totalAmount || previewInstallments.length === 0) {
      toast.error("يرجى ملء جميع الحقول المطلوبة لجدولة الأقساط");
      return;
    }

    const total = parseFloat(newPlan.totalAmount);
    const loadingToast = toast.loading("جاري تسجيل خطة الدفع والأقساط...");
    try {
      await createPaymentPlan(
        {
          clientId: newPlan.clientId,
          caseId: newPlan.caseId || undefined,
          totalAmount: total,
          paidAmount: 0,
          planDescription: newPlan.description || `جدولة أتعاب على ${newPlan.installmentsCount} أقساط`,
          status: "active"
        },
        previewInstallments
      );

      toast.success("تم جدولة خطة الدفع بنجاح", { id: loadingToast });
      setCreateDialogOpen(false);
      setNewPlan({
        clientId: "",
        caseId: "",
        totalAmount: "",
        installmentsCount: "4",
        startDate: new Date().toISOString().split("T")[0],
        interval: "monthly",
        description: ""
      });
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ خطة الدفع", { id: loadingToast });
    }
  };

  // Handle paying an installment
  const handlePayInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.installmentId || paymentForm.amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح للسداد");
      return;
    }

    const loadingToast = toast.loading("جاري تسجيل دفعة القسط...");
    try {
      await payInstallment(
        paymentForm.installmentId,
        paymentForm.amount,
        paymentForm.paidDate,
        paymentForm.notes
      );

      toast.success("تم سداد القسط بنجاح", { id: loadingToast });
      setPaymentDialogOpen(false);
      
      // Refresh current details dialog
      if (selectedPlan) {
        const updated = paymentPlans.find(p => p.id === selectedPlan.id);
        if (updated) setSelectedPlan(updated);
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء السداد", { id: loadingToast });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {!hideHeader ? (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">خطط الدفع والأقساط</h1>
            <p className="text-slate-500 mt-1">جدولة أتعاب الموكلين على دفعات دورية متسقة ومراقبة التدفقات النقدية.</p>
          </div>
          <Button 
            className="bg-primary-500 hover:bg-primary-600 text-white gap-2"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus size={18} />
            جدولة خطة دفع
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button 
            className="bg-primary-500 hover:bg-primary-600 text-white gap-2"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus size={18} />
            جدولة خطة دفع
          </Button>
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px] dark:bg-navy-900 dark:text-white max-h-[90vh] overflow-visible">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">إنشاء خطة دفع وأقساط جديدة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePlan} className="space-y-4 pt-4 text-start" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الموكل</Label>
                  <Select
                    value={newPlan.clientId}
                    onValueChange={(v) => {
                      const caseData = cases.find((c: any) => c.clientId === v);
                      setNewPlan(prev => ({ 
                        ...prev, 
                        clientId: v || "",
                        caseId: caseData ? caseData.id : ""
                      }));
                    }}
                  >
                    <SelectTrigger className="dark:bg-navy-800">
                      <SelectValue placeholder="اختر الموكل" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-navy-800 max-h-[250px] overflow-y-auto" style={{ zIndex: 9999 }}>
                      {clients.map((cl: any) => (
                        <SelectItem key={cl.id} value={cl.id}>{cl.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>القضية المرتبطة (اختياري)</Label>
                  <Select
                    value={newPlan.caseId}
                    onValueChange={(v) => {
                      const caseData = cases.find((c: any) => c.id === v);
                      setNewPlan(prev => ({ 
                        ...prev, 
                        caseId: v || "",
                        clientId: caseData ? caseData.clientId : prev.clientId
                      }));
                    }}
                  >
                    <SelectTrigger className="dark:bg-navy-800">
                      <SelectValue placeholder="اختر القضية" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-navy-800 max-h-[250px] overflow-y-auto" style={{ zIndex: 9999 }}>
                      {cases.length > 0 ? (
                        cases.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.plaintiff} ضد {c.defendant}</SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-xs text-slate-500">لا توجد قضايا متاحة</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>إجمالي أتعاب الخطة (ج.م)</Label>
                  <Input
                    type="number"
                    placeholder="30000"
                    className="dark:bg-navy-800"
                    value={newPlan.totalAmount}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, totalAmount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>عدد الأقساط</Label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    className="dark:bg-navy-800"
                    value={newPlan.installmentsCount}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, installmentsCount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ أول قسط</Label>
                  <Input
                    type="date"
                    className="dark:bg-navy-800"
                    value={newPlan.startDate}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>دورية الاستحقاق</Label>
                  <Select
                    value={newPlan.interval}
                    onValueChange={(v) => setNewPlan(prev => ({ ...prev, interval: v || "monthly" }))}
                  >
                    <SelectTrigger className="dark:bg-navy-800">
                      <SelectValue placeholder="اختر الدورية" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-navy-800">
                      <SelectItem value="monthly">شهري</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>وصف خطة السداد</Label>
                <Input
                  placeholder="مثال: أتعاب النقض وجلسات الاستئناف"
                  className="dark:bg-navy-800"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {previewInstallments.length > 0 && (
                <div className="mt-4 border dark:border-white/10 rounded-lg p-3 bg-slate-50 dark:bg-navy-950/50">
                  <p className="text-xs font-bold text-slate-500 mb-2">معاينة الأقساط المحسوبة تلقائياً:</p>
                  <div className="max-h-[160px] overflow-y-auto space-y-1.5 font-mono text-xs">
                    {previewInstallments.map((inst, index) => (
                      <div key={index} className="flex justify-between p-1.5 border-b border-dashed dark:border-white/5 last:border-none">
                        <span>القسط {index + 1}:</span>
                        <span className="font-bold text-navy-900 dark:text-white">{inst.amount.toLocaleString('ar-EG')} ج.م</span>
                        <span className="text-slate-400">{formatDateEG(inst.dueDate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold mt-4">
                تأكيد الجدولة وحفظ الخطة
              </Button>
            </form>
          </DialogContent>
        </Dialog>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Wallet className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">إجمالي الأتعاب المجدولة</p>
              <p className="text-xl font-bold font-mono text-navy-900 dark:text-white">{formatEGP(totalPlanned)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">المحصل الفعلي للأقساط</p>
              <p className="text-xl font-bold font-mono text-navy-900 dark:text-white">{formatEGP(totalCollected)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">متبقي الذمم المستحقة</p>
              <p className="text-xl font-bold font-mono text-navy-900 dark:text-white">{formatEGP(totalOutstanding)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <CreditCard className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">الخطط النشطة الحالية</p>
              <p className="text-xl font-bold text-navy-900 dark:text-white">{activePlansCount.toLocaleString('ar-EG')} خطة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Payment Plans table */}
      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="border-b border-slate-50 dark:border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-base font-bold text-navy-900 dark:text-white">سجلات خطط الدفع</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="بحث في خطط الدفع..." 
                  className="ps-10 w-64 dark:bg-navy-900 dark:border-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
                <SelectTrigger className="w-36 dark:bg-navy-900 dark:border-white/10">
                  <SelectValue placeholder="حالة الخطة" />
                </SelectTrigger>
                <SelectContent className="dark:bg-navy-800">
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="defaulted">تعثر سداد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-white/5">
              <TableRow>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">الموكل</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">القضية المرتبطة</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">الوصف</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">إجمالي المبلغ</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">المدفوع</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">المتبقي</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">الحالة</TableHead>
                <TableHead className="text-center font-bold text-navy-900 dark:text-white">الإجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plansLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                    <RefreshCw className="animate-spin inline-block mr-2 w-4 h-4" /> جاري تحميل خطط السداد...
                  </TableCell>
                </TableRow>
              ) : filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => {
                  const outstanding = plan.totalAmount - plan.paidAmount;
                  return (
                    <TableRow key={plan.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-bold text-navy-900 dark:text-white">{plan.clientName}</TableCell>
                      <TableCell className="text-sm dark:text-slate-300">{plan.caseName || "مستقلة"}</TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-xs truncate">{plan.planDescription}</TableCell>
                      <TableCell className="font-mono font-bold">{plan.totalAmount.toLocaleString('ar-EG')} ج.م</TableCell>
                      <TableCell className="font-mono text-emerald-600 font-bold">{plan.paidAmount.toLocaleString('ar-EG')} ج.م</TableCell>
                      <TableCell className="font-mono text-amber-600 font-bold">{outstanding.toLocaleString('ar-EG')} ج.م</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "font-bold",
                          plan.status === "completed" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
                          plan.status === "defaulted" ? "bg-red-100 text-red-700 hover:bg-red-200" :
                          "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        )}>
                          {plan.status === "completed" ? "مكتملة" : plan.status === "defaulted" ? "تعثر سداد" : "نشطة"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          عرض الأقساط
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                    لا توجد خطط سداد مسجلة تتطابق مع البحث.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog displaying installments */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] dark:bg-navy-900 dark:text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">تفاصيل الأقساط المقررة للموكل</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4 pt-4 text-start font-sans" dir="rtl">
              <div className="p-4 rounded-xl border dark:border-white/10 bg-slate-50 dark:bg-navy-950/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-slate-400">الموكل:</p>
                  <p className="font-bold text-sm text-navy-900 dark:text-white">{selectedPlan.clientName}</p>
                </div>
                <div>
                  <p className="text-slate-400">إجمالي المبلغ:</p>
                  <p className="font-bold text-sm font-mono">{selectedPlan.totalAmount.toLocaleString('ar-EG')} ج.م</p>
                </div>
                <div>
                  <p className="text-slate-400">المدفوع الفعلي:</p>
                  <p className="font-bold text-sm text-emerald-600 font-mono">{selectedPlan.paidAmount.toLocaleString('ar-EG')} ج.م</p>
                </div>
                <div>
                  <p className="text-slate-400">المتبقي المطلوب:</p>
                  <p className="font-bold text-sm text-amber-600 font-mono">{(selectedPlan.totalAmount - selectedPlan.paidAmount).toLocaleString('ar-EG')} ج.م</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-500 mb-3">جدول استحقاق الأقساط:</h3>
                <div className="border dark:border-white/10 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-white/5">
                      <TableRow>
                        <TableHead className="text-start font-bold py-2">رقم القسط</TableHead>
                        <TableHead className="text-start font-bold py-2">تاريخ الاستحقاق</TableHead>
                        <TableHead className="text-start font-bold py-2">المبلغ</TableHead>
                        <TableHead className="text-start font-bold py-2">تاريخ السداد</TableHead>
                        <TableHead className="text-start font-bold py-2">الحالة</TableHead>
                        <TableHead className="text-center font-bold py-2">الإجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPlan.installments && selectedPlan.installments.length > 0 ? (
                        selectedPlan.installments.map((inst: any, idx: number) => {
                          const isOverdue = new Date(inst.dueDate).getTime() < Date.now() && inst.status === "pending";
                          return (
                            <TableRow key={inst.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 last:border-none transition-colors">
                              <TableCell className="font-bold py-2">قسط {idx + 1}</TableCell>
                              <TableCell className="text-xs py-2 font-mono">{formatDateEG(inst.dueDate)}</TableCell>
                              <TableCell className="font-mono font-bold py-2">{inst.amount.toLocaleString('ar-EG')} ج.م</TableCell>
                              <TableCell className="text-xs py-2 font-mono text-slate-500">{inst.paidDate ? formatDateEG(inst.paidDate) : "—"}</TableCell>
                              <TableCell className="py-2">
                                <Badge className={cn(
                                  "font-bold text-[10px] px-1.5 py-0.5",
                                  inst.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                                  isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                )}>
                                  {inst.status === "paid" ? "تم السداد" : isOverdue ? "متأخر" : "معلق"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center py-2">
                                {inst.status !== "paid" ? (
                                  <Button 
                                    size="xs" 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 h-7"
                                    onClick={() => {
                                      setPaymentForm({
                                        installmentId: inst.id,
                                        amount: inst.amount,
                                        paidDate: new Date().toISOString().split("T")[0],
                                        notes: ""
                                      });
                                      setPaymentDialogOpen(true);
                                    }}
                                  >
                                    تسجيل دفع
                                  </Button>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                                    <CheckCircle2 size={12} /> مكتمل
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-slate-400">لا توجد أقساط مجدولة.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tiny Sub-Dialog to record installment payment */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px] dark:bg-navy-900 dark:text-white" style={{ zIndex: 60 }}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={16} />
              سداد القسط المستحق
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePayInstallment} className="space-y-4 pt-2 text-start font-sans" dir="rtl">
            <div className="space-y-2">
              <Label>المبلغ المستحق سداده (ج.م)</Label>
              <Input
                type="number"
                className="dark:bg-navy-800"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ السداد</Label>
              <Input
                type="date"
                className="dark:bg-navy-800"
                value={paymentForm.paidDate}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, paidDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات السداد</Label>
              <Input
                placeholder="مثال: نقداً أو بحوالة بنكية"
                className="dark:bg-navy-800"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold mt-2">
              تأكيد عملية السداد
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
