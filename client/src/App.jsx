import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LogIn from "../components/LogIn";
import Dashboard from "../components/dashboard/Dashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import "./App.css";
import Register from "../components/Register";
import OnboardingWizard from "../components/OnboardingWizard";

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
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;
