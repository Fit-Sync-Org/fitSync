import { useState, useEffect } from 'react';
import { plansAPI } from '../../src/api/plans';
import { generateAndSavePlan } from '../../src/utils/planGeneration';
import './PlanGenerationStatus.css';

export default function PlanGenerationStatus({
  compact = false, onPlanGenerated }) {
  const [user, setUser] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [error, setError] = useState(null);
  const [hasCurrentPlan, setHasCurrentPlan] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    checkCurrentPlan();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const checkCurrentPlan = async () => {
    try {
      const result = await plansAPI.getCurrentPlan();
      setHasCurrentPlan(result.success && result.data);
    } catch {
      setHasCurrentPlan(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!user) {
      setError('User profile not loaded. Please refresh the page.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);
    setGenerationProgress(0);
    setGenerationStep('Initializing...');

    try {
      setGenerationStep('Analyzing your profile...');
      setGenerationProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationStep('Generating your personalized plan with AI...');
      setGenerationProgress(40);

      const result = await generateAndSavePlan(user);

      if (result.success) {
        setGenerationStep('Validating and optimizing your plan...');
        setGenerationProgress(80);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setGenerationStep('Plan generated successfully!');
        setGenerationProgress(100);
        setSuccess(true);
        setHasCurrentPlan(true);

        if (onPlanGenerated) {
          onPlanGenerated();
        }

        setTimeout(() => {
          setIsGenerating(false);
          setGenerationProgress(0);
          setGenerationStep('');
        }, 2000);

      } else {
        throw new Error(result.error || 'Failed to generate plan');
      }

    } catch (err) {
      console.error('Plan generation failed:', err);
      setError(err.message || 'Failed to generate plan');
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStep('');
    }
  };

  const handleRegeneratePlan = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai-plans/regenerate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setHasCurrentPlan(false);
        await handleGeneratePlan();
      } else {
        throw new Error('Failed to clear existing plan');
      }
    } catch (err) {
      setError(err.message || 'Failed to regenerate plan');
    }
  };

  if (compact) {
    return (
      <div className="plan-generation-status compact">
        <div className="status-header">
          <h3>AI Plan Generation</h3>
          {isGenerating && (
            <div className="status-badge generating" />
          )}
        </div>

        {isGenerating ? (
          <div className="generation-progress">
            <div className="progress-info">
              <span className="progress-label">{generationStep}</span>
              <span className="progress-percentage">{Math.round(generationProgress)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="generation-controls">
            {error && (
              <div className="generation-error">
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="generation-success">
                <p>✅ Plan generated successfully!</p>
              </div>
            )}

            {hasCurrentPlan ? (
              <div className="plan-exists">
                <p>✅ You have an active plan for this week</p>
                <button
                  onClick={handleRegeneratePlan}
                  className="regenerate-btn secondary"
                  disabled={isGenerating}
                >
                  Generate New Plan
                </button>
              </div>
            ) : (
              <div className="no-plan">
                <p>No active plan found</p>
                <button
                  onClick={handleGeneratePlan}
                  className="generate-btn primary"
                  disabled={isGenerating || !user}
                >
                  Generate AI Plan
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="plan-generation-status full">
      <div className="status-header">
        <div className="header-left">
          <h2>AI Plan Generation</h2>
          <p>Powered by Firebase Vertex AI for personalized fitness plans</p>
        </div>
        <div className="header-actions">
          <button
            onClick={checkCurrentPlan}
            className="refresh-btn"
            disabled={isGenerating}
          >
            Refresh
          </button>
        </div>
      </div>

      {isGenerating ? (
        <div className="active-generation">
          <h3>Generating Your Plan</h3>
          <div className="generation-card">
            <div className="generation-header">
              <div className="generation-icon">🤖</div>
              <div className="generation-details">
                <h4>AI Plan Generation</h4>
                <p>{generationStep}</p>
              </div>
            </div>

            <div className="generation-progress-full">
              <div className="progress-header">
                <span>Generation Progress</span>
                <span>{Math.round(generationProgress)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <div className="progress-steps">
                <div className={`step ${generationProgress >= 20 ? 'completed' : ''}`}>
                  <span className="step-label">Analyzing Profile</span>
                </div>
                <div className={`step ${generationProgress >= 40 ? 'completed' : generationProgress >= 20 ? 'active' : ''}`}>
                  <span className="step-label">AI Generation</span>
                </div>
                <div className={`step ${generationProgress >= 80 ? 'completed' : generationProgress >= 40 ? 'active' : ''}`}>
                  <span className="step-label">Validation</span>
                </div>
                <div className={`step ${generationProgress >= 100 ? 'completed' : generationProgress >= 80 ? 'active' : ''}`}>
                  <span className="step-label">Saving Plan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-active-generation">
          {error ? (
            <div className="generation-error">
              <h3>Generation Error</h3>
              <p>{error}</p>
              <button onClick={() => setError(null)} className="retry-btn">
                Clear Error
              </button>
            </div>
          ) : success ? (
            <div className="generation-success">
              <h3>✅ Plan Generated Successfully!</h3>
              <p>Your personalized AI plan has been created and saved.</p>
              <div className="success-actions">
                <button onClick={handleRegeneratePlan} className="regenerate-btn secondary">
                  Generate New Plan
                </button>
              </div>
            </div>
          ) : hasCurrentPlan ? (
            <div className="plan-exists">
              <h3>✅ Active Plan Found</h3>
              <p>You have an active plan for this week</p>
              <div className="plan-actions">
                <button onClick={handleRegeneratePlan} className="regenerate-btn secondary" disabled={!user}>
                  Generate New Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="no-plan">
              <h3>No Active Plan</h3>
              <p>Generate your personalized AI fitness and meal plan</p>
              <div className="generation-actions">
                <button onClick={handleGeneratePlan} className="generate-btn primary" disabled={!user}>
                  Generate AI Plan
                </button>
              </div>
              {!user && (
                <p className="loading-note">Loading user profile...</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
