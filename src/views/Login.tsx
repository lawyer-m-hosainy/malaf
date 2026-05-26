import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Loader2, Mail, Lock, Eye, EyeOff, UserPlus, Sparkles } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuth } from "@/components/AuthProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ensureUserOrganization } from "@/services/organizationSetup";
import { setTenantIdCache } from "@/lib/tenant";

function getSupabaseAuthErrorMessage(error: any, context: "login" | "register" = "login") {
  const code = error?.status || error?.code || "";
  const msg = error?.message || "";
  
  if (msg.includes("Invalid login credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }
  if (msg.includes("User already registered")) {
    return "هذا البريد الإلكتروني مسجل مسبقاً.";
  }
  if (msg.includes("weak_password")) {
    return "كلمة المرور ضعيفة. يجب أن تكون 8 أحرف على الأقل.";
  }
  if (msg.includes("Email not confirmed")) {
    return "يرجى تفعيل حسابك من خلال الرابط المرسل إلى بريدك الإلكتروني أولاً.";
  }
  
  return context === "register"
    ? "فشل إنشاء الحساب. تحقق من البيانات وجرب مرة أخرى."
    : "فشل تسجيل الدخول. تأكد من صحة البيانات.";
}

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const currentUser = useAuthStore(state => state.currentUser);
  const isDemoMode = useAuthStore(state => state.isDemoMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  // Email/Password Login Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register Form
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");

  // مستخدم مسجل — توجيه حسب اكتمال ربط المكتب
  if (!authLoading && (user || isDemoMode)) {
    const orgId = currentUser?.orgId || user?.user_metadata?.org_id;
    if (user && !orgId && !isDemoMode) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = window.location.origin + '/login';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: { prompt: "select_account" }
        }
      });
      if (error) throw error;
      // Note: Redirects automatically, so no need for manual navigation here
    } catch (error: any) {
      const message = getSupabaseAuthErrorMessage(error);
      console.error("Google login failed:", error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setIsEmailLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      
      toast.success("تم تسجيل الدخول بنجاح");
      const isFirstLogin = !localStorage.getItem('onboarding_completed');
      navigate(isFirstLogin ? "/onboarding" : "/dashboard");
    } catch (error: any) {
      const message = getSupabaseAuthErrorMessage(error);
      console.error("Email login failed:", error);
      toast.error(message);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = registerName.trim();
    const regEmail = registerEmail.trim().toLowerCase();
    const pwd = registerPassword;
    const confirm = registerConfirm;

    if (!name || !regEmail || !pwd) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    if (pwd.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (pwd !== confirm) {
      toast.error("كلمة المرور وتأكيدها غير متطابقتين");
      return;
    }

    setIsRegisterLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail,
        password: pwd,
        options: {
          data: {
            full_name: name,
            role: "محامي"
          },
          emailRedirectTo: window.location.origin + '/login',
        }
      });
      
      if (error) throw error;

      // Case 1: Email confirmation is DISABLED — دخول فوري + إنشاء المكتب
      if (data.session && data.user) {
        const orgId = await ensureUserOrganization(data.user);
        if (!orgId) {
          toast.error("تعذر إنشاء مكتبك تلقائياً. أكمل الإعداد في الخطوة التالية.");
          setShowRegisterDialog(false);
          navigate("/onboarding");
          return;
        }
        setTenantIdCache(orgId);
        useAuthStore.getState().setCurrentUser({
          id: data.user.id,
          name: name,
          email: regEmail,
          role: "مدير مكتب",
          orgId,
        });
        localStorage.setItem("onboarding_completed", "1");
        toast.success("تم إنشاء الحساب والمكتب بنجاح! مرحباً بك في مَلَف.");
        setShowRegisterDialog(false);
        navigate("/dashboard");
        return;
      }

      // Case 2: Email confirmation is ENABLED in Supabase Dashboard
      // → data.session will be null → user needs to verify email
      // Check if user was actually created (identities array not empty)
      if (data.user && data.user.identities && data.user.identities.length > 0) {
        toast.success(
          "تم إنشاء الحساب بنجاح! تم إرسال رابط التفعيل إلى بريدك الإلكتروني. يرجى مراجعة صندوق الوارد ومجلد الرسائل غير المرغوبة (Spam).",
          { duration: 10000 }
        );
      } else {
        // User already exists but hasn't confirmed — resend
        toast.info(
          "هذا البريد مسجل مسبقاً ولم يتم تفعيله بعد. تم إرسال رابط تفعيل جديد. تحقق من بريدك الإلكتروني ومجلد Spam.",
          { duration: 10000 }
        );
      }

      setShowRegisterDialog(false);
    } catch (error: any) {
      const message = getSupabaseAuthErrorMessage(error, "register");
      console.error("Register failed:", error);
      toast.error(message);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/20">
            <Scale className="text-white w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-black tracking-tighter text-navy-900 dark:text-white uppercase">
          مَلَف <span className="text-primary-600">MALAF</span>
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400 font-medium">
          نظام حوكمة وإدارة المكاتب القانونية الذكي
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-navy-800 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-white/5"
        >
          <div className="space-y-6">
            {/* Google Login */}
            <Button 
              onClick={handleGoogleLogin} 
              disabled={isLoading}
              className="w-full flex justify-center py-6 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm dark:bg-navy-800 bg-white dark:bg-navy-900 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 me-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="me-2 font-medium">تسجيل الدخول باستخدام Google</span>
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-navy-800 text-slate-500">
                  أو تسجيل الدخول بالبريد الإلكتروني
                </span>
              </div>
            </div>

            {/* Email/Password Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-slate-700 dark:text-slate-300">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-3 text-slate-400" size={18} />
                  <Input 
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@lawfirm.eg"
                    className="ps-10 dark:bg-white/5"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-3 text-slate-400" size={18} />
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="ps-10 dark:bg-white/5"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button 
                type="submit"
                disabled={isEmailLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-5"
              >
                {isEmailLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4 me-2" />
                    تسجيل الدخول
                  </>
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="text-center">
              <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                <Button type="button" variant="link" className="text-primary-600 dark:text-primary-400 gap-1" onClick={() => setShowRegisterDialog(true)}>
                  <UserPlus size={16} />
                  ليس لديك حساب؟ إنشاء حساب جديد
                </Button>
                <DialogContent className="sm:max-w-md border-none shadow-2xl dark:bg-navy-900">
                  <DialogHeader>
                    <DialogTitle className="text-navy-900 dark:text-white text-center">إنشاء حساب جديد</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRegister} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">الاسم الكامل</Label>
                      <Input 
                        id="register-name"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="مثال: أ. محمد العتيبي"
                        className="dark:bg-white/5 dark:border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">البريد الإلكتروني</Label>
                      <Input 
                        id="register-email"
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="name@lawfirm.eg — بريدك الإلكتروني"
                        className="dark:bg-white/5 dark:border-white/10"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">كلمة المرور (8 أحرف على الأقل)</Label>
                      <Input 
                        id="register-password"
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="••••••••"
                        className="dark:bg-white/5 dark:border-white/10"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm">تأكيد كلمة المرور</Label>
                      <Input 
                        id="register-confirm"
                        type="password"
                        value={registerConfirm}
                        onChange={(e) => setRegisterConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="dark:bg-white/5 dark:border-white/10"
                        dir="ltr"
                      />
                    </div>
                    <Button 
                      type="submit"
                      disabled={isRegisterLoading}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-5"
                    >
                      {isRegisterLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 me-2" />
                          إنشاء الحساب
                        </>
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Demo Mode — Dev only */}
            {!((import.meta as any).env?.PROD) && (
            <div className="pt-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl text-xs border border-emerald-200 dark:border-emerald-900/50 text-center space-y-2">
                <div className="font-black text-sm uppercase">منطقة المستثمرين | Investor Zone</div>
                <p>يمكنك استكشاف كامل ميزات المنصة ببيانات تجريبية مصرية واقعية من خلال الزر أدناه.</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  const { setDemoMode, setCurrentUser } = useAuthStore.getState();
                  setDemoMode(true);
                  setCurrentUser({
                    id: "demo-admin",
                    name: "مستخدم تجريبي (مدير مكتب)",
                    email: "demo@example.com",
                    role: "مدير مكتب"
                  });
                  localStorage.setItem("demoStartedAt", Date.now().toString());
                  toast.success("تم تفعيل وضع العرض التفاعلي بنجاح");
                  navigate("/dashboard");
                }}
                className="w-full mt-3 py-7 border-2 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500/20 transition-all font-bold rounded-xl shadow-lg shadow-emerald-500/10"
              >
                <Sparkles className="me-2 w-5 h-5" />
                بدء العرض التفاعلي للمنصة
              </Button>
            </div>
            )}

            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => navigate('/')} className="text-primary-600 dark:text-primary-400">
                العودة للصفحة الرئيسية
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
