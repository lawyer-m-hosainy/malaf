import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import '@fontsource-variable/cairo';
import './index.css';
import { logEvent } from './observability/logger';

window.addEventListener("error", (event) => {
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
  logEvent("error", {
    event: "unhandled_rejection",
    context: {
      reason: String(event.reason),
    },
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
