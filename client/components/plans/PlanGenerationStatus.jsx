import { useState, useEffect } from "react";
import { plansAPI } from "../../src/api/plans";
import "./PlanGenerationStatus.css";

export default function PlanGenerationStatus({
  compact = false, onPlanGenerated,}) {
  const [generationStatus, setGenerationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasCurrentPlan, setHasCurrentPlan] = useState(false);

  useEffect(() => {
    checkGenerationStatus();
    checkCurrentPlan();
  }, []);

  useEffect(() => {
    let interval;
    if (polling) {
      interval = setInterval(() => {
        checkGenerationStatus();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [polling]);

  const checkGenerationStatus = async () => {
    const result = await plansAPI.getGenerationStatus();
    if (result.success) {
      setGenerationStatus(result.data);
      if (result.data.activeJobs && result.data.activeJobs.length > 0) {
        setPolling(true);
        updateProgress(result.data.activeJobs[0]);
      } else {
        setPolling(false);
        setProgress(0);
      }
    } else {
      setError(result.error);
      setPolling(false);
    }
  };

  const checkCurrentPlan = async () => {
    try {
      const result = await plansAPI.getCurrentPlan();
      setHasCurrentPlan(result.success && result.data);
    } catch (err) {
      setHasCurrentPlan(false);
    }
  };

  const updateProgress = (job) => {
    if (job.status === "active") {
      const startTime = new Date(job.processedOn || job.timestamp).getTime();
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const estimatedDuration = 30000;
      const percent = Math.min((elapsed / estimatedDuration) * 100, 95);
      setProgress(percent);
    } else if (job.status === "completed") {
      setProgress(100);
      setPolling(false);
      setHasCurrentPlan(true);
      if (onPlanGenerated) onPlanGenerated();
    } else if (job.status === "failed") {
      setPolling(false);
      setError("Plan generation failed");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
      case "waiting":
        return "#FFC107";
      case "completed":
        return "#ADC97E";
      case "failed":
        return "#FF6B6B";
      default:
        return "#8A9A8A";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Generating Plan...";
      case "waiting":
        return "Queued for Generation";
      case "completed":
        return "Plan Generated Successfully";
      case "failed":
        return "Generation Failed";
      default:
        return "Ready to Generate";
    }
  };

  const hasActiveJob =
    generationStatus?.activeJobs && generationStatus.activeJobs.length > 0;
  const currentJob = hasActiveJob ? generationStatus.activeJobs[0] : null;

  if (compact) {
    return (
      <div className="plan-generation-status compact">
        <div className="status-header">
          <h3>AI Plan Generation</h3>
          {hasActiveJob && (
            <div
              className="status-badge"
              style={{ backgroundColor: getStatusColor(currentJob.status) }}
            />
          )}
        </div>
        {hasActiveJob ? (
          <div className="generation-progress">
            <div className="progress-info">
              <span className="progress-label">
                {getStatusLabel(currentJob.status)}
              </span>
              {currentJob.status === "active" && (
                <span className="progress-percentage">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
            {currentJob.status === "active" && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            <div className="job-details">
              <span className="job-type">{currentJob.name}</span>
              <span className="job-time">
                Started{" "}
                {new Date(
                  currentJob.processedOn || currentJob.timestamp
                ).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="no-active-generation">
            {error ? (
              <div className="generation-error">
                <p>{error}</p>
                <button onClick={checkGenerationStatus} className="retry-btn">
                  Refresh Status
                </button>
              </div>
            ) : hasCurrentPlan ? (
              <div className="plan-exists">
                <p>✅ You have an active plan for this week</p>
                <p className="plan-note">Plans are automatically generated after onboarding</p>
              </div>
            ) : (
              <div className="no-plan">
                <p>No active plan found</p>
                <p className="plan-note">Complete your onboarding to get your first AI-generated plan</p>
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
          <p>Powered by Gemini AI for personalized fitness plans</p>
        </div>
        <div className="header-actions">
          <button
            onClick={checkGenerationStatus}
            className="refresh-btn"
            disabled={polling}
          >
            Refresh
          </button>
        </div>
      </div>
      {generationStatus && (
        <div className="generation-overview">
          <div className="overview-stats">
            <div className="stat">
              <span className="stat-number">
                {generationStatus.totalJobs || 0}
              </span>
              <span className="stat-label">Total Plans Generated</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {generationStatus.activeJobs?.length || 0}
              </span>
              <span className="stat-label">Active Jobs</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {generationStatus.completedJobs || 0}
              </span>
              <span className="stat-label">Completed Today</span>
            </div>
          </div>
        </div>
      )}
      {hasActiveJob ? (
        <div className="active-generation">
          <h3>Current Generation</h3>
          <div className="job-card">
            <div className="job-header">
              <div className="job-info">
                <div
                  className="job-icon"
                  style={{ color: getStatusColor(currentJob.status) }}
                />
                <div className="job-details">
                  <h4>{currentJob.name}</h4>
                  <p>{getStatusLabel(currentJob.status)}</p>
                </div>
              </div>
              <div className="job-meta">
                <span className="job-id">Job #{currentJob.id}</span>
                <span className="job-time">
                  {new Date(
                    currentJob.processedOn || currentJob.timestamp
                  ).toLocaleString()}
                </span>
              </div>
            </div>
            {currentJob.status === "active" && (
              <div className="job-progress">
                <div className="progress-header">
                  <span>Generation Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="progress-steps">
                  <div className="step completed">
                    <span className="step-label">Analyzing Profile</span>
                  </div>
                  <div className="step active">
                    <span className="step-label">AI Generation</span>
                  </div>
                  <div className="step">
                    <span className="step-label">Validation</span>
                  </div>
                  <div className="step">
                    <span className="step-label">Saving Plan</span>
                  </div>
                </div>
              </div>
            )}
            {currentJob.status === "failed" && currentJob.failedReason && (
              <div className="job-error">
                <p>{currentJob.failedReason}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-active-generation">
          {error ? (
            <div className="generation-error">
              <h3>Generation Error</h3>
              <p>{error}</p>
              <button onClick={checkGenerationStatus} className="retry-btn">
                Refresh Status
              </button>
            </div>
          ) : hasCurrentPlan ? (
            <div className="plan-exists">
              <p>✅ You have an active plan for this week</p>
              <p className="plan-note">Plans are automatically generated after onboarding</p>
            </div>
          ) : (
            <div className="no-plan">
              <p>No active plan found</p>
              <p className="plan-note">Complete your onboarding to get your first AI-generated plan</p>
            </div>
          )}
        </div>
      )}
      {generationStatus?.recentJobs?.length > 0 && (
        <div className="recent-generations">
          <h3>Recent Generations</h3>
          <div className="jobs-list">
            {generationStatus.recentJobs.map((job) => (
              <div key={job.id} className="job-item">
                <div
                  className="job-icon"
                  style={{ color: getStatusColor(job.status) }}
                />
                <div className="job-content">
                  <div className="job-name">{job.name}</div>
                  <div className="job-timestamp">
                    {new Date(job.timestamp).toLocaleString()}
                  </div>
                </div>
                <div
                  className="job-status"
                  style={{ color: getStatusColor(job.status) }}
                >
                  {getStatusLabel(job.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
