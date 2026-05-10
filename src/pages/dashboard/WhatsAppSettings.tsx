import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase } from "@/lib/supabase";
import WhatsAppStats from "@/components/whatsapp/WhatsAppStats";
import WorkingHours from "@/components/whatsapp/WorkingHours";
import CommandsReference from "@/components/whatsapp/CommandsReference";
import WhatsAppContacts from "@/components/whatsapp/WhatsAppContacts";
import BotTester from "@/components/whatsapp/BotTester";
import ConnectionStatus from "@/components/whatsapp/ConnectionStatus";
import { MessageLog } from "@/components/whatsapp/MessageLog";
import { NotificationToggles } from "@/components/whatsapp/NotificationToggles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save, Bot } from "lucide-react";

export function WhatsAppSettings() {
  const { currentUser } = useAuthStore();
  const orgId = currentUser?.orgId || currentUser?.id; // fallback if orgId is not set directly


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    is_active: false,
    wa_phone_number: '',
    welcome_message: '',
    away_message: '',
    provider: 'meta_cloud',
    api_token_encrypted: '',
    notifications: {
      session_reminder_24h: true,
      session_reminder_3h: true,
      session_result: true,
      invoice_due: true,
      weekly_report: true
    }
  });
  const [stats, setStats] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (orgId) {
      fetchSettings();
      fetchStats();
      fetchMessages();
    }
  }, [orgId]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/whatsapp/settings/${orgId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.org_id) setSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/whatsapp/stats/${orgId}`);
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/whatsapp/messages/${orgId}?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/whatsapp/settings/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast.success("تم حفظ إعدادات الواتساب بنجاح");
      } else {
        toast.error("حدث خطأ أثناء الحفظ");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings((s: any) => ({
      ...s,
      notifications: { ...s.notifications, [key]: value }
    }));
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">واتساب بوت مَلَف</h2>
          <p className="text-muted-foreground mt-1">
            أدر محادثات موكليك وتلقى أوامر المحامين عبر الواتساب.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#15803d] hover:bg-[#166534] text-white">
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      <ConnectionStatus />

      <WhatsAppStats />

      <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>الإعدادات الأساسية</CardTitle>
              <CardDescription>اربط رقم واتساب مكتبك بالمنصة</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="active-toggle" className={settings.is_active ? "text-emerald-600 font-bold cursor-pointer" : "cursor-pointer"}>
                {settings.is_active ? 'مفعّل' : 'معطّل'}
              </Label>
              <Checkbox 
                id="active-toggle"
                checked={settings.is_active} 
                onCheckedChange={(v) => setSettings({ ...settings, is_active: !!v })} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="provider">مزود الخدمة</Label>
              <select 
                id="provider"
                className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                value={settings.provider || 'meta_cloud'}
                onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
              >
                <option value="meta_cloud">Meta Cloud API (Official)</option>
                <option value="360dialog">360dialog</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="waPhone">معرف رقم الهاتف (Phone Number ID)</Label>
              <Input 
                id="waPhone" 
                placeholder="مثال: 1019595217914857" 
                value={settings.wa_phone_number || ''}
                onChange={(e) => setSettings({ ...settings, wa_phone_number: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="accessToken">رمز وصول ميتا (Access Token)</Label>
            <Input 
              id="accessToken" 
              type="password"
              placeholder="انسخ الرمز الذي حصلت عليه من Meta Developers" 
              value={settings.api_token_encrypted || ''}
              onChange={(e) => setSettings({ ...settings, api_token_encrypted: e.target.value })}
              dir="ltr"
            />
            <p className="text-[10px] text-muted-foreground">سيتم تشفير هذا الرمز تلقائياً قبل حفظه في قاعدة البيانات لأمانك.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="welcome">رسالة الترحيب (للموكلين الجدد)</Label>
            <Textarea 
              id="welcome" 
              rows={3}
              value={settings.welcome_message || ''}
              onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="away">رسالة الغياب (خارج أوقات العمل)</Label>
            <Textarea 
              id="away" 
              rows={2}
              value={settings.away_message || ''}
              onChange={(e) => setSettings({ ...settings, away_message: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <WorkingHours />

      <NotificationToggles 
        notifications={settings.notifications || {}} 
        onChange={handleNotificationChange} 
      />

      <CommandsReference />

      <WhatsAppContacts />

      <BotTester />

      <MessageLog messages={messages} />
    </div>
  );
}
