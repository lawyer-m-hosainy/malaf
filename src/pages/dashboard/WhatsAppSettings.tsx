import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase } from "@/lib/supabase";
import { WhatsAppDashboard } from "@/components/whatsapp/WhatsAppDashboard";
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">واتساب بوت مَلَف</h2>
          <p className="text-muted-foreground mt-1">
            أدر محادثات موكليك وتلقى أوامر المحامين عبر الواتساب.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      <WhatsAppDashboard stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
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
              <div className="grid gap-2">
                <Label htmlFor="waPhone">رقم الواتساب (بدون +)</Label>
                <Input 
                  id="waPhone" 
                  placeholder="201012345678" 
                  value={settings.wa_phone_number || ''}
                  onChange={(e) => setSettings({ ...settings, wa_phone_number: e.target.value })}
                  dir="ltr"
                />
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

          <NotificationToggles 
            notifications={settings.notifications || {}} 
            onChange={handleNotificationChange} 
          />
        </div>

        <div>
          <MessageLog messages={messages} />
        </div>
      </div>
    </div>
  );
}
