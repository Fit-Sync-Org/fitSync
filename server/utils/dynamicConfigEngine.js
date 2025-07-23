const { PrismaClient } = require("@prisma/client");

class DynamicConfigEngine {
  constructor(webSocketService = null) {
    this.wsService = webSocketService;
    this.baseConfig = {
      retryDelays: {
        base: 1000,
        multiplier: 2,
        maxDelay: 30000,
        jitterFactor: 0.5,
      },
      encryptionSettings: {
        keyIterations: 10000,
        enabledThreshold: 0.5,
      },
    };
    this.contextCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // detect device type and capabilities from user agent
  analyzeUserAgent(userAgent) {
    if (!userAgent)
      return { type: "unknown", performance: 0.5, batteryOptimization: false };

    const ua = userAgent.toLowerCase();
    let deviceType = "desktop";
    let performance = 1.0;
    let batteryOptimization = false;
    let networkReliability = 1.0;

    // asumming lesser performance and network strength for mobile
    if (/mobile|android|iphone|ipad|tablet/.test(ua)) {
      deviceType = "mobile";
      performance = 0.7;
      batteryOptimization = true;
      networkReliability = 0.8;
    }

    // Browser performance
    if (/chrome/.test(ua)) performance += 0.1;
    if (/firefox/.test(ua)) performance += 0.05;
    if (/safari/.test(ua) && !/chrome/.test(ua)) performance -= 0.05;
    if (/msie|trident/.test(ua)) performance -= 0.2; //older browser test

    return {
      type: deviceType,
      performance: Math.max(0.3, Math.min(1.0, performance)),
      batteryOptimization,
      networkReliability: Math.max(0.5, networkReliability),
      isLowEnd: performance < 0.6,
    };
  }

  getUserTechnicalFactors(userId) {
    const cacheKey = `technical_${userId}`;
    const cached = this.contextCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const factors = {
      connectionQuality: 0.8, // Based on recent connection success rate
      averageLatency: 50,
      frequentReconnects: false,
      isNewUser: false,
    };

    this.contextCache.set(cacheKey, {
      data: factors,
      timestamp: Date.now(),
    });

    return factors;
  }

  getServerLoadFactors() {
    const memUsage = process.memoryUsage();
    const memoryPressure = memUsage.heapUsed / memUsage.heapTotal;

    const connectionCount = this.wsService
      ? this.wsService.getTotalConnectionsCount()
      : 0;
    const activeUsers = this.wsService
      ? this.wsService.getConnectedUsersCount()
      : 0;

    // Time-based load
    const hour = new Date().getHours();
    const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    const isOffPeak = hour >= 23 || hour <= 6;

    return {
      memoryPressure,
      connectionLoad: Math.min(1.0, connectionCount / 1000), // Assume 1000 is high load
      userLoad: Math.min(1.0, activeUsers / 500),
      isPeakHour,
      isOffPeak,
      timeMultiplier: isOffPeak ? 0.5 : isPeakHour ? 1.5 : 1.0,
    };
  }

  async calculateRetryDelays(userId, userAgent, connectionHistory = []) {
    const deviceInfo = this.analyzeUserAgent(userAgent);
    const technicalFactors = this.getUserTechnicalFactors(userId);
    const serverFactors = this.getServerLoadFactors();

    let baseDelay = this.baseConfig.retryDelays.base;
    let multiplier = this.baseConfig.retryDelays.multiplier;
    let maxDelay = this.baseConfig.retryDelays.maxDelay;

    // ADJUSTMENTS
    if (deviceInfo.type === "mobile") {
      baseDelay *= 1.5; // Slower for battery
      if (deviceInfo.isLowEnd) baseDelay *= 1.3;
    }

    baseDelay *= 2 - deviceInfo.networkReliability;

    // User pattern adjustments (slower retries for users with connection issues)
    if (technicalFactors.frequentReconnects) {
      baseDelay *= 1.4;
    }
    if (technicalFactors.connectionQuality < 0.5) {
      baseDelay *= 1.6;
      multiplier = 1.8;
    }

    if (serverFactors.memoryPressure > 0.8) {
      baseDelay *= 2;
      multiplier = 1.5;
    }

    if (serverFactors.connectionLoad > 0.7) {
      baseDelay *= 1.3; // slower with a lot of concurrent connections
    }

    baseDelay *= serverFactors.timeMultiplier;

    // connection history-based learning
    if (connectionHistory.length > 5) {
      const recentFailures = connectionHistory
        .slice(-10)
        .filter((h) => h.success === false).length;
      const failureRate =
        recentFailures / Math.min(10, connectionHistory.length);

      if (failureRate > 0.5) {
        baseDelay *= 1.5;
        multiplier = 1.8;
      }
    }

    return {
      baseDelay: Math.floor(baseDelay),
      multiplier,
      maxDelay: Math.floor(maxDelay),
      jitterFactor:
        deviceInfo.performance * this.baseConfig.retryDelays.jitterFactor,
      reasoning: {
        deviceType: deviceInfo.type,
        isLowEnd: deviceInfo.isLowEnd,
        memoryPressure: serverFactors.memoryPressure,
        connectionLoad: serverFactors.connectionLoad,
        networkReliability: deviceInfo.networkReliability,
        timeMultiplier: serverFactors.timeMultiplier,
      },
    };
  }

  async calculateEncryptionParams(userId, userAgent, dataType) {
    const deviceInfo = this.analyzeUserAgent(userAgent);
    const serverFactors = this.getServerLoadFactors();

    let keyIterations = this.baseConfig.encryptionSettings.keyIterations;
    let shouldEncrypt = true;

    if (deviceInfo.isLowEnd || deviceInfo.performance < 0.5) {
      keyIterations = Math.floor(keyIterations * 0.7); // Reduce for low-end devices
    }

    if (serverFactors.memoryPressure > 0.9) {
      keyIterations = Math.floor(keyIterations * 0.8);
    }

    if (serverFactors.connectionLoad > 0.8) {
      keyIterations = Math.floor(keyIterations * 0.9); // Reduce for high connection load
    }

    // Data type considerations
    if (dataType === "health_critical") {
      keyIterations = Math.floor(keyIterations * 1.2);
    } else if (dataType === "metadata") {
      shouldEncrypt = false;
    }

    return {
      keyIterations,
      shouldEncrypt,
      algorithm: keyIterations > 8000 ? "aes-256-cbc" : "aes-128-cbc",
      reasoning: {
        devicePerformance: deviceInfo.performance,
        serverLoad: serverFactors.memoryPressure,
        connectionLoad: serverFactors.connectionLoad,
        dataType,
      },
    };
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.contextCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.contextCache.delete(key);
      }
    }
  }

  async getFullContext(userId, userAgent) {
    const deviceInfo = this.analyzeUserAgent(userAgent);
    const technicalFactors = this.getUserTechnicalFactors(userId);
    const serverFactors = this.getServerLoadFactors();

    return {
      device: deviceInfo,
      technical: technicalFactors,
      server: serverFactors,
      timestamp: new Date().toISOString(),
      cacheSize: this.contextCache.size,
    };
  }
}

module.exports = { DynamicConfigEngine };
