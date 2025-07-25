import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

export const notificationsAPI = {
  async getNotifications(page = 1, limit = 10) {
    try {
      const response = await axios.get(`${API_BASE}/api/notifications`, {
        params: { page, limit },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch notifications',
      };
    }
  },

  async markAsRead(notificationId) {
    try {
      const response = await axios.patch(`${API_BASE}/api/notifications/${notificationId}/read`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to mark notification as read',
      };
    }
  },

  async markAllAsRead() {
    try {
      const response = await axios.patch(`${API_BASE}/api/notifications/mark-all-read`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to mark all notifications as read',
      };
    }
  },

  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(`${API_BASE}/api/notifications/${notificationId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete notification',
      };
    }
  },

  async getProgressAlerts(days = 7) {
    try {
      const response = await axios.get(`${API_BASE}/api/notifications/progress-alerts`, {
        params: { days },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch progress alerts',
      };
    }
  },

  async createNotification(notificationData) {
    try {
      const response = await axios.post(`${API_BASE}/api/notifications`, notificationData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create notification',
      };
    }
  },
};


export const progressTracking = {
  calculateDailyProgress(plannedDay, actualMeals, actualWorkouts) {
    const plannedCalories = plannedDay.totalCalories || 0;
    const plannedWorkouts = plannedDay.workouts?.length || 0;
    const actualCalories = actualMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const actualWorkoutsCount = actualWorkouts.length;

    const calorieDeviation = plannedCalories > 0 ? (actualCalories - plannedCalories) / plannedCalories : 0;
    const workoutCompliance = plannedWorkouts > 0 ? actualWorkoutsCount / plannedWorkouts : 1;

    return {
      plannedCalories,
      actualCalories,
      calorieDeviation,
      plannedWorkouts,
      actualWorkouts: actualWorkoutsCount,
      workoutCompliance,
      isOnTrack: Math.abs(calorieDeviation) <= 0.15 && workoutCompliance >= 0.8,
    };
  },

  calculateWeeklyProgress(plan, userMeals, userWorkouts) {
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
      const dateStr = dayDate.toISOString().split('T')[0];

      const dayActualMeals = userMeals.filter(
        meal => new Date(meal.date).toDateString() === dayDate.toDateString(),
      );
      const dayActualWorkouts = userWorkouts.filter(
        workout => new Date(workout.date).toDateString() === dayDate.toDateString(),
      );

      const dayProgress = this.calculateDailyProgress(day, dayActualMeals, dayActualWorkouts);
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
        maxConsecutiveMissed = Math.max(maxConsecutiveMissed, consecutiveMissedDays);
      }
    });

    const overallCalorieCompliance = totalPlannedCalories > 0 ? totalActualCalories / totalPlannedCalories : 1;
    const overallWorkoutCompliance = totalPlannedWorkouts > 0 ? totalActualWorkouts / totalPlannedWorkouts : 1;

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
      isWeekOnTrack: overallCalorieCompliance >= 0.85 && overallWorkoutCompliance >= 0.8,
    };
  },

  // Check for progress alerts and create notifications
  async checkProgressAlerts(weeklyProgress, userId) {
    const alerts = [];

    if (!weeklyProgress) return alerts;

    const { overallCalorieCompliance, overallWorkoutCompliance, maxConsecutiveMissed, daysOnTrack } = weeklyProgress;

    if (overallCalorieCompliance < 0.8) {
      alerts.push({
        type: 'PROGRESS_ALERT',
        title: 'Calorie Intake Below Target',
        message: `You're consistently consuming ${Math.round((1 - overallCalorieCompliance) * 100)}% fewer calories than planned. Consider adjusting your meal portions or adding healthy snacks.`,
        severity: 'medium',
      });
    } else if (overallCalorieCompliance > 1.2) {
      alerts.push({
        type: 'PROGRESS_ALERT',
        title: 'Calorie Intake Above Target',
        message: `You're consuming ${Math.round((overallCalorieCompliance - 1) * 100)}% more calories than planned. Consider reviewing your portion sizes or meal choices.`,
        severity: 'medium',
      });
    }

    if (overallWorkoutCompliance < 0.7) {
      alerts.push({
        type: 'PROGRESS_ALERT',
        title: 'Workout Consistency Needed',
        message: `You've completed ${Math.round(overallWorkoutCompliance * 100)}% of your planned workouts. Try to fit in at least one workout session today.`,
        severity: 'high',
      });
    }

    if (maxConsecutiveMissed >= 2) {
      alerts.push({
        type: 'PROGRESS_ALERT',
        title: 'Multiple Workout Days Missed',
        message: `You've missed ${maxConsecutiveMissed} consecutive workout days. Consider a shorter, more manageable workout to get back on track.`,
        severity: 'high',
      });
    }

    if (daysOnTrack >= 7) {
      alerts.push({
        type: 'MILESTONE',
        title: 'Perfect Week Achievement! 🎉',
        message: 'Congratulations! You\'ve stayed on track with your fitness plan for the entire week. Keep up the great work!',
        severity: 'positive',
      });
    }

    if (overallCalorieCompliance < 0.7 || overallWorkoutCompliance < 0.7) {
      alerts.push({
        type: 'PROGRESS_ALERT',
        title: 'Plan Adjustment Recommended',
        message: 'Your current plan might be too challenging. Consider generating a new, more realistic plan that better fits your lifestyle.',
        severity: 'medium',
      });
    }

    for (const alert of alerts) {
      try {
        await notificationsAPI.createNotification({
          type: alert.type,
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
        });
      } catch (error) {
        console.error('Failed to create notification:', error);
      }
    }

    return alerts;
  },

  async trackProgress(plan, userMeals, userWorkouts, userId) {
    try {
      const weeklyProgress = this.calculateWeeklyProgress(plan, userMeals, userWorkouts);

      if (!weeklyProgress) {
        console.log('No plan available for progress tracking');
        return null;
      }


      const alerts = await this.checkProgressAlerts(weeklyProgress, userId);

      return {
        weeklyProgress,
        alerts,
        alertCount: alerts.length,
      };
    } catch (error) {
      console.error('Error in progress tracking:', error);
      return null;
    }
  },
};
