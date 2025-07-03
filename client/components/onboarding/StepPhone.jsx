const StepPhone = ({ value, setValue }) => {
  return (
    <div className="step">
      <h2 className="step-header"> Phone Number </h2>
      <div className="input-wrapper phone-number">
        <label className="step-label" htmlFor="phone-number">
          What is your phone number
          <span className="tooltip">
            <p>ⓘ</p>
          </span>
        </label>
        
        <input id="phone-number" name="phoneNumber" type="tel" placeholder="e.g., +1 234 567 8901" value={value || ''}
        onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </div>
  );
}

export default StepPhone
