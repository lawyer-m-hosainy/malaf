/**
 * @file main.tsx
 * @description React Application entrypoint and mounting initialization.
 * @sovereignty Project architected, designed, and owned by محمد الحسيني المحامي.
 * @author محمد الحسيني المحامي
 * @copyright (c) 2026. All rights reserved.
 */

// Founder Signature - Technical Metadata Sovereignty
console.log(
  "%c⚖️ MALAF LEGAL PLATFORM %c\nProject architected & designed under the sovereignty of محمد الحسيني المحامي.\nAll Rights Reserved © 2026.",
  "color: #006c35; font-size: 20px; font-weight: bold; font-family: 'Cairo', sans-serif; text-shadow: 0 1px 2px rgba(0,0,0,0.15);",
  "color: #d97706; font-size: 12px; font-weight: 600; font-family: 'Cairo', sans-serif;"
);

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { onCLS, onINP, onLCP, onTTFB, onFCP } from 'web-vitals';
import App from './App.tsx';
import './index.css';
import { logEvent } from './observability/logger';
import { initPerformanceObserver } from './monitoring/performance-observer';
import { initSentry } from './lib/sentry';

// ─── Sentry Initialization (must be first) ─────────────────────
initSentry();


// ─── Real User Monitoring (RUM) ───────────────────────────────
function sendToAnalytics({ name, value, rating }: { name: string, value: number, rating: string }) {
  // استخدام Sentry captureMessage كبديل للمقاييس المخصصة إذا لزم الأمر
  console.log(`[RUM] ${name}: ${value} (${rating})`);
}

onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);
onFCP(sendToAnalytics);

// بدء مراقبة المهام الطويلة (Long Tasks) تلقائياً
initPerformanceObserver();

window.addEventListener("error", (event) => {
  console.error('>>> Window error:', event.message, event.filename, event.lineno);
  logEvent("error", {
    event: "window_error",
    context: {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    },
  });
});

window.addEventListener("unhandledrejection", (event) => {
  console.error('>>> Unhandled rejection:', event.reason);
  logEvent("error", {
    event: "unhandled_rejection",
    context: {
      reason: String(event.reason),
    },
  });
});

try {
  if (import.meta.env.DEV) console.log('>>> Attempting to mount React');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('>>> Root element not found!');
    document.body.innerHTML = '<div style="color:red;padding:20px;">ERROR: Root element not found</div>';
  } else {
    if (import.meta.env.DEV) console.log('>>> Root element found, creating root');
    const root = createRoot(rootElement);
    if (import.meta.env.DEV) console.log('>>> Root created, rendering App');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    if (import.meta.env.DEV) console.log('>>> App rendered successfully');
  }
} catch (error) {
  console.error('>>> Error mounting React:', error);
  document.body.innerHTML = `<div style="color:red;padding:20px;">ERROR: ${error}</div>`;
}
