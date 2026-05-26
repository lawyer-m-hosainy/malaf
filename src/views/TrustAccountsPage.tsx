import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Shield, ArrowUpLeft, ArrowDownRight, Wallet, History, Search, Trash2, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useCasesStore } from "@/store/useCasesStore";
import { useClientsStore } from "@/store/useClientsStore";
import { toast } from "sonner";
import { TrustTransactionFormData } from "@/types";

export default function TrustAccountsPage() {
  const trustTransactions = useFinanceStore(state => state.trustTransactions);
  const trustStats = useFinanceStore(state => state.trustStats);
  const trustLoading = useFinanceStore(state => state.trustLoading);
  const trustError = useFinanceStore(state => state.trustError);
  const trustFilterType = useFinanceStore(state => state.trustFilterType);
  const trustSearchQuery = useFinanceStore(state => state.trustSearchQuery);

  const loadTrustTransactions = useFinanceStore(state => state.loadTrustTransactions);
  const addTrustTransaction = useFinanceStore(state => state.addTrustTransaction);
  const removeTrustTransaction = useFinanceStore(state => state.removeTrustTransaction);
  const getClientBalance = useFinanceStore(state => state.getClientBalance);
  const setTrustFilterType = useFinanceStore(state => state.setTrustFilterType);
  const setTrustSearchQuery = useFinanceStore(state => state.setTrustSearchQuery);
  const getFilteredTrustTransactions = useFinanceStore(state => state.getFilteredTrustTransactions);

  const cases = useCasesStore(state => state.cases) || [];
  const clients = useClientsStore(state => state.clients) || [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TrustTransactionFormData>({
    transactionType: "deposit",
    clientId: "",
    caseId: "",
    amount: "",
    description: "",
    receiptNumber: "",
    transactionDate: new Date().toISOString().split("T")[0],
  });

  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [isCalculatingBalance, setIsCalculatingBalance] = useState(false);

  // Load transactions and stats on mount
  useEffect(() => {
    loadTrustTransactions();
  }, [loadTrustTransactions]);

  // Dynamic balance checking for withdrawals
  useEffect(() => {
    if (formData.transactionType !== "withdrawal" || !formData.clientId) {
      setAvailableBalance(null);
      return;
    }

    const fetchBalance = async () => {
      setIsCalculatingBalance(true);
      try {
        const bal = await getClientBalance(formData.clientId, formData.caseId || undefined);
        setAvailableBalance(bal);
      } catch (err) {
        console.error(err);
        setAvailableBalance(0);
      } finally {
        setIsCalculatingBalance(false);
      }
    };

    fetchBalance();
  }, [formData.transactionType, formData.clientId, formData.caseId, getClientBalance]);

  const amountNum = parseFloat(formData.amount);
  const balanceWarning = formData.transactionType === "withdrawal" &&
    availableBalance !== null &&
    !isNaN(amountNum) &&
    amountNum > availableBalance;

  const handleSaveTransaction = async () => {
    const amt = parseFloat(formData.amount);
    if (!formData.clientId) {
      toast.error("يرجى اختيار الموكل");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح أكبر من الصفر");
      return;
    }
    if (balanceWarning) {
      toast.error(`لا يمكن الصرف! المبلغ يتجاوز الرصيد المتاح (${availableBalance?.toLocaleString("ar-EG")} ج.م)`);
      return;
    }

    try {
      await addTrustTransaction({
        ...formData,
        caseId: formData.caseId || undefined,
      });
      toast.success("تم تسجيل حركة الأمانة بنجاح");
      setDialogOpen(false);
      // Reset form
      setFormData({
        transactionType: "deposit",
        clientId: "",
        caseId: "",
        amount: "",
        description: "",
        receiptNumber: "",
        transactionDate: new Date().toISOString().split("T")[0],
      });
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ المعاملة");
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm("هل أنت متأكد من رغبتك في حذف حركة الأمانة هذه؟")) {
      removeTrustTransaction(id)
        .then(() => {
          toast.success("تم حذف حركة الأمانة بنجاح");
        })
        .catch(() => {
          toast.error("فشل حذف حركة الأمانة");
        });
    }
  };

  const currencyFormatter = new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  });

  const dateFormatter = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const filteredTransactions = getFilteredTrustTransactions();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Shield className="text-green-600 w-8 h-8" />
            حسابات الأمانات (Escrow / Trust Accounts)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            إدارة مبالغ الموكلين المودعة لدى المكتب للإنفاق على القضايا (رسوم، مصاريف، إعلانات).
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white gap-2 font-bold shadow-lg shadow-green-600/20"
        >
          <Plus size={18} />
          إضافة إيداع/صرف أمانة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-white dark:bg-navy-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30">
                <ArrowUpLeft className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">إجمالي الإيداعات</p>
                <p className="text-2xl font-bold text-navy-900 dark:text-white">
                  {currencyFormatter.format(trustStats.totalDeposits)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-navy-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30">
                <ArrowDownRight className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">إجمالي الصرف</p>
                <p className="text-2xl font-bold text-navy-900 dark:text-white">
                  {currencyFormatter.format(trustStats.totalWithdrawals)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-navy-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <Wallet className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">الرصيد المتاح</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {currencyFormatter.format(trustStats.totalAvailableBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Ledger Table */}
      <Card className="border-none shadow-sm bg-white dark:bg-navy-800">
        <div className="p-6 border-b border-slate-50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <History size={18} className="text-slate-400" />
            سجل حركة الأمانات
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="بحث في الحركات..."
                value={trustSearchQuery}
                onChange={(e) => setTrustSearchQuery(e.target.value)}
                className="ps-10 w-full dark:bg-navy-900 dark:border-white/10"
              />
            </div>
            {/* Filter types */}
            <div className="flex bg-slate-100 dark:bg-navy-900 p-1 rounded-lg w-full sm:w-auto">
              <Button
                variant={trustFilterType === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs font-bold flex-1 sm:flex-initial"
                onClick={() => setTrustFilterType("all")}
              >
                الكل
              </Button>
              <Button
                variant={trustFilterType === "deposit" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs font-bold text-green-600 flex-1 sm:flex-initial"
                onClick={() => setTrustFilterType("deposit")}
              >
                إيداعات
              </Button>
              <Button
                variant={trustFilterType === "withdrawal" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs font-bold text-orange-500 flex-1 sm:flex-initial"
                onClick={() => setTrustFilterType("withdrawal")}
              >
                صرف
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-white/5">
              <TableRow>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">التاريخ</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">الموكل</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">القضية</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">النوع</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">الوصف</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">رقم الإيصال</TableHead>
                <TableHead className="text-start font-bold text-navy-900 dark:text-white">المبلغ</TableHead>
                <TableHead className="text-center font-bold text-navy-900 dark:text-white w-20">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trustLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <RefreshCw className="animate-spin w-5 h-5" />
                      <span>جاري تحميل سجل الأمانات...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : trustError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-red-500 font-bold">
                    {trustError}
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <TableCell className="text-sm dark:text-slate-300">
                      {dateFormatter(tx.transactionDate)}
                    </TableCell>
                    <TableCell className="font-bold text-navy-900 dark:text-white">
                      {tx.clientName}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                      {tx.caseName ?? <span className="text-slate-400 font-medium">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          tx.transactionType === "deposit"
                            ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-none font-bold"
                            : "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-none font-bold"
                        }
                      >
                        {tx.transactionType === "deposit" ? "إيداع (+)" : "صرف (-)"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate" title={tx.description}>
                      {tx.description ?? <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {tx.receiptNumber ?? <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell
                      className={
                        tx.transactionType === "deposit"
                          ? "font-bold text-green-600 dark:text-green-400"
                          : "font-bold text-orange-500 dark:text-orange-400"
                      }
                    >
                      {tx.transactionType === "deposit" ? "+" : "−"}{" "}
                      {tx.amount.toLocaleString("ar-EG")} ج.م
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                      <Shield size={48} className="stroke-[1.5]" />
                      <p className="font-bold text-lg mt-2">لا توجد حركات أمانات مسجلة</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                        {trustSearchQuery
                          ? "لا توجد معاملات تطابق معايير البحث الحالية."
                          : "لم تقم بتسجيل أي حركة إيداع أو صرف أمانة للموكلين بعد."}
                      </p>
                      {!trustSearchQuery && (
                        <Button
                          onClick={() => setDialogOpen(true)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white mt-4 font-bold"
                        >
                          تسجيل أول معاملة
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Escrow/Trust Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="dark:bg-navy-950 dark:text-white dark:border-white/10 max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Shield className="text-green-600" size={24} />
              تسجيل عملية أمانة جديدة
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Transaction Type */}
            <div className="grid gap-2">
              <Label className="font-bold">نوع العملية</Label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-navy-900 p-1 rounded-lg">
                <Button
                  type="button"
                  variant={formData.transactionType === "deposit" ? "secondary" : "ghost"}
                  onClick={() => setFormData(prev => ({ ...prev, transactionType: "deposit" }))}
                  className={
                    formData.transactionType === "deposit"
                      ? "bg-green-600 text-white font-bold hover:bg-green-600"
                      : "text-slate-600 dark:text-slate-400 font-bold"
                  }
                >
                  إيداع أمانة (+)
                </Button>
                <Button
                  type="button"
                  variant={formData.transactionType === "withdrawal" ? "secondary" : "ghost"}
                  onClick={() => setFormData(prev => ({ ...prev, transactionType: "withdrawal" }))}
                  className={
                    formData.transactionType === "withdrawal"
                      ? "bg-orange-500 text-white font-bold hover:bg-orange-500"
                      : "text-slate-600 dark:text-slate-400 font-bold"
                  }
                >
                  صرف من الأمانة (−)
                </Button>
              </div>
            </div>

            {/* Case Selection (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="case-select" className="font-bold">القضية (اختياري)</Label>
              <Select
                value={formData.caseId || "no-case"}
                onValueChange={(val) => {
                  const caseId = val === "no-case" ? "" : val;
                  let newClientId = formData.clientId;
                  if (caseId) {
                    const selectedCase = cases.find((c: any) => c.id === caseId);
                    if (selectedCase) {
                      newClientId = selectedCase.clientId;
                    }
                  }
                  setFormData(prev => ({
                    ...prev,
                    caseId: caseId || undefined,
                    clientId: newClientId || "",
                  }));
                }}
              >
                <SelectTrigger id="case-select" className="dark:bg-navy-900 dark:border-white/10 text-right">
                  <SelectValue placeholder="اختر القضية لربط الأمانة بها تلقائياً" />
                </SelectTrigger>
                <SelectContent className="dark:bg-navy-900 max-h-60" dir="rtl">
                  <SelectItem value="no-case">بدون قضية (أمانة عامة)</SelectItem>
                  {cases.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.plaintiff} ضد {c.defendant} (محكمة {c.court})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Selection */}
            <div className="grid gap-2">
              <Label htmlFor="client-select" className="font-bold">الموكل (مطلوب)</Label>
              <Select
                disabled={!!formData.caseId} // Disabled and auto-filled if a case is chosen
                value={formData.clientId}
                onValueChange={(val) => setFormData(prev => ({ ...prev, clientId: val || "" }))}
              >
                <SelectTrigger id="client-select" className="dark:bg-navy-900 dark:border-white/10 text-right">
                  <SelectValue placeholder="اختر الموكل المودع/الصارف" />
                </SelectTrigger>
                <SelectContent className="dark:bg-navy-900 max-h-60" dir="rtl">
                  {clients.map((cl: any) => (
                    <SelectItem key={cl.id} value={cl.id}>
                      {cl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.caseId && (
                <p className="text-[10px] text-slate-500 mr-1">
                  * تم تحديد الموكل وتأمينه تلقائياً بناءً على القضية المحددة.
                </p>
              )}
            </div>

            {/* Balance Indicator (Withdrawals only) */}
            {formData.transactionType === "withdrawal" && formData.clientId && (
              <div className="p-3 rounded-lg border dark:border-white/10 flex items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-navy-900/50">
                {isCalculatingBalance ? (
                  <div className="flex items-center gap-1.5 text-slate-500 animate-pulse">
                    <RefreshCw className="animate-spin w-4 h-4" />
                    <span>جاري حساب الرصيد المتاح...</span>
                  </div>
                ) : balanceWarning ? (
                  <div className="flex items-center gap-1.5 text-red-500 font-bold animate-shake">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>
                      الرصيد المتاح {availableBalance?.toLocaleString("ar-EG")} ج.م فقط — لا يمكن الصرف!
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-green-600 font-bold">
                    <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
                    <span>
                      الرصيد المتاح كافٍ: {availableBalance?.toLocaleString("ar-EG")} ج.م
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount-input" className="font-bold">المبلغ (ج.م)</Label>
              <Input
                id="amount-input"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="أدخل مبلغ العملية"
                className={
                  balanceWarning
                    ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500 focus:border-red-500 dark:bg-navy-900 text-red-600 dark:text-red-400"
                    : "dark:bg-navy-900 dark:border-white/10"
                }
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="desc-input" className="font-bold">الوصف والتفاصيل</Label>
              <Textarea
                id="desc-input"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="أدخل تفاصيل الإيداع أو بنود الصرف بالتفصيل..."
                className="dark:bg-navy-900 dark:border-white/10"
                rows={3}
              />
            </div>

            {/* Receipt Number (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="receipt-input" className="font-bold">رقم الإيصال أو الشيك (اختياري)</Label>
              <Input
                id="receipt-input"
                type="text"
                value={formData.receiptNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                placeholder="أدخل رقم الإيصال إن وجد"
                className="dark:bg-navy-900 dark:border-white/10"
              />
            </div>

            {/* Transaction Date */}
            <div className="grid gap-2">
              <Label htmlFor="date-input" className="font-bold">تاريخ العملية</Label>
              <Input
                id="date-input"
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
                className="dark:bg-navy-900 dark:border-white/10"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                // Clear form
                setFormData({
                  transactionType: "deposit",
                  clientId: "",
                  caseId: "",
                  amount: "",
                  description: "",
                  receiptNumber: "",
                  transactionDate: new Date().toISOString().split("T")[0],
                });
              }}
              className="dark:border-white/10"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              disabled={balanceWarning || isCalculatingBalance || !formData.clientId || !formData.amount}
              onClick={handleSaveTransaction}
              className={
                formData.transactionType === "deposit"
                  ? "bg-green-600 hover:bg-green-700 text-white font-bold"
                  : "bg-orange-500 hover:bg-orange-600 text-white font-bold"
              }
            >
              حفظ العملية
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
