import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../src/firebase';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setAuth] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const signal = controller.signal;

    async function refreshCookie(idToken) {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/firebase-login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal,
      });
    }

    async function check() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          credentials: 'include',
          signal,
        });

        if (res.ok) {
          if (!cancelled) setAuth(true);
          return;
        }

        if (res.status === 401 && auth.currentUser) {
          const freshToken = await auth.currentUser.getIdToken(/* forceRefresh */ true);
          await refreshCookie(freshToken);

          /* retry once */
          const retry = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
            credentials: 'include',
            signal,
          });
          if (!cancelled) setAuth(retry.ok);
          return;
        }

        if (!cancelled) setAuth(false);
      } catch (err) {
        console.error('auth check failed:', err);
        if (!cancelled) setAuth(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    check();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  if (loading) return <p>Checking authentication…</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
