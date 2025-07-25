import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanGenerationStatus from './PlanGenerationStatus';
import './PlanGeneration.css';

export default function PlanGeneration() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(userData => {
        setUser(userData);
        setLoading(false);
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  const handlePlanGenerated = () => {
    navigate('/plans');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="plan-generation-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="plan-generation-page">
      <div className="plan-generation-header">
        <button
          className="back-button"
          onClick={handleBackToDashboard}
        >
          ← Back to Dashboard
        </button>
        <div className="header-content">
          <h1>AI Plan Generation</h1>
          <p>Generate your personalized fitness and meal plan using AI</p>
        </div>
      </div>

      <div className="plan-generation-content">
        <div className="user-info-card">
          <h2>Your Profile</h2>
          <div className="profile-summary">
            <div className="profile-item">
              <span className="label">Name:</span>
              <span className="value">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="profile-item">
              <span className="label">Goal:</span>
              <span className="value">{user?.goal || 'Not specified'}</span>
            </div>
            <div className="profile-item">
              <span className="label">Activity Level:</span>
              <span className="value">{user?.activityLevel || 'Not specified'}</span>
            </div>
            <div className="profile-item">
              <span className="label">Fitness Level:</span>
              <span className="value">{user?.fitnessLevel || 'Not specified'}</span>
            </div>
          </div>
          {(!user?.goal || !user?.activityLevel || !user?.fitnessLevel) && (
            <div className="incomplete-profile-warning">
              <p>Your profile seems incomplete. Consider updating your profile for better AI recommendations.</p>
              <button
                className="update-profile-btn"
                onClick={() => navigate('/profile')}
              >
                Update Profile
              </button>
            </div>
          )}
        </div>

        <div className="generation-section">
          <PlanGenerationStatus
            compact={false}
            onPlanGenerated={handlePlanGenerated}
          />
        </div>

        <div className="navigation-section">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button
              className="action-btn primary"
              onClick={() => navigate('/plans')}
            >
              View My Current Plan
            </button>
            <button
              className="action-btn secondary"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="info-section">
          <h3>What to Expect</h3>
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">🎯</div>
              <h4>Personalized Plans</h4>
              <p>AI-generated meal and workout plans tailored to your specific goals, preferences, and fitness level.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">📅</div>
              <h4>7-Day Schedule</h4>
              <p>Complete weekly plan with daily workouts, meal suggestions, and calorie targets.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">📊</div>
              <h4>Progress Tracking</h4>
              <p>Built-in progress monitoring with smart notifications to keep you on track.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
