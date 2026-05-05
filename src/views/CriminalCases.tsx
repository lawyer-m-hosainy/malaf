import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Siren, Shield, Scale, AlertTriangle, FileText, ChevronDown, CheckCircle } from "lucide-react";
import { useCriminalStore, CriminalCase } from "@/store/useCriminalStore";
import { cn } from "@/lib/utils";

const StageBadge = ({ num, active, completed }: { num: number, active: boolean, completed: boolean }) => (
  <div className={cn(
    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors z-10 relative",
    completed ? "bg-primary-500 border-primary-500 text-white" : 
    active ? "bg-white dark:bg-navy-900 border-primary-500 text-primary-500" : 
    "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
  )}>
    {completed ? <CheckCircle size={16} /> : num}
  </div>
);

const StageConnector = ({ active }: { active: boolean }) => (
  <div className={cn(
    "flex-1 h-1 mx-2 transition-colors",
    active ? "bg-primary-500" : "bg-slate-200 dark:bg-slate-700"
  )} />
);

const CriminalCaseRow = ({ caseData }: { caseData: CriminalCase }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-100 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-navy-800">
      <div 
        className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold text-navy-900 dark:text-white">
              {caseData.policeReport.accused} ضد {caseData.policeReport.victim}
            </h3>
            <Badge className={
              caseData.caseType === 'جناية' ? "bg-red-50 text-red-700 hover:bg-red-100" :
              caseData.caseType === 'جنحة' ? "bg-amber-50 text-amber-700 hover:bg-amber-100" :
              "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }>{caseData.caseType}</Badge>
          </div>
          <p className="text-sm text-slate-500">{caseData.policeReport.incidentType} - {caseData.policeReport.policeStation}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center">
            <StageBadge num={1} active={caseData.currentStage === 1} completed={caseData.currentStage > 1} />
            <StageConnector active={caseData.currentStage > 1} />
            <StageBadge num={2} active={caseData.currentStage === 2} completed={caseData.currentStage > 2} />
            <StageConnector active={caseData.currentStage > 2} />
            <StageBadge num={3} active={caseData.currentStage === 3} completed={caseData.currentStage > 3} />
            <StageConnector active={caseData.currentStage > 3} />
            <StageBadge num={4} active={caseData.currentStage === 4} completed={caseData.currentStage > 4} />
            <StageConnector active={caseData.currentStage > 4} />
            <StageBadge num={5} active={caseData.currentStage === 5} completed={caseData.currentStage > 5} />
          </div>
          <ChevronDown className={cn("text-slate-400 transition-transform", expanded && "rotate-180")} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 dark:border-white/10"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-white/[0.02]">
              {/* Stage 1 */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2 text-navy-900 dark:text-white">
                  <div className="w-5 h-5 rounded bg-primary-100 text-primary-700 flex items-center justify-center text-xs">1</div>
                  محضر الشرطة
                </h4>
                <Card className="shadow-sm border-slate-200 dark:border-white/10 dark:bg-navy-900">
                  <CardContent className="p-3 text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-slate-500">رقم المحضر:</span><span className="font-bold">{caseData.policeReport.reportNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">القسم:</span><span className="font-bold">{caseData.policeReport.policeStation}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">تاريخ:</span><span className="font-bold">{new Date(caseData.policeReport.date).toLocaleDateString('ar-EG')}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">المتهم:</span><span className="font-bold">{caseData.policeReport.accused}</span></div>
                  </CardContent>
                </Card>
              </div>

              {/* Stage 2 */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2 text-navy-900 dark:text-white">
                  <div className={cn("w-5 h-5 rounded flex items-center justify-center text-xs", caseData.currentStage >= 2 ? "bg-primary-100 text-primary-700" : "bg-slate-200 text-slate-500")}>2</div>
                  حصر النيابة
                </h4>
                {caseData.prosecution ? (
                  <Card className="shadow-sm border-slate-200 dark:border-white/10 dark:bg-navy-900">
                    <CardContent className="p-3 text-sm space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500">رقم الحصر:</span><span className="font-bold">{caseData.prosecution.prosecutionNumber}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">النيابة:</span><span className="font-bold">{caseData.prosecution.prosecutionOffice}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">المحقق:</span><span className="font-bold">{caseData.prosecution.investigator}</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-500">القرار:</span><Badge variant="outline">{caseData.prosecution.decision}</Badge></div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="h-full border border-dashed border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center p-4 text-slate-400 text-sm bg-white dark:bg-navy-900">لم يصل لهذه المرحلة</div>
                )}
              </div>

              {/* Stage 3 */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2 text-navy-900 dark:text-white">
                  <div className={cn("w-5 h-5 rounded flex items-center justify-center text-xs", caseData.currentStage >= 3 ? "bg-primary-100 text-primary-700" : "bg-slate-200 text-slate-500")}>3</div>
                  قيد المحكمة
                </h4>
                {caseData.courtRegistration ? (
                  <Card className="shadow-sm border-slate-200 dark:border-white/10 dark:bg-navy-900">
                    <CardContent className="p-3 text-sm space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500">رقم القضية:</span><span className="font-bold">{caseData.courtRegistration.caseNumber}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">المحكمة:</span><span className="font-bold">{caseData.courtRegistration.court}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">الدائرة:</span><span className="font-bold">{caseData.courtRegistration.circuit}</span></div>
                      <div className="flex flex-col"><span className="text-slate-500">التهمة:</span><span className="font-bold">{caseData.courtRegistration.officialCharge}</span></div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="h-full border border-dashed border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center p-4 text-slate-400 text-sm bg-white dark:bg-navy-900">لم يصل لهذه المرحلة</div>
                )}
              </div>

              {/* Stage 4 */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2 text-navy-900 dark:text-white">
                  <div className={cn("w-5 h-5 rounded flex items-center justify-center text-xs", caseData.currentStage >= 4 ? "bg-primary-100 text-primary-700" : "bg-slate-200 text-slate-500")}>4</div>
                  المحاكمة والجلسات
                </h4>
                {caseData.trial ? (
                  <Card className="shadow-sm border-slate-200 dark:border-white/10 dark:bg-navy-900">
                    <CardContent className="p-3 text-sm space-y-3">
                      <Button variant="outline" className="w-full justify-start gap-2" size="sm"><FileText size={14}/> عرض أجندة الجلسات</Button>
                      <div className="bg-slate-50 dark:bg-white/5 p-2 rounded text-xs text-slate-600 dark:text-slate-400">
                        {caseData.trial.notes}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="h-full border border-dashed border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center p-4 text-slate-400 text-sm bg-white dark:bg-navy-900">لم يصل لهذه المرحلة</div>
                )}
              </div>

              {/* Stage 5 */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2 text-navy-900 dark:text-white">
                  <div className={cn("w-5 h-5 rounded flex items-center justify-center text-xs", caseData.currentStage === 5 ? "bg-primary-100 text-primary-700" : "bg-slate-200 text-slate-500")}>5</div>
                  الحكم والطعن
                </h4>
                {caseData.verdictAndAppeal ? (
                  <Card className="shadow-sm border-slate-200 dark:border-white/10 dark:bg-navy-900">
                    <CardContent className="p-3 text-sm space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500">منطوق الحكم:</span><span className="font-bold text-primary-700">{caseData.verdictAndAppeal.verdict}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">تاريخ:</span><span className="font-bold">{new Date(caseData.verdictAndAppeal.verdictDate).toLocaleDateString('ar-EG')}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">حالة الطعن:</span><Badge variant="secondary">{caseData.verdictAndAppeal.appealStatus}</Badge></div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="h-full border border-dashed border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center p-4 text-slate-400 text-sm bg-white dark:bg-navy-900">لم يصل لهذه المرحلة</div>
                )}
              </div>
            </div>
            <div className="bg-slate-100 dark:bg-white/5 p-3 flex justify-end gap-2 border-t border-slate-200 dark:border-white/10">
              <Button size="sm" variant="outline" className="dark:border-white/10">تعديل القضية</Button>
              {caseData.currentStage < 5 && (
                <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white">ترقية للمرحلة التالية</Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function CriminalCases() {
  const criminalCases = useCriminalStore(state => state.criminalCases);

  const stats = [
    { title: "جنايات", value: criminalCases.filter(c => c.caseType === 'جناية').length, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
    { title: "جنح", value: criminalCases.filter(c => c.caseType === 'جنحة').length, icon: Shield, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { title: "مخالفات", value: criminalCases.filter(c => c.caseType === 'مخالفة').length, icon: Scale, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">الجنائي والنيابة العامة</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">تتبع دورة حياة القضايا الجنائية عبر مراحلها الخمس (محضر، نيابة، قيد، محاكمة، حكم).</p>
        </div>
        <Button className="bg-primary-600 text-white gap-2 shadow-lg shadow-primary-500/20">
          إضافة قضية جنائية
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-6 h-6 ${s.color}`} /></div>
              <div><p className="text-sm font-semibold text-slate-700 dark:text-slate-400">{s.title}</p><p className="text-2xl font-bold text-navy-900 dark:text-white">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <Siren className="w-5 h-5 text-red-500" />
          ملفات القضايا الجنائية
        </h2>
        
        {criminalCases.length > 0 ? (
          criminalCases.map(c => <CriminalCaseRow key={c.id} caseData={c} />)
        ) : (
          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-12 text-center text-slate-500 flex flex-col items-center">
              <Shield className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
              لا توجد قضايا جنائية حالياً
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
