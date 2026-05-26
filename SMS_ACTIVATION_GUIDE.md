# دليل التفعيل النهائي لخدمة الإشعارات (SMS Activation Guide) 🚀

بمجرد الانتهاء من جميع مراحل تطوير منصة "مَلَف"، اتبع الخطوات التالية لتفعيل ميزة الرسائل النصية للموكلين:

### 1. إعداد حساب Twilio

- قم بإنشاء حساب على [Twilio](https://www.twilio.com/).
- احصل على رقم هاتف (Phone Number).
- استخرج البيانات التالية: `Account SID`, `Auth Token`, `From Number`.

### 2. رفع الـ Edge Function

افتح نافذة الأوامر في مجلد المشروع ونفذ:

```bash
npx supabase functions deploy send-client-sms
```

### 3. إعداد مفاتيح الأمان (Secrets)

قم بتشغيل الأوامر التالية لربط حساب Twilio بمشروع Supabase:

```bash
npx supabase secrets set TWILIO_ACCOUNT_SID=XXX
npx supabase secrets set TWILIO_AUTH_TOKEN=XXX
npx supabase secrets set TWILIO_FROM_NUMBER=XXX
```

### 4. التحقق من أرقام الموكلين

تأكد أن أرقام هواتف الموكلين المسجلة في المنصة تتبع الصيغة الدولية (مثال: `+201XXXXXXXXX`).

---

**ملاحظة:** الكود البرمجي والواجهات والـ Store كلها جاهزة الآن وتعمل بمجرد تنفيذ هذه الخطوات.
