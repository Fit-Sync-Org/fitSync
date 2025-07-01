const stepName = ({ value, setValue }) => {
  return (
    <div className="step">
      <div className="input-wrapper first-name">
        <label htmlFor="first-name">First name </label>
        <input id="first-name" name="firstName" type="text" placeholder="First name" value = {value.firstName}
          onChange={(e) => setValue({...value, firstName: e.target.value})} />
      </div>
      <div className="input-wrapper last-name">
        <label htmlFor="last-name">Last name </label>
        <input id="last-name" name="lastName" type="text" placeholder="Last name" value = {value.lastName}
          onChange={(e) => setValue({...value, lastName: e.target.value})} />
      </div>
    </div>
  );
}

export default stepName;
