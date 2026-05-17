import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import '@fontsource-variable/cairo';
import './index.css';
import { logEvent } from './observability/logger';

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
