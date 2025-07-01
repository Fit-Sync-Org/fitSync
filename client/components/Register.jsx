import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, googleProvider } from "../src/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import "./Register.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function authFirebaseLogin(idToken) {
    console.log("Sending ID Token to backend:", idToken);
    const resp = await fetch(`${import.meta.env.VITE_API_URL}/auth/firebase-login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.error || resp.statusText);
    }
    return resp.json();
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      console.log("Attempting to register with:", email, password);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Firebase user created:", user);

      if (!user) throw new Error("No user returned from Firebase");

      const idToken = await user.getIdToken(true);
      console.log("Generated ID Token:", idToken);

      const data = await authFirebaseLogin(idToken);
      console.log("Server response:", data);

      if (data.user?.hasCompletedOnboarding) {
        navigate("/dashboard");
      } else {
        navigate("/OnboardingWizard");
      }

    } catch (err) {
      console.error("Register failed:", err);
      alert(err.message || "Registration failed");
    }
  };

  const handleGoogleRegister = async () => {
    try {
      console.log("Starting Google sign up flow");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user) throw new Error("No user returned from Google sign-in");

      const idToken = await user.getIdToken(true);
      console.log("Generated ID Token (Google):", idToken);

      const data = await authFirebaseLogin(idToken);
      console.log("Server response:", data);

      if (data.user?.hasCompletedOnboarding) {
        navigate("/dashboard");
      } else {
        navigate("/OnboardingWizard");
      }

    } catch (err) {
      console.error("Google sign up failed:", err);
      alert(err.message || "Google sign up failed");
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
              style={{ marginRight: "8px" }}
            />
            Sign up with Google
          </button>
        </div>
      </div>
      <p className="login-tag">
        Already have an account?{" "}
        <Link to="/login" className="login-link">
          Log in
        </Link>
      </p>
    </div>
  );
}
