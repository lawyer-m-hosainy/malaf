import { useState, useMemo } from "react";
import { formatEGP, formatDateEG } from "@/lib/formatEG";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, CalendarClock, Briefcase, Hash, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useExpertStore } from "@/store/useExpertStore";
import { useEffect } from "react";
import { fetchExpertMissions, fetchExpertSessions } from "@/services/legalDataService";

export default function ExpertMissions() {
  const missions = useExpertStore(state => state.missions);
  const setMissions = useExpertStore(state => state.setMissions);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const loadMissions = async () => {
      const dbMissions = await fetchExpertMissions();
      const fullMissions = await Promise.all(dbMissions.map(async (m: any) => {
        const sessions = await fetchExpertSessions(m.id);
        return {
          id: m.id,
          caseId: m.case_id,
          caseName: m.case_id || "غير محدد", // Should join cases for real name
          expertType: m.expert_type,
          expertName: m.expert_name,
          missionNumber: m.mission_number,
          assignmentDate: m.assignment_date,
          depositAmount: m.deposit_amount,
          reportReceived: m.report_received,
          objectionFiled: m.objection_filed,
          status: m.status,
          sessions: sessions.map((s: any) => ({
            id: s.id,
            date: s.date,
            result: s.result,
            nextSession: s.next_session
          }))
        };
      }));
      setMissions(fullMissions);
      if (fullMissions.length > 0 && !selectedId) {
        setSelectedId(fullMissions[0].id);
      }
    };
    loadMissions();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return missions;
    return missions.filter(m => 
      m.expertName.toLowerCase().includes(q) ||
      m.missionNumber.toLowerCase().includes(q) ||
      m.caseName.toLowerCase().includes(q)
    );
  }, [missions, query]);

  const selected = filtered.find(m => m.id === selectedId) || filtered[0];

  const hasStaleWarning = (sessions: any[]) => {
    if (sessions.length === 0) return true;
    const lastSession = new Date(sessions[sessions.length - 1].date);
    const diff = (Date.now() - lastSession.getTime()) / (1000 * 3600 * 24);
    return diff > 30;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">مأموريات الخبراء</h1>
          <p className="text-slate-500 mt-1">متابعة إحالات القضايا للخبراء، الجلسات، والأمانات.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-primary-500 hover:bg-primary-600 text-white gap-2 shadow-lg shadow-primary-500/20">
            <Plus size={16} />
            إضافة مأمورية
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-none shadow-sm dark:bg-navy-800">
          <CardHeader>
            <CardTitle className="text-base">قائمة المأموريات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="بحث برقم المأمورية أو الخبير..." 
                className="pr-10 dark:bg-navy-900" 
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-[600px] overflow-auto pe-1">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-start p-3.5 rounded-lg border-2 transition-all duration-200 ${
                    selected?.id === item.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md shadow-primary-500/10"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs text-slate-500">{item.missionNumber}</span>
                    <Badge variant={item.status === 'منتهية' ? 'default' : 'outline'} className={
                      item.status === 'جارية' ? 'border-primary-500 text-primary-700 dark:text-primary-400' : ''
                    }>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-navy-900 dark:text-white truncate">{item.caseName}</p>
                  <p className="text-xs text-slate-500 truncate mt-1">خبير {item.expertType} - {item.expertName}</p>
                  
                  {hasStaleWarning(item.sessions) && item.status === 'جارية' && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                      <AlertTriangle size={12} />
                      تجاوزت 30 يوماً بلا جلسات
                    </div>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-slate-500 py-8">لا توجد مأموريات مطابقة</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm dark:bg-navy-800">
          <CardHeader>
            <CardTitle className="text-base text-navy-900 dark:text-white">تفاصيل المأمورية</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">اختر مأمورية لعرض التفاصيل</p>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10">
                    <Hash size={16} className="text-slate-400" />
                    <span className="font-bold text-navy-900 dark:text-white">{selected.missionNumber}</span>
                  </div>
                  <Badge variant="outline" className="gap-1 border-primary-200 text-primary-700 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300">
                    <Briefcase size={12} />
                    خبير {selected.expertType}
                  </Badge>
                  {selected.objectionFiled && (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">مُعترض عليها</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الخبير المنتدب</p>
                    <p className="font-bold text-sm text-navy-900 dark:text-white truncate" title={selected.expertName}>{selected.expertName}</p>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">تاريخ الإحالة</p>
                    <p className="font-bold text-sm text-navy-900 dark:text-white">{formatDateEG(selected.assignmentDate)}</p>
                  </div>
                  <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">أمانة الخبير</p>
                    <p className="font-bold text-sm text-emerald-700 dark:text-emerald-300">{formatEGP(selected.depositAmount)}</p>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">استلام التقرير</p>
                    <div className="flex items-center gap-1">
                      {selected.reportReceived ? (
                        <><CheckCircle size={14} className="text-emerald-500" /> <span className="font-bold text-sm text-emerald-600">تم الاستلام</span></>
                      ) : (
                        <><Clock size={14} className="text-slate-400" /> <span className="font-bold text-sm text-slate-600 dark:text-slate-300">في الانتظار</span></>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-navy-900 dark:text-white flex items-center gap-2">
                      <CalendarClock size={18} className="text-primary-500" />
                      جلسات الخبير
                    </h3>
                    <Button variant="outline" size="sm" className="dark:border-white/10">إضافة جلسة</Button>
                  </div>
                  
                  {selected.sessions.length === 0 ? (
                    <div className="p-6 text-center border rounded-lg border-dashed dark:border-white/10">
                      <p className="text-sm text-slate-500">لم يتم تسجيل أي جلسات حتى الآن</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selected.sessions.map((s) => (
                        <div key={s.id} className="p-3 border dark:border-white/10 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white dark:bg-navy-900">
                          <div>
                            <p className="text-sm font-bold text-navy-900 dark:text-white mb-1">تاريخ الجلسة: {formatDateEG(s.date)}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{s.result}</p>
                          </div>
                          {s.nextSession && (
                            <div className="text-start bg-slate-50 dark:bg-white/5 px-3 py-2 rounded">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider">الجلسة القادمة</p>
                              <p className="text-sm font-bold text-primary-700 dark:text-primary-400">{formatDateEG(s.nextSession)}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
