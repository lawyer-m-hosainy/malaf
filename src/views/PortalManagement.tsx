import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Globe, LogIn, Plus, Users, Mail, Lock, Copy, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useClientsStore } from "@/store/useClientsStore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, collection, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getCurrentTenantId } from "@/lib/tenant";

interface PortalUser {
  id: string;
  name: string;
  email: string;
  linkedClientId: string;
  createdAt: string;
}

export default function PortalManagement() {
  const clients = useClientsStore((state) => state.clients);
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // New client account form
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");

  // Load existing portal users
  useEffect(() => {
    async function loadPortalUsers() {
      setIsLoadingUsers(true);
      try {
        const tenantId = getCurrentTenantId();
        const q = query(
          collection(db, "users"),
          where("tenantId", "==", tenantId),
          where("role", "==", "client")
        );
        const snapshot = await getDocs(q);
        const users: PortalUser[] = snapshot.docs.map((d) => ({
          id: d.id,
          name: d.data().name || "موكل",
          email: d.data().email || "",
          linkedClientId: d.data().linkedClientId || "",
          createdAt: d.data().createdAt || "",
        }));
        setPortalUsers(users);
      } catch {
        // Firestore may not have rules deployed — use empty list for demo
      } finally {
        setIsLoadingUsers(false);
      }
    }
    loadPortalUsers();
  }, []);

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(pwd);
    setClientPassword(pwd);
  };

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const handleCreatePortalUser = async () => {
    if (!selectedClientId || !clientEmail.trim() || !clientPassword.trim()) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    if (clientPassword.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setIsCreating(true);
    try {
      // Create Firebase Auth account
      const cred = await createUserWithEmailAndPassword(auth, clientEmail.trim(), clientPassword);
      await updateProfile(cred.user, { displayName: selectedClient?.name || "موكل" });

      // Create user document in Firestore with role: 'client'
      const tenantId = getCurrentTenantId();
      await setDoc(doc(db, "users", cred.user.uid), {
        id: cred.user.uid,
        name: selectedClient?.name || "موكل",
        email: clientEmail.trim(),
        role: "client",
        tenantId,
        linkedClientId: selectedClientId,
        createdAt: new Date().toISOString(),
      });

      const newUser: PortalUser = {
        id: cred.user.uid,
        name: selectedClient?.name || "موكل",
        email: clientEmail.trim(),
        linkedClientId: selectedClientId,
        createdAt: new Date().toISOString(),
      };

      setPortalUsers((prev) => [newUser, ...prev]);
      toast.success(`تم إنشاء حساب البوابة لـ "${selectedClient?.name}" بنجاح`);
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      if (error?.code === "auth/email-already-in-use") {
        toast.error("هذا البريد مسجل مسبقاً. استخدم بريداً مختلفاً.");
      } else {
        toast.error("حدث خطأ أثناء إنشاء الحساب. حاول لاحقاً.");
        console.error("Create portal user error:", error);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedClientId("");
    setClientEmail("");
    setClientPassword("");
    setGeneratedPassword("");
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      setPortalUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("تم حذف حساب الموكل من البوابة");
    } catch {
      toast.error("فشل حذف الحساب");
    }
  };

  const portalUrl = window.location.origin + "/client-portal";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">إدارة بوابة الموكلين</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            إنشاء وإدارة حسابات العملاء لمتابعة قضاياهم عبر البوابة.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button
            type="button"
            className="bg-primary-500 hover:bg-primary-600 text-white gap-2"
            onClick={() => {
              generateRandomPassword();
              setIsDialogOpen(true);
            }}
          >
            <Plus size={18} />
            إنشاء حساب موكل
          </Button>
          <DialogContent className="sm:max-w-lg border-none shadow-2xl dark:bg-navy-900">
            <DialogHeader>
              <DialogTitle className="text-navy-900 dark:text-white">إنشاء حساب موكل جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Select Client */}
              <div className="space-y-2">
                <Label>اختر العميل</Label>
                <select
                  title="اختيار العميل"
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-sm dark:text-white"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="" className="dark:bg-navy-900">-- اختر عميلاً --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id} className="dark:bg-navy-900">
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="portal-email">البريد الإلكتروني للموكل</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="portal-email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="ps-10 dark:bg-white/5"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="portal-password">كلمة المرور</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="portal-password"
                      type="text"
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      placeholder="8 أحرف على الأقل"
                      className="ps-10 font-mono dark:bg-white/5"
                      dir="ltr"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRandomPassword}
                    className="shrink-0 dark:border-white/10"
                  >
                    توليد تلقائي
                  </Button>
                </div>
                {generatedPassword && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-xs">
                    <p className="font-bold text-amber-800 dark:text-amber-400 mb-1">⚠️ انسخ كلمة المرور وأرسلها للموكل:</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-white dark:bg-navy-800 px-2 py-1 rounded font-mono text-sm flex-1" dir="ltr">
                        {generatedPassword}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPassword);
                          toast.success("تم نسخ كلمة المرور");
                        }}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreatePortalUser}
                disabled={isCreating}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-5"
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 me-2" />
                    إنشاء الحساب
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Portal Users List */}
          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users size={20} className="text-primary-500" />
                الموكلون المسجلون في البوابة
              </CardTitle>
              <Badge className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                {portalUsers.length} موكل
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              ) : portalUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-bold">لا يوجد موكلون مسجلون بعد</p>
                  <p className="text-sm mt-1">اضغط "إنشاء حساب موكل" لإضافة أول موكل</p>
                </div>
              ) : (
                portalUsers.map((user) => {
                  const linkedClient = clients.find((c) => c.id === user.linkedClientId);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                          <Globe size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-navy-900 dark:text-white">{user.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5" dir="ltr">{user.email}</p>
                          {linkedClient && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              مرتبط بـ: {linkedClient.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                          نشط
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-red-700"
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Portal Link Card */}
          <Card className="border-none shadow-sm dark:bg-navy-800 bg-primary-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <LogIn size={20} />
                رابط بوابة الموكلين
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-primary-100">
                شارك هذا الرابط مع موكليك ليتمكنوا من تسجيل الدخول ومتابعة قضاياهم.
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={portalUrl}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-xs font-mono"
                  dir="ltr"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(portalUrl);
                    toast.success("تم نسخ رابط البوابة");
                  }}
                >
                  <Copy size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold">إحصائيات البوابة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">إجمالي الموكلين المسجلين</span>
                <span className="font-bold text-navy-900 dark:text-white">{portalUsers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">إجمالي العملاء</span>
                <span className="font-bold text-navy-900 dark:text-white">{clients.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">نسبة التسجيل</span>
                <span className="font-bold text-primary-600 dark:text-primary-400">
                  {clients.length > 0 ? Math.round((portalUsers.length / clients.length) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
