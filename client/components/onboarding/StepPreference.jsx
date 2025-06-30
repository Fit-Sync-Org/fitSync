export default function StepPreference ({ value, setValue }) {
  return (
    <div className="step">
        <div className="input-wrapper preference">
            <label for="preference"> How do you prefer to structure your workouts?” <span className="tooltip">ⓘ</span></label>
            <div className="options">
                <button
                className={value === "More frequent, shorter sessions" ? "active" : ""}
                onClick={() => setValue("More frequent, shorter sessions")}
                >
                More frequent, shorter sessions
                </button>
                <button
                className={value === "Fewer, longer sessions" ? "active" : ""}
                onClick={() => setValue("Fewer, longer sessions")}
                >
                Fewer, longer sessions
                </button>
            </div>
        </div>
    </div>
  );
}
