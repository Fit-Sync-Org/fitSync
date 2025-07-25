import './onbooarding-styles/ProgressBar.css';

export default function ProgressBar({ currentStep, totalSteps }) {
  const percent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="progress-bar">
      <div
        className="progress-bar__fill"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
