const Queue = require("bull");
const Redis = require("ioredis");
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 10000,
  lazyConnect: true,
};



const redis = new Redis(redisConfig);



const planGenerationQueue = new Queue("plan generation", {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});


const progressCheckQueue = new Queue("progress check", {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});


const emailNotificationQueue = new Queue("email notification", {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
  },
});


planGenerationQueue.on("completed", (job) => {
  console.log(
    `Plan generation job ${job.id} completed for user ${job.data.userId}`
  );
});


planGenerationQueue.on("failed", (job, err) => {
  console.error(
    `Plan generation job ${job.id} failed for user ${job.data.userId}:`,
    err.message
  );
});


progressCheckQueue.on("completed", (job) => {
  console.log(
    `Progress check job ${job.id} completed for user ${job.data.userId}`
  );
});


progressCheckQueue.on("failed", (job, err) => {
  console.error(
    `Progress check job ${job.id} failed for user ${job.data.userId}:`,
    err.message
  );
});


emailNotificationQueue.on("completed", (job) => {
  console.log(
    `Email notification job ${job.id} completed for user ${job.data.userId}`
  );
});


emailNotificationQueue.on("failed", (job, err) => {
  console.error(
    `Email notification job ${job.id} failed for user ${job.data.userId}:`,
    err.message
  );
});

async function checkQueueHealth() {
  try {
    await redis.ping();
    console.log("Redis connection healthy");


    const planWaiting = await planGenerationQueue.waiting();
    const planActive = await planGenerationQueue.active();
    const progressWaiting = await progressCheckQueue.waiting();
    const progressActive = await progressCheckQueue.active();


    console.log("Queue Status:");
    console.log(
      `  Plan Generation: ${planWaiting.length} waiting, ${planActive.length} active`
    );
    console.log(
      `  Progress Check: ${progressWaiting.length} waiting, ${progressActive.length} active`
    );


    return true;
  } catch (error) {
    console.error("Queue health check failed:", error.message);
    return false;
  }
}


// Graceful shutdown
async function closeQueues() {
  console.log("Closing queues...");
  await planGenerationQueue.close();
  await progressCheckQueue.close();
  await emailNotificationQueue.close();
  await redis.quit();
  console.log("Queues closed successfully");
}


module.exports = {
  redis,
  planGenerationQueue,
  progressCheckQueue,
  emailNotificationQueue,
  checkQueueHealth,
  closeQueues,
};
