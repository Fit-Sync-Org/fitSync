import './WorkoutHistory.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


export default function WorkoutHistory() {
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [allWorkoutHistory, setAllWorkoutHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/exercises/completed-entries`, {
          withCredentials: true,
          params: { days: 30 },
        });

        if (response.data) {
          setAllWorkoutHistory(response.data);

          setWorkoutHistory(response.data.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch workout history:', error);
        setWorkoutHistory([]);
        setAllWorkoutHistory([]);
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
          date,
        ).toLocaleDateString()}?`,
      )
    ) {
      try {
        setWorkoutHistory((prev) => prev.filter((entry) => entry.id !== id));
        alert('Workout log deleted successfully!');
      } catch (error) {
        console.error('Failed to delete workout log:', error);
        alert('Failed to delete workout log. Please try again.');
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
    <div className="workout-history">
      <div className="section-header">
        <h3>Workout History</h3>
        <button className="view-all-btn" onClick={() => setShowModal(true)}>
          View All
        </button>
      </div>

      {workoutHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💪🏽</div>
          <p>No completed workout entries yet</p>
          <span>Log workouts and click "Complete This Entry" to see your history here</span>
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
                        entry.isCompleted ? 'completed' : 'incomplete'
                      }`}
                    >
                      {entry.isCompleted ? '✓ Complete' : 'In Progress'}
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
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>All Workout History</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {allWorkoutHistory.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💪🏽</div>
                  <p>No workout history found</p>
                </div>
              ) : (
                <div className="history-list modal-list">
                  {allWorkoutHistory.map((entry) => (
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
                                entry.isCompleted ? 'completed' : 'incomplete'
                              }`}
                            >
                              {entry.isCompleted ? '✓ Complete' : '⏳ In Progress'}
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
