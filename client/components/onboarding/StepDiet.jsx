const StepDiet = ({ value, setValue }) => {
  return (
    <div className="step">
      <h2 className="step-header"> Diet </h2>
      <div className="input-wrapper diet">
        <label className="step-label" htmlFor="diet">
          Do you have any dietary restrictions?
          <span className="tooltip" data-tooltip="Any food/ingredients you must avoid or prefer to limit?">
            <p>ⓘ</p>
          </span>
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
