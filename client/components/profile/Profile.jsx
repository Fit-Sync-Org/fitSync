import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";


export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/auth/me`, { withCredentials: true })
      .then(({ data }) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);


  const logout = () => {
    axios
      .post(
        `${import.meta.env.VITE_API_URL}/auth/logout`,
        {},
        { withCredentials: true }
      )
      .then(() => navigate("/login"));
  };


  const handleNavigation = (path) => {
    navigate(path);
    setShowSidebar(false);
  };


  const formatGoals = (goals) => {
    if (!goals || goals.length === 0) return "No goals set";


    const goalMap = {
      LOSE_WEIGHT: "Weight Loss",
      GAIN_WEIGHT: "Healthy Weight Gain",
      BUILD_MUSCLE: "Muscle Building",
      TONE_AND_STRENGTHEN: "Tone & Strengthening",
      MAINTAIN_WEIGHT: "Weight Maintenance",
      EAT_HEALTHY: "Improve Eating Habits",
      HEALTH_AND_LONGEVITY: "Health & Longevity",
      MANAGE_STRESS_AND_RECOVERY: "Stress Management & Recovery",
    };


    return goals.map((goal) => goalMap[goal] || goal).join(", ");
  };


  const formatGender = (gender) => {
    const genderMap = {
      MALE: "Male",
      FEMALE: "Female",
      OTHER: "Other",
      RATHER_NOT_SAY: "Rather Not Say",
    };
    return genderMap[gender] || gender;
  };


  const formatPreference = (preference) => {
    const prefMap = {
      SHORTER_MORE: "More frequent, shorter sessions",
      LONGER_FEWER: "Fewer, longer sessions",
    };
    return prefMap[preference] || preference;
  };


  const formatHeight = (heightCm) => {
    if (!heightCm) return "Not specified";
    const feet = Math.floor(heightCm / 30.48);
    const inches = Math.round((heightCm / 30.48 - feet) * 12);
    return `${heightCm} cm (${feet}'${inches}")`;
  };


  const formatWeight = (weightKg) => {
    if (!weightKg) return "Not specified";
    const pounds = Math.round(weightKg * 2.20462);
    return `${weightKg} kg (${pounds} lbs)`;
  };


  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }


  if (!user) {
    return (
      <div className="profile-error">
        <p>Unable to load profile. Please try again.</p>
        <button onClick={() => navigate("/dashboard")}>
          Return to Dashboard
        </button>
      </div>
    );
  }


  return (
    <div className="profile-container">
      {showSidebar && (
        <div
          className="sidebar-overlay"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}


      {/* Sidebar */}
      <nav className={`sidebar ${showSidebar ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <h2>FitSync</h2>
          <button
            className="sidebar-close"
            onClick={() => setShowSidebar(false)}
          >
            ×
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
                <button
                  onClick={() => handleNavigation("/profile")}
                  className="active"
                >
                  <span>Profile</span>
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


      {/* Header */}
      <header className="profile-header">
        <button className="menu-toggle" onClick={() => setShowSidebar(true)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1 className="profile-title">Profile</h1>
        <button className="logout-btn" onClick={logout}>
          <span>←</span> Logout
        </button>
      </header>


      {/* Main Content */}
      <main className="profile-main">
        {/* Profile Header Section */}
        <section className="profile-header-section">
          <div className="profile-avatar">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                {user.firstName?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h2>
              {user.firstName || "User"} {user.lastName || ""}
            </h2>
            <p className="profile-email">{user.email}</p>
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-number">{user.streakCount || 0}</span>
                <span className="stat-label">Day Streak</span>
              </div>
              <div className="stat">
                <span className="stat-number">{user.age || "N/A"}</span>
                <span className="stat-label">Age</span>
              </div>
            </div>
          </div>
        </section>


        {/* Personal Information */}
        <section className="profile-section">
          <h3>Personal Information</h3>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Full Name</label>
              <p>
                {user.firstName || "Not specified"} {user.lastName || ""}
              </p>
            </div>
            <div className="profile-field">
              <label>Age</label>
              <p>{user.age || "Not specified"}</p>
            </div>
            <div className="profile-field">
              <label>Gender</label>
              <p>{formatGender(user.gender)}</p>
            </div>
            <div className="profile-field">
              <label>Occupation</label>
              <p>{user.occupation || "Not specified"}</p>
            </div>
            <div className="profile-field">
              <label>Phone</label>
              <p>{user.phone || "Not specified"}</p>
            </div>
          </div>
        </section>


        {/* Fitness Goals */}
        <section className="profile-section">
          <h3>Fitness Goals</h3>
          <div className="profile-field">
            <label>Primary Goals</label>
            <p>{formatGoals(user.goals?.map((goal) => goal.name))}</p>
          </div>
        </section>


        {/* Physical Metrics */}
        <section className="profile-section">
          <h3>Physical Metrics</h3>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Height</label>
              <p>{formatHeight(user.heightCm)}</p>
            </div>
            <div className="profile-field">
              <label>Weight</label>
              <p>{formatWeight(user.weightKg)}</p>
            </div>
          </div>
        </section>


        {/* Workout Preferences */}
        <section className="profile-section">
          <h3>Workout Preferences</h3>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Weekly Availability</label>
              <p>
                {user.weeklyWorkoutHours
                  ? `${user.weeklyWorkoutHours} hours per week`
                  : "Not specified"}
              </p>
            </div>
            <div className="profile-field">
              <label>Session Preference</label>
              <p>{formatPreference(user.sessionPreference)}</p>
            </div>
          </div>
        </section>


        {/* Dietary Information */}
        <section className="profile-section">
          <h3>Dietary Information</h3>
          <div className="profile-field">
            <label>Dietary Restrictions</label>
            <p>{user.dietaryRestrictions || "None specified"}</p>
          </div>
        </section>


        {/* Account Information */}
        <section className="profile-section">
          <h3>Account Information</h3>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Member Since</label>
              <p>
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "Not available"}
              </p>
            </div>
            <div className="profile-field">
              <label>Last Login</label>
              <p>
                {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleDateString()
                  : "Not available"}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}



