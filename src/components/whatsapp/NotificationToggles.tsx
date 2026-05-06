import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Notifications {
  session_reminder_24h: boolean;
  session_reminder_3h: boolean;
  session_result: boolean;
  invoice_due: boolean;
  weekly_report: boolean;
}

interface Props {
  notifications: Notifications;
  onChange: (key: keyof Notifications, value: boolean) => void;
}

export function NotificationToggles({ notifications, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">الإشعارات الآلية</CardTitle>
        <CardDescription>
          الرسائل التي يرسلها البوت تلقائياً للموكلين والمحامين
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex items-center justify-between space-x-2 space-x-reverse">
          <div className="space-y-0.5">
            <Label className="text-base cursor-pointer">تذكير الجلسة (قبل 24 ساعة)</Label>
            <p className="text-xs text-muted-foreground">يُرسل للموكل قبل يوم من موعد الجلسة</p>
          </div>
          <Checkbox 
            checked={notifications.session_reminder_24h} 
            onCheckedChange={(v) => onChange('session_reminder_24h', !!v)} 
          />
        </div>

        <div className="flex items-center justify-between space-x-2 space-x-reverse">
          <div className="space-y-0.5">
            <Label className="text-base cursor-pointer">تذكير عاجل (قبل 3 ساعات)</Label>
            <p className="text-xs text-muted-foreground">تنبيه نهائي للموكل صباح يوم الجلسة</p>
          </div>
          <Checkbox 
            checked={notifications.session_reminder_3h} 
            onCheckedChange={(v) => onChange('session_reminder_3h', !!v)} 
          />
        </div>

        <div className="flex items-center justify-between space-x-2 space-x-reverse">
          <div className="space-y-0.5">
            <Label className="text-base cursor-pointer">نتيجة الجلسة</Label>
            <p className="text-xs text-muted-foreground">عندما يُسجل المحامي نتيجة الجلسة عبر الواتساب</p>
          </div>
          <Checkbox 
            checked={notifications.session_result} 
            onCheckedChange={(v) => onChange('session_result', !!v)} 
          />
        </div>

        <div className="flex items-center justify-between space-x-2 space-x-reverse">
          <div className="space-y-0.5">
            <Label className="text-base cursor-pointer">استحقاق الفاتورة</Label>
            <p className="text-xs text-muted-foreground">تذكير للموكل في يوم استحقاق الفاتورة غير المدفوعة</p>
          </div>
          <Checkbox 
            checked={notifications.invoice_due} 
            onCheckedChange={(v) => onChange('invoice_due', !!v)} 
          />
        </div>

        <div className="flex items-center justify-between space-x-2 space-x-reverse">
          <div className="space-y-0.5">
            <Label className="text-base cursor-pointer">التقرير الأسبوعي للمكتب</Label>
            <p className="text-xs text-muted-foreground">موجز جلسات وفواتير الأسبوع يُرسل لمدير المكتب</p>
          </div>
          <Checkbox 
            checked={notifications.weekly_report} 
            onCheckedChange={(v) => onChange('weekly_report', !!v)} 
          />
        </div>

      </CardContent>
    </Card>
  );
}
