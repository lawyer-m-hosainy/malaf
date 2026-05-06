import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, CheckCircle, Zap, Activity } from "lucide-react";

interface Stats {
  totalMessages: number;
  inbound: number;
  outbound: number;
  commandsExecuted: number;
  aiResponses: number;
  responseRate: number;
}

export function WhatsAppDashboard({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString('ar-EG')}</div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-emerald-500 font-medium">↑ {stats.inbound}</span> وارد | <span className="text-sky-500 font-medium">↓ {stats.outbound}</span> صادر
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">معدل الرد</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.responseRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            نسبة الرد على رسائل الموكلين
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الأوامر المنفذة</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.commandsExecuted.toLocaleString('ar-EG')}</div>
          <p className="text-xs text-muted-foreground mt-1">
            أوامر نفذها المحامون عبر الواتساب
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ردود الذكاء الاصطناعي</CardTitle>
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.aiResponses.toLocaleString('ar-EG')}</div>
          <p className="text-xs text-muted-foreground mt-1">
            استفسارات تولاها المساعد الذكي
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
