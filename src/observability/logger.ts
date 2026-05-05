type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  event: string;
  requestId?: string;
  context?: Record<string, unknown>;
}

function sanitizeContext(context?: Record<string, unknown>) {
  if (!context) return undefined;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (/(token|password|secret|email|phone|nationalId|vat|commercialRegistration)/i.test(key)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function logEvent(level: LogLevel, payload: LogPayload) {
  const entry = {
    level,
    event: payload.event,
    requestId: payload.requestId,
    context: sanitizeContext(payload.context),
    timestamp: new Date().toISOString(),
  };

  if (level === "error") {
    console.error("[OBS]", JSON.stringify(entry));
    return;
  }
  if (level === "warn") {
    console.warn("[OBS]", JSON.stringify(entry));
    return;
  }
  console.info("[OBS]", JSON.stringify(entry));
}
