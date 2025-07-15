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

function App() {
  return (
    <div className="App">
        <BrowserRouter>
        <Routes>
            <Route path="/login" element={<LogIn />} />
            <Route path="/register" element={<Register />} />
            <Route path="/OnboardingWizard" element={<OnboardingWizard />} />
            <Route element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>}/>
            <Route path="/dashboard" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute>}/>
            <Route path="/profile" element={ <ProtectedRoute> <Profile /> </ProtectedRoute>}/>
            <Route path="/log-meal" element={ <ProtectedRoute> <LogMeal /> </ProtectedRoute>}/>
            <Route path="/log-workout" element = {<ProtectedRoute> <LogWorkout /> </ProtectedRoute>}/>
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;
