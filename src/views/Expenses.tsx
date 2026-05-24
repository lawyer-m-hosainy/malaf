import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Receipt, Wallet, TrendingDown, History, Search, Filter, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { formatDateEG } from "@/lib/formatEG";
import { toast } from "sonner";
import { useFinanceStore } from '@/store/useFinanceStore';
import { useCasesStore } from '@/store/useCasesStore';
import { useClientsStore } from '@/store/useClientsStore';
import { saveExpense, saveTrustTransaction } from "@/services/legalDataService";

export default function Expenses() {
  const expenses = useFinanceStore((state) => state.expenses);
  const addExpense = useFinanceStore((state) => state.addExpense);
  const cases = useCasesStore((state) => state.cases) || [];
  const clients = useClientsStore((state) => state.clients) || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    caseId: "",
    clientId: "",
    category: "",
    amount: "",
    description: "",
    fundingSource: "office"
  });

  const getClientBalance = useFinanceStore(state => state.getClientBalance);
  const [clientBalance, setClientBalance] = useState<number | null>(null);
  const [isCalculatingBalance, setIsCalculatingBalance] = useState(false);

  useEffect(() => {
    if (newExpense.fundingSource !== 'trust' || !newExpense.clientId) {
      setClientBalance(null);
      return;
    }
    const fetchBal = async () => {
      setIsCalculatingBalance(true);
      try {
        const bal = await getClientBalance(newExpense.clientId, newExpense.caseId || undefined);
        setClientBalance(bal);
      } catch {
        setClientBalance(0);
      } finally {
        setIsCalculatingBalance(false);
      }
    };
    fetchBal();
  }, [newExpense.fundingSource, newExpense.clientId, newExpense.caseId, getClientBalance]);

  const isClientExpense = ['رسوم قضائية', 'أمانة خبير', 'رسم إعلان (محضر)'].includes(newExpense.category);
  const amountNum = parseFloat(newExpense.amount);
  const balanceWarning = newExpense.fundingSource === 'trust' &&
    clientBalance !== null &&
    !isNaN(amountNum) &&
    amountNum > clientBalance;

  const filteredExpenses = expenses.filter(exp => 
    (exp.caseName && exp.caseName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    exp.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingReimbursement = expenses
    .filter(e => e.status === 'معلق')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const stats = [
    { title: "إجمالي المصروفات", value: `${totalExpenses.toLocaleString('ar-EG')} ج.م`, icon: Wallet, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "بانتظار الاسترداد", value: `${pendingReimbursement.toLocaleString('ar-EG')} ج.م`, icon: TrendingDown, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { title: "عدد العمليات", value: expenses.length.toLocaleString('ar-EG'), icon: History, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">إدارة المصروفات</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">تتبع تكاليف القضايا، الرسوم القضائية، والمصروفات النثرية.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button className="bg-primary-500 hover:bg-primary-600 text-white gap-2" onClick={() => setDialogOpen(true)}>
            <Plus size={18} />
            تسجيل مصروف جديد
          </Button>
          <DialogContent className="dark:bg-navy-900 dark:text-white">
            <DialogHeader>
              <DialogTitle>تسجيل مصروف جديد</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="case">القضية</Label>
                <Select
                  value={newExpense.caseId}
                  onValueChange={(v) => {
                    if (v) {
                      const caseData = cases.find((c: any) => c.id === v);
                      setNewExpense(prev => ({
                        ...prev,
                        caseId: v,
                        clientId: caseData ? caseData.clientId : prev.clientId
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="dark:bg-navy-800">
                    <SelectValue placeholder="اختر القضية" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-navy-800">
                    {cases.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.plaintiff} ضد {c.defendant}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">التصنيف</Label>
                <Select value={newExpense.category} onValueChange={(v) => v && setNewExpense(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="dark:bg-navy-800">
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-navy-800">
                    <SelectItem value="دمغة محاماة">دمغة محاماة</SelectItem>
                    <SelectItem value="رسوم نقابة">رسوم نقابة</SelectItem>
                    <SelectItem value="أمانة خبير">رسوم خبراء — على الموكل</SelectItem>
                    <SelectItem value="رسم إعلان (محضر)">رسوم إعلانات — على الموكل</SelectItem>
                    <SelectItem value="رسوم قضائية">رسوم قضائية — على الموكل</SelectItem>
                    <SelectItem value="مصروفات انتقال">مصروفات انتقال</SelectItem>
                    <SelectItem value="مصروفات طباعة ونسخ">مصروفات طباعة ونسخ</SelectItem>
                    <SelectItem value="أمانة تنفيذ">أمانة تنفيذ</SelectItem>
                    <SelectItem value="رسوم شهر عقاري">رسوم شهر عقاري</SelectItem>
                    <SelectItem value="أخرى">أخرى (حر)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isClientExpense && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="client">الموكل المستحق عليه</Label>
                    <Select
                      disabled={!!newExpense.caseId}
                      value={newExpense.clientId}
                      onValueChange={(v) => setNewExpense(prev => ({ ...prev, clientId: v || "" }))}
                    >
                      <SelectTrigger className="dark:bg-navy-800">
                        <SelectValue placeholder="اختر الموكل" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-navy-800">
                        {clients.map((cl: any) => (
                          <SelectItem key={cl.id} value={cl.id}>{cl.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="funding">مصدر التمويل</Label>
                    <Select
                      value={newExpense.fundingSource}
                      onValueChange={(v) => setNewExpense(prev => ({ ...prev, fundingSource: v || "office" }))}
                    >
                      <SelectTrigger className="dark:bg-navy-800">
                        <SelectValue placeholder="اختر مصدر التمويل" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-navy-800">
                        <SelectItem value="trust">من حساب الأمانة</SelectItem>
                        <SelectItem value="office">من المكتب (سيُسترد لاحقاً)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newExpense.fundingSource === 'trust' && newExpense.clientId && (
                    <div className="p-3 rounded-lg border dark:border-white/10 flex items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-navy-950/50">
                      {isCalculatingBalance ? (
                        <div className="flex items-center gap-1.5 text-slate-500 animate-pulse">
                          <RefreshCw className="animate-spin w-4 h-4" />
                          <span>جاري حساب رصيد الأمانة المتاح...</span>
                        </div>
                      ) : balanceWarning ? (
                        <div className="flex items-center gap-1.5 text-red-500 font-bold">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                          <span>
                            الرصيد المتاح {clientBalance?.toLocaleString("ar-EG")} ج.م فقط — الرصيد غير كافٍ!
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-600 font-bold">
                          <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
                          <span>
                            الرصيد المتاح كافٍ: {clientBalance?.toLocaleString("ar-EG")} ج.م
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              <div className="grid gap-2">
                <Label htmlFor="amount">المبلغ (ج.م)</Label>
                <Input id="amount" type="number" className="dark:bg-navy-800" value={newExpense.amount} onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">الوصف</Label>
                <Input id="desc" className="dark:bg-navy-800" value={newExpense.description} onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="dark:border-white/10" onClick={() => {
                setDialogOpen(false);
                setNewExpense({
                  caseId: "",
                  clientId: "",
                  category: "",
                  amount: "",
                  description: "",
                  fundingSource: "office"
                });
              }}>إلغاء</Button>
              <Button
                className="bg-primary-500 text-white font-bold"
                disabled={balanceWarning || isCalculatingBalance || (isClientExpense && !newExpense.clientId) || !newExpense.amount}
                onClick={async () => {
                  const amountNum = parseFloat(newExpense.amount);
                  if (isNaN(amountNum) || amountNum <= 0 || !newExpense.category) {
                    toast.error("يرجى ملء جميع الحقول وإدخال مبلغ صحيح");
                    return;
                  }
                  if (isClientExpense && !newExpense.clientId) {
                    toast.error("يرجى تحديد الموكل المستحق عليه المصروف");
                    return;
                  }
                  if (balanceWarning) {
                    toast.error("لا يمكن الحفظ! الرصيد المتاح في الأمانة غير كافٍ.");
                    return;
                  }

                  const caseData = cases.find((c: any) => c.id === newExpense.caseId);
                  const clientData = newExpense.clientId
                    ? clients.find((cl: any) => cl.id === newExpense.clientId)
                    : (caseData ? clients.find((cl: any) => cl.id === caseData.clientId) : null);

                  const loadingToast = toast.loading("جاري حفظ المصروف...");
                  try {
                    const expenseId = `EXP-${Date.now()}`;
                    const expData = {
                      id: expenseId,
                      clientId: clientData ? clientData.id : "UNKNOWN",
                      clientName: clientData ? clientData.name : "غير معروف",
                      caseId: newExpense.caseId || undefined,
                      caseName: caseData ? `${caseData.plaintiff} ضد ${caseData.defendant}` : newExpense.caseId,
                      category: newExpense.category as any,
                      amount: amountNum,
                      date: new Date().toISOString().split('T')[0],
                      status: isClientExpense && newExpense.fundingSource === 'trust' ? 'مخصوم من الأمانة' : 'معلق',
                      description: newExpense.description,
                    };

                    // 1. Save to Database
                    await saveExpense(expData);

                    // 2. Log withdrawal in trust_transactions if funded from trust
                    if (isClientExpense && newExpense.fundingSource === 'trust' && newExpense.clientId) {
                      await saveTrustTransaction({
                        clientId: newExpense.clientId,
                        caseId: newExpense.caseId || undefined,
                        transactionType: 'withdrawal',
                        amount: amountNum,
                        description: `خصم تلقائي لمصروف: ${newExpense.category} — ${newExpense.description || ""}`,
                        transactionDate: new Date().toISOString().split('T')[0],
                      });
                    }

                    // 3. Update Zustand Store and UI
                    addExpense(expData as any);
                    toast.success("تم حفظ المصروف بنجاح", { id: loadingToast });
                    setDialogOpen(false);
                    setNewExpense({
                      caseId: "",
                      clientId: "",
                      category: "",
                      amount: "",
                      description: "",
                      fundingSource: "office"
                    });
                  } catch (err: any) {
                    toast.error(err.message || "حدث خطأ أثناء حفظ المصروف", { id: loadingToast });
                  }
                }}
              >
                حفظ المصروف
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-navy-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader className="border-b border-slate-50 dark:border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold text-navy-900 dark:text-white">سجل المصروفات</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="بحث في المصروفات..." 
                  className="ps-10 w-64 dark:bg-navy-900 dark:border-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="dark:border-white/10" onClick={() => toast.success("تم تفعيل التصفية")}>
                <Filter size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-white/5">
              <TableRow>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">التاريخ</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">القضية</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">التصنيف</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">الوصف</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">المبلغ</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((exp) => (
                <TableRow key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <TableCell className="text-sm dark:text-slate-300">{formatDateEG(new Date(exp.date))}</TableCell>
                  <TableCell className="font-bold text-navy-900 dark:text-white">{exp.caseName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="dark:border-white/10 dark:text-slate-300">
                      {exp.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                    {exp.description}
                  </TableCell>
                  <TableCell className="font-bold text-navy-900 dark:text-white">
                    {exp.amount.toLocaleString('ar-EG')} ج.م
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Badge className={cn(
                      "font-bold",
                      exp.status === 'تم السداد' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" :
                      exp.status === 'معلق' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" :
                      "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                    )}>
                      {exp.status}
                    </Badge>
                    {exp.amount > 500 && (
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 gap-1 border-none cursor-pointer">
                        يحتاج اعتماد الشريك
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
