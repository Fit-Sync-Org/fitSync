const {
  enqueuePlanGeneration,
  enqueueProgressCheck,
  getJobStatus,
} = require("./utils/queueHelpers");
const { checkQueueHealth, closeQueues } = require("./config/queue");

async function testQueue() {
  console.log("Testing queue system...");

  try {
    console.log("1. Checking queue health...");
    const isHealthy = await checkQueueHealth();
    if (!isHealthy) {
      console.log("Queue health check failed - make sure Redis is running");
      return;
    }
    console.log("Queue health check passed");

    console.log("2. Testing plan generation queue...");
    const planJob = await enqueuePlanGeneration(1, { priority: 1 });
    console.log(`Plan generation job created with ID: ${planJob.id}`);

    console.log("3. Testing progress check queue...");
    const today = new Date().toISOString().split("T")[0];
    const progressJob = await enqueueProgressCheck(1, today);
    console.log(`Progress check job created with ID: ${progressJob.id}`);

    console.log("4. Checking job status...");
    const planStatus = await getJobStatus(planJob.id, "plan");
    console.log(`Plan job status: ${planStatus.status}`);
    const progressStatus = await getJobStatus(progressJob.id, "progress");
    console.log(`Progress job status: ${progressStatus.status}`);

    console.log("All queue tests passed");
    console.log("Next steps:");
    console.log("1. Start the workers: npm run workers");
    console.log("2. Jobs will be processed automatically");
    console.log("3. Check the console for job completion logs");
  } catch (error) {
    console.error("Queue test failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("Redis connection refused. Make sure Redis is running:");
      console.log("  - Install Redis: https://redis.io/docs/getting-started/installation/");
      console.log("  - Start Redis: redis-server");
      console.log("  - Or use Docker: docker run -p 6379:6379 redis:alpine");
    }
  } finally {
    await closeQueues();
    process.exit(0);
  }
}

testQueue();


