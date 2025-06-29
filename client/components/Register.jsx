import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth , googleProvider } from "../src/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Link } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function authFirebaseLogin(idToken) {
  const resp = await fetch(`${import.meta.env.VITE_API_URL}/auth/firebase-login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!resp.ok) {
    const body = await resp.json();
    console.error("Backend login failed:", body);
    throw new Error(body.error || resp.statusText);
    }
  }


  const handleRegister = async e => {
    e.preventDefault();
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await user.getIdToken();(/*forceRefresh: */ true);
      await authFirebaseLogin(idToken);
      navigate("/dashboard");
    } catch (err) {
      console.error("Register failed:", err);
      alert(err.message);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const result   = await signInWithPopup(auth, googleProvider);
      const idToken  = await result.user.getIdToken(/* forceRefresh= */ true);
      await authFirebaseLogin(idToken);
      navigate("/dashboard");
    } catch (err) {
      console.error("Google sign up failed:", err);
      alert("Google sign up failed: " + err.message);
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
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <button type="submit" className="register-button">Register</button>
          </form>

          <div className="divider">or</div>

          <button className="social google-btn" onClick={handleGoogleRegister}>
              <img className="google-icon" src="../icons8-google.svg" alt="" style={{marginRight: '8px'}} />
              Sign up with Google
          </button>
        </div>
      </div>
      <p className="login-tag"> Already have an account? <Link to="/login" className="login-link">Log in</Link> </p>
  </div>
  );
}
