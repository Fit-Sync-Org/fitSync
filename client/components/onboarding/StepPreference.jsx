const StepPreference = ({ value, setValue }) => {
  return (
    <div className="step">
      <div className="input-wrapper preference">
        <label htmlFor="preference">
          How do you prefer to structure your workouts? <span className="tooltip">ⓘ</span>
        </label>
        <div className="options">
          <button
            className={value === "SHORTER_MORE" ? "active" : ""}
            onClick={() => setValue("SHORTER_MORE")}
          >
            More frequent, shorter sessions
          </button>
          <button
            className={value === "LONGER_FEWER" ? "active" : ""}
            onClick={() => setValue("LONGER_FEWER")}
          >
            Fewer, longer sessions
          </button>
        </div>
      </div>
    </div>
  );
}

export default StepPreference;
