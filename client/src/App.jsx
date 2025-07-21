import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LogIn from "../components/login/LogIn";
import Dashboard from "../components/dashboard/Dashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import "./App.css";
import Register from "../components/register/Register";
import OnboardingWizard from "../components/onboarding/OnboardingWizard";
import LogMeal from "../components/meals/LogMeal";
import LogWorkout from "../components/workouts/LogWorkout";
import Profile from "../components/profile/Profile";
import WeeklyPlan from "../components/plans/WeeklyPlan";
import NotificationCenter from "../components/notifications/NotificationCenter";
import { useEffect } from "react";
import { auth } from "./firebase";
import websocketService from "./services/websocketService";

function App() {
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("User authenticated, initializing WebSocket...");
        try {
          await websocketService.connect();
          console.log("WebSocket initialized successfully");
        } catch (error) {
          console.error("Failed to initialize WebSocket:", error);
        }
      } else {
        console.log("User not authenticated, disconnecting WebSocket...");
        websocketService.disconnect();
      }
    });

    return () => {
      unsubscribe();
      websocketService.cleanup();
    };
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LogIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="/OnboardingWizard" element={<OnboardingWizard />} />
          <Route
            element={
              <ProtectedRoute>
                {" "}
                <Dashboard />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {" "}
                <Dashboard />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                {" "}
                <Profile />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/log-meal"
            element={
              <ProtectedRoute>
                {" "}
                <LogMeal />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/log-workout"
            element={
              <ProtectedRoute>
                {" "}
                <LogWorkout />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/plans"
            element={
              <ProtectedRoute>
                {" "}
                <WeeklyPlan />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                {" "}
                <NotificationCenter />{" "}
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
