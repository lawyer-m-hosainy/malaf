import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useTeamStore } from "@/store/useTeamStore";
import { useClientsStore } from "@/store/useClientsStore";
import { useCasesStore } from "@/store/useCasesStore";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export function OnboardingWidget() {
  const { currentUser } = useAuthStore();
  const orgId = currentUser?.orgId;
  const navigate = useNavigate();
  
  const [hasProfile, setHasProfile] = useState(false);
  const team = useTeamStore(state => state.teamMembers);
  const clients = useClientsStore(state => state.clients);
  const cases = useCasesStore(state => state.cases);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    checkProfile();
    
    const handleComplete = () => checkProfile();
    window.addEventListener('onboarding_completed', handleComplete);
    return () => window.removeEventListener('onboarding_completed', handleComplete);
  }, [orgId]);

  async function checkProfile() {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('address, bar_association_number')
        .eq('id', orgId)
        .single();
      
      setHasProfile(!!(data?.address || data?.bar_association_number));
    } finally {
      setLoading(false);
    }
  }

  const tasks = [
    { id: 'profile', label: 'إكمال بيانات المكتب', done: hasProfile, link: '/dashboard/settings' },
    { id: 'team', label: 'إضافة عضو للفريق', done: team.length > 1, link: '/dashboard/team' },
    { id: 'client', label: 'إضافة أول موكل', done: clients.length > 0, link: '/dashboard/clients' },
    { id: 'case', label: 'إضافة أول قضية', done: cases.length > 0, link: '/dashboard/cases' },
  ];

  const completedCount = tasks.filter(t => t.done).length;
  const progress = (completedCount / tasks.length) * 100;

  if (loading || progress === 100) return null; // Hide if 100%

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary-200 dark:border-primary-900/30 shadow-sm bg-primary-50/50 dark:bg-primary-900/10">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-end">
            <div>
              <CardTitle className="text-lg font-bold text-primary-800 dark:text-primary-400">إعداد حسابك</CardTitle>
              <p className="text-sm text-primary-600/80 dark:text-primary-400/80 mt-1">
                أكمل الخطوات التالية لتستفيد من المنصة بالكامل
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary-600">{Math.round(progress)}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-2 mt-4 [&>div]:bg-primary-500 bg-primary-200/50" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => navigate(task.link)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border text-start transition-all",
                  task.done 
                    ? "bg-white/50 dark:bg-white/5 border-transparent text-slate-400"
                    : "bg-white dark:bg-navy-800 border-primary-100 dark:border-primary-900/50 hover:border-primary-300 dark:hover:border-primary-700 shadow-sm group"
                )}
              >
                {task.done ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-primary-300 group-hover:text-primary-500 shrink-0" />
                )}
                <span className={cn("text-sm font-bold flex-1", task.done ? "line-through" : "text-navy-900 dark:text-white")}>
                  {task.label}
                </span>
                {!task.done && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
