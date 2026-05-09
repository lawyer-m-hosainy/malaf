# ⏰ دليل إعداد UptimeRobot لمنع Cold Start

## المشكلة
Render Free Tier يوقف الخادم بعد **15 دقيقة** من عدم النشاط.  
أول طلب بعد السكون يأخذ **30-60 ثانية** (cold start).

## الحل
استخدام UptimeRobot لإرسال ping كل 5 دقائق.

---

## خطوات الإعداد

### 1. إنشاء حساب مجاني
- اذهب إلى [uptimerobot.com](https://uptimerobot.com)
- أنشئ حساب مجاني (يدعم 50 monitor)

### 2. إضافة Monitor جديد

| الإعداد | القيمة |
|---------|--------|
| **Monitor Type** | `HTTP(s)` |
| **Friendly Name** | `Malaf Platform - Ping` |
| **URL** | `https://malaf-platform.onrender.com/api/health/ping` |
| **Monitoring Interval** | `5 minutes` |
| **Monitor Timeout** | `30 seconds` |

### 3. إعداد التنبيهات (اختياري)
- **Alert Contact**: أضف بريدك الإلكتروني
- **Alert When Down**: بعد **2 failed checks** (10 دقائق)

---

## Endpoints المتاحة

| Endpoint | الغرض | الاستجابة |
|----------|-------|----------|
| `GET /api/health/ping` | UptimeRobot ping (خفيف) | `pong` (text/plain) |
| `GET /api/health` | فحص صحة شامل | JSON مع memory + uptime |

### مثال استجابة `/api/health`:
```json
{
  "success": true,
  "status": "healthy",
  "service": "Malaf Legal ERP Backend",
  "environment": "production",
  "uptime": 3600,
  "memory": {
    "heapUsedMB": 45,
    "heapTotalMB": 72,
    "rssMB": 95
  },
  "version": "1.0.0"
}
```

---

## بدائل مجانية أخرى

| الخدمة | الفاصل الأدنى | الحد المجاني |
|--------|---------------|-------------|
| [UptimeRobot](https://uptimerobot.com) | 5 دقائق | 50 monitor |
| [Cron-Job.org](https://cron-job.org) | 1 دقيقة | unlimited |
| [Freshping](https://freshping.io) | 1 دقيقة | 50 monitors |

> **ملاحظة:** إذا كنت على Render Paid Plan ($7/شهر)، لا تحتاج UptimeRobot لأن الخادم لا ينام.
