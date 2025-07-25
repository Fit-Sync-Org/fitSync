const { RetryEngine, RetryExhaustedError } = require("../utils/retryEngine");

// Mock DynamicConfigEngine
jest.mock("../utils/dynamicConfigEngine", () => ({
  DynamicConfigEngine: jest.fn().mockImplementation(() => ({
    calculateRetryDelays: jest.fn().mockResolvedValue({
      baseDelay: 1000,
      multiplier: 2,
      jitterFactor: 0.1,
      maxDelay: 30000,
      reasoning: "Standard retry policy",
    }),
  })),
}));

describe("RetryEngine", () => {
  let retryEngine;
  let mockOperation;

  beforeEach(() => {
    retryEngine = new RetryEngine({
      maxRetries: 3,
      baseDelay: 100, // Shorter delays for testing
      capDelay: 5000,
      jitter: false,
    });
    mockOperation = jest.fn();

    jest.clearAllMocks();
  });

  describe("Successful Operations", () => {
    test("should execute operation successfully on first try", async () => {
      const expectedResult = { success: true, data: "test" };
      mockOperation.mockResolvedValueOnce(expectedResult);

      const result = await retryEngine.start(mockOperation);

      expect(result).toEqual(expectedResult);
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(retryEngine.retryCount).toBe(0);

      const metrics = retryEngine.getMetrics();
      expect(metrics.attempts).toBe(1);
      expect(metrics.successes).toBe(1);
      expect(metrics.failures).toBe(0);
    });

    test("should succeed after retries", async () => {
      const expectedResult = { success: true, data: "retry success" };
      mockOperation
        .mockRejectedValueOnce(new Error("First failure"))
        .mockRejectedValueOnce(new Error("Second failure"))
        .mockResolvedValueOnce(expectedResult);

      const result = await retryEngine.start(mockOperation);

      expect(result).toEqual(expectedResult);
      expect(mockOperation).toHaveBeenCalledTimes(3);

      const metrics = retryEngine.getMetrics();
      expect(metrics.attempts).toBe(3);
      expect(metrics.successes).toBe(1);
      expect(metrics.failures).toBe(2);
    });
  });

  describe("Retry Logic", () => {
    test("should respect maximum retry limit", async () => {
      mockOperation.mockRejectedValue(new Error("Persistent failure"));

      await expect(retryEngine.start(mockOperation)).rejects.toThrow(
        RetryExhaustedError
      );
      expect(mockOperation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    test("should throw RetryExhaustedError with details", async () => {
      const persistentError = new Error("Persistent failure");
      mockOperation.mockRejectedValue(persistentError);

      try {
        await retryEngine.start(mockOperation);
      } catch (error) {
        expect(error).toBeInstanceOf(RetryExhaustedError);
        expect(error.details).toHaveProperty("attempts");
        expect(error.details).toHaveProperty("lastError");
        expect(error.details).toHaveProperty("metrics");
        expect(error.details).toHaveProperty("connectionHistory");
        expect(error.details.attempts).toBe(3);
      }
    });

    test("should calculate exponential backoff delays", async () => {
      const retryEngineWithJitter = new RetryEngine({
        maxRetries: 2,
        baseDelay: 100,
        jitter: false,
      });

      const delay1 = await retryEngineWithJitter.calculateDelay();
      retryEngineWithJitter.retryCount = 1;
      const delay2 = await retryEngineWithJitter.calculateDelay();

      expect(delay1).toBe(100);
      expect(delay2).toBe(200);
    });

    test("should respect cap delay limit", async () => {
      const retryEngineWithCap = new RetryEngine({
        baseDelay: 1000,
        capDelay: 2000,
        jitter: false,
      });

      retryEngineWithCap.retryCount = 5;
      const delay = await retryEngineWithCap.calculateDelay();

      expect(delay).toBe(2000);
    });
  });

  describe("Metrics and Monitoring", () => {
    test("should update metrics correctly", () => {
      retryEngine.updateMetrics(true, 100);
      retryEngine.updateMetrics(false, 200, new Error("Test error"));

      const metrics = retryEngine.getMetrics();
      expect(metrics.attempts).toBe(2);
      expect(metrics.successes).toBe(1);
      expect(metrics.failures).toBe(1);
      expect(metrics.totalDelay).toBe(300);
      expect(metrics.avgDelay).toBe(150);
      expect(metrics.lastError).toBe("Test error");
    });

    test("should reset metrics correctly", () => {
      retryEngine.updateMetrics(true, 100);
      retryEngine.resetMetrics();

      const metrics = retryEngine.getMetrics();
      expect(metrics.attempts).toBe(0);
      expect(metrics.successes).toBe(0);
      expect(metrics.failures).toBe(0);
      expect(metrics.totalDelay).toBe(0);
      expect(metrics.avgDelay).toBe(0);
      expect(metrics.lastError).toBeNull();
    });

    test("should maintain connection history", async () => {
      const retryEngineWithHistory = new RetryEngine({
        maxRetries: 2,
        baseDelay: 50,
      });

      mockOperation
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce({ success: true });

      await retryEngineWithHistory.start(mockOperation);

      expect(retryEngineWithHistory.connectionHistory).toHaveLength(2);
      expect(retryEngineWithHistory.connectionHistory[0].success).toBe(false);
      expect(retryEngineWithHistory.connectionHistory[1].success).toBe(true);
    });

    test("should limit connection history size", () => {
      // Add more than 20 entries
      for (let i = 0; i < 25; i++) {
        retryEngine.updateConnectionHistory(
          i % 2 === 0,
          new Error(`Error ${i}`)
        );
      }

      expect(retryEngine.connectionHistory.length).toBe(20);
      // Should keep the most recent 20
      expect(retryEngine.connectionHistory[0].error).toBe("Error 5");
    });
  });

  describe("Callback Functions", () => {
    test("should call onRetry callback", async () => {
      const onRetrySpy = jest.fn();
      const retryEngineWithCallbacks = new RetryEngine({
        maxRetries: 2,
        baseDelay: 50,
        onRetry: onRetrySpy,
      });

      mockOperation
        .mockRejectedValueOnce(new Error("Failure"))
        .mockResolvedValueOnce({ success: true });

      await retryEngineWithCallbacks.start(mockOperation);

      expect(onRetrySpy).toHaveBeenCalledTimes(1);
      expect(onRetrySpy).toHaveBeenCalledWith({
        attempt: 1,
        waitTime: expect.any(Number),
        device: "server",
        error: "Failure",
      });
    });

    test("should call onSuccess callback", async () => {
      const onSuccessSpy = jest.fn();
      const retryEngineWithCallbacks = new RetryEngine({
        onSuccess: onSuccessSpy,
      });

      const expectedResult = { success: true };
      mockOperation.mockResolvedValueOnce(expectedResult);

      await retryEngineWithCallbacks.start(mockOperation);

      expect(onSuccessSpy).toHaveBeenCalledTimes(1);
      expect(onSuccessSpy).toHaveBeenCalledWith(expectedResult);
    });

    test("should call onFailure callback when max retries exceeded", async () => {
      const onFailureSpy = jest.fn();
      const retryEngineWithCallbacks = new RetryEngine({
        maxRetries: 1,
        onFailure: onFailureSpy,
      });

      const persistentError = new Error("Persistent error");
      mockOperation.mockRejectedValue(persistentError);

      await expect(
        retryEngineWithCallbacks.start(mockOperation)
      ).rejects.toThrow();

      expect(onFailureSpy).toHaveBeenCalledTimes(1);
      expect(onFailureSpy).toHaveBeenCalledWith(persistentError);
    });
  });

  describe("Dynamic Configuration", () => {
    test("should use dynamic config when available", async () => {
      const mockDynamicConfig = {
        calculateRetryDelays: jest.fn().mockResolvedValue({
          baseDelay: 2000,
          multiplier: 1.5,
          jitterFactor: 0.2,
          maxDelay: 10000,
          reasoning: "User-specific policy",
        }),
      };

      const retryEngineWithDynamic = new RetryEngine({
        userId: "test-user-123",
        userAgent: "test-agent",
        dynamicConfig: mockDynamicConfig,
      });

      const delay = await retryEngineWithDynamic.calculateDelay();

      expect(mockDynamicConfig.calculateRetryDelays).toHaveBeenCalledWith(
        "test-user-123",
        "test-agent",
        expect.any(Array)
      );
      expect(delay).toBeGreaterThan(0);
    });

    test("should fallback to standard delay calculation on dynamic config error", async () => {
      const mockDynamicConfig = {
        calculateRetryDelays: jest
          .fn()
          .mockRejectedValue(new Error("Config error")),
      };

      const retryEngineWithDynamic = new RetryEngine({
        userId: "test-user-123",
        baseDelay: 1000,
        jitter: false,
        dynamicConfig: mockDynamicConfig,
      });

      const delay = await retryEngineWithDynamic.calculateDelay();

      expect(delay).toBe(1000); // Should use fallback baseDelay
    });
  });

  describe("Memory-based Delay Adjustment", () => {
    test("should increase delay under high memory usage", async () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 900 * 1024 * 1024,
        heapTotal: 1000 * 1024 * 1024,
      });

      const delay = await retryEngine.calculateDelay();
      const expectedDelay = retryEngine.baseDelay * 2;

      expect(delay).toBe(expectedDelay);

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });
  });
});
