const { DynamicConfigEngine } = require("./dynamicConfigEngine");

async function testDynamicConfig() {
  console.log("=== Testing Dynamic Configuration Engine ===");

  const mockWebSocketService = {
    getTotalConnectionsCount: () => 50,
    getConnectedUsersCount: () => 25,
  };

  const dynamicConfig = new DynamicConfigEngine(mockWebSocketService);

  console.log("\nTest 1: User Agent Analysis");
  const userAgents = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
  ];

  userAgents.forEach((ua) => {
    const analysis = dynamicConfig.analyzeUserAgent(ua);
    console.log(`User Agent: ${ua.substring(0, 50)}...`);
    console.log(`  Device Type: ${analysis.type}`);
    console.log(`  Performance: ${analysis.performance.toFixed(2)}`);
    console.log(`  Battery Optimization: ${analysis.batteryOptimization}`);
    console.log(
      `  Network Reliability: ${analysis.networkReliability.toFixed(2)}`
    );
    console.log(`  Low End: ${analysis.isLowEnd}`);
    console.log("---");
  });

  console.log("\nTest 2: Server Load Factors");
  const serverLoad = dynamicConfig.getServerLoadFactors();
  console.log("Server Load Factors:");
  console.log(`  Memory Pressure: ${serverLoad.memoryPressure.toFixed(2)}`);
  console.log(`  Connection Load: ${serverLoad.connectionLoad.toFixed(2)}`);
  console.log(`  User Load: ${serverLoad.userLoad.toFixed(2)}`);
  console.log(`  Peak Hour: ${serverLoad.isPeakHour}`);
  console.log(`  Off Peak: ${serverLoad.isOffPeak}`);
  console.log(`  Time Multiplier: ${serverLoad.timeMultiplier.toFixed(2)}`);

  console.log("\nTest 3: Dynamic Retry Delays");
  const userId = "user123";
  const userAgent = userAgents[0]; // iPhone

  const retryParams = await dynamicConfig.calculateRetryDelays(
    userId,
    userAgent
  );
  console.log("Retry Parameters:");
  console.log(`  Base Delay: ${retryParams.baseDelay}ms`);
  console.log(`  Multiplier: ${retryParams.multiplier.toFixed(2)}`);
  console.log(`  Max Delay: ${retryParams.maxDelay}ms`);
  console.log(`  Jitter Factor: ${retryParams.jitterFactor.toFixed(2)}`);
  console.log("  Reasoning:", retryParams.reasoning);

  // Test 4: Encryption Parameters  console.log("\nTest 4: Encryption Parameters");
  const encryptionParams = await dynamicConfig.calculateEncryptionParams(
    userId,
    userAgent,
    "health_critical"
  );

  console.log("Encryption Parameters:");
  console.log(`  Key Iterations: ${encryptionParams.keyIterations}`);
  console.log(`  Should Encrypt: ${encryptionParams.shouldEncrypt}`);
  console.log(`  Algorithm: ${encryptionParams.algorithm}`);
  console.log("  Reasoning:", encryptionParams.reasoning);

  // Test 5: Context Cache
  console.log("\nTest 5: Context Cache");
  // Get context multiple times to test caching
  await dynamicConfig.getUserTechnicalFactors(userId);
  await dynamicConfig.getUserTechnicalFactors(userId);

  const fullContext = await dynamicConfig.getFullContext(userId, userAgent);
  console.log("Full Context:");
  console.log(`  Device Type: ${fullContext.device.type}`);
  console.log(
    `  Connection Quality: ${fullContext.technical.connectionQuality}`
  );
  console.log(
    `  Memory Pressure: ${fullContext.server.memoryPressure.toFixed(2)}`
  );
  console.log(`  Cache Size: ${fullContext.cacheSize}`);

  // Test cache cleanup
  console.log("\nTest 6: Cache Cleanup");
  console.log(`  Before cleanup: ${dynamicConfig.contextCache.size} entries`);
  dynamicConfig.cleanupCache();
  console.log(`  After cleanup: ${dynamicConfig.contextCache.size} entries`);

  console.log("\n=== Dynamic Configuration Tests Complete ===");
}

if (require.main === module) {
  testDynamicConfig().catch(console.error);
}

module.exports = { testDynamicConfig };
