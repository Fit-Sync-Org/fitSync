export default function StepOccupation({ value, setValue }) {
  return (
    <div className="step">
        <div className="input-wrapper occupation">
            <label for="occupation"> What is your occupation? <span className="tooltip">ⓘ</span></label>
            <input id="occupation" name="Occupation" type="text" placeholder="" />
        </div>
    </div>
  );
}
