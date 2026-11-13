
import { useEffect, useState } from "react";
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Flame,
  Dumbbell,
  RefreshCw,
  X,
  Play,
  Square,
} from "lucide-react";

import api from "../api/axios";

const initialForm = {
  workout_name: "",
  category: "Cardio",
  duration: "",
  calories_burned: "",
  workout_date: new Date().toISOString().split("T")[0],
};

const CALORIES_PER_MINUTE = {
  Cardio: 8,
  Strength: 5,
  Yoga: 3,
};

const formatElapsedTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const getLocalDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  // MODULE 16: WORKOUT TIMER
  const [timerWorkoutName, setTimerWorkoutName] = useState("");
  const [timerCategory, setTimerCategory] = useState("Cardio");
  const [timerStartTime, setTimerStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerSaving, setTimerSaving] = useState(false);
  const [timerError, setTimerError] = useState("");
  const [timerMessage, setTimerMessage] = useState("");

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/workouts/");
      setWorkouts(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load workouts. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  // Update the timer using the actual start timestamp.
  useEffect(() => {
    if (!timerStartTime) return;

    const updateElapsedTime = () => {
      setElapsedSeconds(
        Math.floor((Date.now() - timerStartTime) / 1000)
      );
    };

    updateElapsedTime();

    const intervalId = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(intervalId);
  }, [timerStartTime]);

  const handleStartTimer = () => {
    if (timerWorkoutName.trim().length < 2) {
      setTimerError("Enter a workout name with at least 2 characters.");
      return;
    }

    setTimerError("");
    setTimerMessage("");
    setElapsedSeconds(0);
    setTimerStartTime(Date.now());
  };

  const handleStopTimer = async () => {
    if (!timerStartTime || timerSaving) return;

    const durationMinutes = Math.max(
      1,
      Math.ceil(elapsedSeconds / 60)
    );

    const caloriesBurned = Math.round(
      durationMinutes * CALORIES_PER_MINUTE[timerCategory]
    );

    const payload = {
      workout_name: timerWorkoutName.trim(),
      category: timerCategory,
      duration: durationMinutes,
      calories_burned: caloriesBurned,
      workout_date: getLocalDate(),
    };

    setTimerStartTime(null);
    setTimerSaving(true);
    setTimerError("");
    setTimerMessage("");

    try {
      await api.post("/workouts/", payload);

      setTimerMessage(
        `Workout saved successfully! ${durationMinutes} minute(s), approximately ${caloriesBurned} kcal.`
      );

      setTimerWorkoutName("");
      setTimerCategory("Cardio");
      setElapsedSeconds(0);

      await fetchWorkouts();
    } catch (err) {
      console.error("Unable to save timed workout:", err);

      setTimerError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "The timer stopped, but the workout could not be saved. Please add it manually."
      );
    } finally {
      setTimerSaving(false);
    }
  };

  const estimatedCalories = Math.round(
    (elapsedSeconds / 60) *
    CALORIES_PER_MINUTE[timerCategory]
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        workout_name: formData.workout_name.trim(),
        category: formData.category,
        duration: Number(formData.duration),
        calories_burned: Number(formData.calories_burned),
        workout_date: formData.workout_date,
      };

      if (editingId) {
        await api.put(`/workouts/${editingId}`, payload);
        setSuccess("Workout updated successfully!");
      } else {
        await api.post("/workouts/", payload);
        setSuccess("Workout added successfully!");
      }

      resetForm();
      await fetchWorkouts();
    } catch (err) {
      setError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Unable to save workout. Check your input."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (workout) => {
    setEditingId(workout.id);

    setFormData({
      workout_name: workout.workout_name,
      category: workout.category,
      duration: String(workout.duration),
      calories_burned: String(workout.calories_burned),
      workout_date: workout.workout_date,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (workoutId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this workout?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/workouts/${workoutId}`);

      setSuccess("Workout deleted successfully!");
      setWorkouts((previous) =>
        previous.filter((item) => item.id !== workoutId)
      );

      if (editingId === workoutId) {
        resetForm();
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to delete workout."
      );
    }
  };

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesCategory =
      categoryFilter === "All" ||
      workout.category === categoryFilter;

    const matchesDate =
      !dateFilter || workout.workout_date === dateFilter;

    return matchesCategory && matchesDate;
  });

  const totalCalories = workouts.reduce(
    (total, item) => total + item.calories_burned,
    0
  );

  const totalDuration = workouts.reduce(
    (total, item) => total + item.duration,
    0
  );

  return (
    <div className="workout-page">
      <header className="workout-header">
        <div className="workout-brand">
          <Activity size={26} />
          <span>FitTrack</span>
        </div>

        <a href="/dashboard" className="back-dashboard">
          Back to Dashboard
        </a>
      </header>

      <main className="workout-content">
        <section className="workout-heading">
          <div>
            <p className="dashboard-eyebrow">FITNESS MANAGEMENT</p>
            <h1>Workout Management</h1>
            <p>Record, manage and track your workout activities.</p>
          </div>

          <Dumbbell size={42} />
        </section>

        {error && <div className="message error-message">{error}</div>}
        {success && <div className="message success-message">{success}</div>}

        <section className="workout-stats">
          <div className="workout-stat-card">
            <Activity />
            <span>Total Workouts</span>
            <h2>{workouts.length}</h2>
          </div>

          <div className="workout-stat-card">
            <Flame />
            <span>Calories Burned</span>
            <h2>{totalCalories.toLocaleString()}</h2>
          </div>

          <div className="workout-stat-card">
            <Clock />
            <span>Total Duration</span>
            <h2>{totalDuration} min</h2>
          </div>
        </section>

        {/* MODULE 16: WORKOUT TIMER */}
        <section className="workout-timer-card">
          <div className="workout-section-title">
            <div>
              <p className="dashboard-eyebrow">MODULE 16</p>
              <h2>Workout Timer & Live Tracking</h2>
              <p>Track your workout duration and estimated calories live.</p>
            </div>
            <Clock size={32} />
          </div>

          {timerError && (
            <div className="message error-message">{timerError}</div>
          )}

          {timerMessage && (
            <div className="message success-message">{timerMessage}</div>
          )}

          <div className="workout-timer-controls">
            <div className="form-group">
              <label>Workout Name</label>
              <input
                value={timerWorkoutName}
                onChange={(e) => setTimerWorkoutName(e.target.value)}
                placeholder="e.g. Morning Running"
                minLength={2}
                maxLength={100}
                disabled={Boolean(timerStartTime) || timerSaving}
              />
            </div>

            <div className="form-group">
              <label>Workout Category</label>
              <select
                value={timerCategory}
                onChange={(e) => setTimerCategory(e.target.value)}
                disabled={Boolean(timerStartTime) || timerSaving}
              >
                <option value="Cardio">Cardio</option>
                <option value="Strength">Strength</option>
                <option value="Yoga">Yoga</option>
              </select>
            </div>
          </div>

          <div className="workout-timer-display">
            <span>ELAPSED TIME</span>
            <h2>{formatElapsedTime(elapsedSeconds)}</h2>
            <p>
              {timerStartTime ? "Workout in progress" : "Ready to start"}
            </p>
          </div>

          <div className="workout-timer-live-stats">
            <div>
              <Flame size={22} />
              <span>Estimated Calories</span>
              <strong>{estimatedCalories} kcal</strong>
            </div>

            <div>
              <Clock size={22} />
              <span>Elapsed Minutes</span>
              <strong>{Math.floor(elapsedSeconds / 60)} min</strong>
            </div>
          </div>

          <div className="workout-timer-actions">
            {!timerStartTime ? (
              <button
                type="button"
                className="timer-start-button"
                onClick={handleStartTimer}
                disabled={timerSaving}
              >
                <Play size={18} />
                Start Workout
              </button>
            ) : (
              <button
                type="button"
                className="timer-stop-button"
                onClick={handleStopTimer}
                disabled={timerSaving}
              >
                <Square size={18} />
                Stop & Save Workout
              </button>
            )}

            {timerSaving && <span>Saving workout...</span>}
          </div>

          <p className="workout-timer-note">
            Calorie values are estimates using category-based rates:
            Cardio 8, Strength 5, and Yoga 3 kcal per minute.
            Saved duration is rounded up to a whole minute.
          </p>
        </section>

        <section className="workout-form-card">
          <div className="workout-section-title">
            <h2>{editingId ? "Edit Workout" : "Add New Workout"}</h2>

            {editingId && (
              <button
                type="button"
                className="cancel-edit-button"
                onClick={resetForm}
              >
                <X size={16} /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="workout-form-grid">
              <div className="form-group">
                <label>Workout Name</label>
                <input
                  name="workout_name"
                  value={formData.workout_name}
                  onChange={handleChange}
                  placeholder="e.g. Morning Running"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="Cardio">Cardio</option>
                  <option value="Strength">Strength</option>
                  <option value="Yoga">Yoga</option>
                </select>
              </div>

              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  max="1440"
                  placeholder="45"
                  required
                />
              </div>

              <div className="form-group">
                <label>Calories Burned</label>
                <input
                  type="number"
                  name="calories_burned"
                  value={formData.calories_burned}
                  onChange={handleChange}
                  min="0"
                  max="10000"
                  placeholder="250"
                  required
                />
              </div>

              <div className="form-group">
                <label>Workout Date</label>
                <input
                  type="date"
                  name="workout_date"
                  value={formData.workout_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="workout-submit-button"
              disabled={saving}
            >
              {editingId ? <Pencil size={18} /> : <Plus size={18} />}
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Workout"
                  : "Add Workout"}
            </button>
          </form>
        </section>

        <section className="workout-history-card">
          <div className="workout-section-title">
            <div>
              <h2>Workout History</h2>
              <p>View and manage your saved workouts.</p>
            </div>

            <button
              className="refresh-button"
              onClick={fetchWorkouts}
              disabled={loading}
              type="button"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="workout-filters">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Cardio">Cardio</option>
              <option value="Strength">Strength</option>
              <option value="Yoga">Yoga</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />

            <button
              type="button"
              className="clear-filter-button"
              onClick={() => {
                setCategoryFilter("All");
                setDateFilter("");
              }}
            >
              Clear Filters
            </button>
          </div>

          {loading ? (
            <p className="workout-empty">Loading workouts...</p>
          ) : filteredWorkouts.length === 0 ? (
            <p className="workout-empty">
              No workouts found. Add a workout to get started.
            </p>
          ) : (
            <div className="workout-table-wrapper">
              <table className="workout-table">
                <thead>
                  <tr>
                    <th>Workout</th>
                    <th>Category</th>
                    <th>Duration</th>
                    <th>Calories</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredWorkouts.map((workout) => (
                    <tr key={workout.id}>
                      <td>{workout.workout_name}</td>
                      <td>
                        <span className={`category-badge ${workout.category.toLowerCase()}`}>
                          {workout.category}
                        </span>
                      </td>
                      <td>{workout.duration} min</td>
                      <td>{workout.calories_burned} kcal</td>
                      <td>
                        <Calendar size={14} />
                        {workout.workout_date}
                      </td>
                      <td>
                        <div className="workout-actions">
                          <button
                            type="button"
                            className="edit-workout-button"
                            onClick={() => handleEdit(workout)}
                            title="Edit workout"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className="delete-workout-button"
                            onClick={() => handleDelete(workout.id)}
                            title="Delete workout"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Workouts;
