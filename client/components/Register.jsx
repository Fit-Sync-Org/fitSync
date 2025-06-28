import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../src/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async e => {
    e.preventDefault();
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await user.getIdToken();
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
      navigate("/dashboard");
    } catch (err) {
      console.error("Register failed:", err);
      alert(err.message);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h2>Sign Up</h2>
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
      <button type="submit">Register</button>
      <p> Already have an account? <Link to="/login">Log in</Link> </p>
    </form>
  );
}
