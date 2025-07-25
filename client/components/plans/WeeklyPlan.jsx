import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { plansAPI, planHelpers } from '../../src/api/plans';
import './WeeklyPlan.css';

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

      const todayIndex = dates.findIndex(date => date.isToday);
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

      const todayIndex = dates.findIndex(date => date.isToday);
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
            onClick={() => navigate('/dashboard')}
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
              Your personalized plan will be automatically generated after completing your onboarding.
            </p>
            <div className="plan-actions">
              <button
                className="complete-profile-btn"
                onClick={() => navigate('/profile')}
              >
                Complete Profile
              </button>
              <button
                className="back-dashboard-btn"
                onClick={() => navigate('/dashboard')}
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
              <div className="meal-list">
                {todaysPlan.meals?.slice(0, 3).map((meal, index) => (
                  <div key={index} className="meal-item">
                    <span className="meal-name">{meal.name}</span>
                    <span className="meal-calories">{meal.calories} kcal</span>
                  </div>
                ))}
                {todaysPlan.meals?.length > 3 && (
                  <div className="meal-item more">
                    <span>+{todaysPlan.meals.length - 3} more meals</span>
                  </div>
                )}
              </div>
            </div>
            <button
              className="view-full-btn"
              onClick={() => navigate('/plans')}
            >
              View Full Week Plan
            </button>
          </div>
        ) : (
          <div className="no-today-plan">
            <p>No plan available for today</p>
            <button
              className="view-full-btn"
              onClick={() => navigate('/plans')}
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
        <button
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>
        <h1>My Plans</h1>
      </div>

      <div className="weekly-plan full">
        <div className="plan-header">
          <div className="plan-title">
            <h2>Weekly Fitness Plan</h2>
            <p>
              Week of{' '}
              {new Date(plan.weekStart).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
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
                {plan.plan.totalWeeklyCalories || 'N/A'}
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
                  0,
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
              className={`day-tab ${dateInfo.isToday ? 'today' : ''} ${
                selectedDay === index ? 'active' : ''
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
            {day.meals ?
              (day.meals.breakfast ? 1 : 0) +
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
          <div className="workouts-section wp">
            <h4>Workouts</h4>
            <div className="workout-list">
              {day.workouts.map((workout, index) => {
                const isStringWorkout = typeof workout === 'string';
                const workoutName = isStringWorkout ? workout : (workout.name || workout.type || 'Workout');


                return (
                  <div key={index} className="workout-item">
                    <div className="workout-header">
                      <div className="workout-title">
                        <span className="workout-name">{workoutName}</span>
                        {!isStringWorkout && workout.type && workout.type !== workout.name && (
                          <span className="workout-type">({workout.type})</span>
                        )}
                      </div>
                      {!isStringWorkout && (
                        <div className="workout-meta">
                          {workout.calories_burned && (
                            <span className="workout-calories">
                              <i className="icon-fire"></i> {workout.calories_burned} kcal
                            </span>
                          )}
                          {workout.rest_seconds && workout.rest_seconds > 0 && (
                            <span className="workout-rest">
                              <i className="icon-time"></i> {workout.rest_seconds}s rest
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
                          {workout.weight && workout.weight !== 'N/A' && (
                            <span className="workout-weight">
                              <strong>Weight:</strong> {workout.weight}
                            </span>
                          )}
                        </div>
                      </div>
                    )}


                    {!isStringWorkout && workout.exercises && Array.isArray(workout.exercises) && workout.exercises.length > 0 && (
                      <div className="workout-exercises">
                        <h5 className="exercises-title">Exercises:</h5>
                        {workout.exercises.map((exercise, idx) => (
                          <div key={idx} className="exercise-item">
                            <div className="exercise-header">
                              <span className="exercise-name">{exercise.name}</span>
                              <div className="exercise-details">
                                {exercise.sets && exercise.reps ? (
                                  <span className="exercise-sets-reps">
                                    {exercise.sets} sets × {exercise.reps} reps
                                    {exercise.weight && (
                                      <span className="exercise-weight"> @ {exercise.weight}lbs</span>
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
                                      <span className="exercise-weight"> @ {exercise.weight}lbs</span>
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
        {Array.isArray(day.meals) && day.meals.length > 0 && (
          <div className="meals-section">
            <h4>Meals</h4>
            <div className="meal-list">
              {day.meals.map((meal, idx) => (
                <div key={idx} className="meal-item">
                  <div className="meal-header">
                    <span className="meal-name">{meal.name}</span>
                    <span className="meal-calories">{meal.calories} kcal</span>
                  </div>
                  {meal.foods && (
                    <div className="meal-foods">{meal.foods.join(', ')}</div>
                  )}
                  {meal.macros && (
                    <div className="meal-macros">
                     Protein: {meal.macros.protein}g, Carbs: {meal.macros.carbs}g, Fat: {meal.macros.fat}g
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


