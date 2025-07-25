import './MealHistory.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function MealHistory() {
  const [mealHistory, setMealHistory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [allMealHistory, setAllMealHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMealHistory = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/meals/completed-entries`, {
          withCredentials: true,
          params: { days: 30 },
        });

        if (response.data) {
          setAllMealHistory(response.data);
          setMealHistory(response.data.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching meal history:', error);
        setMealHistory([]);
        setAllMealHistory([]);
      }
    };

    fetchMealHistory();
  }, []);

  const handleEdit = (date) => {
    navigate(`/log-meal?date=${date}`);
  };

  const handleDelete = async (id, date) => {
    if (
      window.confirm(
        `Are you sure you want to delete all meals for ${new Date(
          date,
        ).toLocaleDateString()}?`,
      )
    ) {
      try {
        setMealHistory((prev) => prev.filter((entry) => entry.id !== id));
        alert('Meal log deleted successfully!');
      } catch (error) {
        console.error('Failed to delete meal log:', error);
        alert('Failed to delete meal log. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div className="meal-history">
      <div className="section-header">
        <h3>Meal History</h3>
        <button className="view-all-btn" onClick={() => setShowModal(true)}>
          View All
        </button>
      </div>

      {!mealHistory || mealHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <p>No completed meal entries yet</p>
          <span>Log meals and click "Complete This Entry" to see your history here</span>
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
                        entry.isCompleted ? 'completed' : 'incomplete'
                      }`}
                    >
                      {entry.isCompleted ? '✓ Complete' : '⏳ In Progress'}
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

      {/* Modal meal history */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>All Meal History</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {allMealHistory.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🍽️</div>
                  <p>No meal history found</p>
                </div>
              ) : (
                <div className="history-list modal-list">
                  {allMealHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="history-item clickable"
                      onClick={() => {
                        handleEdit(entry.date);
                        setShowModal(false);
                      }}
                    >
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
                                entry.isCompleted ? 'completed' : 'incomplete'
                              }`}
                            >
                              {entry.isCompleted ? 'Complete' : 'In Progress'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
