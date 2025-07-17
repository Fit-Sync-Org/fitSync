const { PrismaClient } = require("@prisma/client");
const { sendProgressAlertEmail } = require("../config/email");

const prisma = new PrismaClient();

const PROGRESS_THRESHOLDS = {
  CALORIE_DEVIATION: 0.15,
  WORKOUT_MISSED_DAYS: 2,
  CONSISTENT_UNDER: 0.8,
  CONSISTENT_OVER: 1.2,
  PLAN_ADJUSTMENT_THRESHOLD: 0.7,
};

const calculateDailyProgress = (plannedDay, actualMeals, actualWorkouts) => {
  const plannedCalories = plannedDay.totalCalories || 0;
  const plannedWorkouts = plannedDay.workouts?.length || 0;

  const actualCalories = actualMeals.reduce(
    (sum, meal) => sum + (meal.calories || 0),
    0
  );
  const actualWorkouts = actualWorkouts.length;

  const calorieDeviation =
    plannedCalories > 0
      ? (actualCalories - plannedCalories) / plannedCalories
      : 0;
  const workoutCompliance =
    plannedWorkouts > 0 ? actualWorkouts / plannedWorkouts : 1;

  return {
    plannedCalories,
    actualCalories,
    calorieDeviation,
    plannedWorkouts,
    actualWorkouts,
    workoutCompliance,
    isOnTrack:
      Math.abs(calorieDeviation) <= PROGRESS_THRESHOLDS.CALORIE_DEVIATION &&
      workoutCompliance >= 0.8,
  };
};

const calculateWeeklyProgress = (plan, userMeals, userWorkouts) => {
  if (!plan?.plan?.days) return null;

  const days = plan.plan.days;
  const weekStart = new Date(plan.weekStart);
  let totalPlannedCalories = 0;
  let totalActualCalories = 0;
  let totalPlannedWorkouts = 0;
  let totalActualWorkouts = 0;
  let daysOnTrack = 0;
  let consecutiveMissedDays = 0;
  let maxConsecutiveMissed = 0;
  let dailyProgress = [];

  days.forEach((day, index) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + index);
    const dateStr = dayDate.toISOString().split("T")[0];

    const dayActualMeals = userMeals.filter(
      (meal) => new Date(meal.date).toDateString() === dayDate.toDateString()
    );
    const dayActualWorkouts = userWorkouts.filter(
      (workout) =>
        new Date(workout.date).toDateString() === dayDate.toDateString()
    );

    const dayProgress = calculateDailyProgress(
      day,
      dayActualMeals,
      dayActualWorkouts
    );
    dailyProgress.push({
      date: dateStr,
      ...dayProgress,
    });

    totalPlannedCalories += dayProgress.plannedCalories;
    totalActualCalories += dayProgress.actualCalories;
    totalPlannedWorkouts += dayProgress.plannedWorkouts;
    totalActualWorkouts += dayProgress.actualWorkouts;

    if (dayProgress.isOnTrack) {
      daysOnTrack++;
      consecutiveMissedDays = 0;
    } else {
      consecutiveMissedDays++;
      maxConsecutiveMissed = Math.max(
        maxConsecutiveMissed,
        consecutiveMissedDays
      );
    }
  });

  const overallCalorieCompliance =
    totalPlannedCalories > 0 ? totalActualCalories / totalPlannedCalories : 1;
  const overallWorkoutCompliance =
    totalPlannedWorkouts > 0 ? totalActualWorkouts / totalPlannedWorkouts : 1;

  return {
    totalPlannedCalories,
    totalActualCalories,
    totalPlannedWorkouts,
    totalActualWorkouts,
    overallCalorieCompliance,
    overallWorkoutCompliance,
    daysOnTrack,
    maxConsecutiveMissed,
    dailyProgress,
    isWeekOnTrack:
      overallCalorieCompliance >= 0.85 && overallWorkoutCompliance >= 0.8,
  };
};

const checkProgressAlerts = async (weeklyProgress, userId) => {
  const alerts = [];
  if (!weeklyProgress) return alerts;

  const {
    overallCalorieCompliance,
    overallWorkoutCompliance,
    maxConsecutiveMissed,
    daysOnTrack,
  } = weeklyProgress;

  if (overallCalorieCompliance < PROGRESS_THRESHOLDS.CONSISTENT_UNDER) {
    alerts.push({
      type: "PROGRESS_ALERT",
      title: "Calorie Intake Below Target",
      message: `You're consistently consuming ${Math.round(
        (1 - overallCalorieCompliance) * 100
      )}% fewer calories than planned. Consider adjusting your meal portions or adding healthy snacks.`,
      severity: "medium",
    });
  } else if (overallCalorieCompliance > PROGRESS_THRESHOLDS.CONSISTENT_OVER) {
    alerts.push({
      type: "PROGRESS_ALERT",
      title: "Calorie Intake Above Target",
      message: `You're consuming ${Math.round(
        (overallCalorieCompliance - 1) * 100
      )}% more calories than planned. Consider reviewing your portion sizes or meal choices.`,
      severity: "medium",
    });
  }
  if (
    overallWorkoutCompliance < PROGRESS_THRESHOLDS.PLAN_ADJUSTMENT_THRESHOLD
  ) {
    alerts.push({
      type: "PROGRESS_ALERT",
      title: "Workout Consistency Needed",
      message: `You've completed ${Math.round(
        overallWorkoutCompliance * 100
      )}% of your planned workouts. Try to fit in at least one workout session today.`,
      severity: "high",
    });
  }
  if (maxConsecutiveMissed >= PROGRESS_THRESHOLDS.WORKOUT_MISSED_DAYS) {
    alerts.push({
      type: "PROGRESS_ALERT",
      title: "Multiple Workout Days Missed",
      message: `You've missed ${maxConsecutiveMissed} consecutive workout days. Consider a shorter, more manageable workout to get back on track.`,
      severity: "high",
    });
  }
  if (daysOnTrack >= 7) {
    alerts.push({
      type: "MILESTONE",
      title: "Perfect Week Achievement! 🎉",
      message:
        "Congratulations! You've stayed on track with your fitness plan for the entire week. Keep up the great work!",
      severity: "positive",
    });
  }
  if (
    overallCalorieCompliance < PROGRESS_THRESHOLDS.PLAN_ADJUSTMENT_THRESHOLD ||
    overallWorkoutCompliance < PROGRESS_THRESHOLDS.PLAN_ADJUSTMENT_THRESHOLD
  ) {
    alerts.push({
      type: "PROGRESS_ALERT",
      title: "Plan Adjustment Recommended",
      message:
        "Your current plan might be too challenging. Consider generating a new, more realistic plan that better fits your lifestyle.",
      severity: "medium",
    });
  }
  return alerts;
};

const createNotification = async (userId, alert) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        isRead: false,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user && alert.severity === "high") {
      await sendProgressAlertEmail(user, alert);
    }

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};

const trackProgress = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    const currentPlan = await prisma.userPlan.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!currentPlan) return null;

    const weekStart = new Date(currentPlan.weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const [userMeals, userWorkouts] = await Promise.all([
      prisma.meal.findMany({
        where: {
          userId,
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      }),
      prisma.workout.findMany({
        where: {
          userId,
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      }),
    ]);

    const weeklyProgress = calculateWeeklyProgress(
      currentPlan,
      userMeals,
      userWorkouts
    );
    const alerts = await checkProgressAlerts(weeklyProgress, userId);

    for (const alert of alerts) {
      await createNotification(userId, alert);
    }

    return {
      weeklyProgress,
      alerts,
      alertCount: alerts.length,
    };
  } catch (error) {
    console.error("Error in progress tracking:", error);
    return null;
  }
};

module.exports = {
  trackProgress,
  calculateDailyProgress,
  calculateWeeklyProgress,
};
