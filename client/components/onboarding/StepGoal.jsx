import './onbooarding-styles/StepGoal.css'
const StepGoal= ({ value, setValue }) => {

  function handleToggleGoal(goal) {
    if (value.includes(goal)) {
      setValue(value.filter(g => g !== goal));
    } else if  (value.length < 3) {
      setValue([...value, goal]);
    }
  }

  return (
    <div className="step">
        <div className="input-wrapper goals">

            <label htmlFor="goals">
              What are your primary fitness goals?
              <span> Select up to three(3) </span>
            </label>
            <div className="options">
                <button
                className={value.includes("LOSE_WEIGHT") ? "active" : ""}
                onClick={() => handleToggleGoal("LOSE_WEIGHT")}
                >
                Weight Loss
                </button>

                <button
                className={value.includes("GAIN_WEIGHT") ? "active" : ""}
                onClick={() => handleToggleGoal("GAIN_WEIGHT")}
                >
                Healthy Weight Gain
                </button>

                <button
                className={value.includes("BUILD_MUSCLE") ? "active" : ""}
                onClick={() => handleToggleGoal("BUILD_MUSCLE")}
                >
                Muscle Building
                </button>

                <button
                className={value.includes("TONE_AND_STRENGTHEN") ? "active" : ""}
                onClick={() => handleToggleGoal("TONE_AND_STRENGTHEN")}
                >
                Tone & Strengthening
                </button>

                <button
                className={value.includes("MAINTAIN_WEIGHT") ? "active" : ""}
                onClick={() => handleToggleGoal("MAINTAIN_WEIGHT")}
                >
                Weight Maintenance
                </button>

                <button
                className={value.includes("EAT_HEALTHY") ? "active" : ""}
                onClick={() => handleToggleGoal("EAT_HEALTHY")}
                >
                Improve Eating Habits
                </button>

                <button
                className={value.includes("HEALTH_AND_LONGEVITY") ? "active" : ""}
                onClick={() => handleToggleGoal("HEALTH_AND_LONGEVITY")}
                > Health & Longevity
                </button>

                <button
                className={value.includes("MANAGE_STRESS_AND_RECOVERY") ? "active" : ""}
                onClick={() => handleToggleGoal("MANAGE_STRESS_AND_RECOVERY")}
                >
                Stress Management & Recovery
                </button>
            </div>

        </div>
    </div>
  );
}

export default StepGoal;
