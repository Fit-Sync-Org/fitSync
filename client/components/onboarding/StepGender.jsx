const StepGender = ({ value, setValue }) => {
  return (
    <div className="step">
        <label htmlFor="gender"> What is your gender? <span className="tooltip">ⓘ</span></label>
        <div className="options">
            <button
            className={value === "MALE" ? "active" : ""}
            onClick={() => setValue("MALE")}
            >
            Male
            </button>

            <button
            className={value === "FEMALE" ? "active" : ""}
            onClick={() => setValue("FEMALE")}
            >
            Female
            </button>

            <button
            className={value === "OTHER" ? "active" : ""}
            onClick={() => setValue("OTHER")}
            >
            Other
            </button>

            <button
            className={value === "RATHER Not Say" ? "active" : ""}
            onClick={() => setValue("RATHER_NOT_SAY")}
            >
            Rather Not Say
            </button>
        </div>
    </div>
  );
}

export default StepGender;
