import { supabase } from "@/lib/supabase";

/**
 * Health Check Endpoint
 * يُستخدم لمراقبة حالة النظام ومنع Cold Start في Render.com
 */
export async function GET() {
  const start = Date.now();
  
  // إجراء فحوصات متوازية للخدمات
  const checks = await Promise.allSettled([
    // 1. فحص قاعدة البيانات (Supabase)
    supabase.from('organizations').select('count', { count: 'exact', head: true }).limit(1),
    
    // 2. فحص الاتصال ببوابة الضرائب المصرية (ETA) - بيئة الاختبار أو الإنتاج
    fetch('https://sdk.preprod.invoicing.eta.gov.eg/swagger/index.html', { method: 'HEAD' })
      .catch(() => null),
  ]);

  const dbStatus = checks[0].status === 'fulfilled' && !(checks[0] as any).value.error ? 'up' : 'down';
  const etaStatus = checks[1].status === 'fulfilled' && (checks[1] as any).value !== null ? 'up' : 'unreachable';

  const isHealthy = dbStatus === 'up';

  return Response.json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbStatus,
      eta_api: etaStatus,
    },
    response_time_ms: Date.now() - start,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  });
}
