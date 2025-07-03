const StepAge = ({ value, setValue }) => {
  return (
    <div className="step">
      <div className="input-wrapper age">
        <label htmlFor="age">How old are you? <span className="tooltip">ⓘ</span></label>
        <input id="age" name="Age" type="text" placeholder="Your age" value={value}
        onChange={(e) => setValue(Number(e.target.value))}/>
      </div>
    </div>
  );
}

export default StepAge;
