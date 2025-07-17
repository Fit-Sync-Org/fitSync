const { PrismaClient } = require("@prisma/client");
const {
  sendProgressAlertEmail,
  sendInactivityEmail,
} = require("../config/email");
const prisma = new PrismaClient();

const checkProgressAndNotify = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const currentPlan = await prisma.userPlan.findFirst({
      where: {
        userId: userId,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!currentPlan) return;

    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const [userMeals, userWorkouts] = await Promise.all([
      prisma.meal.findMany({
        where: {
          userId: userId,
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      }),
      prisma.workout.findMany({
        where: {
          userId: userId,
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      }),
    ]);

    const planData = currentPlan.planJson;
    if (!planData || !planData.days) return;

    let totalPlannedCalories = 0;
    let totalActualCalories = 0;
    let totalPlannedWorkouts = 0;
    let totalActualWorkouts = 0;

    planData.days.forEach((day, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + index);

      const dayActualMeals = userMeals.filter(
        (meal) => new Date(meal.date).toDateString() === dayDate.toDateString()
      );
      const dayActualWorkouts = userWorkouts.filter(
        (workout) =>
          new Date(workout.date).toDateString() === dayDate.toDateString()
      );

      totalPlannedCalories += day.totalCalories || 0;
      totalActualCalories += dayActualMeals.reduce(
        (sum, meal) => sum + (meal.calories || 0),
        0
      );
      totalPlannedWorkouts += day.workouts?.length || 0;
      totalActualWorkouts += dayActualWorkouts.length;
    });

    const calorieCompliance =
      totalPlannedCalories > 0 ? totalActualCalories / totalPlannedCalories : 1;
    const workoutCompliance =
      totalPlannedWorkouts > 0 ? totalActualWorkouts / totalPlannedWorkouts : 1;
    const alerts = [];

    if (calorieCompliance < 0.8) {
      alerts.push({
        type: "PROGRESS_ALERT",
        title: "Calorie Intake Below Target",
        message: `You're consuming ${Math.round(
          (1 - calorieCompliance) * 100
        )}% fewer calories than planned. Consider adjusting your meal portions.`,
        severity: "medium",
      });
    } else if (calorieCompliance > 1.2) {
      alerts.push({
        type: "PROGRESS_ALERT",
        title: "Calorie Intake Above Target",
        message: `You're consuming ${Math.round(
          (calorieCompliance - 1) * 100
        )}% more calories than planned. Consider reviewing your portion sizes.`,
        severity: "medium",
      });
    }

    if (workoutCompliance < 0.7) {
      alerts.push({
        type: "PROGRESS_ALERT",
        title: "Workout Consistency Needed",
        message: `You've completed ${Math.round(
          workoutCompliance * 100
        )}% of your planned workouts. Try to fit in a workout session today.`,
        severity: "high",
      });
    }

    for (const alert of alerts) {
      await prisma.notification.create({
        data: {
          userId: userId,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          isRead: false,
        },
      });

      if (alert.severity === "high") {
        await sendProgressAlertEmail(user, alert);
      }
    }
  } catch (error) {
    console.error("Progress tracking error:", error);
  }
};

const checkInactivity = async () => {
  try {
    const users = await prisma.user.findMany({
      where: {
        hasCompletedOnboarding: true,
      },
    });

    for (const user of users) {
      const lastActivity = await prisma.meal.findFirst({
        where: { userId: user.id },
        orderBy: { date: "desc" },
      });

      if (!lastActivity) continue;

      const daysSinceLastActivity = Math.floor(
        (new Date() - new Date(lastActivity.date)) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastActivity >= 1) {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: "PROGRESS_ALERT",
            title: { contains: "inactive" },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: "PROGRESS_ALERT",
              title: `Inactive for ${daysSinceLastActivity} day${
                daysSinceLastActivity > 1 ? "s" : ""
              }`,
              message: `You haven't logged any activities for ${daysSinceLastActivity} day${
                daysSinceLastActivity > 1 ? "s" : ""
              }. Don't let your fitness goals slip away!`,
              isRead: false,
            },
          });

          if (daysSinceLastActivity >= 3) {
            await sendInactivityEmail(user, daysSinceLastActivity);
          }
        }
      }
    }
  } catch (error) {
    console.error("Inactivity check error:", error);
  }
};

module.exports = {
  checkProgressAndNotify,
  checkInactivity,
};
