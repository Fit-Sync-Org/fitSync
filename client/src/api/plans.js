import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

export const plansAPI = {
  async getCurrentPlan() {
    try {
      const response = await axios.get(`${API_BASE}/api/plans/current`);
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'No active plan found',
          noActivePlan: true,
        };
      }
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch plan',
      };
    }
  },

  async getPlanHistory(page = 1, limit = 10) {
    try {
      const response = await axios.get(`${API_BASE}/api/plans/history`, {
        params: { page, limit },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch plan history',
      };
    }
  },

  async getPlanById(planId) {
    try {
      const response = await axios.get(`${API_BASE}/api/plans/${planId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch plan',
      };
    }
  },

  async generatePlan(weekStart = null) {
    try {
      const response = await axios.post(
        `${API_BASE}/api/plans/generate`,
        weekStart ? { weekStart } : {},
      );
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 409) {
        return {
          success: false,
          error: 'Plan already exists for this week',
          conflictError: true,
          existingPlan: error.response.data.existingPlan,
        };
      }
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to generate plan',
      };
    }
  },

  async getGenerationStatus() {
    try {
      const response = await axios.get(
        `${API_BASE}/api/plans/generation/status`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error || 'Failed to fetch generation status',
      };
    }
  },

  async getJobStatus(jobId) {
    try {
      const response = await axios.get(`${API_BASE}/api/plans/jobs/${jobId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch job status',
      };
    }
  },
};

export const planHelpers = {
  calculateWeeklyProgress(plan, userMeals, userWorkouts) {
    if (!plan?.plan?.days) return null;
    const days = plan.plan.days;
    const weekStart = new Date(plan.weekStart);
    let totalPlannedCalories = 0;
    let totalActualCalories = 0;
    let totalPlannedWorkouts = 0;
    let totalActualWorkouts = 0;
    days.forEach((day) => {
      const dayDate = new Date(day.date);
      totalPlannedCalories += day.totalCalories || 0;
      totalPlannedWorkouts += day.totalWorkouts || day.workouts?.length || 0;
      const dayActualMeals = userMeals.filter(
        (meal) => new Date(meal.date).toDateString() === dayDate.toDateString(),
      );
      const dayActualWorkouts = userWorkouts.filter(
        (workout) =>
          new Date(workout.date).toDateString() === dayDate.toDateString(),
      );
      totalActualCalories += dayActualMeals.reduce(
        (sum, meal) => sum + (meal.calories || 0),
        0,
      );
      totalActualWorkouts += dayActualWorkouts.length;
    });
    return {
      calorieCompliance:
        totalPlannedCalories > 0
          ? (totalActualCalories / totalPlannedCalories) * 100
          : 0,
      workoutCompliance:
        totalPlannedWorkouts > 0
          ? (totalActualWorkouts / totalPlannedWorkouts) * 100
          : 0,
      totalPlannedCalories,
      totalActualCalories,
      totalPlannedWorkouts,
      totalActualWorkouts,
    };
  },

  getCurrentDayPlan(plan) {
    if (!plan?.plan?.days) return null;
    const today = new Date().toISOString().split('T')[0];
    return plan.plan.days.find((day) => day.date === today) || null;
  },

  formatPlanForDisplay(plan) {
    if (!plan?.plan) return null;
    return {
      id: plan.id,
      weekStart: plan.weekStart,
      status: plan.status,
      totalDays: plan.plan.days?.length || 0,
      totalWeeklyCalories: plan.plan.totalWeeklyCalories || 0,
      days: plan.plan.days || [],
      createdAt: plan.createdAt,
    };
  },

  getWeekDates(weekStart) {
    const start = new Date(weekStart);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: date.toDateString() === new Date().toDateString(),
      });
    }
    return dates;
  },
};
