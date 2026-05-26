# دليل تفعيل الإشعارات الفورية (Push Notifications)

لتفعيل الإشعارات الفورية في منصة "مَلَف" على بيئة الإنتاج، يرجى اتباع الخطوات التالية بدقة:

## 1. توليد مفاتيح VAPID

قم بتشغيل الأمر التالي في سطر الأوامر (Terminal) لتوليد مفتاحين (Public & Private):

```bash
npx web-push generate-vapid-keys
```

## 2. تحديث متغيرات البيئة للواجهة الأمامية

انسخ المفتاح العام (`Public Key`) الناتج من الخطوة السابقة، وقم بإضافته إلى ملف `.env` في المشروع (لبيئة التطوير) وفي إعدادات بيئة Vercel أو المنصة المستخدمة للرفع (لبيئة الإنتاج):

```env
VITE_VAPID_PUBLIC_KEY="ضع_هنا_المفتاح_العام_الخاص_بك"
```

## 3. إعداد أسرار الدالة في Supabase (Edge Function Secrets)

قم بتسجيل الدخول إلى مشروعك في Supabase عبر سطر الأوامر (Supabase CLI) ونفذ الأمر التالي لرفع المفاتيح إلى سيرفرات Supabase:

```bash
supabase secrets set VAPID_PUBLIC_KEY="ضع_هنا_المفتاح_العام" VAPID_PRIVATE_KEY="ضع_هنا_المفتاح_الخاص" VAPID_SUBJECT="mailto:admin@malaf.app"
```

## 4. رفع الدالة السحابية (Edge Function)

تأكد من رفع الدالة المسؤولة عن إرسال الإشعارات إلى Supabase:

```bash
supabase functions deploy send-session-reminders --no-verify-jwt
```

## 5. جدولة التشغيل اليومي (Cron Job)

لتشغيل دالة الإشعارات أوتوماتيكياً كل يوم للبحث عن جلسات الغد وتنبيه المحامين، يجب إعداد الجدولة من خلال واجهة Supabase (SQL Editor) أو لوحة تحكم `pg_cron`:

```sql
select
  cron.schedule(
    'send-session-reminders-job', -- اسم المهمة
    '0 20 * * *', -- التوقيت: الساعة 8 مساءً بتوقيت السيرفر
    $$
    select net.http_post(
        url:='https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/functions/v1/send-session-reminders',
        headers:='{"Content-Type": "application/json"}'::jsonb
    ) as request_id;
    $$
  );
```

_(لا تنسَ استبدال `[YOUR_SUPABASE_PROJECT_REF]` بمعرف مشروعك في Supabase)._

بمجرد تنفيذ هذه الخطوات، ستصبح منصة مَلَف قادرة بشكل آلي على إرسال الإشعارات الفورية للمحامين على أجهزتهم المحمولة وأجهزة الكمبيوتر!
