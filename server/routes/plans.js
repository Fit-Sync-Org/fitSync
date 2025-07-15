const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();


router.get("/current", async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    console.log(`Looking for plan for user ${userId}, calculated weekStart: ${weekStart.toISOString()}`);

    let plan = await prisma.userPlan.findFirst({
      where: {
        userId: userId,
        weekStart: weekStart,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!plan) {
      console.log("No exact match found, looking for any active plan...");
      plan = await prisma.userPlan.findFirst({
        where: {
          userId: userId,
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (plan) {
        console.log(`Found active plan with weekStart: ${plan.weekStart.toISOString()}`);
      }
    }

    if (!plan) {
      const allPlans = await prisma.userPlan.findMany({
        where: { userId: userId },
        select: { id: true, weekStart: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5
      });

      console.log(`No active plan found. User has ${allPlans.length} total plans:`, allPlans);

      return res.status(404).json({
        error: "No active plan found for this week",
        weekStart: weekStart.toISOString().split("T")[0],
        debug: {
          calculatedWeekStart: weekStart.toISOString(),
          userPlans: allPlans
        }
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
  } catch (error) {
    console.error("Get current plan error:", error);
    res.status(500).json({ error: "Failed to fetch current plan" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [plans, total] = await Promise.all([
      prisma.userPlan.findMany({
        where: { userId: userId },
        orderBy: { weekStart: "desc" },
        skip: skip,
        take: parseInt(limit),
        select: {
          id: true,
          weekStart: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.userPlan.count({
        where: { userId: userId },
      }),
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
  } catch (error) {
    console.error("Get plan history error:", error);
    res.status(500).json({ error: "Failed to fetch plan history" });
  }
});

router.get("/:planId", async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.params;

    const plan = await prisma.userPlan.findFirst({
      where: {
        id: parseInt(planId),
        userId: userId,
      },
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
  } catch (error) {
    console.error("Get plan by ID error:", error);
    res.status(500).json({ error: "Failed to fetch plan" });
  }
});

// Remove the generate endpoint since plans are now auto-generated after onboarding

router.get("/generation/status", async (req, res) => {
  try {
    const userId = req.user.id;

    const generatingPlans = await prisma.userPlan.findMany({
      where: {
        userId: userId,
        status: "GENERATING",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    res.json({
      generatingPlans,
      queueAvailable: false,
    });
  } catch (error) {
    console.error("Get generation status error:", error);
    res.status(500).json({ error: "Failed to fetch generation status" });
  }
});

module.exports = router;
