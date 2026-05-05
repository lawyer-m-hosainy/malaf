import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Plus, ChevronRight, ChevronLeft, Scale, CalendarCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, isSameDay, isAfter, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { cn, formatHijriDate } from "@/lib/utils";
import { useCasesStore } from '@/store/useCasesStore';
import { AddSessionDialog } from "./cases-components";
import { useNavigate } from "react-router-dom";

export default function SessionsCalendar() {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const sessions = useCasesStore((state) => state.sessions);
  const deadlines = useCasesStore((state) => state.deadlines);

  const selectedDaySessions = sessions.filter(s => 
    date && isSameDay(new Date(s.date), date)
  );

  const selectedDayDeadlines = deadlines.filter(d => 
    date && isSameDay(new Date(d.date), date)
  );

  const totalEvents = selectedDaySessions.length + selectedDayDeadlines.length;

  // Get dates that have sessions for calendar dot indicators
  const sessionDates = useMemo(() => 
    sessions.map(s => new Date(s.date)),
    [sessions]
  );

  const deadlineDates = useMemo(() =>
    deadlines.map(d => new Date(d.date)),
    [deadlines]
  );

  // Upcoming sessions (today and future), sorted by date
  const upcomingSessions = useMemo(() => {
    const today = startOfDay(new Date());
    return sessions
      .filter(s => {
        const sDate = new Date(s.date);
        return isSameDay(sDate, today) || isAfter(sDate, today);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions]);

  // Custom day content to show dots
  const modifiers = useMemo(() => ({
    hasSession: sessionDates,
    hasDeadline: deadlineDates,
  }), [sessionDates, deadlineDates]);

  const modifiersClassNames = useMemo(() => ({
    hasSession: "has-session-dot",
    hasDeadline: "has-deadline-dot",
  }), []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Inline styles for calendar dots */}
      <style>{`
        .has-session-dot .rdp-day_button::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: var(--color-primary-500);
        }
        .has-deadline-dot .rdp-day_button::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: #f59e0b;
        }
        .has-session-dot.has-deadline-dot .rdp-day_button::after {
          width: 12px;
          height: 5px;
          border-radius: 3px;
          background: linear-gradient(to right, var(--color-primary-500) 50%, #f59e0b 50%);
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">تقويم الجلسات</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">متابعة مواعيد الجلسات القضائية والتحضير لها.</p>
        </div>
        <AddSessionDialog triggerContext="calendar" onSessionAdded={setDate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar + Upcoming Sessions sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border-none dark:bg-navy-800 dark:text-white"
                locale={ar}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
              />
            </CardContent>
          </Card>

          {/* Upcoming Sessions List */}
          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <CalendarCheck size={16} className="text-primary-500" />
                الجلسات القادمة ({upcomingSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[280px] overflow-auto">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <CalendarCheck size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">لا توجد جلسات قادمة</p>
                </div>
              ) : (
                upcomingSessions.map((session) => {
                  const sessionDate = new Date(session.date);
                  const isToday = isSameDay(sessionDate, new Date());
                  const isSelected = date && isSameDay(sessionDate, date);
                  return (
                    <button
                      key={session.id}
                      onClick={() => setDate(sessionDate)}
                      className={cn(
                        "w-full text-start p-3 rounded-lg border transition-all duration-200",
                        isSelected
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-sm dark:bg-navy-800"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300 hover:shadow-sm dark:bg-navy-800"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{session.caseId}</span>
                        {isToday && (
                          <Badge className="bg-primary-500 text-white text-[9px] px-1.5 py-0">اليوم</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{session.caseName}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {format(sessionDate, "d MMM", { locale: ar })} • {session.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {session.court}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Day Details */}
        <Card className="lg:col-span-2 border-none shadow-sm dark:bg-navy-800">
          <CardHeader className="border-b border-slate-50 dark:border-white/5">
            <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center justify-between">
              <div className="flex flex-col">
                <span>جلسات يوم {date ? format(date, "eeee, d MMMM yyyy", { locale: ar }) : "المحدد"}</span>
                {date && <span className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-1">{formatHijriDate(date)}</span>}
              </div>
              <Badge variant="outline" className="text-primary-600 dark:text-primary-400 border-primary-100 dark:border-white/10">
                {totalEvents} مواعيد
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {totalEvents > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-white/5">
                {/* Sessions */}
                {selectedDaySessions.map((session) => (
                  <div key={session.id} className="p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-100 border-none">
                            جلسة قضائية
                          </Badge>
                          <Badge variant="outline" className="font-mono text-[10px]">{session.time}</Badge>
                          <h3 className="font-bold text-navy-900 dark:text-white">{session.caseName}</h3>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <MapPin size={14} className="text-primary-500" />
                            {session.court}
                          </div>
                          {session.notes && (
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <AlertCircle size={14} className="text-slate-400" />
                              {session.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-primary-600 dark:text-primary-400 border-primary-100 dark:border-white/10"
                        onClick={() => {
                          navigate("/dashboard/cases");
                          toast.info(`تم فتح القضايا لعرض تفاصيل ${session.caseId}`);
                        }}
                      >
                        عرض التفاصيل
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Deadlines */}
                {selectedDayDeadlines.map((deadline) => (
                  <div key={deadline.id} className="p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-r-4 border-amber-500">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 border-none">
                            موعد نهائي
                          </Badge>
                          <Badge className={cn(
                            "text-[10px] px-1.5 py-0",
                            deadline.priority === 'high' ? "bg-destructive/10 text-destructive" :
                            deadline.priority === 'medium' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                          )}>
                            {deadline.priority === 'high' ? 'عالية' : deadline.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </Badge>
                          <h3 className="font-bold text-navy-900 dark:text-white">{deadline.title}</h3>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Clock size={14} className="text-amber-500" />
                            النوع: {deadline.type}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Scale size={14} className="text-primary-500" />
                            رقم القضية: {deadline.caseId}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 dark:text-amber-400 border-amber-100 dark:border-white/10"
                        onClick={() => toast.success(`تمت مراجعة الموعد النهائي: ${deadline.title}`)}
                      >
                        تحديث الحالة
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-slate-300 dark:text-slate-600" size={32} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">لا توجد جلسات مجدولة في هذا اليوم.</p>
                <div className="mt-4"><AddSessionDialog triggerContext="calendar" onSessionAdded={setDate} /></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
