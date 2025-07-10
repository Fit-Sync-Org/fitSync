import PropTypes from 'prop-types';
import './MealHistory.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function MealHistory({ meals }) {
  const [mealHistory, setMealHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMealHistory = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);


        const mockMealHistory = [
          {
          id: 1,
          date: new Date().toISOString().slice(0, 10),
          summary: "Breakfast: Oatmeal with banana and peanut butter",
          totalCalories: 500,
          isCompleted: true,
          },
          {
          id: 2,
          date: new Date(Date.now()-864000000).toISOString().slice(0, 10),
          summary: "Breakfast: Oatmeal with banana and peanut butter",
          totalCalories: 500,
          isCompleted: true,
          },
          {
          id: 3,
          date: new Date(Date.now()-172800000).toISOString().slice(0, 10),
          summary: "Breakfast: Oatmeal with banana and peanut butter",
          totalCalories: 500,
          isCompleted: true,
          },
        ];
        setMealHistory(mockMealHistory);
        } catch (error) {
          console.error('Error fetching meal history:', error);
        }
    };
    fetchMealHistory();

    }, []);

    const handleEdit = (date) => {
      navigate(`/meal/${date}`);
    };

    const handleDelete = async (id, date) => {
    if (
      window.confirm(
        `Are you sure you want to delete all meals for ${new Date(
          date
        ).toLocaleDateString()}?`
      )
    ) {
      try {
        setMealHistory((prev) => prev.filter((entry) => entry.id !== id));
        alert("Meal log deleted successfully!");
      } catch (error) {
        console.error("Failed to delete meal log:", error);
        alert("Failed to delete meal log. Please try again.");
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
    <div className="meal-history">
      <div className="section-header">
        <h3>Recent Meal History</h3>
        <button className="view-all-btn" onClick={() => navigate("/log-meal")}>
          Log New Meal
        </button>
      </div>

      {!mealHistory || mealHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <p>No meal history yet</p>
          <span>Start logging your meals to see your history here</span>
        </div>
      ) : (
        <div className="history-list">
          {mealHistory.map((entry) => (
            <div key={entry.id} className="history-item">
              <div className="history-main">
                <div className="history-date">
                  <span className="date-label">{formatDate(entry.date)}</span>
                  <span className="full-date">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="history-content">
                  <div className="meal-summary">
                    <p>{entry.summary}</p>
                  </div>
                  <div className="meal-stats">
                    <span className="calories-badge">
                      {entry.totalCalories} kcal
                    </span>
                    <span
                      className={`status-badge ${
                        entry.isCompleted ? "completed" : "incomplete"
                      }`}
                    >
                      {entry.isCompleted ? "✓ Complete" : ":hourglass_flowing_sand: In Progress"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="history-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleEdit(entry.date)}
                  title="Edit this day's meals"
                >
                  ✏️
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(entry.id, entry.date)}
                  title="Delete this day's meals"
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

MealHistory.propTypes = {
  meals: PropTypes.object.isRequired,
};
