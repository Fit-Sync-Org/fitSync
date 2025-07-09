const StepAvailability = ({ value, setValue }) => {
  return (
    <div className="step">
        <h2 className="step-header">Availability</h2>

        <div className="input-wrapper availability">
            <label className="step-label" htmlFor="availability">
               Roughly how many hours per week can you devote to workouts?
              <span className="tooltip" data-tooltip='Think “total workout time,” not commute or prep. A good estimate helps us make a strong workout schedule.'>
                <p> ⓘ </p>
              </span>
            </label>
            <input id="availability" name="Availabilty" type="number" placeholder="e.g. 3, 4" value={value || ''}
            onChange={(e) => setValue(Number(e.target.value))} />
        </div>
    </div>
  );
}

export default StepAvailability;
