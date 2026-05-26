import pino from 'pino';

const logger = pino();

interface ServiceStats {
  failures: number;
  lastFailure: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const services: Record<string, ServiceStats> = {};

const THRESHOLD = 5;
const COOLDOWN = 30000; // 30 seconds

/**
 * Circuit Breaker لخدمات التكامل الخارجية
 */
export const circuitBreaker = async <T>(
  serviceName: string,
  request: () => Promise<T>,
  fallback: () => T
): Promise<T> => {
  if (!services[serviceName]) {
    services[serviceName] = { failures: 0, lastFailure: 0, state: 'CLOSED' };
  }

  const stats = services[serviceName];

  if (stats.state === 'OPEN') {
    if (Date.now() - stats.lastFailure > COOLDOWN) {
      stats.state = 'HALF_OPEN';
      logger.info(`Circuit Breaker [${serviceName}]: HALF_OPEN - Testing...`);
    } else {
      return fallback();
    }
  }

  try {
    const result = await request();
    
    if (stats.state === 'HALF_OPEN') {
      stats.state = 'CLOSED';
      stats.failures = 0;
      logger.info(`Circuit Breaker [${serviceName}]: CLOSED - Service recovered`);
    }
    
    return result;
  } catch (error) {
    stats.failures++;
    stats.lastFailure = Date.now();
    
    if (stats.failures >= THRESHOLD) {
      stats.state = 'OPEN';
      logger.error(`Circuit Breaker [${serviceName}]: OPENED - Too many failures`);
    }
    
    throw error;
  }
};

/**
 * إعدادات التنبيهات (Monitoring Alerts Configuration)
 * 
 * | Alert | Condition | Severity | Channel |
 * | :--- | :--- | :--- | :--- |
 * | Payment Error Rate | > 1% in 5min | Critical | PagerDuty |
 * | AI Latency | p95 > 10s | Warning | Slack |
 * | ETA Rejection Rate | > 5% daily | High | Email |
 * | WhatsApp Quota | > 80% used | Warning | Slack |
 */
export const alertsConfig = {
  payment_error_rate: { condition: '> 1% in 5m', severity: 'CRITICAL', channel: 'PagerDuty' },
  ai_latency_p95: { condition: '> 10s', severity: 'WARNING', channel: 'Slack' },
  eta_rejection_rate: { condition: '> 5% daily', severity: 'HIGH', channel: 'Email' },
  whatsapp_quota: { condition: '> 80% used', severity: 'WARNING', channel: 'Slack' },
};
