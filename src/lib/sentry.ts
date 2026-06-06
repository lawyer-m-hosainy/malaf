/**
 * @file sentry.ts
 * @description Sentry error monitoring initialization with PII filtering for legal data.
 * @sovereignty Project architected, designed, and owned by محمد الحسيني المحامي.
 */

import * as Sentry from '@sentry/react';
import {
  useEffect,
} from 'react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

/**
 * Initialize Sentry error monitoring.
 * Gracefully degrades when DSN is not configured.
 */
export function initSentry() {
  if (!SENTRY_DSN || SENTRY_DSN === 'YOUR_SENTRY_DSN_HERE') {
    if (import.meta.env.DEV) {
      console.warn('[Sentry] DSN not configured — monitoring disabled');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION ?? 'unknown',

    // Performance
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    profilesSampleRate: import.meta.env.PROD ? 0.05 : 0,

    // Session Replay — maskAllText إلزامي (بيانات قانونية حساسة)
    replaysSessionSampleRate: import.meta.env.PROD ? 0.05 : 0,
    replaysOnErrorSampleRate: 1.0,

    // PII Filtering — حماية بيانات المحامين والموكلين (CRITICAL)
    beforeSend(event: Sentry.ErrorEvent) {
      // حذف بيانات المستخدم الشخصية
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
        delete event.user.username;
      }

      // فلترة البيانات الحساسة من request body
      if (event.request?.data && typeof event.request.data === 'object' && event.request.data !== null) {
        const sensitiveKeys = ['national_id', 'phone', 'encrypted_', 'client_name', 'case_details', 'password'];
        const data = event.request.data as Record<string, unknown>;
        Object.keys(data).forEach(k => {
          if (sensitiveKeys.some(sk => k.toLowerCase().includes(sk))) {
            data[k] = '[REDACTED]';
          }
        });
      }

      return event;
    },

    // تجاهل الأخطاء غير المهمة
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      /^Loading chunk \d+ failed/,
      /^Non-Error promise rejection captured/,
    ],

    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration({
        maskAllText: true,       // إخفاء كل النصوص في الـ replay — بيانات قانونية
        blockAllMedia: true,     // حجب الوسائط
      }),
    ],
  });
}

/**
 * Capture an error with legal context tags.
 * Sensitive IDs are NOT sent directly — use hashed or generic tags only.
 */
export function captureError(error: Error, context?: Record<string, string>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Set user context for Sentry (without PII).
 */
export function setSentryUser(userId: string, orgId?: string) {
  Sentry.setUser({
    id: userId,
    ...(orgId && { org_id: orgId }),
  });
}

/**
 * Clear user context on logout.
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}
