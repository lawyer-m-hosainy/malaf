import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, BriefcaseBusiness, Scale, Plus } from "lucide-react";
import { toast } from "sonner";
import { useComplianceStore } from '@/store/useComplianceStore';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function isSlaNear(date?: string) {
  if (!date) return false;
  const diff = new Date(date).getTime() - Date.now();
  return diff <= 24 * 60 * 60 * 1000;
}

export default function SpecializedTracks() {
  const specializedTracks = useComplianceStore((state) => state.specializedTracks);
  const toggleSpecializedChecklist = useComplianceStore((state) => state.toggleSpecializedChecklist);
  const updateSpecializedTrackStatus = useComplianceStore((state) => state.updateSpecializedTrackStatus);
  const addSpecializedTrack = useComplianceStore((state) => state.addSpecializedTrack);
  const addAuditLog = useUIStore((state) => state.addAuditLog);
  const currentUser = useAuthStore((state) => state.currentUser);

  // Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTrackData, setNewTrackData] = useState({
    caseId: "",
    caseType: "عمالي" as "عمالي" | "جنائي",
  });

  const kpi = useMemo(() => {
    const labor = specializedTracks.filter((t) => t.caseType === "عمالي");
    const criminal = specializedTracks.filter((t) => t.caseType === "جنائي");
    return {
      laborOnTime: labor.filter((t) => t.status !== "متأخر").length,
      laborTotal: labor.length,
      criminalOnTime: criminal.filter((t) => t.status !== "متأخر").length,
      criminalTotal: criminal.length,
    };
  }, [specializedTracks]);

  const log = (action: string, details: string) => {
    addAuditLog({
      id: `AL-SP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: currentUser?.id || "unknown",
      userName: currentUser?.name || "unknown",
      action,
      module: "specialized-tracks",
      details,
      timestamp: new Date().toISOString(),
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackData.caseId) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    
    addSpecializedTrack({
      id: `ST-${newTrackData.caseType === 'عمالي' ? 'LAB' : 'CRI'}-${Math.floor(Math.random() * 9000)}`,
      caseId: newTrackData.caseId,
      caseType: newTrackData.caseType,
      stage: newTrackData.caseType === 'عمالي' ? "مكتب العمل" : "الشرطة",
      slaDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "نشط",
      checklist: [
        { id: "c1", title: "جمع المستندات الأولية", done: false },
        { id: "c2", title: "صياغة المذكرة", done: false }
      ],
      documentTemplates: [],
      steps: [
        { id: "s1", name: "الخطوة الأولى", completed: false }
      ],
      createdAt: new Date().toISOString()
    });
    
    toast.success("تم إضافة المسار بنجاح");
    setIsAddOpen(false);
    setNewTrackData({ ...newTrackData, caseId: "" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">المسارات المتخصصة</h1>
          <p className="text-slate-500 mt-1">قوالب عمل عمالي/جزائي مع checklists إلزامية وتنبيهات SLA.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-primary-100 text-primary-700 hidden sm:inline-flex">Labor + Criminal</Badge>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="bg-primary-500 hover:bg-primary-600 text-white gap-2" />}>
              <Plus size={16} />
              إضافة مسار
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>إضافة مسار عمل لقضية</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">رقم / ملف القضية</label>
                  <Input 
                    placeholder="مثال: C-12345" 
                    value={newTrackData.caseId}
                    onChange={(e) => setNewTrackData(prev => ({...prev, caseId: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">نوع المسار</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    value={newTrackData.caseType}
                    onChange={(e) => setNewTrackData(prev => ({...prev, caseType: e.target.value as any}))}
                  >
                    <option value="عمالي">عمالي</option>
                    <option value="جنائي">جنائي</option>
                  </select>
                </div>
                <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white mt-4">
                  إنشاء المسار
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BriefcaseBusiness size={16} /> KPI عمالي</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpi.laborTotal ? Math.round((kpi.laborOnTime / kpi.laborTotal) * 100) : 0}%</p>
            <p className="text-xs text-slate-500">نسبة الالتزام بالمواعيد</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm dark:bg-navy-800">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Scale size={16} /> KPI جزائي</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpi.criminalTotal ? Math.round((kpi.criminalOnTime / kpi.criminalTotal) * 100) : 0}%</p>
            <p className="text-xs text-slate-500">نسبة الالتزام بالمواعيد</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {specializedTracks.map((t) => (
          <Card key={t.id} className="border-none shadow-sm dark:bg-navy-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t.id} • {t.caseType}</CardTitle>
              <Badge className={t.status === "متأخر" ? "bg-destructive/10 text-destructive" : t.status === "مغلق" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}>
                {t.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge>{t.stage}</Badge>
                {isSlaNear(t.slaDueAt) && t.status !== "مغلق" && (
                  <Badge className="bg-amber-100 text-amber-700 gap-1"><Bell size={12} /> SLA قريب</Badge>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Workflow Steps</h3>
                <div className="space-y-2">
                  {t.steps.map((s) => (
                    <div key={s.id} className="p-2 border rounded-md text-sm flex items-center justify-between">
                      <span>{s.name}</span>
                      <Badge className={s.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                        {s.completed ? "مكتمل" : "قيد التنفيذ"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Checklist إلزامي</h3>
                <div className="space-y-2">
                  {t.checklist.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        toggleSpecializedChecklist(t.id, c.id);
                        log("Toggle Specialized Checklist", `${t.id} -> ${c.id}`);
                      }}
                      className="w-full text-start p-2 border rounded-md text-sm hover:bg-slate-50"
                    >
                      <span className={c.done ? "line-through text-slate-500" : ""}>{c.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">قوالب مستندات</h3>
                <div className="flex flex-wrap gap-2">
                  {t.documentTemplates.map((d) => (
                    <Badge key={d.id} className="bg-slate-100 text-slate-700">{d.title}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { updateSpecializedTrackStatus(t.id, "نشط"); toast.success("تم تحديث الحالة"); }}>نشط</Button>
                <Button size="sm" variant="outline" onClick={() => { updateSpecializedTrackStatus(t.id, "متأخر"); toast.success("تم تحديث الحالة"); }}>متأخر</Button>
                <Button size="sm" onClick={() => { updateSpecializedTrackStatus(t.id, "مغلق"); toast.success("تم إغلاق المسار"); }}>إغلاق</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
