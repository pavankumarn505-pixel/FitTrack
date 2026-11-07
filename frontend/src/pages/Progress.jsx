
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Clock,
  Dumbbell,
  Flame,
  RefreshCw,
} from "lucide-react";

import api from "../api/axios";
import "./Progress.css";

function Progress() {
  const navigate = useNavigate();

  const [progress, setProgress] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchProgress = async () => {
    setLoading(true);
    setError("");

    try {
      const [progressResult, workoutResult] =
        await Promise.allSettled([
          api.get("/progress/today"),
          api.get("/workouts/"),
        ]);

      if (progressResult.status === "fulfilled") {
        setProgress(progressResult.value.data);
      } else if (
        progressResult.reason?.response?.status === 404
      ) {
        setProgress({
          total_workouts: 0,
          total_calories: 0,
          total_duration: 0,
        });
      } else {
        throw progressResult.reason;
      }

      if (workoutResult.status === "fulfilled") {
        const workoutData = workoutResult.value.data;

        const workoutList = Array.isArray(workoutData)
          ? workoutData
          : workoutData.workouts || [];

        setWorkouts(
          workoutList.filter(
            (workout) => workout.workout_date === todayString
          )
        );
      } else {
        setWorkouts([]);
      }
    } catch (err) {
      console.error("Progress loading error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load your daily progress. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const stats = [
    {
      title: "Total Workouts",
      value: progress?.total_workouts ?? 0,
      description: "Workouts completed today",
      icon: Dumbbell,
      className: "progress-workouts",
    },
    {
      title: "Calories Burned",
      value: Number(progress?.total_calories ?? 0).toLocaleString("en-IN"),
      description: "Total calories burned",
      icon: Flame,
      className: "progress-calories",
    },
    {
      title: "Workout Duration",
      value: `${progress?.total_duration ?? 0} min`,
      description: "Total exercise duration",
      icon: Clock,
      className: "progress-duration",
    },
  ];

  if (loading) {
    return (
      <div className="progress-loading">
        <Activity size={32} />
        <p>Loading your daily progress...</p>
      </div>
    );
  }

  return (
    <div className="progress-page">
      <header className="progress-header">
        <div className="progress-brand">
          <Activity size={27} />
          <span>FitTrack</span>
        </div>

        <button
          className="progress-back-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>
      </header>

      <main className="progress-content">
        <section className="progress-heading">
          <div>
            <p className="progress-eyebrow">
              FITNESS ANALYTICS
            </p>

            <h1>Daily Progress</h1>

            <p>
              Track your daily workouts, calories and activity.
            </p>
          </div>

          <button
            className="progress-refresh-button"
            onClick={fetchProgress}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </section>

        <section className="progress-date">
          <CalendarDays size={21} />
          <span>{formattedDate}</span>
        </section>

        {error && (
          <div className="progress-error">
            {error}
            <button onClick={fetchProgress}>Retry</button>
          </div>
        )}

        <section className="progress-stats">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                className="progress-stat-card"
                key={stat.title}
              >
                <div className={`progress-stat-icon ${stat.className}`}>
                  <Icon size={25} />
                </div>

                <p>{stat.title}</p>

                <h2>{stat.value}</h2>

                <span>{stat.description}</span>
              </div>
            );
          })}
        </section>

        <section className="progress-summary">
          <div className="progress-section-heading">
            <div>
              <h2>Today's Workout Summary</h2>
              <p>Your completed fitness activities</p>
            </div>

            <Dumbbell size={25} />
          </div>

          {workouts.length === 0 ? (
            <div className="progress-empty">
              <Activity size={40} />
              <h3>No workouts recorded today</h3>
              <p>
                Start a workout to see your daily activity summary.
              </p>

              <button onClick={() => navigate("/workouts")}>
                Manage Workouts
              </button>
            </div>
          ) : (
            <div className="progress-workout-list">
              {workouts.map((workout) => (
                <div
                  className="progress-workout-item"
                  key={workout.id}
                >
                  <div className="progress-workout-icon">
                    <Dumbbell size={22} />
                  </div>

                  <div className="progress-workout-info">
                    <h3>{workout.workout_name}</h3>
                    <span>{workout.category}</span>
                  </div>

                  <div className="progress-workout-details">
                    <span>
                      <Clock size={15} />
                      {workout.duration} min
                    </span>

                    <span>
                      <Flame size={15} />
                      {workout.calories_burned} kcal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Progress;
