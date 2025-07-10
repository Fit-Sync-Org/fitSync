import PropTypes from 'prop-types';
import './WorkoutHistory.css';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


export default function WorkoutHistory({ workouts }) {
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      try {
        const mockHistory = [
          {
            id: 1,
            date: new Date().toISOString().slice(0, 10),
            summary: "Cardio: Running, Strength: Push-ups, Flexibility: Yoga",
            totalCaloriesBurned: 450,
            totalDuration: 75,
            isCompleted: true,
          },
          {
            id: 2,
            date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
            summary: "Strength: Weight lifting, Cardio: Cycling",
            totalCaloriesBurned: 380,
            totalDuration: 60,
            isCompleted: true,
          },
          {
            id: 3,
            date: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
            summary: "Sports: Basketball, Flexibility: Stretching",
            totalCaloriesBurned: 320,
            totalDuration: 90,
            isCompleted: true,
          },
        ];
        setWorkoutHistory(mockHistory);
      } catch (error) {
        console.error("Failed to fetch workout history:", error);
      }
    };

    fetchWorkoutHistory();
  }, []);

  const handleEdit = (date) => {
    navigate(`/log-workout?date=${date}`);
  };

  const handleDelete = async (id, date) => {
    if (
      window.confirm(
        `Are you sure you want to delete all workouts for ${new Date(
          date
        ).toLocaleDateString()}?`
      )
    ) {
      try {
        setWorkoutHistory((prev) => prev.filter((entry) => entry.id !== id));
        alert("Workout log deleted successfully!");
      } catch (error) {
        console.error("Failed to delete workout log:", error);
        alert("Failed to delete workout log. Please try again.");
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="workout-history">
      <div className="section-header">
        <h3>Recent Workout History</h3>
        <button
          className="view-all-btn"
          onClick={() => navigate("/log-workout")}
        >
          Log New Workout
        </button>
      </div>

      {workoutHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💪🏽</div>
          <p>No workout history yet</p>
          <span>Start logging your workouts to see your history here</span>
        </div>
      ) : (
        <div className="history-list">
          {workoutHistory.map((entry) => (
            <div key={entry.id} className="history-item">
              <div className="history-main">
                <div className="history-date">
                  <span className="date-label">{formatDate(entry.date)}</span>
                  <span className="full-date">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="history-content">
                  <div className="workout-summary">
                    <p>{entry.summary}</p>
                  </div>
                  <div className="workout-stats">
                    <span className="calories-badge">
                      {entry.totalCaloriesBurned} kcal burned
                    </span>
                    <span className="duration-badge">
                      {entry.totalDuration} min
                    </span>
                    <span
                      className={`status-badge ${
                        entry.isCompleted ? "completed" : "incomplete"
                      }`}
                    >
                      {entry.isCompleted ? "✓ Complete" : "In Progress"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="history-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleEdit(entry.date)}
                  title="Edit this day's workouts"
                >
                  ✏️
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(entry.id, entry.date)}
                  title="Delete this day's workouts"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

WorkoutHistory.propTypes = {
  workouts: PropTypes.object.isRequired,
};
