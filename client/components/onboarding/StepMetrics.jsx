const StepMetrics = ({ value, setValue }) => {
  return (
    <div className="step">
      <div className="input-wrapper metrics">
        <h2>
          <label htmlFor="metrics">Your Metrics</label>
        </h2>
      </div>

      <div className="metrics-inputs">
        <div className="input-group">
          <label htmlFor="height">Height (cm)</label>
          <input
            id="height"
            name="height"
            type="number"
            placeholder="e.g., 175"
            value={value.height}
            onChange={(e) =>
              setValue({ ...value, height: Number(e.target.value) })
            }
          />
        </div>

        <div className="input-group">
          <label htmlFor="weight">Weight (kg)</label>
          <input
            id="weight"
            name="weight"
            type="number"
            placeholder="e.g., 70"
            value={value.weight}
            onChange={(e) =>
              setValue({ ...value, weight: Number(e.target.value) })
            }
          />
        </div>
      </div>
    </div>
  );
}

export default StepMetrics;
