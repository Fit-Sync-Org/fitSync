const StepDiet = ({ value, setValue }) => {
  return (
    <div className="step">
      <div className="input-wrapper diet">
        <label htmlFor="diet">
          Do you have any dietary restrictions? <span className="tooltip">ⓘ</span>
        </label>
        <input
          id="diet"
          name="dietRestrictions"
          type="text"
          placeholder="e.g., vegetarian, halal, no nuts"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </div>
  );
}

export default StepDiet;
