const StepAge = ({ value, setValue }) => {
  return (
    <div className="step">
      <h2 className="step-header">Age</h2>

      <div className="input-wrapper age">
        <label className="step-label" htmlFor="age">
          How old are you?
          <span className="tooltip" data-tooltip="lorem ipsum">
            <p > ⓘ </p>
          </span>
        </label>
        <input id="age" name="Age" type="text" placeholder="Your age" value={value || ''}
        onChange={(e) => setValue(Number(e.target.value))}/>
      </div>
    </div>
  );
}

export default StepAge;
