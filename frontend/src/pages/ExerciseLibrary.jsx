
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Clock,
  Dumbbell,
  Plus,
  Search,
  X,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import api from "../api/axios";
import "./ExerciseLibrary.css";

const initialForm = {
  name: "",
  category: "Cardio",
  description: "",
  duration: 30,
};

function ExerciseLibrary() {
  const navigate = useNavigate();

  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (category !== "All") {
        params.category = category;
      }

      const response = await api.get("/exercises/", { params });

      setExercises(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load exercises. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchExercises();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, category]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: name === "duration" ? value : value,
    }));
  };

  const handleCreateExercise = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const duration = Number(formData.duration);

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError("Exercise name must contain at least 2 characters.");
      return;
    }

    if (formData.description.trim().length < 5) {
      setError("Description must contain at least 5 characters.");
      return;
    }

    if (!Number.isInteger(duration) || duration < 1 || duration > 300) {
      setError("Duration must be between 1 and 300 minutes.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/exercises/", {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        duration,
      });

      setFormData(initialForm);
      setShowForm(false);
      setSuccess("Exercise created successfully.");

      await fetchExercises();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to create exercise. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddToWorkout = (exercise) => {
    navigate("/workout-planner", {
      state: {
        exercise,
      },
    });
  };

  return (
    <div className="exercise-library-page">
      <div className="exercise-library-header">
        <div>
          <p className="exercise-eyebrow">FITNESS COLLECTION</p>
          <h1>Exercise Library</h1>
          <p className="exercise-subtitle">
            Discover exercises and add them to your workout plan.
          </p>
        </div>

        <button
          className="exercise-add-button"
          onClick={() => {
            setShowForm((previous) => !previous);
            setError("");
            setSuccess("");
          }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Close Form" : "Add Exercise"}
        </button>
      </div>

      {error && <div className="exercise-message error">{error}</div>}
      {success && <div className="exercise-message success">{success}</div>}

      {showForm && (
        <form
          className="exercise-create-form"
          onSubmit={handleCreateExercise}
        >
          <h2>Create New Exercise</h2>

          <div className="exercise-form-grid">
            <div className="exercise-field">
              <label htmlFor="exercise-name">Exercise Name</label>
              <input
                id="exercise-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Example: Running"
                minLength={2}
                maxLength={100}
                required
              />
            </div>

            <div className="exercise-field">
              <label htmlFor="exercise-category">Category</label>
              <select
                id="exercise-category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="Cardio">Cardio</option>
                <option value="Strength">Strength</option>
                <option value="Yoga">Yoga</option>
              </select>
            </div>

            <div className="exercise-field">
              <label htmlFor="exercise-duration">Duration (minutes)</label>
              <input
                id="exercise-duration"
                name="duration"
                type="number"
                min="1"
                max="300"
                value={formData.duration}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="exercise-field exercise-description-field">
              <label htmlFor="exercise-description">Description</label>
              <textarea
                id="exercise-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe this exercise..."
                minLength={5}
                maxLength={500}
                rows={3}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="exercise-submit-button"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Exercise"}
          </button>
        </form>
      )}

      <div className="exercise-toolbar">
        <div className="exercise-search">
          <Search size={19} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search exercises..."
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <select
          className="exercise-category-filter"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="All">All Categories</option>
          <option value="Cardio">Cardio</option>
          <option value="Strength">Strength</option>
          <option value="Yoga">Yoga</option>
        </select>

        <button
          className="exercise-refresh-button"
          onClick={fetchExercises}
          title="Refresh exercises"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      <div className="exercise-results-heading">
        <h2>Available Exercises</h2>
        <span>{exercises.length} exercises</span>
      </div>

      {loading ? (
        <div className="exercise-empty-state">
          <RefreshCw className="exercise-loading-icon" size={28} />
          <p>Loading exercises...</p>
        </div>
      ) : exercises.length === 0 ? (
        <div className="exercise-empty-state">
          <Dumbbell size={38} />
          <h3>No exercises found</h3>
          <p>Try another search or add a new exercise to your library.</p>
        </div>
      ) : (
        <div className="exercise-grid">
          {exercises.map((exercise) => (
            <article className="exercise-card" key={exercise.id}>
              <div className="exercise-card-top">
                <div className="exercise-icon">
                  {exercise.category === "Cardio" ? (
                    <Activity size={23} />
                  ) : (
                    <Dumbbell size={23} />
                  )}
                </div>

                <span
                  className={`exercise-category-badge ${exercise.category.toLowerCase()}`}
                >
                  {exercise.category}
                </span>
              </div>

              <h3>{exercise.name}</h3>
              <p className="exercise-description">
                {exercise.description}
              </p>

              <div className="exercise-card-footer">
                <span className="exercise-duration">
                  <Clock size={16} />
                  {exercise.duration} min
                </span>

                <button
                  className="exercise-plan-button"
                  onClick={() => handleAddToWorkout(exercise)}
                >
                  Add to Workout
                  <ArrowRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExerciseLibrary;
