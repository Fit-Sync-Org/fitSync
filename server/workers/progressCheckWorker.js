const { progressCheckQueue } = require("../config/queue");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

progressCheckQueue.process(async (job) => {
  const { userId, date } = job.data;

  try {
    console.log(`Checking progress for user ${userId} on ${date}`);

    await job.progress(10);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const dayOfWeek = targetDate.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    await job.progress(20);

    const userPlan = await prisma.userPlan.findFirst({
      where: {
        userId,
        weekStart,
        status: "ACTIVE",
      },
    });

    if (!userPlan) {
      console.log(`No active plan for user ${userId} for week ${weekStart.toISOString()}`);
      return { status: "no_plan" };
    }

    await job.progress(30);

    const planData = userPlan.planJson;
    const targetDateStr = targetDate.toISOString().split("T")[0];
    const dayPlan = planData.days?.find((day) => day.date === targetDateStr);

    if (!dayPlan) {
      console.log(`No plan for user ${userId} on date ${targetDateStr}`);
      return { status: "no_day_plan" };
    }

    await job.progress(40);

    const actualMeals = await prisma.meal.findMany({
      where: {
        userId,
        date: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const actualWorkouts = await prisma.workout.findMany({
      where: {
        userId,
        date: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    await job.progress(60);

    const plannedCalories = dayPlan.totalCalories || 0;
    const plannedWorkouts = dayPlan.totalWorkouts || dayPlan.workouts?.length || 0;

    const actualCalories = actualMeals.reduce(
      (sum, meal) => sum + (meal.calories || 0),
      0
    );
    const actualWorkoutCount = actualWorkouts.length;

    const calorieDeviation = plannedCalories > 0
      ? ((actualCalories - plannedCalories) / plannedCalories) * 100
      : 0;
    const workoutCompliance = plannedWorkouts > 0
      ? (actualWorkoutCount / plannedWorkouts) * 100
      : 100;

    await job.progress(80);

    await prisma.progressSnapshot.upsert({
      where: {
        userId_date: { userId, date: targetDate },
      },
      update: {
        plannedCalories,
        actualCalories,
        plannedWorkouts,
        actualWorkouts: actualWorkoutCount,
        calorieDeviation,
        workoutCompliance,
      },
      create: {
        userId,
        date: targetDate,
        plannedCalories,
        actualCalories,
        plannedWorkouts,
        actualWorkouts: actualWorkoutCount,
        calorieDeviation,
        workoutCompliance,
      },
    });

    await job.progress(90);

    const notifications = [];
    const CALORIE_DEVIATION_THRESHOLD = 20;
    const WORKOUT_COMPLIANCE_THRESHOLD = 50;

    if (Math.abs(calorieDeviation) > CALORIE_DEVIATION_THRESHOLD) {
      const isOver = calorieDeviation > 0;
      const deviationText = isOver ? "over" : "under";

      notifications.push({
        userId,
        type: "PROGRESS_ALERT",
        title: `Calorie Alert`,
        message: `You are ${Math.abs(calorieDeviation).toFixed(1)}% ${deviationText} your daily calorie goal. Target: ${plannedCalories} | Actual: ${actualCalories.toFixed(0)}`,
        isRead: false,
      });
    }

    if (workoutCompliance < WORKOUT_COMPLIANCE_THRESHOLD && plannedWorkouts > 0) {
      notifications.push({
        userId,
        type: "PROGRESS_ALERT",
        title: "Workout Reminder",
        message: `You have completed ${actualWorkoutCount} of ${plannedWorkouts} planned workouts today.`,
        isRead: false,
      });
    }

    if (workoutCompliance === 100 && plannedWorkouts > 0) {
      notifications.push({
        userId,
        type: "MILESTONE",
        title: "Daily Goal Achieved",
        message: `You have completed all your planned workouts for today.`,
        isRead: false,
      });
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
      console.log(`Created ${notifications.length} notifications for user ${userId}`);
    }

    await job.progress(100);

    console.log(`Progress check completed for user ${userId} on ${targetDateStr}`);

    return {
      status: "success",
      date: targetDateStr,
      metrics: {
        plannedCalories,
        actualCalories,
        calorieDeviation: calorieDeviation.toFixed(1),
        plannedWorkouts,
        actualWorkouts: actualWorkoutCount,
        workoutCompliance: workoutCompliance.toFixed(1),
      },
      notificationsCreated: notifications.length,
    };
  } catch (error) {
    console.error(`Progress check failed for user ${userId}:`, error.message);
    throw error;
  }
});

console.log("Progress check worker started");

module.exports = progressCheckQueue;


