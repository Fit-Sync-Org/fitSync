import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setAuth] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
      credentials: "include",
    })
      .then(res => {
        if (res.ok) setAuth(true);
      })
      .catch(() => setAuth(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Checking authentication…</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
