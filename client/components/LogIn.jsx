import { useState } from "react";
import { auth, googleProvider } from "../src/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import "./LogIn.css"

const LogIn = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleGoogleLogin = async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();


        await sendToBackend(idToken);
      } catch (err) {
        console.error("Google login failed:", err);
      }
    };

    const handleEmailLogin = async (e) => {
      e.preventDefault();
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await result.user.getIdToken();

        await sendToBackend(idToken);
      } catch (err) {
        console.error("Email/password login failed:", err);
      }
    };

    const sendToBackend = async (idToken) => {
      try {
        await fetch("http://localhost:3001/auth/firebase-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ idToken }),
        });

        alert("Logged in with Firebase!");
      } catch (err) {
        console.error("Backend login failed:", err);
      }
    };

    return (
        <div className="LogIn">
          <div className="login-container">
            <h2 >Member Login</h2>
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
              <img src="/icons/google.svg" alt="" style={{marginRight: '8px'}} />
              Continue with Google
            </button>

          </div>
        </div>
      );
    }

export default LogIn;
