import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [today, setToday] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/me`, { credentials: "include" })
      .then(res  => res.json())
      .then(data => setUser(data))
      .catch(() => {});

    const now = new Date();
    const formatted = now.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",});
    setToday(formatted);
  }, []);

  if (!user) return <p>Loading your profile…</p>;

  const logout = () => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).then(() => {
      nav("/login");
    });
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-banner">
        <h1>Welcome, {user.firstName}</h1>
      </header>

      <div className="dashboard-meta">
        <span className="dashboard-date">{today}</span>
        <span className="dashboard-streak">
          🔥 Streak: {user.dailyStreak || 0} days
        </span>
      </div>

      <div className="dashboard-actions">
        <button className="btn primary" onClick={() => nav("/log-meal")}>Log Meal</button>
        <button className="btn primary">Log Workout</button>
      </div>

      <div className="dashboard-summary">
        <div className="card">
          <h2>Calories In</h2>
          <p>{user.dailyCaloriesIn || 0} kcal</p>
        </div>
        <div className="card">
          <h2>Calories Burned</h2>
          <p>{user.dailyCaloriesOut || 0} kcal</p>
        </div>
        <div className="card">
          <h2>Meals Logged</h2>
          <p>{user.mealsCount || 0}</p>
        </div>
        <div className="card">
          <h2>Workouts Logged</h2>
          <p>{user.workoutsCount || 0}</p>
        </div>
      </div>

      <div className="dashboard-progress">
        <h2>Daily Calorie Goal</h2>
        <div className="progress-bar">
          <div
            className="progress"
            style={{
              width: typeof user.calorieGoal === 'number' && user.calorieGoal > 0
                ? `${(user.dailyCaloriesIn / user.calorieGoal) * 100}%`
                : "0%",
            }}
          />
        </div>
        <p>
          {user.dailyCaloriesIn || 0}/{user.calorieGoal || 0} kcal
        </p>
      </div>

      <div className="dashboard-activity">
        <h2>Recent Activity</h2>
        <ul>
          {user.recentActivities && user.recentActivities.length > 0 ? (
            user.recentActivities.map((act, idx) => (
              <li key={idx}>
                <span className="activity-time">
                  {new Date(act.time).toLocaleTimeString()}
                </span>
                <span className="activity-desc">{act.description}</span>
              </li>
            ))
          ) : (
            <li>No activity yet.</li>
          )}
        </ul>
      </div>

      <button className="chatbot-btn">💬</button>

      <footer className="dashboard-footer">
        <p>&copy; {new Date().getFullYear()} FitSync</p>
      </footer>
    </div>
  );
}
