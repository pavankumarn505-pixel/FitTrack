
import { useCallback, useEffect, useState } from "react";
import {
  Apple,
  Plus,
  Pencil,
  Trash2,
  Flame,
  Beef,
  Wheat,
  Droplets,
  CalendarDays,
  Utensils,
  X,
  RefreshCw,
} from "lucide-react";

import api from "../api/axios";
import "./MealTracking.css";

const initialForm = {
  meal_type: "Breakfast",
  food_name: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
};

const getToday = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
};

function MealTracking() {
  const [meals, setMeals] = useState([]);
  const [summary, setSummary] = useState({
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fats: 0,
  });

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getErrorMessage = (err) =>
    err.response?.data?.detail ||
    err.message ||
    "Something went wrong. Please try again.";

  const fetchMeals = useCallback(async () => {
    try {
      const response = await api.get("/meals/");
      setMeals(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get("/meals/daily-summary", {
        params: {
          summary_date: selectedDate,
        },
      });

      setSummary(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [selectedDate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    await Promise.all([
      fetchMeals(),
      fetchSummary(),
    ]);

    setLoading(false);
  }, [fetchMeals, fetchSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const mealData = {
      meal_type: form.meal_type,
      food_name: form.food_name.trim(),
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fats: Number(form.fats),
    };

    try {
      if (editingId !== null) {
        await api.put(`/meals/${editingId}`, mealData);
        setMessage("Meal updated successfully!");
      } else {
        await api.post("/meals/", mealData);
        setMessage("Meal added successfully!");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (meal) => {
    setForm({
      meal_type: meal.meal_type,
      food_name: meal.food_name,
      calories: String(meal.calories),
      protein: String(meal.protein),
      carbs: String(meal.carbs),
      fats: String(meal.fats),
    });

    setEditingId(meal.id);
    setShowForm(true);
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (mealId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this meal?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/meals/${mealId}`);
      setMessage("Meal deleted successfully!");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const formatDate = (value) => {
    if (!value) return "";

    return new Date(value).toLocaleString();
  };

  return (
    <div className="meal-page">

      {/* PAGE HEADER */}

      <div className="meal-header">
        <div>
          <div className="meal-heading-icon">
            <Apple size={28} />
          </div>

          <h1>Nutrition & Meal Tracking</h1>

          <p>
            Track your meals, calories and daily nutrition.
          </p>
        </div>

        <button
          className="meal-add-button"
          onClick={() => {
            if (showForm && editingId === null) {
              resetForm();
            } else {
              setForm(initialForm);
              setEditingId(null);
              setShowForm(true);
            }
          }}
        >
          {showForm && editingId === null ? (
            <X size={18} />
          ) : (
            <Plus size={18} />
          )}

          {showForm && editingId === null
            ? "Close"
            : "Add Meal"}
        </button>
      </div>

      {/* NOTIFICATIONS */}

      {error && (
        <div className="meal-alert meal-error">
          {Array.isArray(error)
            ? error.map((item) => item.msg).join(", ")
            : error}
        </div>
      )}

      {message && (
        <div className="meal-alert meal-success">
          {message}
        </div>
      )}

      {/* DATE FILTER */}

      <div className="meal-date-filter">
        <CalendarDays size={20} />

        <label htmlFor="summary-date">
          Daily Summary
        </label>

        <input
          id="summary-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <button
          type="button"
          className="meal-refresh-button"
          onClick={loadData}
          title="Refresh meals"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {/* NUTRITION SUMMARY */}

      <div className="meal-summary-grid">

        <div className="meal-summary-card calories-card">
          <div className="meal-summary-icon">
            <Flame size={23} />
          </div>

          <p>Total Calories</p>

          <h2>
            {Number(summary.total_calories || 0).toFixed(0)}
          </h2>

          <span>kcal</span>
        </div>

        <div className="meal-summary-card protein-card">
          <div className="meal-summary-icon">
            <Beef size={23} />
          </div>

          <p>Total Protein</p>

          <h2>
            {Number(summary.total_protein || 0).toFixed(1)}
          </h2>

          <span>grams</span>
        </div>

        <div className="meal-summary-card carbs-card">
          <div className="meal-summary-icon">
            <Wheat size={23} />
          </div>

          <p>Total Carbs</p>

          <h2>
            {Number(summary.total_carbs || 0).toFixed(1)}
          </h2>

          <span>grams</span>
        </div>

        <div className="meal-summary-card fats-card">
          <div className="meal-summary-icon">
            <Droplets size={23} />
          </div>

          <p>Total Fats</p>

          <h2>
            {Number(summary.total_fats || 0).toFixed(1)}
          </h2>

          <span>grams</span>
        </div>

      </div>

      {/* ADD / EDIT MEAL FORM */}

      {showForm && (
        <div className="meal-form-card">

          <div className="meal-form-heading">
            <div>
              <h2>
                {editingId !== null
                  ? "Update Meal"
                  : "Add New Meal"}
              </h2>

              <p>
                Enter your food and nutrition details.
              </p>
            </div>

            <button
              type="button"
              className="meal-close-button"
              onClick={resetForm}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="meal-form-grid">

              <div className="meal-field">
                <label>Meal Type</label>

                <select
                  name="meal_type"
                  value={form.meal_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snacks">Snacks</option>
                </select>
              </div>

              <div className="meal-field">
                <label>Food Name</label>

                <input
                  type="text"
                  name="food_name"
                  placeholder="Example: Oatmeal with Banana"
                  value={form.food_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="meal-field">
                <label>Calories (kcal)</label>

                <input
                  type="number"
                  name="calories"
                  min="0"
                  step="any"
                  value={form.calories}
                  onChange={handleInputChange}
                  placeholder="350"
                  required
                />
              </div>

              <div className="meal-field">
                <label>Protein (g)</label>

                <input
                  type="number"
                  name="protein"
                  min="0"
                  step="any"
                  value={form.protein}
                  onChange={handleInputChange}
                  placeholder="12"
                  required
                />
              </div>

              <div className="meal-field">
                <label>Carbohydrates (g)</label>

                <input
                  type="number"
                  name="carbs"
                  min="0"
                  step="any"
                  value={form.carbs}
                  onChange={handleInputChange}
                  placeholder="55"
                  required
                />
              </div>

              <div className="meal-field">
                <label>Fats (g)</label>

                <input
                  type="number"
                  name="fats"
                  min="0"
                  step="any"
                  value={form.fats}
                  onChange={handleInputChange}
                  placeholder="9"
                  required
                />
              </div>

            </div>

            <div className="meal-form-actions">

              <button
                type="button"
                className="meal-cancel-button"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="meal-submit-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Meal"
                    : "Save Meal"}
              </button>

            </div>

          </form>
        </div>
      )}

      {/* MEAL LIST */}

      <div className="meal-list-section">

        <div className="meal-list-heading">
          <div>
            <h2>My Meals</h2>
            <p>Manage your recorded meals.</p>
          </div>

          <span className="meal-count">
            {meals.length} Meals
          </span>
        </div>

        {loading ? (
          <div className="meal-empty-state">
            Loading meals...
          </div>
        ) : meals.length === 0 ? (
          <div className="meal-empty-state">
            <Utensils size={42} />

            <h3>No meals recorded yet</h3>

            <p>
              Start tracking your nutrition by adding your first meal.
            </p>

            <button
              className="meal-add-button"
              onClick={() => setShowForm(true)}
            >
              <Plus size={18} />
              Add Your First Meal
            </button>
          </div>
        ) : (
          <div className="meal-list">

            {meals.map((meal) => (
              <div className="meal-item" key={meal.id}>

                <div className="meal-item-icon">
                  <Apple size={24} />
                </div>

                <div className="meal-item-details">

                  <span className="meal-type">
                    {meal.meal_type}
                  </span>

                  <h3>{meal.food_name}</h3>

                  <p className="meal-created">
                    {formatDate(meal.created_at)}
                  </p>

                  <div className="meal-nutrition-details">
                    <span>
                      <Flame size={14} />
                      {meal.calories} kcal
                    </span>

                    <span>
                      <Beef size={14} />
                      {meal.protein}g protein
                    </span>

                    <span>
                      <Wheat size={14} />
                      {meal.carbs}g carbs
                    </span>

                    <span>
                      <Droplets size={14} />
                      {meal.fats}g fats
                    </span>
                  </div>

                </div>

                <div className="meal-item-actions">

                  <button
                    type="button"
                    className="meal-edit-button"
                    onClick={() => handleEdit(meal)}
                    title="Edit meal"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    className="meal-delete-button"
                    onClick={() => handleDelete(meal.id)}
                    title="Delete meal"
                  >
                    <Trash2 size={17} />
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default MealTracking;
