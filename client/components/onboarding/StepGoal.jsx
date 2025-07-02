export default function StepGoal({ value, setValue }) {

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

            <label for="goals"> What are your primary fitness goals? <span> Select up to three(3) </span></label>
            <div className="options">
                <button
                className={value === "LOSE_WEIGHT" ? "active" : ""}
                onClick={() => setValue("LOSE_WEIGHT")}
                >
                Weight Loss
                </button>

                <button
                className={value === "GAIN_WEIGHT" ? "active" : ""}
                onClick={() => setValue("Weight Gain")}
                >
                Healthy Weight Gain
                </button>

                <button
                className={value === "BUILD_MUSCLE" ? "active" : ""}
                onClick={() => setValue("Muscle Building")}
                >
                Muscle Building
                </button>

                <button
                className={value === "TONE_AND_STRENGTHEN" ? "active" : ""}
                onClick={() => setValue("Tone & Strengthening")}
                >
                Tone & Strengthening
                </button>

                <button
                className={value === "MAINTAIN_WEIGHT" ? "active" : ""}
                onClick={() => setValue("MAINTAIN_WEIGHT")}
                >
                Weight Maintenance
                </button>

                <button
                className={value === "EAT_HEALTHY" ? "active" : ""}
                onClick={() => setValue("EAT_HEALTHY")}
                >
                Improve Eating Habits
                </button>

                <button
                className={value === "HEALTH_AND_LONGEVITY" ? "active" : ""}
                onClick={() => setValue("HEALTH_AND_LONGEVITY")}
                > Health & Longevity
                </button>

                <button
                className={value === "MANAGE_STRESS_AND_RECOVERY" ? "active" : ""}
                onClick={() => setValue("MANAGE_STRESS_AND_RECOVERY")}
                >
                Stress Management & Recovery
                </button>
            </div>

        </div>
    </div>
  );
}
