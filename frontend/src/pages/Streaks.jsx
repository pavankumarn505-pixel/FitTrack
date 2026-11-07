
import { useEffect, useState } from "react";

import {
  Activity,
  Flame,
  Trophy,
  CalendarCheck,
  CalendarDays,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  Clock,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import "./Streaks.css";

function Streaks() {
  const navigate = useNavigate();

  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStreak = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/streaks/summary");

      setStreak(response.data);
    } catch (err) {
      console.error("Streak API error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load streak information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  const formatDate = (date) => {
    if (!date) return "No workouts yet";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  if (loading) {
    return (
      <div className="streak-loading">
        <RefreshCw className="streak-spinner" size={30} />
        <p>Loading your streak information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="streak-error-container">
        <h2>Unable to Load Streaks</h2>
        <p>{error}</p>

        <button onClick={fetchStreak}>
          <RefreshCw size={17} />
          Try Again
        </button>

        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const cards = [
    {
      title: "Current Streak",
      value: streak.current_streak,
      suffix: "Days",
      description: "Your ongoing workout streak",
      icon: Flame,
      color: "orange",
    },
    {
      title: "Longest Streak",
      value: streak.longest_streak,
      suffix: "Days",
      description: "Your personal best streak",
      icon: Trophy,
      color: "purple",
    },
    {
      title: "Total Active Days",
      value: streak.total_active_days,
      suffix: "Days",
      description: "Days you completed workouts",
      icon: CalendarCheck,
      color: "green",
    },
    {
      title: "Last Workout",
      value: formatDate(streak.last_workout_date),
      suffix: "",
      description: "Your most recent workout",
      icon: CalendarDays,
      color: "blue",
    },
  ];

  return (
    <div className="streak-page">

      {/* Header */}
      <header className="streak-header">
        <div className="streak-brand">
          <div className="streak-brand-icon">
            <Activity size={25} />
          </div>

          <div>
            <h1>FitTrack</h1>
            <p>Streak Tracking</p>
          </div>
        </div>

        <button
          className="streak-back-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>
      </header>

      <main className="streak-content">

        {/* Welcome */}
        <section className="streak-welcome">
          <div>
            <span className="streak-eyebrow">
              FITNESS CONSISTENCY
            </span>

            <h2>Your Workout Streaks</h2>

            <p>
              Stay consistent, build healthy habits,
              and keep moving towards your fitness goals.
            </p>
          </div>

          <div className="streak-welcome-icon">
            <Flame size={48} />
          </div>
        </section>

        {/* Workout Today Status */}
        <section className="streak-status">
          {streak.worked_out_today ? (
            <>
              <CheckCircle size={24} />

              <div>
                <h3>Great job! Workout completed today.</h3>
                <p>Keep your fitness momentum going!</p>
              </div>
            </>
          ) : (
            <>
              <Clock size={24} />

              <div>
                <h3>Your workout for today is pending.</h3>
                <p>Complete a workout to stay consistent.</p>
              </div>
            </>
          )}
        </section>

        {/* Summary Cards */}
        <section className="streak-cards">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                className="streak-card"
                key={card.title}
              >
                <div
                  className={`streak-card-icon ${card.color}`}
                >
                  <Icon size={26} />
                </div>

                <div className="streak-card-info">
                  <h3>{card.title}</h3>

                  <div className="streak-value">
                    <strong>{card.value}</strong>
                    {card.suffix && (
                      <span>{card.suffix}</span>
                    )}
                  </div>

                  <p>{card.description}</p>
                </div>
              </article>
            );
          })}
        </section>

        {/* Motivation */}
        <section className="streak-motivation">
          <Flame size={30} />

          <div>
            <h3>Consistency is the key to success!</h3>

            <p>
              Every workout brings you one step closer
              to a healthier and stronger you.
            </p>
          </div>
        </section>

        {/* Refresh */}
        <div className="streak-refresh-container">
          <button
            className="streak-refresh-button"
            onClick={fetchStreak}
          >
            <RefreshCw size={17} />
            Refresh Streak Data
          </button>
        </div>

      </main>
    </div>
  );
}

export default Streaks;
