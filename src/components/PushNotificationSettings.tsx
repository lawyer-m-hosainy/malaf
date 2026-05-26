import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
} from '@/services/pushNotificationService';
import { toast } from 'sonner';

/**
 * مكون إعدادات الإشعارات الفورية
 * يُعرض داخل صفحة الإعدادات ليتيح للمستخدم تفعيل/إلغاء الإشعارات
 */
export function PushNotificationSettings() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      const sup = isPushSupported();
      setSupported(sup);
      if (sup) {
        setPermission(getNotificationPermission());
        setSubscribed(await isSubscribed());
      }
    };
    check();
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        const success = await unsubscribeFromPush();
        if (success) {
          setSubscribed(false);
          toast.success('تم إلغاء الإشعارات');
        }
      } else {
        const success = await subscribeToPush();
        if (success) {
          setSubscribed(true);
          setPermission('granted');
          toast.success('تم تفعيل الإشعارات بنجاح! 🔔');
        } else {
          if (Notification.permission === 'denied') {
            setPermission('denied');
            toast.error('تم رفض إذن الإشعارات. يرجى تفعيلها من إعدادات المتصفح.');
          }
        }
      }
    } catch (error) {
      toast.error('حدث خطأ في إعدادات الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-5">
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200">الإشعارات غير متاحة</p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              المتصفح الحالي لا يدعم الإشعارات الفورية. جرّب استخدام Chrome أو Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            subscribed 
              ? 'bg-emerald-100 dark:bg-emerald-900/30' 
              : 'bg-slate-100 dark:bg-slate-700'
          }`}>
            {subscribed 
              ? <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> 
              : <BellOff className="w-5 h-5 text-slate-400" />
            }
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">إشعارات الجلسات</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              تنبيهات تلقائية قبل الجلسات بيوم
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading || permission === 'denied'}
          className={`
            relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${subscribed 
              ? 'bg-emerald-500 dark:bg-emerald-600' 
              : 'bg-slate-300 dark:bg-slate-600'
            }
          `}
          aria-label={subscribed ? 'إلغاء الإشعارات' : 'تفعيل الإشعارات'}
        >
          <span className={`
            inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200
            ${subscribed ? '-translate-x-6' : '-translate-x-1'}
          `}>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 m-0.5" />}
          </span>
        </button>
      </div>

      {/* حالة الإذن */}
      <div className="flex items-center gap-2 text-xs">
        {permission === 'granted' && (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">إذن الإشعارات مُفعّل</span>
          </>
        )}
        {permission === 'denied' && (
          <>
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-red-600 dark:text-red-400">
              إذن الإشعارات مرفوض — فعّله من إعدادات المتصفح
            </span>
          </>
        )}
        {permission === 'default' && (
          <>
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">اضغط لتفعيل الإشعارات على هذا الجهاز</span>
          </>
        )}
      </div>
    </div>
  );
}

export default PushNotificationSettings;
