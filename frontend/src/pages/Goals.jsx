
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  Plus,
  ArrowLeft,
  X,
  Dumbbell,
  Footprints,
  Scale,
} from "lucide-react";

import api from "../api/axios";
import GoalCard from "../components/GoalCard";
import "./Goals.css";

const initialForm = {
  goal_type: "Weight Loss",
  target_value: "",
  current_value: "",
  deadline: "",
};

function Goals() {
  const navigate = useNavigate();

  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingGoal, setEditingGoal] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = new Date().toLocaleDateString("en-CA");

  // Load goals from backend
  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/goals/");

      setGoals(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load goals. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Open create form
  const openCreateForm = () => {
    setEditingGoal(null);

    setForm({
      ...initialForm,
      current_value: "0",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Open edit form
  const handleEdit = (goal) => {
    setEditingGoal(goal);

    setForm({
      goal_type: goal.goal_type,
      target_value: String(goal.target_value),
      current_value: String(goal.current_value),
      deadline: goal.deadline,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Submit create or update request
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const target = Number(form.target_value);
    const current = Number(form.current_value);

    if (!Number.isFinite(target) || target <= 0) {
      setError("Target value must be greater than zero.");
      return;
    }

    if (
      !Number.isFinite(current) ||
      current < 0 ||
      current > 10000000
    ) {
      setError("Enter a valid current value.");
      return;
    }

    if (
      form.goal_type === "Weight Loss" &&
      current <= 0
    ) {
      setError("Current weight must be greater than zero.");
      return;
    }

    if (!form.deadline || form.deadline < today) {
      setError("Please select a valid future deadline.");
      return;
    }

    try {
      setSaving(true);

      if (editingGoal) {
        // Backend GoalUpdate supports these fields.
        const updateData = {};

        if (
          target !== Number(editingGoal.target_value)
        ) {
          updateData.target_value = target;
        }

        if (
          current !== Number(editingGoal.current_value)
        ) {
          updateData.current_value = current;
        }

        if (form.deadline !== editingGoal.deadline) {
          updateData.deadline = form.deadline;
        }

        if (Object.keys(updateData).length === 0) {
          setError("Please change at least one field.");
          return;
        }

        await api.put(
          `/goals/${editingGoal.id}`,
          updateData
        );

        setSuccess("Goal updated successfully!");
      } else {
        const goalData = {
          goal_type: form.goal_type,
          target_value: target,
          current_value: current,
          deadline: form.deadline,
        };

        await api.post("/goals/", goalData);

        setSuccess("Goal created successfully!");
      }

      setShowForm(false);
      setEditingGoal(null);
      setForm(initialForm);

      await fetchGoals();
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => item.msg).join(", ")
            : "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete goal
  const handleDelete = async (goalId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this goal?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/goals/${goalId}`);

      setSuccess("Goal deleted successfully!");

      await fetchGoals();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to delete goal."
      );
    }
  };

  const completedGoals = goals.filter(
    (goal) => goal.status === "COMPLETED"
  ).length;

  const activeGoals = goals.filter(
    (goal) => goal.status === "IN_PROGRESS"
  ).length;

  const overdueGoals = goals.filter(
    (goal) => goal.status === "OVERDUE"
  ).length;

  return (
    <div className="goals-page">
      <div className="goals-container">

        {/* Header */}
        <div className="goals-header">
          <div>
            <button
              className="goals-back-button"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft size={17} />
              Dashboard
            </button>

            <h1>Fitness Goals</h1>

            <p>
              Set your targets, track your progress, and achieve
              your fitness goals.
            </p>
          </div>

          <button
            className="add-goal-button"
            onClick={openCreateForm}
          >
            <Plus size={19} />
            Create Goal
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="goal-alert goal-alert-error">
            {error}
            <button onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="goal-alert goal-alert-success">
            {success}
            <button onClick={() => setSuccess("")}>
              <X size={17} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="goal-stats-grid">
          <div className="goal-stat-card">
            <div className="goal-stat-icon purple">
              <Target size={23} />
            </div>
            <div>
              <p>Total Goals</p>
              <h2>{goals.length}</h2>
            </div>
          </div>

          <div className="goal-stat-card">
            <div className="goal-stat-icon green">
              <Scale size={23} />
            </div>
            <div>
              <p>Completed</p>
              <h2>{completedGoals}</h2>
            </div>
          </div>

          <div className="goal-stat-card">
            <div className="goal-stat-icon blue">
              <Dumbbell size={23} />
            </div>
            <div>
              <p>In Progress</p>
              <h2>{activeGoals}</h2>
            </div>
          </div>

          <div className="goal-stat-card">
            <div className="goal-stat-icon orange">
              <Footprints size={23} />
            </div>
            <div>
              <p>Overdue</p>
              <h2>{overdueGoals}</h2>
            </div>
          </div>
        </div>

        {/* Goal Form */}
        {showForm && (
          <div className="goal-form-overlay">
            <div className="goal-form-card">
              <div className="goal-form-header">
                <div>
                  <h2>
                    {editingGoal
                      ? "Update Fitness Goal"
                      : "Create Fitness Goal"}
                  </h2>

                  <p>
                    {editingGoal
                      ? "Update your goal values and deadline."
                      : "Define a new fitness target."}
                  </p>
                </div>

                <button
                  className="goal-close-button"
                  onClick={() => setShowForm(false)}
                  type="button"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="goal-form-group">
                  <label>Goal Type</label>

                  <select
                    name="goal_type"
                    value={form.goal_type}
                    onChange={handleChange}
                    disabled={Boolean(editingGoal)}
                  >
                    <option value="Weight Loss">
                      Weight Loss
                    </option>

                    <option value="Muscle Gain">
                      Muscle Gain
                    </option>

                    <option value="Steps">
                      Steps
                    </option>
                  </select>

                  {editingGoal && (
                    <small>
                      Goal type cannot be changed after creation.
                    </small>
                  )}
                </div>

                <div className="goal-form-group">
                  <label>
                    Target Value
                    {form.goal_type === "Weight Loss"
                      ? " (kg)"
                      : form.goal_type === "Muscle Gain"
                        ? " (kg)"
                        : " (steps)"}
                  </label>

                  <input
                    type="number"
                    name="target_value"
                    placeholder="Enter target value"
                    min="0.01"
                    max="10000000"
                    step="any"
                    value={form.target_value}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="goal-form-group">
                  <label>
                    Current Value
                    {form.goal_type === "Weight Loss" ||
                    form.goal_type === "Muscle Gain"
                      ? " (kg)"
                      : " (steps)"}
                  </label>

                  <input
                    type="number"
                    name="current_value"
                    placeholder="Enter current value"
                    min={
                      form.goal_type === "Weight Loss"
                        ? "0.01"
                        : "0"
                    }
                    max="10000000"
                    step="any"
                    value={form.current_value}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="goal-form-group">
                  <label>Deadline</label>

                  <input
                    type="date"
                    name="deadline"
                    min={today}
                    value={form.deadline}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="goal-form-actions">
                  <button
                    type="button"
                    className="goal-cancel-button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="goal-submit-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingGoal
                        ? "Update Goal"
                        : "Create Goal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Goals List */}
        <div className="goals-list-header">
          <div>
            <h2>My Goals</h2>
            <p>Monitor your fitness journey.</p>
          </div>
        </div>

        {loading ? (
          <div className="goals-message">
            Loading your goals...
          </div>
        ) : goals.length === 0 ? (
          <div className="goals-empty-state">
            <div className="empty-goal-icon">
              <Target size={42} />
            </div>

            <h3>No Fitness Goals Yet</h3>

            <p>
              Start your fitness journey by creating your first
              goal.
            </p>

            <button
              className="add-goal-button"
              onClick={openCreateForm}
            >
              <Plus size={18} />
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Goals;
