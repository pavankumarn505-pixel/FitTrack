
import { useEffect, useState } from "react";

import {
  Activity,
  CalendarDays,
  Clock,
  Plus,
  Pencil,
  RefreshCw,
  X,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import api from "../api/axios";
import "./WorkoutPlanner.css";

// Get today's date in YYYY-MM-DD format
const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Format date as YYYY-MM-DD
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Convert scheduled date and time into a local Date object
const getScheduledDateTime = (plan) => {
  if (!plan.scheduled_date) return null;

  const time = (plan.scheduled_time || "00:00").slice(0, 5);

  const scheduledDateTime = new Date(
    `${plan.scheduled_date}T${time}:00`
  );

  return Number.isNaN(scheduledDateTime.getTime())
    ? null
    : scheduledDateTime;
};

// Generate calendar days (Monday to Sunday)
const getCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const mondayOffset = (firstDay.getDay() + 6) % 7;

  const totalCells =
    Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - mondayOffset + 1;

    if (day < 1 || day > daysInMonth) {
      return null;
    }

    return new Date(year, month, day);
  });
};

// Initial form values
const initialForm = {
  plan_name: "",
  workout_name: "",
  category: "Cardio",
  duration: "",
  scheduled_date: getToday(),
  scheduled_time: "07:30",
  notes: "",
  status: "Scheduled",
};

function WorkoutPlanner() {
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();

    return new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
  });

  const [selectedDate, setSelectedDate] = useState(getToday());

  // FETCH WORKOUT PLANS
  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/workout-plans/");

      setPlans(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load workout plans. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // HANDLE FORM INPUT CHANGES
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // RESET FORM
  // preserveSuccess keeps the success message after saving.
  const resetForm = ({ preserveSuccess = false } = {}) => {
    setFormData({
      ...initialForm,
      scheduled_date: getToday(),
    });

    setEditingId(null);
    setError("");

    if (!preserveSuccess) {
      setSuccess("");
    }
  };

  // CREATE OR UPDATE WORKOUT PLAN
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const duration = Number(formData.duration);

      if (
        !Number.isInteger(duration) ||
        duration < 1 ||
        duration > 1440
      ) {
        setError("Duration must be between 1 and 1440 minutes.");
        return;
      }

      if (!formData.plan_name.trim()) {
        setError("Please enter a plan name.");
        return;
      }

      if (!formData.workout_name.trim()) {
        setError("Please enter a workout name.");
        return;
      }

      if (formData.scheduled_date < getToday()) {
        setError("Please select today or a future date.");
        return;
      }

      // Prevent scheduling a workout in the past
      const selectedDateTime = new Date(
        `${formData.scheduled_date}T${formData.scheduled_time}:00`
      );

      if (
        Number.isNaN(selectedDateTime.getTime()) ||
        selectedDateTime < new Date()
      ) {
        setError("Please select a future workout date and time.");
        return;
      }

      const payload = {
        plan_name: formData.plan_name.trim(),
        workout_name: formData.workout_name.trim(),
        category: formData.category,
        duration,
        scheduled_date: formData.scheduled_date,

        scheduled_time:
          formData.scheduled_time.length === 5
            ? `${formData.scheduled_time}:00`
            : formData.scheduled_time,

        notes: formData.notes.trim(),
      };

      if (editingId !== null) {
        payload.status = formData.status;

        await api.patch(
          `/workout-plans/${editingId}`,
          payload
        );

        setSuccess("Workout plan updated successfully!");
      } else {
        await api.post("/workout-plans/", payload);

        setSuccess("Workout plan created successfully!");
      }

      setSelectedDate(formData.scheduled_date);

      // Reset fields without clearing the success message
      resetForm({ preserveSuccess: true });

      await fetchPlans();

    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to save workout plan. Please check your inputs."
      );
    } finally {
      setSaving(false);
    }
  };

  // EDIT WORKOUT PLAN
  const handleEdit = (plan) => {
    setEditingId(plan.id);

    setFormData({
      plan_name: plan.plan_name || "",
      workout_name: plan.workout_name || "",
      category: plan.category || "Cardio",
      duration: String(plan.duration || ""),
      scheduled_date: plan.scheduled_date,
      scheduled_time: plan.scheduled_time?.slice(0, 5) || "07:30",
      notes: plan.notes || "",
      status: plan.status || "Scheduled",
    });

    setSelectedDate(plan.scheduled_date);

    const planDate = new Date(
      `${plan.scheduled_date}T00:00:00`
    );

    setCurrentMonth(
      new Date(
        planDate.getFullYear(),
        planDate.getMonth(),
        1
      )
    );

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // CALENDAR NAVIGATION
  const previousMonth = () => {
    setCurrentMonth((previous) =>
      new Date(
        previous.getFullYear(),
        previous.getMonth() - 1,
        1
      )
    );
  };

  const nextMonth = () => {
    setCurrentMonth((previous) =>
      new Date(
        previous.getFullYear(),
        previous.getMonth() + 1,
        1
      )
    );
  };

  const goToToday = () => {
    const today = new Date();

    setCurrentMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    setSelectedDate(getToday());
  };

  // UPCOMING WORKOUTS
  // Includes only scheduled workouts whose date AND time are in the future.
  const now = new Date();

  const upcomingPlans = plans
    .filter((plan) => {
      if (plan.status !== "Scheduled") {
        return false;
      }

      const scheduledDateTime = getScheduledDateTime(plan);

      return scheduledDateTime && scheduledDateTime >= now;
    })
    .sort((a, b) => {
      const dateA = getScheduledDateTime(a);
      const dateB = getScheduledDateTime(b);

      return dateA - dateB;
    });

  // TOTAL UPCOMING DURATION
  const totalDuration = upcomingPlans.reduce(
    (total, plan) => total + Number(plan.duration || 0),
    0
  );

  // CALENDAR DATA
  const calendarDays = getCalendarDays(currentMonth);

  const monthLabel = currentMonth.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  const selectedDatePlans = plans
    .filter(
      (plan) => plan.scheduled_date === selectedDate
    )
    .sort((a, b) =>
      (a.scheduled_time || "").localeCompare(
        b.scheduled_time || ""
      )
    );

  // UI
  return (
    <div className="planner-page">

      {/* HEADER */}
      <header className="planner-header">

        <div className="planner-brand">
          <Activity size={27} />
          <span>FitTrack</span>
        </div>

        <a href="/dashboard" className="planner-back">
          Back to Dashboard
        </a>

      </header>

      <main className="planner-content">

        {/* PAGE HEADING */}
        <section className="planner-heading">

          <div>
            <p className="planner-eyebrow">
              FITNESS MANAGEMENT
            </p>

            <h1>Workout Planner</h1>

            <p>
              Plan your workouts, schedule sessions and
              stay consistent with your fitness goals.
            </p>
          </div>

          <CalendarDays size={46} />

        </section>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="planner-message planner-error">
            {error}
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="planner-message planner-success">
            {success}
          </div>
        )}

        {/* STATISTICS */}
        <section className="planner-stats">

          <div className="planner-stat-card">
            <CalendarDays />
            <span>Total Plans</span>
            <h2>{plans.length}</h2>
          </div>

          <div className="planner-stat-card">
            <Activity />
            <span>Upcoming Workouts</span>
            <h2>{upcomingPlans.length}</h2>
          </div>

          <div className="planner-stat-card">
            <Clock />
            <span>Scheduled Duration</span>
            <h2>{totalDuration} min</h2>
          </div>

        </section>

        {/* WORKOUT CALENDAR */}
        <section className="planner-calendar-card">

          <div className="planner-section-heading">

            <div>
              <h2>Workout Calendar</h2>
              <p>
                View and manage your scheduled workout dates.
              </p>
            </div>

            <button
              type="button"
              className="planner-refresh"
              onClick={goToToday}
            >
              Today
            </button>

          </div>

          {/* MONTH NAVIGATION */}
          <div className="calendar-navigation">

            <button
              type="button"
              onClick={previousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft size={21} />
            </button>

            <h3>{monthLabel}</h3>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
            >
              <ChevronRight size={21} />
            </button>

          </div>

          {/* WEEKDAYS */}
          <div className="calendar-grid calendar-weekdays">

            {[
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
              "Sun",
            ].map((day) => (
              <div key={day}>{day}</div>
            ))}

          </div>

          {/* CALENDAR DATES */}
          <div className="calendar-grid">

            {calendarDays.map((date, index) => {

              if (!date) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="calendar-day calendar-empty"
                  />
                );
              }

              const dateKey = formatDateKey(date);

              const dayPlans = plans.filter(
                (plan) => plan.scheduled_date === dateKey
              );

              const isSelected = selectedDate === dateKey;
              const isToday = getToday() === dateKey;

              return (
                <button
                  type="button"
                  key={dateKey}
                  className={`calendar-day ${
                    isSelected ? "calendar-selected" : ""
                  } ${isToday ? "calendar-today" : ""}`}
                  onClick={() => setSelectedDate(dateKey)}
                  aria-label={`${dateKey}, ${dayPlans.length} workouts`}
                  aria-pressed={isSelected}
                >

                  <span>{date.getDate()}</span>

                  {dayPlans.length > 0 && (
                    <span className="calendar-workout-indicator">
                      {dayPlans.length}
                    </span>
                  )}

                </button>
              );
            })}

          </div>

          {/* SELECTED DATE WORKOUTS */}
          <div className="calendar-selected-workouts">

            <h3>
              Workouts for{" "}
              {new Date(
                `${selectedDate}T00:00:00`
              ).toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h3>

            {selectedDatePlans.length === 0 ? (

              <p className="planner-empty">
                No workouts scheduled for this date.
              </p>

            ) : (

              <div className="planner-list">

                {selectedDatePlans.map((plan) => (

                  <article
                    className="planner-workout-item"
                    key={plan.id}
                  >

                    <div className="planner-workout-icon">
                      <Dumbbell size={23} />
                    </div>

                    <div className="planner-workout-details">

                      <h3>{plan.plan_name}</h3>

                      <p>
                        {plan.workout_name} · {plan.category}
                      </p>

                      <div className="planner-workout-meta">

                        <span>
                          <Clock size={14} />
                          {plan.scheduled_time?.slice(0, 5) || "—"}
                        </span>

                        <span>
                          {plan.duration} minutes
                        </span>

                      </div>

                    </div>

                    <div className="planner-workout-actions">

                      <span className="planner-status">
                        {plan.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleEdit(plan)}
                        title="Edit workout plan"
                      >
                        <Pencil size={17} />
                      </button>

                    </div>

                  </article>

                ))}

              </div>

            )}

          </div>

        </section>

        {/* CREATE / UPDATE FORM */}
        <section className="planner-form-card">

          <div className="planner-section-heading">

            <h2>
              {editingId !== null
                ? "Edit Workout Plan"
                : "Create Workout Plan"}
            </h2>

            {editingId !== null && (
              <button
                type="button"
                className="planner-cancel"
                onClick={resetForm}
              >
                <X size={16} />
                Cancel
              </button>
            )}

          </div>

          <form onSubmit={handleSubmit}>

            <div className="planner-form-grid">

              <div className="planner-field">
                <label>Plan Name</label>

                <input
                  type="text"
                  name="plan_name"
                  value={formData.plan_name}
                  onChange={handleChange}
                  placeholder="e.g. Morning Fitness Plan"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>

              <div className="planner-field">
                <label>Workout Name</label>

                <input
                  type="text"
                  name="workout_name"
                  value={formData.workout_name}
                  onChange={handleChange}
                  placeholder="e.g. Running"
                  required
                />
              </div>

              <div className="planner-field">
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

              <div className="planner-field">
                <label>Duration (minutes)</label>

                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  max="1440"
                  placeholder="30"
                  required
                />
              </div>

              <div className="planner-field">
                <label>Scheduled Date</label>

                <input
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  min={getToday()}
                  required
                />
              </div>

              <div className="planner-field">
                <label>Scheduled Time</label>

                <input
                  type="time"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="planner-field planner-full-width">
                <label>Notes</label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add workout instructions or notes..."
                  rows={3}
                />
              </div>

              {editingId !== null && (
                <div className="planner-field">

                  <label>Status</label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                </div>
              )}

            </div>

            <button
              type="submit"
              className="planner-submit"
              disabled={saving}
            >

              {editingId !== null ? (
                <Pencil size={18} />
              ) : (
                <Plus size={18} />
              )}

              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Plan"
                  : "Create Workout Plan"}

            </button>

          </form>

        </section>

        {/* UPCOMING WORKOUT LIST */}
        <section className="planner-list-card">

          <div className="planner-section-heading">

            <div>
              <h2>Upcoming Workouts</h2>

              <p>
                Your future scheduled workout sessions.
              </p>
            </div>

            <button
              type="button"
              className="planner-refresh"
              onClick={fetchPlans}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>

          </div>

          {loading ? (

            <p className="planner-empty">
              Loading workout plans...
            </p>

          ) : upcomingPlans.length === 0 ? (

            <p className="planner-empty">
              No upcoming workouts. Create your first plan!
            </p>

          ) : (

            <div className="planner-list">

              {upcomingPlans.map((plan) => (

                <article
                  className="planner-workout-item"
                  key={plan.id}
                >

                  <div className="planner-workout-icon">
                    <Dumbbell size={23} />
                  </div>

                  <div className="planner-workout-details">

                    <h3>{plan.plan_name}</h3>

                    <p>
                      {plan.workout_name} · {plan.category}
                    </p>

                    <div className="planner-workout-meta">

                      <span>
                        <CalendarDays size={14} />
                        {plan.scheduled_date}
                      </span>

                      <span>
                        <Clock size={14} />
                        {plan.scheduled_time?.slice(0, 5) || "—"}
                      </span>

                      <span>
                        {plan.duration} minutes
                      </span>

                    </div>

                    {plan.notes && (
                      <p className="planner-notes">
                        {plan.notes}
                      </p>
                    )}

                  </div>

                  <div className="planner-workout-actions">

                    <span className="planner-status">
                      {plan.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleEdit(plan)}
                      title="Edit workout plan"
                    >
                      <Pencil size={17} />
                    </button>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default WorkoutPlanner;
