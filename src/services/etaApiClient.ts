import pino from 'pino';
import crypto from 'crypto';

const logger = pino();

interface RequestConfig {
  retries: number;
  backoff: number;
  maxBackoff?: number;
}

/**
 * عميل API للربط مع مصلحة الضرائب المصرية
 */
export class ETAApiClient {
  private static instance: ETAApiClient;
  private failureCount = 0;
  private circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastFailureTime = 0;

  private constructor() {}

  static getInstance() {
    if (!ETAApiClient.instance) {
      ETAApiClient.instance = new ETAApiClient();
    }
    return ETAApiClient.instance;
  }

  async sendInvoice(payload: any, config: RequestConfig = { retries: 3, backoff: 1000, maxBackoff: 30000 }) {
    if (this.circuitState === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > 60000) {
        this.circuitState = 'HALF_OPEN';
        logger.info("ETA API Circuit Breaker: HALF_OPEN - Testing with one request...");
      } else {
        throw new Error("Circuit Breaker is OPEN. Please wait.");
      }
    }

    const idempotencyKey = payload.internalId || payload.id || crypto.randomUUID();

    for (let i = 0; i < config.retries; i++) {
      try {
        const response = await fetch(`${process.env.ETA_API_BASE_URL}/api/v1/documents`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey, // Header لمنع الازدواجية
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          this.handleSuccess();
          return await response.json();
        }

        if (response.status >= 500) {
          logger.warn(`ETA API Request failed (Attempt ${i + 1}/${config.retries}). Status: ${response.status}`);
          if (this.circuitState === 'HALF_OPEN') {
            // فشل فوري في حالة HALF_OPEN وعدم المحاولة مرة أخرى
            this.handleFailure();
            throw new Error(`Circuit Breaker HALF_OPEN test failed with status ${response.status}`);
          }
          const delay = Math.min(config.backoff * Math.pow(2, i), config.maxBackoff || 30000);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }

        // Non-retryable errors (4xx)
        const errorData = await response.json();
        throw { status: response.status, data: errorData };

      } catch (error: any) {
        if (i === config.retries - 1 || this.circuitState === 'HALF_OPEN') {
          this.handleFailure();
          throw error;
        }
        logger.warn(`ETA API Network Error (Attempt ${i + 1}/${config.retries}): ${error.message}`);
        const delay = Math.min(config.backoff * Math.pow(2, i), config.maxBackoff || 30000);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  private handleSuccess() {
    if (this.circuitState !== 'CLOSED') {
      logger.info("ETA API Circuit Breaker: CLOSED - Service recovered");
      this.circuitState = 'CLOSED';
    }
    this.failureCount = 0;
  }

  private handleFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.circuitState === 'HALF_OPEN' || this.failureCount >= 5) {
      this.circuitState = 'OPEN';
      logger.error("ETA API Circuit Breaker: OPENED due to failures");
    }
  }
}
