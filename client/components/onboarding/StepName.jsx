export default function StepName({ value, setValue }) {
  return (
    <div className="step">
      <div className="input-wrapper first-name">
        <label for="first-name">First name </label>
        <input id="first-name" name="firstName" type="text" placeholder="First name" />
      </div>
      <div className="input-wrapper last-name">
        <label for="last-name">Last name </label>
        <input id="last-name" name="lastName" type="text" placeholder="Last name" />
      </div>
    </div>
  );
}
