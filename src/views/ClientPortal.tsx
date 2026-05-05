import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Loader2, Mail, Lock, Eye, EyeOff, FileText, Calendar, MessageSquare, LogOut, Clock, CheckCircle2 } from "lucide-react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

interface ClientCase {
  id: string;
  court: string;
  plaintiff: string;
  defendant: string;
  status: string;
  createdAt: string;
}

interface ClientData {
  name: string;
  phone: string;
  type: string;
  cases: ClientCase[];
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
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // Read user document from Firestore
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        toast.error("هذا الحساب غير مسجل في بوابة الموكلين. تواصل مع مكتبك القانوني.");
        return;
      }

      const userData = userDoc.data();
      if (userData.role !== "client") {
        // Not a client — redirect them to main login
        toast.info("هذا حساب موظف وليس موكل. سيتم تحويلك لصفحة الدخول الرئيسية.");
        return;
      }

      const linkedClientId = userData.linkedClientId;
      const tenantId = userData.tenantId;

      // Fetch client data
      let clientName = userData.name || "الموكل";
      let clientPhone = "";
      let clientType = "فرد";
      
      if (linkedClientId && tenantId) {
        const clientDoc = await getDoc(doc(db, "clients", linkedClientId));
        if (clientDoc.exists()) {
          const clientData = clientDoc.data();
          clientName = clientData.name || clientName;
          clientPhone = clientData.phone || "";
          clientType = clientData.type || "فرد";
        }
      }

      // Fetch cases linked to this client
      let cases: ClientCase[] = [];
      if (linkedClientId && tenantId) {
        try {
          const casesQuery = query(
            collection(db, "cases"),
            where("tenantId", "==", tenantId),
            where("clientId", "==", linkedClientId)
          );
          const casesSnapshot = await getDocs(casesQuery);
          cases = casesSnapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ClientCase, "id">),
          }));
        } catch {
          // If query fails, still show portal with empty cases
        }
      }

      toast.success(`مرحباً ${clientName}`);
      onLogin({ name: clientName, phone: clientPhone, type: clientType, cases });
    } catch (error: any) {
      const code = error?.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        toast.error("البريد أو كلمة المرور غير صحيحة");
      } else if (code === "auth/too-many-requests") {
        toast.error("تم تجاوز عدد المحاولات. انتظر قليلاً ثم حاول مجدداً.");
      } else {
        toast.error("فشل تسجيل الدخول. حاول مرة أخرى.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/20">
            <Scale className="text-white w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-navy-900 dark:text-white">
          بوابة الموكلين
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          تابع قضاياك ومستنداتك ومواعيدك مع مكتبك القانوني
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-navy-800 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-white/5"
        >
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="client-email" className="text-slate-700 dark:text-slate-300">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="ps-10 dark:bg-white/5 dark:border-white/10"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-password" className="text-slate-700 dark:text-slate-300">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="client-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ps-10 pe-10 dark:bg-white/5 dark:border-white/10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-5"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "دخول البوابة"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            بيانات الدخول يتم إنشاؤها بواسطة مكتبك القانوني.
            <br />
            إذا لم يكن لديك حساب، تواصل مع المكتب.
          </p>

          <div className="mt-6 border-t border-slate-100 dark:border-white/5 pt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full text-slate-600 dark:text-slate-300 border-dashed border-2 hover:bg-slate-50 dark:hover:bg-white/5"
              onClick={() => {
                toast.success("تم تسجيل الدخول (وضع العرض للمستثمرين)");
                onLogin({
                  name: "شركة الأفق للتطوير العقاري",
                  phone: "+966501234567",
                  type: "منشأة",
                  cases: [
                    {
                      id: "C-1001",
                      court: "المحكمة التجارية",
                      plaintiff: "شركة الأفق",
                      defendant: "مؤسسة البناء",
                      status: "نشطة",
                      createdAt: "2024-01-15",
                    },
                    {
                      id: "C-1004",
                      court: "الاستئناف",
                      plaintiff: "شركة الأفق",
                      defendant: "شركة التقنية المحدودة",
                      status: "تحت الدراسة",
                      createdAt: "2024-03-22",
                    }
                  ],
                });
              }}
            >
              تسجيل دخول تجريبي (للمستثمرين)
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ClientDashboard({ data, onLogout }: { data: ClientData; onLogout: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-navy-800 border-b border-slate-200 dark:border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Scale className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-navy-900 dark:text-white text-lg">بوابة الموكلين</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
              مرحباً، <span className="font-bold text-navy-900 dark:text-white">{data.name}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 gap-1"
              onClick={async () => {
                await signOut(auth);
                onLogout();
                toast.success("تم تسجيل الخروج");
              }}
            >
              <LogOut size={16} />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-8 rounded-3xl text-white mb-8 shadow-xl shadow-primary-500/20">
            <h1 className="text-2xl font-bold mb-2">مرحباً {data.name} 👋</h1>
            <p className="text-primary-100">يمكنك متابعة آخر المستجدات في قضاياك من هنا.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-none shadow-sm dark:bg-navy-800">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                  <FileText className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">عدد القضايا</p>
                  <p className="text-2xl font-bold text-navy-900 dark:text-white">{data.cases.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm dark:bg-navy-800">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">قضايا نشطة</p>
                  <p className="text-2xl font-bold text-navy-900 dark:text-white">
                    {data.cases.filter((c) => c.status === "نشطة").length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm dark:bg-navy-800">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">تحت الدراسة</p>
                  <p className="text-2xl font-bold text-navy-900 dark:text-white">
                    {data.cases.filter((c) => c.status === "تحت الدراسة").length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cases List */}
          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardHeader className="border-b border-slate-50 dark:border-white/5 pb-4">
              <CardTitle className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary-500" />
                قضاياك
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.cases.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-bold">لا توجد قضايا مسجلة حالياً</p>
                  <p className="text-sm mt-1">سيتم إضافة قضاياك بواسطة مكتبك القانوني</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-white/5">
                  {data.cases.map((c) => (
                    <div key={c.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-navy-900 dark:text-white">
                            {c.plaintiff} ضد {c.defendant}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Scale size={12} />
                              {c.court}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(c.createdAt).toLocaleDateString("ar-SA")}
                            </span>
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            "font-bold",
                            c.status === "نشطة"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : c.status === "تحت الدراسة"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                              : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
                          )}
                        >
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="border-none shadow-sm dark:bg-navy-800 mt-6">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-bold text-navy-900 dark:text-white mb-1">تحتاج مساعدة؟</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  للتواصل مع فريقك القانوني أو الاستفسار عن قضاياك، يرجى التواصل مباشرة مع مكتبك المعتمد.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
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
