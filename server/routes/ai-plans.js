const express = require('express');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/generate', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planData, weekStart } = req.body;
    console.log(`Received plan from client for user ${userId}`);

    if (!planData || !planData.days || !Array.isArray(planData.days)) {
      return res.status(400).json({
        error: 'Invalid plan data: missing or invalid days array'
      });
    }

    if (!weekStart) {
      return res.status(400).json({
        error: 'weekStart parameter missing'
      });
    }

    const weekStartDate = new Date(weekStart);
    weekStartDate.setHours(0, 0, 0, 0);

    const existingPlan = await prisma.userPlan.findFirst({
      where: {
        userId: userId,
        weekStart: weekStartDate,
        status: "ACTIVE",
      },
    });

    if (existingPlan) {
      return res.status(409).json({
        error: 'Plan already exists for this week',
        planId: existingPlan.id
      });
    }



    const enhancedPlanData = {
      ...planData,
      generatedBy: 'client-ai',
      generatedAt: new Date().toISOString(),
      note: 'This plan was generated using client-side AI (Firebase Vertex AI).'
    };

    const savedPlan = await prisma.userPlan.create({
      data: {
        userId: userId,
        weekStart: weekStartDate,
        planJson: enhancedPlanData,
        status: "ACTIVE",
      },
    });



    await prisma.notification.create({
      data: {
        userId: userId,
        type: "PLAN_READY",
        title: "Your AI-Generated Plan is Ready!",
        message: `Your personalized fitness and meal plan for the week of ${weekStart} has been generated and is ready to use.`,
        isRead: false,
      },
    });

    console.log(`plan saved for user ${userId}, plan ID: ${savedPlan.id}`);

    res.json({
      success: true,
      planId: savedPlan.id,
      weekStart: weekStart,
      totalDays: planData.days.length,
      message: 'AI-generated plan saved successfully'
    });

  } catch (error) {
    console.error('Error saving plan:', error);
    res.status(500).json({
      error: 'Failed to save plan',
      details: error.message
    });
  }
});

router.post('/regenerate', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;



    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);



    await prisma.userPlan.deleteMany({
      where: {
        userId: userId,
        weekStart: weekStart,
      },
    });

    console.log(`Cleared existing plan for user ${userId} for week ${weekStart.toISOString()}`);

    res.json({
      success: true,
      weekStart: weekStart.toISOString().split('T')[0],
      message: 'Ready for new plan generation'
    });

  } catch (error) {
    console.error('Error preparing for plan regeneration:', error);
    res.status(500).json({
      error: 'Failed to prepare for plan regeneration',
      details: error.message
    });
  }
});

module.exports = router;
