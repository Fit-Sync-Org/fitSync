import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MealHistory from "./MealHistory";
import WorkoutHistory from "./WorkoutHistory";
import "./Dashboard.css";
import Charts from "./Charts";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [today, setToday] = useState("");
  const [meals, setMeals] = useState({});
  const [workouts, setWorkouts] = useState({});
  const [showChatbot, setShowChatbot] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/auth/me`, { withCredentials: true })
      .then(({ data }) => setUser(data))
      .catch(() => {});

    const now = new Date();
    setToday(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }))
    const dateStr = now.toISOString().slice(0,10);
    axios.get(`${import.meta.env.VITE_API_URL}/api/meals?date=${dateStr}`, { withCredentials: true })
      .then(({ data }) => setMeals(data))
      .catch(() => {});
    axios.get(`${import.meta.env.VITE_API_URL}/api/exercises?date=${dateStr}`, { withCredentials: true })
      .then(({ data }) => setWorkouts(data))
      .catch(() => {});
  }, []);

  const logout = () => {
    axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`, {}, { withCredentials: true })
      .then(() => navigate('/login'));
  };
  const calculateDailyCalories = () => {
    let caloriesIn = 0;
    let caloriesOut = 0;

    Object.values(meals).flat().forEach((meal) => {
      caloriesIn += meal.calories || 0;
    });

    Object.values(workouts).flat().forEach((workout) => {
      caloriesOut += workout.calories || 0;
    });

    return { caloriesIn, caloriesOut };
  };

  const calculateMacros = () => {
    let carbs = 0,
    fat = 0,
    protein = 0,
    sodium = 0,
    sugar = 0;

    Object.values(meals).flat().forEach((meal) => {
      carbs += meal.carbs || 0;
      fat += meal.fat || 0;
      protein += meal.protein || 0;
      sodium += meal.sodium || 0;
      sugar += meal.sugar || 0;
    });

    return { carbs, fat, protein, sodium, sugar };
  };

  const handleNavigation = (path) => {
    navigate(path);
    setShowSidebar(false);
  };

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard....</p>
      </div>
    );
  }

  const { caloriesIn, caloriesOut } = calculateDailyCalories();
  const macros = calculateMacros();
  const calorieGoal = user.calorieGoal || 2000;
  const progressPercentage = Math.min((caloriesIn / calorieGoal) * 100, 100);

  return (
    <div className="dashboard-container">
      {showSidebar && (
        <div className="sidebar-overlay"
        onClick={() =>setShowSidebar(false)}>
        </div>)}

      {/* sidebar */}
      <nav className={`sidebar ${showSidebar ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <h2>FitSync</h2>
          <button
            className="sidebar-close"
            onClick={() => setShowSidebar(false)}> ×
          </button>
        </div>
        <div className="sidebar-content">
          <div className="nav-section">
            <h3>Navigation</h3>
            <ul className="nav-links">
              <li>
                <button onClick={() => handleNavigation("/dashboard")}>
                  <span>Dashboard</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation("/log-meal")}>
                  <span>Log Meal</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation("/log-workout")}>
                  <span>Log Workout</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation("/ai-history")}>
                  <span>AI History</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation("/notes")}>
                  <span>Notes</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation("/profile")}>
                  <span>Profile</span>
                </button>
              </li>
            </ul>
          </div>
          <div className="nav-section">
            <h3>Account</h3>
            <ul className="nav-links">
              <li>
                <button onClick={logout} className="logout-nav-btn">
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

{/* header */}
      <header className="dashboard-header">
        <button className="menu-toggle" onClick={() => setShowSidebar(true)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1 className="dashboard-title">FitSync Dashboard</h1>
        <button className="logout-btn" onClick={logout}>
          <span>←</span> Logout
        </button>
      </header>

      <main className="dashboard-main">
        {/* welcome section */}
        <section className="welcome-section">
          <div className="welcome-content">
            <div className="user-info">
              <div className="user-avatar">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Profile" />
                ) : (
                  <div className="avatar-placeholder">
                    {user.firstName?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div className="user-details">
                <h2>Welcome, {user.firstName || "Champ"}!</h2>
                <p className="welcome-date">{today}</p>
              </div>
            </div>
            <div className="streak-display">
              <div className="streak-icon">🔥</div>
              <div className="streak-info">
                <span className="streak-number">{user.streakCount || 0}</span>
                <span className="streak-label">Day Streak</span>
              </div>
            </div>
          </div>
        </section>

        {/* Calories Section */}
        <section className="calories-section">
          <div className="calories-header">
            <h3>Daily Calories</h3>
            <span className="calories-net">
              Net: {caloriesIn - caloriesOut} kcal
            </span>
          </div>
          <div className="calories-cards">
            <div className="calorie-card calories-in">
              <div className="calorie-icon">🍽️</div>
              <div className="calorie-info">
                <span className="calorie-number">{caloriesIn}</span>
                <span className="calorie-label">Calories In</span>
              </div>
            </div>
            <div className="calorie-card calories-out">
              <div className="calorie-icon">🔥</div>
              <div className="calorie-info">
                <span className="calorie-number">{caloriesOut}</span>
                <span className="calorie-label">Calories Out</span>
              </div>
            </div>
          </div>
          <div className="calorie-goal">
            <div className="goal-header">
              <span>Daily Goal Progress</span>
              <span>
                {caloriesIn}/{calorieGoal} kcal
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="goal-status">
              {caloriesIn >= calorieGoal
                ? ":tada: Goal reached!"
                : `${calorieGoal - caloriesIn} kcal remaining`}
            </div>
          </div>
        </section>

         {/* Macros section */}
        <section className="macros-section">
          <div className="macros-content">
            <div className="macros-breakdown">
              <h3>Macro Breakdown</h3>
              <div className="macro-cards">
                <div className="macro-card carbs">
                  <div className="macro-icon">🍞</div>
                  <div className="macro-info">
                    <span className="macro-amount">
                      {Math.round(macros.carbs)}g
                    </span>
                    <span className="macro-label">Carbs</span>
                  </div>
                </div>
                <div className="macro-card protein">
                  <div className="macro-icon">🥩</div>
                  <div className="macro-info">
                    <span className="macro-amount">
                      {Math.round(macros.protein)}g
                    </span>
                    <span className="macro-label">Protein</span>
                  </div>
                </div>
                <div className="macro-card fat">
                  <div className="macro-icon">🤓</div>
                  <div className="macro-info">
                    <span className="macro-amount">
                      {Math.round(macros.fat)}g
                    </span>
                    <span className="macro-label">Fat</span>
                  </div>
                </div>
                <div className="macro-card sodium">
                  <div className="macro-icon">🧂</div>
                  <div className="macro-info">
                    <span className="macro-amount">
                      {Math.round(macros.sodium)}mg
                    </span>
                    <span className="macro-label">Sodium</span>
                  </div>
                </div>
              </div>
            </div>
            <Charts meals={meals} workouts={workouts} />
          </div>
        </section>

        {/* meal history section */}
        <section className="meal-history-section">
          <MealHistory />
        </section>

        {/* workouthistory section */}
        <section className="workout-history-section">
          <WorkoutHistory />
        </section>

        {/* notes section */}
        <section className="notes-section">
          <div className="section-header">
            <h3>Recent Workout Notes</h3>
            <button className="view-all-btn" onClick={() => navigate("/log-workout")}>
              Add Notes
            </button>
          </div>
          <div className="notes-content">
            <div className="notes-list">
              <div className="note-item">
                <div className="note-date">Today</div>
                <div className="note-text">Great leg day! Increased squat weight by 10lbs.</div>
              </div>
              <div className="note-item">
                <div className="note-date">Yesterday</div>
                <div className="note-text">Cardio session felt easier today. Building endurance.</div>
              </div>
              <div className="note-item">
                <div className="note-date">2 days ago</div>
                <div className="note-text">Need to focus more on form during bench press.</div>
              </div>
            </div>
          </div>
        </section>
        <a href="../../src/chat.jsx"> chat </a>
      </main>

      <button
        className="chatbot-btn"
        onClick={() => setShowChatbot(!showChatbot)}
      >
        💬
      </button>

      {showChatbot && (

    <div className="chatbot-container">
          <div className="chatbot-content">
            <div className="chatbot-header">
              <h4>AI Fitness Trainer</h4>
              <button
                className="chatbot-close"
                onClick={() => setShowChatbot(false)}
              >
                ×
              </button>
            </div>
            <div className="chatbot-body">
              <div className="chatbot-message bot">
                <div className="message-content">
                  <p>
                    Hi! I'm your AI fitness trainer. How can I help you today?
                  </p>
                  <span className="message-time">Just now</span>
                </div>
              </div>
              <div className="chatbot-placeholder">
                <p>AI Chatbot functionality comming soon!</p>
                <span>
                  Advanced fitness coaching and personalized recommendations
                </span>
              </div>
            </div>
            <div className="chatbot-input">
              <input type="text" placeholder="Type your message..." disabled />
              <button disabled>Send</button>
            </div>
          </div>
      </div>
      )}
    </div>
  );
}
