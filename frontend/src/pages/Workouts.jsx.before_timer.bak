
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
} from "lucide-react";

import api from "../api/axios";

const initialForm = {
  workout_name: "",
  category: "Cardio",
  duration: "",
  calories_burned: "",
  workout_date: new Date().toISOString().split("T")[0],
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
