export default function StepGender({ value, setValue }) {
  return (
    <div className="step">
        <label for="gender"> What is your gender? <span className="tooltip">ⓘ</span></label>
        <div className="options">
            <button
            className={value === "Male" ? "active" : ""}
            onClick={() => setValue("Male")}
            >
            Male
            </button>

            <button
            className={value === "Female" ? "active" : ""}
            onClick={() => setValue("Female")}
            >
            Female
            </button>

            <button
            className={value === "Other" ? "active" : ""}
            onClick={() => setValue("Other")}
            >
            Other
            </button>

            <button
            className={value === "Rather Not Say" ? "active" : ""}
            onClick={() => setValue("Rather Not Say")}
            >
            Rather Not Say
            </button>
        </div>
    </div>
  );
}
