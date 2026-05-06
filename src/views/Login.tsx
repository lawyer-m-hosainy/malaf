import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Loader2, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function getFirebaseAuthErrorMessage(error: any, context: "login" | "register" = "login") {
  const code = error?.code || "";
  switch (code) {
    case "auth/unauthorized-domain":
      return "الدومين الحالي غير مصرح به في Firebase Auth. أضف localhost من إعدادات Authorized domains.";
    case "auth/operation-not-allowed":
      return context === "register"
        ? "إنشاء الحساب بالبريد غير مفعّل. من Firebase Console: Authentication → Sign-in method → فعّل Email/Password."
        : "طريقة تسجيل الدخول هذه غير مفعّلة في Firebase. افتح Authentication → Sign-in method وفعّل المزوّد المطلوب.";
    case "auth/popup-blocked":
      return "تم حظر نافذة تسجيل الدخول. سنحوّل العملية إلى تسجيل دخول عبر إعادة التوجيه.";
    case "auth/popup-closed-by-user":
      return "تم إغلاق نافذة تسجيل الدخول قبل إكمال العملية.";
    case "auth/network-request-failed":
      return "فشل الاتصال بالشبكة أثناء تسجيل الدخول. تحقق من الإنترنت ثم أعد المحاولة.";
    case "auth/invalid-email":
      return "البريد الإلكتروني غير صالح. يرجى التحقق من الصيغة.";
    case "auth/user-disabled":
      return "هذا الحساب معطّل. تواصل مع إدارة المكتب.";
    case "auth/user-not-found":
      return "لا يوجد حساب بهذا البريد الإلكتروني. تحقق من البريد أو أنشئ حساباً جديداً.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "كلمة المرور غير صحيحة. حاول مرة أخرى.";
    case "auth/email-already-in-use":
      return "هذا البريد الإلكتروني مسجل مسبقاً. استخدم تسجيل الدخول بدلاً من إنشاء حساب.";
    case "auth/weak-password":
      return "كلمة المرور ضعيفة. يجب أن تكون 8 أحرف على الأقل.";
    case "auth/too-many-requests":
      return "تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار ثم المحاولة لاحقاً.";
    default:
      return context === "register"
        ? "فشل إنشاء الحساب. تحقق من إعدادات Firebase Auth أو جرّب بريداً آخر."
        : "فشل تسجيل الدخول. تحقق من إعدادات Firebase Auth وحاول مرة أخرى.";
  }
}

export default function Login() {
  const navigate = useNavigate();
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      toast.success("تم تسجيل الدخول بنجاح");
      const isFirstLogin = !localStorage.getItem('onboarding_completed');
      navigate(isFirstLogin ? "/onboarding" : "/dashboard");
    } catch (error: any) {
      const message = getFirebaseAuthErrorMessage(error);

      // Fallback: if popup fails, try redirect-based login.
      if (error?.code === "auth/popup-blocked") {
        toast.error(message);
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithRedirect(auth, provider);
        return;
      }

      console.error("Google login failed:", error?.code);
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
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!userCred.user.emailVerified) {
        toast.error("يرجى تفعيل حسابك من خلال الرابط المرسل إلى بريدك الإلكتروني أولاً.");
        await auth.signOut();
        setIsEmailLoading(false);
        return;
      }
      toast.success("تم تسجيل الدخول بنجاح");
      const isFirstLogin = !localStorage.getItem('onboarding_completed');
      navigate(isFirstLogin ? "/onboarding" : "/dashboard");
    } catch (error: any) {
      const message = getFirebaseAuthErrorMessage(error);
      console.error("Email login failed:", error?.code);
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
      toast.error("كلمة المرور وتأكيدها غير متطابقتين — تأكد من نفس الكتابة في الحقلين");
      return;
    }

    setIsRegisterLoading(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, regEmail);
      if (methods.includes("google.com") && !methods.includes("password")) {
        toast.error(
          "هذا البريد مرتبط بحساب Google فقط. سجّل الدخول بزر Google، أو استخدم بريداً إلكترونياً آخر لإنشاء حساب بكلمة مرور."
        );
        return;
      }
      if (methods.includes("password")) {
        toast.error("هذا البريد مسجّل مسبقاً. استخدم «تسجيل الدخول» بنفس البريد وكلمة المرور.");
        return;
      }

      const credential = await createUserWithEmailAndPassword(auth, regEmail, pwd);
      await updateProfile(credential.user, { displayName: name });
      await sendEmailVerification(credential.user);
      toast.success("تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.");
      await auth.signOut();
      setShowRegisterDialog(false);
    } catch (error: any) {
      const message = getFirebaseAuthErrorMessage(error, "register");
      console.error("Register failed:", error?.code);
      toast.error(message);
    } finally {
      setIsRegisterLoading(false);
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
          تسجيل الدخول
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          مرحباً بك في منصة مكتب العدالة للمحاماة
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
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
                  <span className="mr-2 font-medium">تسجيل الدخول باستخدام Google</span>
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
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="ps-10 dark:bg-white/5 dark:border-white/10"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-slate-700 dark:text-slate-300">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="login-password"
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
                        placeholder="example@email.com"
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

            {(import.meta as any).env?.MODE !== "production" && (
              <>
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-3 rounded-lg text-sm border border-amber-200 dark:border-amber-900/50 text-center font-bold">
                  هذا الوضع للعرض التجريبي فقط — لا تدخل بيانات حقيقية
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
                    toast.success("تم الدخول بوضع المعاينة التجريبية (صالح لمدة 30 دقيقة)");
                    navigate("/dashboard");
                  }}
                  className="w-full py-6 border-dashed border-primary-500/30 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10"
                >
                  الدخول التجريبي (لفحص الأقسام)
                </Button>
              </>
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
