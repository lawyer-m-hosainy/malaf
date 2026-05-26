import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateEG } from '@/lib/formatEG';
import { useAuthStore } from '@/store/useAuthStore';

export default function GlobalAdmin() {
  // ── طلبات الدفع اليدوي ──
  const [manualRequests, setManualRequests] = useState<any[]>([]);
  const [confirmLoading, setConfirmLoading] = useState<string | null>(null);
  const hasPermission = useAuthStore(state => state.hasPermission);

  // HIGH-005-FIX: حماية Frontend — فقط super_admin يمكنه الوصول
  if (!hasPermission('*')) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <p className="text-lg font-bold">⛔ غير مصرح لك بالوصول لهذه الصفحة</p>
      </div>
    );
  }

  // جلب الطلبات
  const fetchManualRequests = async () => {
    const { data } = await supabase
      .from('manual_payment_requests')
      .select(`
        *,
        organizations(name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setManualRequests(data || []);
  };

  useEffect(() => { fetchManualRequests(); }, []);

  const handleConfirm = async (requestId: string, action: 'confirmed' | 'rejected', notes?: string) => {
    setConfirmLoading(requestId);
    try {
      const session = await supabase.auth.getSession();
      const res = await fetch('/api/payment/manual/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({ requestId, action, notes }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(action === 'confirmed' ? '✅ تم التفعيل' : '❌ تم الرفض');
        fetchManualRequests();
      } else {
        toast.error(result.error || 'حدث خطأ');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setConfirmLoading(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-6">لوحة الإدارة الرئيسية (Super Admin)</h1>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>💳</span> طلبات الدفع اليدوي
          {manualRequests.length > 0 && (
            <Badge variant="destructive">{manualRequests.length}</Badge>
          )}
        </h2>

        {manualRequests.length === 0 ? (
          <p className="text-muted-foreground text-sm">لا توجد طلبات قيد المراجعة</p>
        ) : (
          manualRequests.map((req: any) => (
            <div key={req.id} className="border rounded-xl p-4 space-y-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{req.organizations?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {req.transfer_method === 'instapay' ? '🏦 InstaPay' : '📱 محفظة إلكترونية'}
                    {' — '}باقة {req.plan === 'basic' ? 'Standard (الأساسية)' : 'White Label (المؤسسات)'}
                  </p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg">{req.amount.toLocaleString('en-EG')} ج.م</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateEG(req.created_at)}
                  </p>
                </div>
              </div>

              <div className="bg-background rounded-lg p-3">
                <p className="text-xs text-muted-foreground">رقم العملية</p>
                <p className="font-mono font-bold" dir="ltr">{req.transfer_reference}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={confirmLoading === req.id}
                  onClick={() => handleConfirm(req.id, 'confirmed')}
                >
                  {confirmLoading === req.id ? '...' : '✅ تأكيد وتفعيل'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  disabled={confirmLoading === req.id}
                  onClick={() => handleConfirm(req.id, 'rejected', 'رقم العملية غير صحيح')}
                >
                  ❌ رفض
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
