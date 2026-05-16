/**
 * خدمة إدارة الإشعارات الفورية (Push Notifications)
 * 
 * المسؤوليات:
 * 1. طلب إذن الإشعارات من المستخدم
 * 2. تسجيل الـ Push Subscription
 * 3. حفظ/حذف الاشتراك في Supabase
 */

import { supabase } from '@/lib/supabase';
import { getCurrentTenantId } from '@/lib/tenant';

// ─── VAPID Public Key ────────────────────────────────────────────
// يجب توليد مفتاح VAPID جديد عبر: npx web-push generate-vapid-keys
// ثم وضع الـ Public Key هنا والـ Private Key في Supabase Secrets
const VAPID_PUBLIC_KEY = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY || '';

/**
 * تحويل VAPID key من Base64 إلى Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * هل المتصفح يدعم الإشعارات؟
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * الحالة الحالية لإذن الإشعارات
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

/**
 * طلب إذن الإشعارات وتسجيل الاشتراك
 * @returns true إذا تم التسجيل بنجاح
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('Push notifications غير مدعومة في هذا المتصفح');
    return false;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID Public Key غير مُعدّ. راجع ملف .env');
    return false;
  }

  try {
    // 1. طلب إذن الإشعارات
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('المستخدم رفض إذن الإشعارات');
      return false;
    }

    // 2. تسجيل Service Worker
    const registration = await navigator.serviceWorker.register('/sw-push.js', {
      scope: '/',
    });

    // انتظار حتى يكون الـ SW جاهزاً
    await navigator.serviceWorker.ready;

    // 3. إنشاء الاشتراك (Push Subscription)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // 4. حفظ الاشتراك في Supabase
    await savePushSubscription(subscription);

    console.log('✅ تم تسجيل الإشعارات بنجاح');
    return true;
  } catch (error) {
    console.error('فشل تسجيل الإشعارات:', error);
    return false;
  }
}

/**
 * إلغاء الاشتراك في الإشعارات
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    // حذف من Supabase
    await removePushSubscription(subscription.endpoint);

    // إلغاء الاشتراك
    await subscription.unsubscribe();

    console.log('✅ تم إلغاء الاشتراك في الإشعارات');
    return true;
  } catch (error) {
    console.error('فشل إلغاء الاشتراك:', error);
    return false;
  }
}

/**
 * هل المستخدم مشترك حالياً؟
 */
export async function isSubscribed(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

// ─── Supabase Persistence ────────────────────────────────────────

async function savePushSubscription(subscription: PushSubscription): Promise<void> {
  const orgId = getCurrentTenantId();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !orgId) return;

  const subJson = subscription.toJSON();

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    organization_id: orgId,
    endpoint: subscription.endpoint,
    p256dh: subJson.keys?.p256dh || '',
    auth: subJson.keys?.auth || '',
    created_at: new Date().toISOString(),
  }, {
    onConflict: 'endpoint',
  });

  if (error) console.error('فشل حفظ الاشتراك:', error.message);
}

async function removePushSubscription(endpoint: string): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);

  if (error) console.error('فشل حذف الاشتراك:', error.message);
}
