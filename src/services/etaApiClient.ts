import pino from 'pino';

const logger = pino();

interface RequestConfig {
  retries: number;
  backoff: number;
}

/**
 * عميل API للربط مع مصلحة الضرائب المصرية
 */
export class ETAApiClient {
  private static instance: ETAApiClient;
  private failureCount = 0;
  private isCircuitOpen = false;
  private lastFailureTime = 0;

  private constructor() {}

  static getInstance() {
    if (!ETAApiClient.instance) {
      ETAApiClient.instance = new ETAApiClient();
    }
    return ETAApiClient.instance;
  }

  async sendInvoice(payload: any, config: RequestConfig = { retries: 3, backoff: 1000 }) {
    if (this.isCircuitOpen) {
      const now = Date.now();
      if (now - this.lastFailureTime > 60000) {
        this.isCircuitOpen = false; // Half-open
      } else {
        throw new Error("Circuit Breaker is OPEN. Please wait.");
      }
    }

    for (let i = 0; i < config.retries; i++) {
      try {
        const response = await fetch(`${process.env.ETA_API_BASE_URL}/api/v1/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          this.failureCount = 0;
          return await response.json();
        }

        if (response.status >= 500) {
          // Retry on server errors
          const delay = config.backoff * Math.pow(2, i);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }

        // Non-retryable errors (4xx)
        const errorData = await response.json();
        throw { status: response.status, data: errorData };

      } catch (error) {
        if (i === config.retries - 1) {
          this.handleFailure();
          throw error;
        }
      }
    }
  }

  private handleFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= 5) {
      this.isCircuitOpen = true;
      logger.error("ETA API Circuit Breaker: OPENED due to multiple failures");
    }
  }
}
