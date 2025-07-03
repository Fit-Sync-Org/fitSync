const StepGender = ({ value, setValue }) => {
  return (
    <div className="step">
      <h2 className="step-header">
        Gender
      </h2>
        <label className="step-label" htmlFor="gender">
          What is your gender?
          <span className="tooltip" data-tooltip="Male and female sex hormones affect metabolism. We calculate calorie needs differently depending on the sex you select.">
            <p> ⓘ </p>
          </span>
        </label>
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
            className={value === "RATHER_NOT_SAY" ? "active" : ""}
            onClick={() => setValue("RATHER_NOT_SAY")}
            >
            Rather Not Say
            </button>
        </div>
    </div>
  );
}

export default StepGender;
