import { useState, useEffect } from "react";
import { notificationsAPI } from "../../src/api/notifications";
import { plansAPI, planHelpers } from "../../src/api/plans";
import axios from "axios";
import "./ProgressTracker.css";

export default function ProgressTracker({ compact = false }) {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [userMeals, setUserMeals] = useState([]);
  const [userWorkouts, setUserWorkouts] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("week");
  const [progressAlerts, setProgressAlerts] = useState([]);

  useEffect(() => {
    fetchProgressData();
  }, [timeRange]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      const planResult = await plansAPI.getCurrentPlan();
      if (planResult.success) {
        setCurrentPlan(planResult.data);

        const weekStart = new Date(planResult.data.weekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const [mealsResult, workoutsResult, alertsResult] = await Promise.all([
          fetchUserMeals(weekStart, weekEnd),
          fetchUserWorkouts(weekStart, weekEnd),
          notificationsAPI.getProgressAlerts(7),
        ]);

        if (mealsResult.success) setUserMeals(mealsResult.data);
        if (workoutsResult.success) setUserWorkouts(workoutsResult.data);
        if (alertsResult.success)
          setProgressAlerts(alertsResult.data.notifications || []);

        const progress = planHelpers.calculateWeeklyProgress(
          planResult.data,
          mealsResult.data || [],
          workoutsResult.data || []
        );
        setProgressData(progress);
      } else {
        setError(planResult.error);
      }
    } catch (err) {
      setError("Failed to fetch progress data");
    }
    setLoading(false);
  };

  const fetchUserMeals = async (startDate, endDate) => {
    try {
      const meals = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/meals?date=${dateStr}`,
          { withCredentials: true }
        );
        if (response.data) {
          Object.values(response.data)
            .flat()
            .forEach((meal) => {
              meals.push({ ...meal, date: dateStr });
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return { success: true, data: meals };
    } catch {
      return { success: false, error: "Failed to fetch meals" };
    }
  };

  const fetchUserWorkouts = async (startDate, endDate) => {
    try {
      const workouts = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/exercises?date=${dateStr}`,
          { withCredentials: true }
        );
        if (response.data) {
          Object.values(response.data)
            .flat()
            .forEach((workout) => {
              workouts.push({ ...workout, date: dateStr });
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return { success: true, data: workouts };
    } catch {
      return { success: false, error: "Failed to fetch workouts" };
    }
  };

  const getComplianceColor = (percentage) => {
    if (percentage >= 90) return "#ADC97E";
    if (percentage >= 70) return "#FFC107";
    if (percentage >= 50) return "#FF8C00";
    return "#FF6B6B";
  };

  const getComplianceLabel = (percentage) => {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 70) return "Good";
    if (percentage >= 50) return "Fair";
    return "Needs Improvement";
  };

  const getDailyProgress = () => {
    if (!currentPlan?.plan?.days) return [];
    const weekStart = new Date(currentPlan.weekStart);
    return currentPlan.plan.days.map((day, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + index);
      const dateStr = dayDate.toISOString().split("T")[0];
      const dayMeals = userMeals.filter((meal) => meal.date === dateStr);
      const dayWorkouts = userWorkouts.filter(
        (workout) => workout.date === dateStr
      );
      const plannedCalories = day.totalCalories || 0;
      const actualCalories = dayMeals.reduce(
        (sum, meal) => sum + (meal.calories || 0),
        0
      );
      const plannedWorkouts = day.workouts?.length || 0;
      const actualWorkouts = dayWorkouts.length;
      return {
        date: dateStr,
        dayName: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: dayDate.getDate(),
        plannedCalories,
        actualCalories,
        plannedWorkouts,
        actualWorkouts,
        calorieCompliance:
          plannedCalories > 0 ? (actualCalories / plannedCalories) * 100 : 0,
        workoutCompliance:
          plannedWorkouts > 0 ? (actualWorkouts / plannedWorkouts) * 100 : 0,
        isToday: dayDate.toDateString() === new Date().toDateString(),
        isPast: dayDate < new Date(),
      };
    });
  };

  if (loading) {
    return (
      <div className={`progress-tracker ${compact ? "compact" : ""}`}>
        <div className="progress-loading">
          <div className="loading-spinner"></div>
          <p>Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`progress-tracker ${compact ? "compact" : ""}`}>
        <div className="progress-error">
          <div className="error-icon"></div>
          <h3>Progress Tracking Unavailable</h3>
          <p>{error}</p>
          <button onClick={fetchProgressData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className={`progress-tracker ${compact ? "compact" : ""}`}>
        <div className="no-plan">
          <div className="no-plan-icon"></div>
          <h3>No Active Plan</h3>
          <p>Generate a fitness plan to start tracking your progress.</p>
        </div>
      </div>
    );
  }

  const dailyProgress = getDailyProgress();

  if (compact) {
    return (
      <div className="progress-tracker compact">
        <div className="progress-header">
          <h3>Weekly Progress</h3>
          <div className="time-range">
            <span>This Week</span>
          </div>
        </div>

        {progressData && (
          <div className="compliance-overview">
            <div className="compliance-card">
              <div className="compliance-circle">
                <div
                  className="compliance-fill"
                  style={{
                    background: `conic-gradient(${getComplianceColor(
                      progressData.calorieCompliance
                    )} ${
                      progressData.calorieCompliance * 3.6
                    }deg, rgba(58, 65, 61, 0.5) 0deg)`,
                  }}
                >
                  <div className="compliance-inner">
                    <span className="compliance-percentage">
                      {Math.round(progressData.calorieCompliance)}%
                    </span>
                    <span className="compliance-label">Nutrition</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="compliance-card">
              <div className="compliance-circle">
                <div
                  className="compliance-fill"
                  style={{
                    background: `conic-gradient(${getComplianceColor(
                      progressData.workoutCompliance
                    )} ${
                      progressData.workoutCompliance * 3.6
                    }deg, rgba(58, 65, 61, 0.5) 0deg)`,
                  }}
                >
                  <div className="compliance-inner">
                    <span className="compliance-percentage">
                      {Math.round(progressData.workoutCompliance)}%
                    </span>
                    <span className="compliance-label">Workouts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {progressAlerts.length > 0 && (
          <div className="progress-alerts">
            <h4>Recent Alerts</h4>
            <div className="alert-list">
              {progressAlerts.slice(0, 2).map((alert, index) => (
                <div key={index} className="alert-item">
                  <span className="alert-text">{alert.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="view-detailed-btn"
          onClick={() => (window.location.href = "/progress")}
        >
          View Detailed Progress
        </button>
      </div>
    );
  }

  return (
    <div className="progress-tracker full">
      <div className="progress-header">
        <div className="header-left">
          <h2>Progress Tracking</h2>
          <p>
            Week of{" "}
            {new Date(currentPlan.weekStart).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="header-actions">
          <div className="time-range-selector">
            <button
              className={timeRange === "week" ? "active" : ""}
              onClick={() => setTimeRange("week")}
            >
              This Week
            </button>
            <button
              className={timeRange === "month" ? "active" : ""}
              onClick={() => setTimeRange("month")}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {progressData && (
        <div className="progress-overview">
          <div className="overall-compliance">
            <div className="compliance-stat">
              <div className="stat-circle large">
                <div
                  className="stat-fill"
                  style={{
                    background: `conic-gradient(${getComplianceColor(
                      progressData.calorieCompliance
                    )} ${
                      progressData.calorieCompliance * 3.6
                    }deg, rgba(58, 65, 61, 0.5) 0deg)`,
                  }}
                >
                  <div className="stat-inner">
                    <span className="stat-percentage">
                      {Math.round(progressData.calorieCompliance)}%
                    </span>
                    <span className="stat-label">Nutrition</span>
                    <span className="stat-status">
                      {getComplianceLabel(progressData.calorieCompliance)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="stat-details">
                <div className="stat-item">
                  <span className="stat-value">
                    {progressData.totalActualCalories}
                  </span>
                  <span className="stat-desc">Actual Calories</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {progressData.totalPlannedCalories}
                  </span>
                  <span className="stat-desc">Planned Calories</span>
                </div>
              </div>
            </div>

            <div className="compliance-stat">
              <div className="stat-circle large">
                <div
                  className="stat-fill"
                  style={{
                    background: `conic-gradient(${getComplianceColor(
                      progressData.workoutCompliance
                    )} ${
                      progressData.workoutCompliance * 3.6
                    }deg, rgba(58, 65, 61, 0.5) 0deg)`,
                  }}
                >
                  <div className="stat-inner">
                    <span className="stat-percentage">
                      {Math.round(progressData.workoutCompliance)}%
                    </span>
                    <span className="stat-label">Workouts</span>
                    <span className="stat-status">
                      {getComplianceLabel(progressData.workoutCompliance)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="stat-details">
                <div className="stat-item">
                  <span className="stat-value">
                    {progressData.totalActualWorkouts}
                  </span>
                  <span className="stat-desc">Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {progressData.totalPlannedWorkouts}
                  </span>
                  <span className="stat-desc">Planned</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="daily-progress">
        <h3>Daily Progress</h3>
        <div className="daily-progress-grid">
          {dailyProgress.map((day, index) => (
            <div
              key={index}
              className={`day-progress ${day.isToday ? "today" : ""} ${
                day.isPast ? "past" : ""
              }`}
            >
              <div className="day-header">
                <span className="day-name">{day.dayName}</span>
                <span className="day-number">{day.dayNumber}</span>
              </div>

              <div className="day-metrics">
                <div className="metric">
                  <div className="metric-label">Calories</div>
                  <div className="metric-bar">
                    <div
                      className="metric-fill calories"
                      style={{
                        width: `${Math.min(day.calorieCompliance, 100)}%`,
                        backgroundColor: getComplianceColor(
                          day.calorieCompliance
                        ),
                      }}
                    ></div>
                  </div>
                  <div className="metric-values">
                    <span>{day.actualCalories}</span> /{" "}
                    <span>{day.plannedCalories}</span>
                  </div>
                </div>

                <div className="metric">
                  <div className="metric-label">Workouts</div>
                  <div className="metric-bar">
                    <div
                      className="metric-fill workouts"
                      style={{
                        width: `${Math.min(day.workoutCompliance, 100)}%`,
                        backgroundColor: getComplianceColor(
                          day.workoutCompliance
                        ),
                      }}
                    ></div>
                  </div>
                  <div className="metric-values">
                    <span>{day.actualWorkouts}</span> /{" "}
                    <span>{day.plannedWorkouts}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {progressAlerts.length > 0 && (
        <div className="progress-alerts-section">
          <h3>Progress Alerts</h3>
          <div className="alerts-grid">
            {progressAlerts.map((alert, index) => (
              <div key={index} className="alert-card">
                <div className="alert-content">
                  <h4>{alert.title}</h4>
                  <p>{alert.message}</p>
                  <span className="alert-time">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
