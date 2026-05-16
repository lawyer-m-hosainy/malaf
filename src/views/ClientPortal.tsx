import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Scale, Loader2, Mail, Lock, Eye, EyeOff, FileText, Calendar, 
  MessageSquare, LogOut, Clock, CheckCircle2, AlertTriangle, 
  Copy, ChevronDown, Check, User, ChevronLeft
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

interface ClientCase {
  id: string;
  officialNumber?: string;
  judgeName?: string;
  court: string;
  plaintiff: string;
  defendant: string;
  status: string;
  createdAt: string;
  currentStage: number; // 0: تسجيل, 1: الجلسة الأولى, 2: المذكرات, 3: الابتدائي, 4: الاستئناف, 5: النهائي
  updates: { text: string; date: string; user: string }[];
  lastSessionSummary?: { date: string; summary: string; nextStep: string };
  nextSession?: { date: string; time: string; courtFull: string };
  team: { name: string; role: string; phone: string; initials: string }[];
  financials: { total: number; fees: number; expenses: number };
}

interface ClientData {
  name: string;
  phone: string;
  type: string;
  poaExpiryDays?: number;
  vacationWarning?: { active: boolean; fromDate: string };
  cases: ClientCase[];
  invoices: any[];
  documents: any[];
}

function ClientLoginForm({ onLogin }: { onLogin: (data: ClientData) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      
      // Read profile from Supabase
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        toast.error("هذا الحساب غير مسجل في بوابة الموكلين. تواصل مع مكتبك القانوني.");
        return;
      }

      if (profile.role !== "client") {
        toast.info("هذا حساب موظف وليس موكل. سيتم تحويلك لصفحة الدخول الرئيسية.");
        return;
      }

      const linkedClientId = profile.linked_client_id;
      const orgId = profile.org_id;

      let clientName = profile.full_name || "الموكل";
      let clientPhone = "";
      let clientType = "فرد";

      if (linkedClientId && orgId) {
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", linkedClientId)
          .single();

        if (client && !clientError) {
          clientName = client.name || clientName;
          clientPhone = client.phone || "";
          clientType = client.type || "فرد";
        }
      }

      // Basic case fetching logic for real DB (simplified for demo)
      let cases: ClientCase[] = [];
      let documents: any[] = [];
      let invoices: any[] = [];

      toast.success(`مرحباً ${clientName}`);
      onLogin({ 
        name: clientName, 
        phone: clientPhone, 
        type: clientType, 
        poaExpiryDays: 25, // Mocked for demo
        vacationWarning: { active: true, fromDate: "١ يوليو ٢٠٢٦" }, // Mocked for demo
        cases, 
        invoices, 
        documents 
      });
    } catch (error: any) {
      toast.error("البريد أو كلمة المرور غير صحيحة");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-navy-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-[#1a5c38] rounded-2xl flex items-center justify-center shadow-xl mx-auto">
          <Scale className="text-white w-10 h-10" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-[#111827] dark:text-white">بوابة الموكلين</h2>
        <p className="mt-2 text-sm text-[#6b7280]">تابع قضاياك ومستنداتك ومواعيدك بلمسة واحدة</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-navy-800 py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-[12px] sm:px-10 border border-[#e5e7eb] dark:border-white/5">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="client-email" className="text-[#111827]">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input id="client-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="ps-10" dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-password" className="text-[#111827]">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input id="client-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="ps-10 pe-10" dir="ltr" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-[#1a5c38] hover:bg-[#2d7a4f] text-white py-5 rounded-[12px]">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "دخول البوابة"}
            </Button>
          </form>

          <div className="mt-6 border-t border-[#e5e7eb] pt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full text-[#374151] border-dashed border-2 rounded-[12px]"
              onClick={() => {
                toast.success("تم تسجيل الدخول بنجاح");
                onLogin({
                  name: "شركة الأفق للتطوير العقاري",
                  phone: "+201012345678",
                  type: "منشأة",
                  poaExpiryDays: 28,
                  vacationWarning: { active: true, fromDate: "١ يوليو ٢٠٢٦" },
                  cases: [
                    {
                      id: "C-1001",
                      officialNumber: "٢٣٤٥ لسنة ٢٠٢٥ محكمة استئناف القاهرة الاقتصادية",
                      judgeName: "المستشار/ أحمد محمود الدسوقي",
                      court: "المحكمة الاقتصادية",
                      plaintiff: "شركة الأفق",
                      defendant: "مؤسسة البناء",
                      status: "نشطة",
                      createdAt: "2024-01-15",
                      currentStage: 2,
                      nextSession: { date: "2026-06-20", time: "٠٩:٠٠ صباحاً", courtFull: "الدائرة الثانية استئناف اقتصادي بقاعة ٣" },
                      lastSessionSummary: { date: "2026-05-10", summary: "تم تقديم حافظة المستندات التي تثبت حقوق الشركة وطلب التأجيل للإطلاع من الخصم.", nextStep: "ننتظر رد الخصم على المستندات." },
                      team: [
                        { name: "محمود الحسيني", role: "محامي رئيسي", phone: "+201000000000", initials: "مح" },
                        { name: "أحمد كمال", role: "محامي مساعد", phone: "+201100000000", initials: "أك" }
                      ],
                      financials: { total: 45000, fees: 40000, expenses: 5000 },
                      updates: [
                        { text: "تم تقديم المذكرات", date: "١٠ مايو ٢٠٢٦", user: "محمود الحسيني" },
                        { text: "حضور الجلسة الأولى", date: "١٥ أبريل ٢٠٢٦", user: "أحمد كمال" },
                        { text: "قيد الدعوى وتسجيلها", date: "١٥ يناير ٢٠٢٤", user: "محمود الحسيني" }
                      ]
                    }
                  ],
                  invoices: [
                    { id: "INV-2024-001", amount: 15000, status: "unpaid", due_date: "2026-05-01" }
                  ],
                  documents: [
                    { id: "DOC-1", name: "مذكرة دفاع اولي.pdf", type: "pdf", is_shared: true, created_at: "2026-04-10" }
                  ]
                });
              }}
            >
              تسجيل دخول تجريبي (للمستثمرين)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CaseProgressBar({ currentStage }: { currentStage: number }) {
  const stages = ["تسجيل", "الجلسة الأولى", "المذكرات", "الابتدائي", "الاستئناف", "النهائي"];
  
  return (
    <div className="relative mt-4 mb-2">
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#e5e7eb] -translate-y-1/2 rounded-full z-0"></div>
      <div 
        className="absolute top-1/2 right-0 h-1 bg-[#1a5c38] -translate-y-1/2 rounded-full z-0 transition-all duration-500"
        style={{ width: `${(currentStage / (stages.length - 1)) * 100}%` }}
      ></div>
      
      <div className="relative z-10 flex justify-between">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentStage;
          const isCurrent = idx === currentStage;
          
          return (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div 
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted ? "bg-[#1a5c38] text-white" : 
                  isCurrent ? "bg-white border-2 border-[#1a5c38] animate-pulse" : 
                  "bg-[#e5e7eb] border-2 border-white"
                )}
              >
                {isCompleted && <Check size={12} strokeWidth={3} />}
              </div>
              <span className={cn(
                "text-[10px] sm:text-xs font-bold absolute mt-7 whitespace-nowrap",
                isCurrent ? "text-[#1a5c38]" : "text-[#9ca3af]"
              )}>{stage}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClientDashboard({ data, onLogout }: { data: ClientData; onLogout: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"cases" | "invoices" | "documents">("cases");
  const [expandedCase, setExpandedCase] = useState<string | null>(data.cases[0]?.id || null);
  const [showRating, setShowRating] = useState(true);

  // Helper to calculate days until a date
  const getDaysUntil = (dateStr: string) => {
    const diffTime = Math.abs(new Date(dateStr).getTime() - new Date().getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nextSessionCase = data.cases.find(c => c.nextSession);

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans pb-24 text-[#111827]" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1a5c38] rounded-xl flex items-center justify-center">
              <Scale className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg">بوابة الموكلين</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#6b7280] hidden sm:block">
              مرحباً، <span className="font-bold text-[#111827]">{data.name}</span>
            </span>
            <Button variant="ghost" size="sm" className="text-[#6b7280] gap-1" onClick={onLogout}>
              <LogOut size={16} />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          
          {/* POA Warning */}
          {data.poaExpiryDays && data.poaExpiryDays <= 30 && (
            <div className="bg-[#fffbeb] border border-[#fcd34d] p-4 rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#fef3c7] rounded-full">
                  <AlertTriangle className="w-5 h-5 text-[#d97706]" />
                </div>
                <div>
                  <h4 className="font-bold text-[#b45309]">تنبيه التوكيل الرسمي</h4>
                  <p className="text-sm text-[#d97706]">التوكيل الرسمي الممنوح للمكتب ينتهي بعد {data.poaExpiryDays} يوم — يرجى التجديد في أقرب وقت.</p>
                </div>
              </div>
              <Button size="sm" className="bg-[#d97706] hover:bg-[#b45309] text-white rounded-full whitespace-nowrap">
                تواصل مع المكتب
              </Button>
            </div>
          )}

          {/* Session Rating Notification */}
          <AnimatePresence>
            {showRating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-[#e5e7eb] p-4 rounded-[12px] flex items-center justify-between gap-4 mb-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2e7d52]" />
                  <p className="text-sm font-bold">كيف كانت الجلسة الأخيرة بتاريخ ١٠ مايو ٢٠٢٦؟</p>
                </div>
                <div className="flex gap-2">
                  {['😊', '😐', '😟'].map((emoji, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        toast.success("شكراً لتقييمك، نسعى دائماً لرضاك.");
                        setShowRating(false);
                      }}
                      className="text-2xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Welcome & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-[#e5e7eb] shadow-sm rounded-[12px]">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#f0fdf4]">
                  <FileText className="w-6 h-6 text-[#1a5c38]" />
                </div>
                <div>
                  <p className="text-[13px] text-[#6b7280]">عدد القضايا</p>
                  <p className="text-2xl font-bold text-[#111827]">{data.cases.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#e5e7eb] shadow-sm rounded-[12px]">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#f0fdf4]">
                  <CheckCircle2 className="w-6 h-6 text-[#2e7d52]" />
                </div>
                <div>
                  <p className="text-[13px] text-[#6b7280]">قضايا نشطة</p>
                  <p className="text-2xl font-bold text-[#111827]">
                    {data.cases.filter((c) => c.status === "نشطة").length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#e5e7eb] shadow-sm rounded-[12px]">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#fffbeb]">
                  <Clock className="w-6 h-6 text-[#d97706]" />
                </div>
                <div>
                  <p className="text-[13px] text-[#6b7280]">تحت الدراسة</p>
                  <p className="text-2xl font-bold text-[#111827]">
                    {data.cases.filter((c) => c.status === "تحت الدراسة").length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Session Card */}
          {nextSessionCase && nextSessionCase.nextSession && (
            <Card className="border-[#e5e7eb] shadow-sm rounded-[12px] mb-8 overflow-hidden">
              <div className="bg-[#f0fdf4] px-6 py-3 border-b border-[#e5e7eb] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#1a5c38]" />
                <h3 className="font-bold text-[#1a5c38]">الجلسة القادمة</h3>
              </div>
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="bg-[#f0fdf4] text-[#1a5c38] p-4 rounded-[12px] text-center min-w-[100px] border border-[#bbf7d0]">
                  <div className="text-3xl font-black">20</div>
                  <div className="text-sm font-bold">يونيو</div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{nextSessionCase.nextSession.courtFull}</p>
                  <p className="text-[#6b7280] text-sm mt-1">{nextSessionCase.plaintiff} ضد {nextSessionCase.defendant}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant="outline" className="text-[#1a5c38] border-[#1a5c38] bg-white">
                      <Clock className="w-3 h-3 me-1" /> {nextSessionCase.nextSession.time}
                    </Badge>
                    <span className="text-sm font-bold text-[#d97706]">
                      بعد {getDaysUntil(nextSessionCase.nextSession.date)} يوم
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Judicial Vacation Warning */}
          {data.vacationWarning?.active && (
            <div className="bg-[#fffbeb] border border-[#fcd34d] p-4 rounded-[12px] flex items-center gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-[#d97706] shrink-0" />
              <p className="text-sm text-[#b45309] font-bold">تنبيه: المحاكم في إجازة صيفية من {data.vacationWarning.fromDate} — قد يتأثر موعد جلستك ويتم تأجيله إدارياً.</p>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-2 hide-scrollbar">
            <Button
              className={cn("rounded-full whitespace-nowrap px-6", activeTab === "cases" ? "bg-[#1a5c38] text-white hover:bg-[#2d7a4f]" : "bg-transparent border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]")}
              onClick={() => setActiveTab("cases")}
            >
              <Scale className="w-4 h-4 me-2" /> القضايا
            </Button>
            <Button
              className={cn("rounded-full whitespace-nowrap px-6", activeTab === "invoices" ? "bg-[#1a5c38] text-white hover:bg-[#2d7a4f]" : "bg-transparent border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]")}
              onClick={() => setActiveTab("invoices")}
            >
              <FileText className="w-4 h-4 me-2" /> الفواتير
            </Button>
            <Button
              className={cn("rounded-full whitespace-nowrap px-6", activeTab === "documents" ? "bg-[#1a5c38] text-white hover:bg-[#2d7a4f]" : "bg-transparent border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]")}
              onClick={() => setActiveTab("documents")}
            >
              <FileText className="w-4 h-4 me-2" /> المستندات
            </Button>
          </div>

          {/* Cases Detailed View */}
          {activeTab === "cases" && (
            <div className="space-y-6">
              {data.cases.map((c) => (
                <div key={c.id} className="bg-white border border-[#e5e7eb] rounded-[12px] overflow-hidden shadow-sm">
                  {/* Case Header (Clickable) */}
                  <div 
                    className="p-5 cursor-pointer hover:bg-[#f9fafb] transition-colors flex justify-between items-center"
                    onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
                  >
                    <div>
                      <h3 className="font-bold text-[16px] mb-1">{c.plaintiff} ضد {c.defendant}</h3>
                      <div className="flex items-center gap-3 text-xs text-[#9ca3af]">
                        <span><Scale className="w-3 h-3 inline me-1" /> {c.court}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={cn("px-3 py-1", c.status === "نشطة" ? "bg-[#f0fdf4] text-[#2e7d52] hover:bg-[#f0fdf4]" : "bg-[#fffbeb] text-[#d97706] hover:bg-[#fffbeb]")}>
                        {c.status}
                      </Badge>
                      <ChevronDown className={cn("text-[#9ca3af] transition-transform", expandedCase === c.id && "rotate-180")} />
                    </div>
                  </div>

                  {/* Expanded Case Details */}
                  <AnimatePresence>
                    {expandedCase === c.id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-[#e5e7eb]">
                        <div className="p-6 bg-[#f9fafb] space-y-6">
                          
                          {/* Progress Bar */}
                          <div className="bg-white p-5 rounded-[12px] border border-[#e5e7eb] mb-8 pb-10">
                            <h4 className="text-sm font-bold text-[#6b7280] mb-6">مرحلة القضية الحالية</h4>
                            <CaseProgressBar currentStage={c.currentStage} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Official Info */}
                            <Card className="border-[#e5e7eb] rounded-[12px] shadow-none">
                              <CardContent className="p-5">
                                <h4 className="font-bold text-[#111827] mb-4 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-[#1a5c38]" /> بيانات القضية الرسمية
                                </h4>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-[12px] text-[#6b7280] mb-1">رقم القضية</p>
                                    <div className="flex items-center justify-between bg-[#f9fafb] p-3 rounded-[8px] border border-[#e5e7eb]">
                                      <span className="font-bold text-[14px]">{c.officialNumber || "لم يُسجل بعد"}</span>
                                      <button title="نسخ الرقم" className="text-[#6b7280] hover:text-[#1a5c38]" onClick={() => toast.success("تم نسخ الرقم")}><Copy size={14} /></button>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[12px] text-[#6b7280] mb-1">اسم القاضي / الدائرة</p>
                                    <p className="font-semibold text-[13px]">{c.judgeName || "غير محدد"}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Last Session Summary */}
                            {c.lastSessionSummary && (
                              <Card className="border-[#e5e7eb] rounded-[12px] shadow-none">
                                <CardContent className="p-5">
                                  <h4 className="font-bold text-[#111827] mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-[#1a5c38]" /> ملخص آخر جلسة
                                  </h4>
                                  <Badge className="bg-[#f0fdf4] text-[#1a5c38] mb-3 hover:bg-[#f0fdf4]">{c.lastSessionSummary.date}</Badge>
                                  <p className="text-[13px] leading-relaxed text-[#374151] mb-3">
                                    {c.lastSessionSummary.summary}
                                  </p>
                                  <p className="text-[13px] bg-[#f9fafb] p-3 rounded-[8px] border border-[#e5e7eb]">
                                    <span className="font-bold text-[#1a5c38]">الخطوة الجاية: </span>
                                    {c.lastSessionSummary.nextStep}
                                  </p>
                                </CardContent>
                              </Card>
                            )}

                            {/* Financials */}
                            {c.financials && (
                              <Card className="border-[#e5e7eb] rounded-[12px] shadow-none">
                                <CardContent className="p-5">
                                  <h4 className="font-bold text-[#111827] mb-4 flex items-center gap-2">
                                    <Scale className="w-4 h-4 text-[#1a5c38]" /> المالية
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[13px]">
                                      <span className="text-[#6b7280]">أتعاب المكتب</span>
                                      <span className="font-bold">{c.financials.fees.toLocaleString()} ج.م</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[13px]">
                                      <span className="text-[#6b7280] flex items-center gap-1">
                                        مصاريف التقاضي <span className="text-[10px] bg-[#e5e7eb] px-1 rounded">دمغات/رسوم</span>
                                      </span>
                                      <span className="font-bold">{c.financials.expenses.toLocaleString()} ج.م</span>
                                    </div>
                                    <div className="pt-3 border-t border-[#e5e7eb] flex justify-between items-center">
                                      <span className="font-bold text-[#111827]">الإجمالي المستحق</span>
                                      <span className="font-black text-[#1a5c38] text-[16px]">{(c.financials.fees + c.financials.expenses).toLocaleString()} ج.م</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Legal Team */}
                            <Card className="border-[#e5e7eb] rounded-[12px] shadow-none">
                              <CardContent className="p-5">
                                <h4 className="font-bold text-[#111827] mb-4 flex items-center gap-2">
                                  <User className="w-4 h-4 text-[#1a5c38]" /> فريق قضيتك
                                </h4>
                                <div className="space-y-4">
                                  {c.team.map((member, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#f0fdf4] text-[#1a5c38] flex items-center justify-center font-bold text-[14px]">
                                          {member.initials}
                                        </div>
                                        <div>
                                          <p className="font-bold text-[13px]">{member.name}</p>
                                          <p className="text-[11px] text-[#6b7280]">{member.role}</p>
                                        </div>
                                      </div>
                                      <a title={`تواصل مع ${member.name} عبر واتساب`} href={`https://wa.me/${member.phone.replace('+', '')}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors">
                                        <MessageSquare size={14} />
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>

                          </div>

                          {/* Timeline of Updates */}
                          <Card className="border-[#e5e7eb] rounded-[12px] shadow-none">
                            <CardContent className="p-5">
                              <h4 className="font-bold text-[#111827] mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#1a5c38]" /> آخر التحديثات والإجراءات
                              </h4>
                              <div className="relative border-s-2 border-[#1a5c38] ms-3 space-y-6">
                                {c.updates.map((update, idx) => (
                                  <div key={idx} className="relative ps-6">
                                    <div className={cn(
                                      "absolute -start-[7px] top-1 w-3 h-3 rounded-full border-2 border-white",
                                      idx === 0 ? "bg-[#2e7d52]" : "bg-[#9ca3af]"
                                    )}></div>
                                    <p className={cn("text-[13px] font-bold", idx === 0 ? "text-[#111827]" : "text-[#374151]")}>{update.text}</p>
                                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6b7280]">
                                      <span>{update.date}</span>
                                      <span>•</span>
                                      <span>بواسطة {update.user}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}

          {/* Contact Card */}
          <Card className="border-[#e5e7eb] shadow-sm rounded-[12px] mt-8">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-bold text-[#111827] mb-1">تحتاج مساعدة؟</p>
                <p className="text-[13px] text-[#6b7280]">
                  للتواصل مع فريقك القانوني أو الاستفسار عن قضاياك، يرجى استخدام زر الواتساب أو التواصل المباشر مع مكتبك.
                </p>
              </div>
            </CardContent>
          </Card>

        </motion.div>
      </div>

      {/* WhatsApp FAB */}
      <a href="#" className="fixed bottom-6 left-6 bg-[#25D366] text-white rounded-full px-5 py-3 font-bold text-[14px] flex items-center gap-2 shadow-lg shadow-[#25D366]/40 hover:scale-105 transition-transform z-50">
        <MessageSquare size={18} />
        تواصل مع المحامي
      </a>

    </div>
  );
}

export default function ClientPortal() {
  const [clientData, setClientData] = useState<ClientData | null>(null);

  if (clientData) {
    return <ClientDashboard data={clientData} onLogout={() => setClientData(null)} />;
  }

  return <ClientLoginForm onLogin={(data) => setClientData(data)} />;
}
