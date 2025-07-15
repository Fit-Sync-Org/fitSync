const {
  planGenerationQueue,
  progressCheckQueue,
  emailNotificationQueue,
} = require("../config/queue");

async function enqueuePlanGeneration(userId, options = {}) {
  const job = await planGenerationQueue.add(
    "generate-plan",
    { userId },
    {
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: options.attempts || 3,
      ...options,
    }
  );
  console.log(`Plan generation job ${job.id} queued for user ${userId}`);
  return job;
}

async function enqueueProgressCheck(userId, date, options = {}) {
  const job = await progressCheckQueue.add(
    "check-progress",
    { userId, date },
    {
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: options.attempts || 2,
      ...options,
    }
  );
  console.log(
    `Progress check job ${job.id} queued for user ${userId} on ${date}`
  );
  return job;
}

async function enqueueEmailNotification(userId, type, data, options = {}) {
  const job = await emailNotificationQueue.add(
    "send-email",
    { userId, type, data },
    {
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: options.attempts || 5,
      ...options,
    }
  );
  console.log(
    `Email notification job ${job.id} queued for user ${userId} (${type})`
  );
  return job;
}

async function getJobStatus(jobId, queueName = "plan") {
  let queue;
  switch (queueName) {
    case "plan":
      queue = planGenerationQueue;
      break;
    case "progress":
      queue = progressCheckQueue;
      break;
    case "email":
      queue = emailNotificationQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  const job = await queue.getJob(jobId);
  if (!job) {
    return { status: "not_found" };
  }

  const state = await job.getState();
  const progress = job.progress();

  return {
    id: job.id,
    status: state,
    progress,
    data: job.data,
    createdAt: new Date(job.timestamp),
    finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
    failedReason: job.failedReason || null,
  };
}

async function getUserPlanJobs(userId) {
  const jobs = await planGenerationQueue.getJobs([
    "waiting",
    "active",
    "completed",
    "failed",
  ]);
  const userJobs = jobs.filter((job) => job.data.userId === userId);

  return Promise.all(
    userJobs.map(async (job) => ({
      id: job.id,
      status: await job.getState(),
      progress: job.progress(),
      createdAt: new Date(job.timestamp),
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      failedReason: job.failedReason || null,
    }))
  );
}

async function scheduleEndOfDayProgressCheck(userId, date) {
  const targetDate = new Date(date);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 30, 0, 0);

  const now = new Date();
  const delay = endOfDay.getTime() - now.getTime();

  if (delay > 0) {
    return enqueueProgressCheck(userId, date, { delay });
  } else {
    return enqueueProgressCheck(userId, date);
  }
}

async function cleanupOldJobs(maxAge = 7 * 24 * 60 * 60 * 1000) {
  const cutoffTime = Date.now() - maxAge;

  try {
    await planGenerationQueue.clean(cutoffTime, "completed");
    await planGenerationQueue.clean(cutoffTime, "failed");
    await progressCheckQueue.clean(cutoffTime, "completed");
    await progressCheckQueue.clean(cutoffTime, "failed");
    await emailNotificationQueue.clean(cutoffTime, "completed");
    await emailNotificationQueue.clean(cutoffTime, "failed");

    console.log(
      `Cleaned up jobs older than ${Math.floor(
        maxAge / (24 * 60 * 60 * 1000)
      )} days`
    );
  } catch (error) {
    console.error("Error cleaning up old jobs:", error);
  }
}

module.exports = {
  enqueuePlanGeneration,
  enqueueProgressCheck,
  enqueueEmailNotification,
  getJobStatus,
  getUserPlanJobs,
  scheduleEndOfDayProgressCheck,
  cleanupOldJobs,
};


