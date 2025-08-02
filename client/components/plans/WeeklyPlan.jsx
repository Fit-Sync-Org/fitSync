import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { plansAPI, planHelpers } from "../../src/api/plans";
import "./WeeklyPlan.css";

export default function WeeklyPlan({ plan: propPlan, compact = false }) {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(propPlan);
  const [loading, setLoading] = useState(!propPlan);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [weekDates, setWeekDates] = useState([]);

  useEffect(() => {
    if (!propPlan) {
      fetchCurrentPlan();
    } else {
      setPlan(propPlan);
      const dates = planHelpers.getWeekDates(propPlan.weekStart);
      setWeekDates(dates);

      const todayIndex = dates.findIndex((date) => date.isToday);
      setSelectedDay(todayIndex >= 0 ? todayIndex : 0);
    }
  }, [propPlan]);

  const fetchCurrentPlan = async () => {
    setLoading(true);
    const result = await plansAPI.getCurrentPlan();
    if (result.success) {
      setPlan(result.data);
      const dates = planHelpers.getWeekDates(result.data.weekStart);
      setWeekDates(dates);

      const todayIndex = dates.findIndex((date) => date.isToday);
      setSelectedDay(todayIndex >= 0 ? todayIndex : 0);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const getTodaysPlan = () => {
    return planHelpers.getCurrentDayPlan(plan);
  };

  if (loading) {
    return (
      <div className="weekly-plan loading">
        <div className="loading-spinner"></div>
        <p>Loading your weekly plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weekly-plan-page">
        <div className="plan-page-header">
          <button
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>
          <h1>My Plans</h1>
        </div>

        <div className="weekly-plan error">
          <div className="no-plan-content">
            <div className="no-plan-icon">📋</div>
            <h3>No Active Plan Found</h3>
            <p>You don't have an active plan for this week yet.</p>
            <p className="no-plan-subtitle">
              Your personalized plan will be automatically generated after
              completing your onboarding.
            </p>
            <div className="plan-actions">
              <button
                className="complete-profile-btn"
                onClick={() => navigate("/profile")}
              >
                Complete Profile
              </button>
              <button
                className="back-dashboard-btn"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!plan?.plan?.days || plan.plan.days.length === 0) {
    return (
      <div className="weekly-plan empty">
        <p>Plan data is not available</p>
      </div>
    );
  }

  // Compact view for dashboard
  if (compact) {
    const todaysPlan = getTodaysPlan();

    return (
      <div className="weekly-plan compact">
        <div className="plan-header">
          <h3>Today's Plan</h3>
          <div className="plan-status">
            <span className={`status-badge ${plan.status.toLowerCase()}`}>
              {plan.status}
            </span>
          </div>
        </div>
        {todaysPlan ? (
          <div className="today-plan">
            <div className="day-overview">
              <div className="calorie-target">
                <span className="number">{todaysPlan.totalCalories || 0}</span>
                <span className="label">Target Calories</span>
              </div>
              <div className="workout-count">
                <span className="number">
                  {todaysPlan.workouts?.length || 0}
                </span>
                <span className="label">Workouts</span>
              </div>
            </div>
            <div className="quick-meals">
              <h4>Today's Meals</h4>
              <div className="plan-meal-list compact">
                {todaysPlan.meals && !Array.isArray(todaysPlan.meals) ? (
                  <>
                    {todaysPlan.meals.breakfast && (
                      <div className="plan-meal-item compact">
                        <div className="plan-meal-title-row">
                          <div className="plan-meal-title">
                            <span className="plan-meal-name">
                              {todaysPlan.meals.breakfast.name || "Breakfast"}
                            </span>
                          </div>
                          <div className="plan-meal-meta">
                            <span className="plan-meal-calories">
                              {todaysPlan.meals.breakfast.calories || 0} kcal
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {todaysPlan.meals.lunch && (
                      <div className="plan-meal-item compact">
                        <div className="plan-meal-title-row">
                          <div className="plan-meal-title">
                            <span className="plan-meal-name">
                              {todaysPlan.meals.lunch.name || "Lunch"}
                            </span>
                          </div>
                          <div className="plan-meal-meta">
                            <span className="plan-meal-calories">
                              {todaysPlan.meals.lunch.calories || 0} kcal
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {todaysPlan.meals.dinner && (
                      <div className="plan-meal-item compact">
                        <div className="plan-meal-title-row">
                          <div className="plan-meal-title">
                            <span className="plan-meal-name">
                              {todaysPlan.meals.dinner.name || "Dinner"}
                            </span>
                          </div>
                          <div className="plan-meal-meta">
                            <span className="plan-meal-calories">
                              {todaysPlan.meals.dinner.calories || 0} kcal
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {Array.isArray(todaysPlan.meals.snacks) &&
                      todaysPlan.meals.snacks.length > 0 && (
                        <div className="plan-meal-item compact more">
                          <span>
                            +{todaysPlan.meals.snacks.length} snack
                            {todaysPlan.meals.snacks.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                  </>
                ) : (
                  <>
                    {todaysPlan.meals?.slice(0, 3).map((meal, index) => (
                      <div key={index} className="plan-meal-item compact">
                        <div className="plan-meal-title-row">
                          <div className="plan-meal-title">
                            <span className="plan-meal-name">{meal.name}</span>
                          </div>
                          <div className="plan-meal-meta">
                            <span className="plan-meal-calories">
                              {meal.calories} kcal
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {Array.isArray(todaysPlan.meals) &&
                      todaysPlan.meals.length > 3 && (
                        <div className="plan-meal-item compact more">
                          <span>+{todaysPlan.meals.length - 3} more meals</span>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
            <button
              className="view-full-btn"
              onClick={() => navigate("/plans")}
            >
              View Full Week Plan
            </button>
          </div>
        ) : (
          <div className="no-today-plan">
            <p>No plan available for today</p>
            <button
              className="view-full-btn"
              onClick={() => navigate("/plans")}
            >
              View Weekly Plan
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full page view (not compact)
  return (
    <div className="weekly-plan-page">
      <div className="plan-page-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <h1>My Plans</h1>
      </div>

      <div className="weekly-plan full">
        <div className="plan-header">
          <div className="plan-title">
            <h2>Weekly Fitness Plan</h2>
            <p>
              Week of{" "}
              {new Date(plan.weekStart).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="plan-status">
            <span className={`status-badge ${plan.status.toLowerCase()}`}>
              {plan.status}
            </span>
          </div>
        </div>
        <div className="week-overview">
          <div className="week-stats">
            <div className="stat">
              <span className="number">
                {plan.plan.totalWeeklyCalories || "N/A"}
              </span>
              <span className="label">Weekly Calories</span>
            </div>
            <div className="stat">
              <span className="number">{plan.plan.days.length}</span>
              <span className="label">Days Planned</span>
            </div>
            <div className="stat">
              <span className="number">
                {plan.plan.days.reduce(
                  (total, day) => total + (day.workouts?.length || 0),
                  0
                )}
              </span>
              <span className="label">Total Workouts</span>
            </div>
          </div>
        </div>
        <div className="week-navigation">
          {weekDates.map((dateInfo, index) => (
            <button
              key={dateInfo.date}
              className={`day-tab ${dateInfo.isToday ? "today" : ""} ${
                selectedDay === index ? "active" : ""
              }`}
              onClick={() => setSelectedDay(index)}
            >
              <span className="day-name">{dateInfo.dayName}</span>
              <span className="day-number">{dateInfo.dayNumber}</span>
            </button>
          ))}
        </div>
        <div className="days-container">
          {selectedDay !== null ? (
            <DayPlan
              day={plan.plan.days[selectedDay]}
              dateInfo={weekDates[selectedDay]}
            />
          ) : (
            <div className="select-day-prompt">
              <p>Select a day to view your plan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DayPlan({ day, dateInfo }) {
  if (!day) {
    return (
      <div className="day-plan empty">
        <h3>
          {dateInfo.dayName}, {dateInfo.dayNumber}
        </h3>
        <p>No plan available for this day</p>
      </div>
    );
  }

  return (
    <div className="day-plan">
      <div className="day-header">
        <h3>{day.dayOfWeek || dateInfo.dayName}</h3>
        <div className="day-focus">
          {day.focus && <span className="focus-badge">{day.focus}</span>}
        </div>
      </div>
      <div className="day-overview">
        <div className="overview-stat">
          <span className="number">{day.totalCalories || 0}</span>
          <span className="label">Calories</span>
        </div>
        <div className="overview-stat">
          <span className="number">{day.workouts?.length || 0}</span>
          <span className="label">Workouts</span>
        </div>
        <div className="overview-stat">
          <span className="number">
            {day.meals
              ? (day.meals.breakfast ? 1 : 0) +
                (day.meals.lunch ? 1 : 0) +
                (day.meals.dinner ? 1 : 0) +
                (day.meals.snacks?.length || 0)
              : 0}
          </span>
          <span className="label">Meals</span>
        </div>
      </div>
      <div className="day-content">
        {Array.isArray(day.workouts) && day.workouts.length > 0 && (
          <div className="wp-workouts-section">
            <h4>Workouts</h4>
            <div className="wp-workout-list">
              {day.workouts.map((workout, index) => {
                const isStringWorkout = typeof workout === "string";
                const workoutName = isStringWorkout
                  ? workout
                  : workout.name || workout.type || "Workout";

                return (
                  <div key={index} className="wp-workout-item">
                    <div className="wp-workout-header">
                      <div className="workout-title">
                        <span className="wp-workout-name">{workoutName}</span>
                        {!isStringWorkout &&
                          workout.type &&
                          workout.type !== workout.name && (
                            <span className="workout-type">
                              ({workout.type})
                            </span>
                          )}
                      </div>
                      {!isStringWorkout && (
                        <div className="workout-meta">
                          {workout.calories_burned && (
                            <span className="wp-workout-calories">
                              <i className="icon-fire"></i>{" "}
                              {workout.calories_burned} kcal
                            </span>
                          )}
                          {workout.rest_seconds && workout.rest_seconds > 0 && (
                            <span className="workout-rest">
                              <i className="icon-time"></i>{" "}
                              {workout.rest_seconds}s rest
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!isStringWorkout && (
                      <div className="workout-details">
                        <div className="workout-specs">
                          {workout.sets && (
                            <span className="workout-sets">
                              <strong>Sets:</strong> {workout.sets}
                            </span>
                          )}
                          {workout.reps && (
                            <span className="workout-reps">
                              <strong>Reps:</strong> {workout.reps}
                            </span>
                          )}
                          {workout.weight && workout.weight !== "N/A" && (
                            <span className="workout-weight">
                              <strong>Weight:</strong> {workout.weight}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {!isStringWorkout &&
                      workout.exercises &&
                      Array.isArray(workout.exercises) &&
                      workout.exercises.length > 0 && (
                        <div className="workout-exercises">
                          <h5 className="exercises-title">Exercises:</h5>
                          {workout.exercises.map((exercise, idx) => (
                            <div key={idx} className="exercise-item">
                              <div className="exercise-header">
                                <span className="exercise-name">
                                  {exercise.name}
                                </span>
                                <div className="exercise-details">
                                  {exercise.sets && exercise.reps ? (
                                    <span className="exercise-sets-reps">
                                      {exercise.sets} sets × {exercise.reps}{" "}
                                      reps
                                      {exercise.weight && (
                                        <span className="exercise-weight">
                                          {" "}
                                          @ {exercise.weight}lbs
                                        </span>
                                      )}
                                    </span>
                                  ) : exercise.duration ? (
                                    <span className="exercise-duration">
                                      {exercise.duration} minutes
                                    </span>
                                  ) : exercise.reps ? (
                                    <span className="exercise-reps">
                                      {exercise.reps} reps
                                      {exercise.weight && (
                                        <span className="exercise-weight">
                                          {" "}
                                          @ {exercise.weight}lbs
                                        </span>
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              {exercise.notes && (
                                <div className="exercise-notes">
                                  <i className="icon-info"></i> {exercise.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                    {!isStringWorkout && workout.notes && (
                      <div className="workout-notes">
                        <i className="icon-info"></i> {workout.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {day.meals && (
          <div className="plan-meals-section">
            <h4>Meals</h4>
            <div className="plan-meal-list">
              {day.meals.breakfast && (
                <div className="plan-meal-item">
                  <div className="plan-meal-title-row">
                    <div className="plan-meal-title">
                      <span className="plan-meal-name">
                        {day.meals.breakfast.name || "Breakfast"}
                      </span>
                    </div>
                    <div className="plan-meal-meta">
                      <span className="plan-meal-calories">
                        {day.meals.breakfast.calories || 0} kcal
                      </span>
                    </div>
                  </div>
                  {day.meals.breakfast.ingredients && (
                    <div className="plan-meal-ingredients">
                      {day.meals.breakfast.ingredients.join(", ")}
                    </div>
                  )}
                  {day.meals.breakfast.description && (
                    <div className="plan-meal-notes">
                      {day.meals.breakfast.description}
                    </div>
                  )}
                </div>
              )}

              {day.meals.lunch && (
                <div className="plan-meal-item">
                  <div className="plan-meal-title-row">
                    <div className="plan-meal-title">
                      <span className="plan-meal-name">
                        {day.meals.lunch.name || "Lunch"}
                      </span>
                    </div>
                    <div className="plan-meal-meta">
                      <span className="plan-meal-calories">
                        {day.meals.lunch.calories || 0} kcal
                      </span>
                    </div>
                  </div>
                  {day.meals.lunch.ingredients && (
                    <div className="plan-meal-ingredients">
                      {day.meals.lunch.ingredients.join(", ")}
                    </div>
                  )}
                  {day.meals.lunch.description && (
                    <div className="plan-meal-notes">
                      {day.meals.lunch.description}
                    </div>
                  )}
                </div>
              )}

              {day.meals.dinner && (
                <div className="plan-meal-item">
                  <div className="plan-meal-title-row">
                    <div className="plan-meal-title">
                      <span className="plan-meal-name">
                        {day.meals.dinner.name || "Dinner"}
                      </span>
                    </div>
                    <div className="plan-meal-meta">
                      <span className="plan-meal-calories">
                        {day.meals.dinner.calories || 0} kcal
                      </span>
                    </div>
                  </div>
                  {day.meals.dinner.ingredients && (
                    <div className="plan-meal-ingredients">
                      {day.meals.dinner.ingredients.join(", ")}
                    </div>
                  )}
                  {day.meals.dinner.description && (
                    <div className="plan-meal-notes">
                      {day.meals.dinner.description}
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(day.meals.snacks) &&
                day.meals.snacks.map((snack, idx) => (
                  <div key={idx} className="plan-meal-item snack">
                    <div className="plan-meal-title-row">
                      <div className="plan-meal-title">
                        <span className="plan-meal-name">
                          {snack.name || `Snack ${idx + 1}`}
                        </span>
                      </div>
                      <div className="plan-meal-meta">
                        <span className="plan-meal-calories">
                          {snack.calories || 0} kcal
                        </span>
                      </div>
                    </div>
                    {snack.description && (
                      <div className="plan-meal-notes">{snack.description}</div>
                    )}
                  </div>
                ))}

              {Array.isArray(day.meals) &&
                day.meals.length > 0 &&
                day.meals.map((meal, idx) => (
                  <div key={`legacy-${idx}`} className="plan-meal-item">
                    <div className="plan-meal-title-row">
                      <div className="plan-meal-title">
                        <span className="plan-meal-name">{meal.name}</span>
                      </div>
                      <div className="plan-meal-meta">
                        <span className="plan-meal-calories">
                          {meal.calories} kcal
                        </span>
                      </div>
                    </div>
                    {meal.foods && (
                      <div className="plan-meal-ingredients">
                        {meal.foods.join(", ")}
                      </div>
                    )}
                    {meal.macros && (
                      <div className="plan-meal-macros">
                        Protein: {meal.macros.protein}g, Carbs:{" "}
                        {meal.macros.carbs}g, Fat: {meal.macros.fat}g
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
