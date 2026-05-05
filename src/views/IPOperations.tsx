import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, FileBadge2, Gavel, ShieldCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import { useIPStore } from '@/store/useIPStore';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function isNear(date: string, days = 15) {
  const d = new Date(date).getTime();
  const diff = d - Date.now();
  return diff <= days * 24 * 60 * 60 * 1000;
}

export default function IPOperations() {
  const ipFilings = useIPStore((state) => state.ipFilings);
  const ipRenewals = useIPStore((state) => state.ipRenewals);
  const ipOppositions = useIPStore((state) => state.ipOppositions);
  const ipEnforcementActions = useIPStore((state) => state.ipEnforcementActions);
  const addIPFiling = useIPStore((state) => state.addIPFiling);
  const updateIPRenewalStatus = useIPStore((state) => state.updateIPRenewalStatus);
  const updateIPOppositionStatus = useIPStore((state) => state.updateIPOppositionStatus);
  const updateIPEnforcementStatus = useIPStore((state) => state.updateIPEnforcementStatus);
  const addAuditLog = useUIStore((state) => state.addAuditLog);
  const currentUser = useAuthStore((state) => state.currentUser);

  // Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFilingData, setNewFilingData] = useState({
    clientName: "",
    type: "علامة تجارية" as "علامة تجارية" | "براءة اختراع" | "حق مؤلف",
    authority: "جهاز تنمية التجارة الداخلية",
  });

  const nearRenewals = useMemo(() => ipRenewals.filter((r) => isNear(r.dueDate)), [ipRenewals]);

  const log = (action: string, details: string) => {
    addAuditLog({
      id: `AL-IP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: currentUser?.id || "unknown",
      userName: currentUser?.name || "unknown",
      action,
      module: "ip-operations",
      details,
      timestamp: new Date().toISOString(),
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilingData.clientName) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    
    addIPFiling({
      id: `FIL-${Math.floor(Math.random() * 90000)}`,
      ipRecordId: `IP-${Math.floor(Math.random() * 9000)}`,
      clientName: newFilingData.clientName,
      type: newFilingData.type,
      filingDate: new Date().toISOString(),
      authority: newFilingData.authority,
      status: "قيد التقديم",
      feeAmount: 0
    });
    
    toast.success("تم إضافة ملف تقديم جديد");
    setIsAddOpen(false);
    setNewFilingData({ ...newFilingData, clientName: "" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">عمليات الملكية الفكرية</h1>
          <p className="text-slate-500 mt-1">إدارة التسجيل والتجديد والاعتراض والإنفاذ مع تنبيهات المهل.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-primary-100 text-primary-700 hidden sm:inline-flex">IP Ops</Badge>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="bg-primary-500 hover:bg-primary-600 text-white gap-2" />}>
              <Plus size={16} />
              تقديم جديد
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>إنشاء ملف تقديم ملكية فكرية</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم العميل (المالك)</label>
                  <Input 
                    placeholder="مثال: مؤسسة الرواد" 
                    value={newFilingData.clientName}
                    onChange={(e) => setNewFilingData(prev => ({...prev, clientName: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">النوع</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    value={newFilingData.type}
                    onChange={(e) => setNewFilingData(prev => ({...prev, type: e.target.value as any}))}
                  >
                    <option value="علامة تجارية">علامة تجارية</option>
                    <option value="براءة اختراع">براءة اختراع</option>
                    <option value="حق مؤلف">حق مؤلف</option>
                  </select>
                </div>
                <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white mt-4">
                  إضافة وإرسال
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm dark:bg-navy-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell size={16} /> تقويم مهل التجديد والاعتراض</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {nearRenewals.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد مهل قريبة خلال 15 يوم.</p>
          ) : (
            nearRenewals.map((r) => (
              <div key={r.id} className="p-2 rounded-md bg-amber-50 text-amber-700 text-sm">
                تجديد قريب: {r.ipRecordId} بتاريخ {r.dueDate}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileBadge2 size={16} /> سجلات التقديم</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ipFilings.map((f) => (
              <div key={f.id} className="p-3 border rounded-md">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">{f.id} • {f.clientName}</p>
                  <Badge>{f.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">{f.type} • {f.authority} • رسوم: {f.feeAmount || 0} ج.م</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck size={16} /> التجديدات</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ipRenewals.map((r) => (
              <div key={r.id} className="p-3 border rounded-md">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">{r.id} • {r.ipRecordId}</p>
                  <Badge className={r.status === "متأخر" ? "bg-destructive/10 text-destructive" : r.status === "مكتمل" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}>
                    {r.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">Due: {r.dueDate} • رسوم: {r.feeAmount || 0} ج.م</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { updateIPRenewalStatus(r.id, "مكتمل"); log("IP Renewal Update", `${r.id} -> مكتمل`); toast.success("تم تحديث حالة التجديد"); }}>مكتمل</Button>
                  <Button size="sm" variant="outline" onClick={() => { updateIPRenewalStatus(r.id, "متأخر"); log("IP Renewal Update", `${r.id} -> متأخر`); toast.success("تم تحديث الحالة"); }}>متأخر</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gavel size={16} /> الاعتراضات</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ipOppositions.map((o) => (
              <div key={o.id} className="p-3 border rounded-md">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">{o.id} • ضد {o.againstParty}</p>
                  <Badge>{o.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">{o.reason}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { updateIPOppositionStatus(o.id, "قيد النظر"); log("IP Opposition Update", `${o.id} -> قيد النظر`); }}>قيد النظر</Button>
                  <Button size="sm" variant="outline" onClick={() => { updateIPOppositionStatus(o.id, "محسوم"); log("IP Opposition Update", `${o.id} -> محسوم`); }}>محسوم</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader><CardTitle className="text-base">إجراءات الإنفاذ</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ipEnforcementActions.map((a) => (
              <div key={a.id} className="p-3 border rounded-md">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">{a.id} • {a.actionType}</p>
                  <Badge>{a.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">{a.description}</p>
                <p className="text-xs text-slate-500">رسوم: {a.feeAmount || 0} ج.م</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { updateIPEnforcementStatus(a.id, "قيد المتابعة"); log("IP Enforcement Update", `${a.id} -> قيد المتابعة`); }}>قيد المتابعة</Button>
                  <Button size="sm" variant="outline" onClick={() => { updateIPEnforcementStatus(a.id, "مغلق"); log("IP Enforcement Update", `${a.id} -> مغلق`); }}>إغلاق</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
