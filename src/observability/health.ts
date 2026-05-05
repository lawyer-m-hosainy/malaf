export async function checkAppHealth() {
  // Skip health check in dev mode (Express server not running alongside Vite)
  if (typeof window !== 'undefined' && window.location.port === '3000' && (import.meta as any).env?.DEV) {
    return { status: 'ok', mode: 'dev-skip' };
  }
  const response = await fetch("/api/health", { method: "GET" });
  if (!response.ok) {
    throw new Error("HEALTHCHECK_FAILED");
  }
  return response.json();
}
