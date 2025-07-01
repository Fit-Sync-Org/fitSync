const StepOccupation = ({ value, setValue }) => {
  return (
    <div className="step">
      <div className="input-wrapper occupation">
        <label htmlFor="occupation">
          What is your occupation?
          <span className="tooltip">ⓘ</span>
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
