import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider } from '../../src/firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import './Register.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const stashToken = (idToken) => sessionStorage.setItem('fitsyncTempToken', idToken);


  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await user.getIdToken(true);
      stashToken(idToken);
      navigate('/OnboardingWizard');
    } catch (err) {
      console.error('Register failed:', err);
      alert(err.message || 'Registration failed');
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      const idToken = await user.getIdToken(true);
      stashToken(idToken);
      navigate('/OnboardingWizard');
    } catch (err) {
      console.error('Register failed:', err);
      alert(err.message || 'Registration failed');
    }
  };


  return (
    <div className="Register">
      <div className="register-wrapper">
        <div className="register-content">
          <h2 className="register-header"> Sign Up </h2>
          <form className="input-forms" onSubmit={handleRegister}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <button type="submit" className="register-button">Register</button>
          </form>

          <div className="divider">or</div>

          <button className="social google-btn" onClick={handleGoogleRegister}>
            <img
              className="google-icon"
              src="../icons8-google.svg"
              alt="Google icon"
              style={{ marginRight: '8px' }}
            />
            Sign up with Google
          </button>
        </div>
      </div>
      <p className="login-tag">
        Already have an account?{' '}
        <Link to="/login" className="login-link">
          Log in
        </Link>
      </p>
    </div>
  );
}
