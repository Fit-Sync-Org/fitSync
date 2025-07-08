/* client/src/pages/Dashboard.jsx */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import MealHistory from "./MealHistory";
import WorkoutHistory from "./WorkoutHistory";
import MacroSummary from "./MacroSummary";
import "./Dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [today, setToday] = useState("");
  const [meals, setMeals] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // fetch user profile
    axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, { withCredentials: true })
      .then(({ data }) => setUser(data))
      .catch(() => {});

    // date
    const now = new Date();
    setToday(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));

    // fetch today's meals and workouts
    const dateStr = now.toISOString().slice(0,10);
    axios.get(`${import.meta.env.VITE_API_URL}/api/meals?date=${dateStr}`, { withCredentials: true })
      .then(({ data }) => setMeals(data))
      .catch(() => {});
    axios.get(`${import.meta.env.VITE_API_URL}/api/exercises?date=${dateStr}`, { withCredentials: true })
      .then(({ data }) => setWorkouts(data))
      .catch(() => {});
  }, []);

  if (!user) return <div className="dashboard-loading">Loading dashboard...</div>;

  const logout = () => {
    axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`, {}, { withCredentials: true })
      .then(() => navigate('/login'));
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <header className="dashboard-header">
        <div className="welcome">
          <img src={user.avatarUrl} alt="Avatar" className="avatar" />
          <div>
            <h1>Welcome, {user.firstName}</h1>
            <div className="subtext">{today} • 🔥 Streak: {user.dailyStreak || 0} days</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </header>

      <section className="calorie-section">
        <div className="calorie-card">
          <h3>Calories In</h3>
          <p>{user.dailyCaloriesIn || 0} kcal</p>
        </div>
        <div className="calorie-card">
          <h3>Calories Out</h3>
          <p>{user.dailyCaloriesOut || 0} kcal</p>
        </div>
      </section>

      <MacroSummary meals={meals} workouts={workouts} />

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

      <div className="chatbot-container">
        <button className="chatbot-btn">💬 Chat with Trainer</button>
      </div>
    </div>
  );
}
