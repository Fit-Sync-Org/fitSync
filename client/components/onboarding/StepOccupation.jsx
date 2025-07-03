const StepOccupation = ({ value, setValue }) => {
  return (
    <div className="step">
      <h2 className="step-header"> Occupation </h2>
      <div className="input-wrapper occupation">
        <label className="step-label" htmlFor="occupation">
          What is your occupation?
          <span className="tooltip">
            <p> ⓘ </p>
          </span>
        </label>
        <input
          id="occupation"
          name="occupation"
          type="text"
          placeholder="e.g., Student, Engineer"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </div>
  );
}

export default StepOccupation;
