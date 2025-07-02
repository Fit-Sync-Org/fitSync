export default function StepAge({ value, setValue }) {
  return (
    <div className="step">
            <div className="input-wrapper age">
                <label for="age">How old are you? <span className="tooltip">ⓘ</span></label>
                <input id="age" name="Age" type="text" placeholder="Your age" />
            </div>
    </div>
  );
}
