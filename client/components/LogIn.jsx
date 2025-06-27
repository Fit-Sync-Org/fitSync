import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../src/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import "./LogIn.css"
import { Link } from "react-router-dom";

const LogIn = () => {
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const nav = useNavigate();

    async function authFirebaseLogin(idToken) {
      await fetch("http://localhost:3001/auth/firebase-login", {
        method:"POST",
        headers:{ "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
    }

    const handleEmailLogin = async e => {
      e.preventDefault();
      try {
        const result  = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await result.user.getIdToken();
        await authFirebaseLogin(idToken);
        nav("/dashboard");
      } catch (err) {
        console.error(err);
        alert("Login failed");
      }
    };

    const handleGoogleLogin = async () => {
      try {
        const result  = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        await authFirebaseLogin(idToken);
        nav("/dashboard");
      } catch (err) {
        console.error(err);
        alert("Google login failed");
      }
    };



    return (
      <div className="LogIn">

        <div className="login-container1">
          <div className="login-container2">
            <h2 className="login-header"> Member Login </h2>
            <form className="input-forms" onSubmit={handleEmailLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
              <a href="/forgot-password" className="forgot-password">
                Forgot password?
              </a>
              <button type="submit">Login</button>
            </form>

            <div className="divider">or</div>

            <button className="social google-btn" onClick={handleGoogleLogin}>
              <img className="google-icon" src="../icons8-google.svg" alt="" style={{marginRight: '8px'}} />
              Continue with Google
            </button>

          </div>
        </div>
         <p className="register-tag">
          Not a member yet? <Link to="/register" className="register-link"> Sign up now!</Link>
          </p>
      </div>
      );
    }

export default LogIn;
