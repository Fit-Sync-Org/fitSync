export default function StepAvailability({ value, setValue }) {
  return (
    <div className="step">
        <div className="input-wrapper availability">
            <label for="availability"> Roughly how many hours per week can you devote to workouts? <span className="tooltip">ⓘ</span></label>
            <input id="availability" name="Availabilty" type="text" placeholder="" />
        </div>
    </div>
  );
}
