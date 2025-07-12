const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { enqueuePlanGeneration, getUserPlanJobs, getJobStatus } = require("../utils/queueHelpers");
const router = express.Router();
const prisma = new PrismaClient();


router.get("/current", async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  const plan = await prisma.userPlan.findFirst({
    where: { userId, weekStart, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  if (!plan) {
    return res.status(404).json({
      error: "No active plan found for this week",
      weekStart: weekStart.toISOString().split("T")[0],
    });
  }

  res.json({
    id: plan.id,
    weekStart: plan.weekStart,
    status: plan.status,
    plan: plan.planJson,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  });
});

router.get("/history", async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [plans, total] = await Promise.all([
    prisma.userPlan.findMany({
      where: { userId },
      orderBy: { weekStart: "desc" },
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        weekStart: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.userPlan.count({ where: { userId } }),
  ]);

  res.json({
    plans,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

router.get("/:planId", async (req, res) => {
  const userId = req.user.id;
  const planId = parseInt(req.params.planId);

  const plan = await prisma.userPlan.findFirst({
    where: { id: planId, userId },
  });

  if (!plan) {
    return res.status(404).json({ error: "Plan not found" });
  }

  res.json({
    id: plan.id,
    weekStart: plan.weekStart,
    status: plan.status,
    plan: plan.planJson,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  });
});

router.post("/generate", async (req, res) => {
  const userId = req.user.id;
  const { weekStart } = req.body;
  let targetWeekStart;

  if (weekStart) {
    targetWeekStart = new Date(weekStart);
  } else {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    targetWeekStart = new Date(today);
    targetWeekStart.setDate(today.getDate() - daysFromMonday);
  }

  targetWeekStart.setHours(0, 0, 0, 0);

  const existingPlan = await prisma.userPlan.findFirst({
    where: { userId, weekStart: targetWeekStart },
  });

  if (existingPlan && existingPlan.status === "ACTIVE") {
    return res.status(409).json({
      error: "An active plan already exists for this week",
      existingPlan: {
        id: existingPlan.id,
        status: existingPlan.status,
        weekStart: existingPlan.weekStart,
      },
    });
  }

  const generatingPlan = await prisma.userPlan.create({
    data: {
      userId,
      weekStart: targetWeekStart,
      planJson: {},
      status: "GENERATING",
    },
  });

  const job = await enqueuePlanGeneration(userId, { priority: 1 });

  res.status(202).json({
    message: "Plan generation started",
    planId: generatingPlan.id,
    jobId: job.id,
    weekStart: targetWeekStart.toISOString().split("T")[0],
    status: "GENERATING",
  });
});

router.get("/generation/status", async (req, res) => {
  const userId = req.user.id;
  const jobs = await getUserPlanJobs(userId);
  const generatingPlans = await prisma.userPlan.findMany({
    where: { userId, status: "GENERATING" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  res.json({
    jobs: jobs.slice(0, 5),
    generatingPlans,
  });
});

router.get("/jobs/:jobId", async (req, res) => {
  const jobId = req.params.jobId;
  const status = await getJobStatus(jobId, "plan");

  if (status.status === "not_found") {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json(status);
});

module.exports = router;
