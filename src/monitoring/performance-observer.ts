/**
 * @file performance-observer.ts
 * @description Real-User Monitoring (RUM) for detecting browser Long Tasks (>50ms).
 * @author مهندس أداء الواجهات (Performance Engineer)
 * @copyright (c) 2026. All rights reserved.
 */

import * as Sentry from "@sentry/react";

/**
 * تهيئة مراقب الأداء للمهام الطويلة وتكاسل الواجهة.
 * يرصد المهام التي تستغرق أكثر من 50 مللي ثانية لحظرها الخيط الرئيسي للـ JavaScript.
 */
export function initPerformanceObserver(): void {
  if (typeof window === "undefined") return;

  // التحقق من دعم المتصفح لمراقب المهام الطويلة
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const duration = entry.duration;
          
          if (duration > 50) {
            const warningMsg = `🐌 Long Task Detected: ${duration.toFixed(1)}ms (Blocks Main Thread)`;
            
            // في وضع التطوير: تنبيه واضح في الكونسول
            if (import.meta.env.DEV) {
              console.warn(warningMsg, {
                startTime: entry.startTime,
                name: entry.name,
                entryType: entry.entryType,
              });
            } else {
              // في وضع الإنتاج: إرسال تقرير أداء غير حرج إلى Sentry للتحليل المجمع
              Sentry.withScope((scope) => {
                scope.setTag("performance.type", "longtask");
                scope.setExtra("duration_ms", duration);
                scope.setExtra("start_time_ms", entry.startTime);
                Sentry.captureMessage(warningMsg, "warning");
              });
            }
          }
        });
      });

      // رصد المهام الطويلة
      observer.observe({ entryTypes: ["longtask"] });
      
      if (import.meta.env.DEV) {
        console.log("🚀 PerformanceObserver initialized for tracking [longtask] entries.");
      }
    } catch (error) {
      console.warn("⚠️ PerformanceObserver.observe failed or is not supported for 'longtask' in this browser:", error);
    }
  } else {
    if (import.meta.env.DEV) {
      console.warn("⚠️ PerformanceObserver is not supported in this browser environment.");
    }
  }
}
