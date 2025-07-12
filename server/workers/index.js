const { checkQueueHealth, closeQueues } = require("../config/queue");

require("./planGenerationWorker");
require("./progressCheckWorker");

console.log("Starting FitSync workers...");

checkQueueHealth();

const healthCheckInterval = setInterval(() => {
  checkQueueHealth();
}, 30000);

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  clearInterval(healthCheckInterval);
  await closeQueues();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down gracefully...");
  clearInterval(healthCheckInterval);
  await closeQueues();
  process.exit(0);
});

process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  clearInterval(healthCheckInterval);
  await closeQueues();
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  clearInterval(healthCheckInterval);
  await closeQueues();
  process.exit(1);
});

console.log("All workers started successfully");
console.log("Monitoring queues... Press Ctrl+C to exit");

process.stdin.resume();


