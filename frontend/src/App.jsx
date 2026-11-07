import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Workouts from "./pages/Workouts";
import Progress from "./pages/Progress";
import Goals from "./pages/Goals";
import Analytics from "./pages/Analytics";
import ProgressComparison from "./pages/ProgressComparison";
import Notifications from "./pages/Notifications";
import WorkoutPlanner from "./pages/WorkoutPlanner";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import Streaks from "./pages/Streaks";
import Achievements from "./pages/Achievements";

import "./App.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Workout Management */}
        <Route
          path="/workouts"
          element={
            <ProtectedRoute>
              <Workouts />
            </ProtectedRoute>
          }
        />

        {/* Exercise Library */}
        <Route
          path="/exercise-library"
          element={
            <ProtectedRoute>
              <ExerciseLibrary />
            </ProtectedRoute>
          }
        />

        {/* Progress Tracking */}
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          }
        />

        {/* Goal Management */}
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <Goals />
            </ProtectedRoute>
          }
        />

        {/* Reports & Analytics */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* Progress Comparison */}
        <Route
          path="/progress-comparison"
          element={
            <ProtectedRoute>
              <ProgressComparison />
            </ProtectedRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Workout Planner */}
        <Route
          path="/workout-planner"
          element={
            <ProtectedRoute>
              <WorkoutPlanner />
            </ProtectedRoute>
          }
        />

        {/* Streak Tracking */}
        <Route
          path="/streaks"
          element={
            <ProtectedRoute>
              <Streaks />
            </ProtectedRoute>
          }
        />

        {/* Achievement Badges */}
        <Route
          path="/achievements"
          element={
            <ProtectedRoute>
              <Achievements />
            </ProtectedRoute>
          }
        />

        {/* Invalid Routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
