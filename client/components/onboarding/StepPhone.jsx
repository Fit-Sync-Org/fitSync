const StepPhone = ({ value, setValue }) => {
  return (
    <div className="step">
      <div className="input-wrapper phone-number">
        <h2>
          <label htmlFor="phone-number">Phone Number</label>
        </h2>
      </div>

      <div className="input-group">
        <input
          id="phone-number"
          name="phoneNumber"
          type="tel"
          placeholder="e.g., +1 234 567 8901"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </div>
  );
}

export default StepPhone
