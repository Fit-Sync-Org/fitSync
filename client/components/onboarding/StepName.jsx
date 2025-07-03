const stepName = ({ value, setValue }) => {
  return (
    <div className="step">
      <h2 className="step-header" > What's your name? </h2>

      <div className="input-wrapper first-name">
        <label className="step-label" htmlFor="first-name">First name </label>
        <input className="name-input" id="first-name" name="firstName" type="text" placeholder="First name" value = {value?.firstName || '' }
          onChange={(e) => setValue({...value, firstName: e.target.value})} />
      </div>

      <div className="input-wrapper last-name">
        <label htmlFor="last-name">Last name</label>
        <input className="name-input" id="last-name" name="lastName" type="text" placeholder="Last name" value = {value?.lastName || ''}
          onChange={(e) => setValue({...value, lastName: e.target.value})} />
      </div>
    </div>
  );
}

export default stepName;
