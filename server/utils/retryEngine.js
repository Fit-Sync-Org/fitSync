class RetryExhaustedError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "RetryExhaustedError";
    this.details = details;
  }
}

const { DynamicConfigEngine } = require("./dynamicConfigEngine");

class RetryEngine {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 5;
    this.baseDelay = options.baseDelay || 1000;
    this.capDelay = options.capDelay || 30000;
    this.jitter = options.jitter !== false;
    this.deviceType = "server";
    this.retryCount = 0;
    this.dynamicConfig = options.dynamicConfig || new DynamicConfigEngine();
    this.userId = options.userId;
    this.userAgent = options.userAgent || "server-side";
    this.connectionHistory = options.connectionHistory || [];

    this.metrics = {
      attempts: 0,
      successes: 0,
      failures: 0,
      totalDelay: 0,
      avgDelay: 0,
      lastError: null,
    };

    this.onRetry = options.onRetry || this.defaultOnRetry.bind(this);
    this.onSuccess = options.onSuccess || this.defaultOnSuccess.bind(this);
    this.onFailure = options.onFailure || this.defaultOnFailure.bind(this);
  }

  async calculateDelay() {
    if (this.userId && this.dynamicConfig) {
      try {
        const dynamicDelays = await this.dynamicConfig.calculateRetryDelays(
          this.userId,
          this.userAgent,
          this.connectionHistory
        );

        let delay =
          dynamicDelays.baseDelay * dynamicDelays.multiplier ** this.retryCount;

        if (this.jitter) {
          delay += Math.floor(
            Math.random() * dynamicDelays.baseDelay * dynamicDelays.jitterFactor
          );
        }

        console.log(`[Server] Dynamic retry delay calculated: ${delay}ms`, {
          reasoning: dynamicDelays.reasoning,
          attempt: this.retryCount + 1,
        });

        return Math.min(delay, dynamicDelays.maxDelay);
      } catch (error) {
        console.error(
          "Failed to calculate dynamic delay, using fallback:",
          error.message
        );
      }
    }

    let delay = this.baseDelay * 2 ** this.retryCount;

    if (this.jitter) {
      delay += Math.floor((Math.random() * this.baseDelay) / 2);
    }

    if (
      process.memoryUsage().heapUsed / process.memoryUsage().heapTotal >
      0.8
    ) {
      delay *= 2; // Double if memory usage >80%
    }

    return Math.min(delay, this.capDelay);
  }

  updateMetrics(success, delay, error = null) {
    this.metrics.attempts++;
    this.metrics.totalDelay += delay || 0;
    this.metrics.avgDelay = this.metrics.totalDelay / this.metrics.attempts;

    if (success) {
      this.metrics.successes++;
    } else {
      this.metrics.failures++;
      this.metrics.lastError = error?.message;
    }
  }

  defaultOnRetry(details) {
    console.log(
      `[Server] Retry #${details.attempt} in ${details.waitTime}ms (Reason: ${details.error})`
    );
  }

  defaultOnSuccess(result) {
    console.log("[Server] Operation successful after retries");
  }

  defaultOnFailure(err) {
    console.error("[Server] Operation failed after max retries:", err.message);
  }

  updateConnectionHistory(success, error = null) {
    this.connectionHistory.push({
      timestamp: Date.now(),
      success,
      error: error?.message,
      attempt: this.retryCount,
    });

    if (this.connectionHistory.length > 20) {
      this.connectionHistory = this.connectionHistory.slice(-20);
    }
  }

  async start(operationFn) {
    let delay = 0;
    try {
      const result = await operationFn();
      this.updateMetrics(true, delay);
      this.updateConnectionHistory(true);
      this.onSuccess(result);
      this.retryCount = 0;
      return result;
    } catch (err) {
      this.updateMetrics(false, delay, err);
      this.updateConnectionHistory(false, err);

      if (this.retryCount >= this.maxRetries) {
        this.onFailure(err);
        throw new RetryExhaustedError("Max retries exceeded", {
          attempts: this.retryCount,
          lastError: err,
          metrics: this.metrics,
          connectionHistory: this.connectionHistory.slice(-5),
        });
      }

      this.retryCount++;
      delay = await this.calculateDelay();

      this.onRetry({
        attempt: this.retryCount,
        waitTime: delay,
        device: this.deviceType,
        error: err.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.start(operationFn);
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      attempts: 0,
      successes: 0,
      failures: 0,
      totalDelay: 0,
      avgDelay: 0,
      lastError: null,
    };
  }
}

module.exports = { RetryEngine, RetryExhaustedError };
