import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3001/auth/me", { credentials: "include" })
      .then(res  => res.json())
      .then(data => setUser(data))
      .catch(() => {
        nav("/login");
      });
  }, []);

  if (!user) return <p>Loading your profile…</p>;

  const logout = () => {
    fetch("http://localhost:3001/auth/logout", {
      method:      "POST",
      credentials: "include",
    }).then(() => {
      nav("/login");
    });
  };

  return (
    <div>
      <h1>Welcome, {user.firstName || user.email}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
