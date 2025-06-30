export default function StepGoal({ value, setValue }) {
  return (
    <div className="step">
        <div className="input-wrapper goals">

            <label for="goals"> What are your primary fitness goals? <span> Select up to three(3) </span></label>
            <div className="options">
                <button
                className={value === "Weight Loss" ? "active" : ""}
                onClick={() => setValue("Weight Loss")}
                >
                Weight Loss
                </button>

                <button
                className={value === "Weight Gain" ? "active" : ""}
                onClick={() => setValue("Weight Gain")}
                >
                Healthy Weight Gain
                </button>

                <button
                className={value === "Muscle Building" ? "active" : ""}
                onClick={() => setValue("Muscle Building")}
                >
                Muscle Building
                </button>

                <button
                className={value === "Tone & Strengthening" ? "active" : ""}
                onClick={() => setValue("Tone & Strengthening")}
                >
                Tone & Strengthening
                </button>

                <button
                className={value === "Weight Maintenance" ? "active" : "Weight Maintenance"}
                onClick={() => setValue("")}
                >
                Weight Maintenance
                </button>

                <button
                className={value === "" ? "active" : ""}
                onClick={() => setValue("")}
                >
                Improve Eating Habits
                </button>

                <button
                className={value === "Health & Longevity" ? "active" : ""}
                onClick={() => setValue("Health & Longevity")}
                > Health & Longevity
                </button>

                <button
                className={value === "" ? "active" : ""}
                onClick={() => setValue("")}
                >
                Stress Management & Recovery
                </button>
            </div>

        </div>
    </div>
  );
}
