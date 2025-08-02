import "./onbooarding-styles/OnboardingLoadingScreen.css";

export default function OnboardingLoadingScreen({
  generationProgress = 0,
  generationStep = "Initializing...",
}) {
  return (
    <div className="plan-generation-overlay">
      <div className="plan-generation-modal">
        <h2>Creating Your Personalized Plan</h2>
        <p className="plan-generation-text">
          Our AI is analyzing your profile and generating a customized fitness
          and meal plan just for you. This may take a moment.
        </p>

        <div className="plan-generation-tracker">
          <div className="plan-generation-header">
            <span className="plan-generation-current-step">
              {generationStep}
            </span>
            <span className="plan-generation-percent">
              {Math.round(generationProgress)}%
            </span>
          </div>
          <div className="plan-generation-bar">
            <div
              className="plan-generation-bar-fill"
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="plan-generation-phases">
          <div
            className={`plan-generation-phase ${
              generationProgress >= 20 ? "phase-completed" : ""
            }`}
          >
            <div className="phase-dot"></div>
            <span className="phase-name">Analyzing Profile</span>
          </div>
          <div
            className={`plan-generation-phase ${
              generationProgress >= 40
                ? "phase-completed"
                : generationProgress >= 20
                ? "phase-active"
                : ""
            }`}
          >
            <div className="phase-dot"></div>
            <span className="phase-name">AI Generation</span>
          </div>
          <div
            className={`plan-generation-phase ${
              generationProgress >= 80
                ? "phase-completed"
                : generationProgress >= 40
                ? "phase-active"
                : ""
            }`}
          >
            <div className="phase-dot"></div>
            <span className="phase-name">Validation</span>
          </div>
          <div
            className={`plan-generation-phase ${
              generationProgress >= 100
                ? "phase-completed"
                : generationProgress >= 80
                ? "phase-active"
                : ""
            }`}
          >
            <div className="phase-dot"></div>
            <span className="phase-name">Finalizing</span>
          </div>
        </div>

        <p className="plan-generation-info">
          Your plan will include personalized workouts and meals based on your
          goals and preferences.
        </p>
      </div>
    </div>
  );
}
