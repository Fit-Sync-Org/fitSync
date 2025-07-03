const StepAvailability = ({ value, setValue }) => {
  return (
    <div className="step">
        <div className="input-wrapper availability">
            <label htmlFor="availability">
               Roughly how many hours per week can you devote to workouts?
              <span className="tooltip">ⓘ</span>
            </label>
            <input id="availability" name="Availabilty" type="number" placeholder="" value={value}
            onChange={(e) => setValue(Number(e.target.value))} />
        </div>
    </div>
  );
}

export default StepAvailability;
