import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Activity,
  Trophy,
  Medal,
  LockKeyhole,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Award,
} from "lucide-react";

import api from "../api/axios";
import "./Achievements.css";

function Achievements() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch achievement progress and unlocked badges
  const fetchAchievements = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      setError("");

      const [progressResponse, unlockedResponse] =
        await Promise.all([
          api.get("/achievements/progress"),
          api.get("/achievements/"),
        ]);

      setSummary(progressResponse.data);
      setUnlockedBadges(unlockedResponse.data);
    } catch (err) {
      console.error("Achievement API error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load achievements. Please try again."
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  // Manually check and unlock achievements
  const handleCheckAchievements = async () => {
    try {
      setChecking(true);
      setError("");
      setSuccess("");

      const response = await api.post("/achievements/check");

      await fetchAchievements(false);

      setSuccess(
        response.data.length > 0
          ? `${response.data.length} new achievement(s) unlocked!`
          : "Achievement check completed. No new badges unlocked yet."
      );
    } catch (err) {
      console.error("Achievement check error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to check achievements. Please try again."
      );
    } finally {
      setChecking(false);
    }
  };

  // Format achievement values
  const formatValue = (value, badgeCode) => {
    if (badgeCode === "CALORIE_CRUSHER") {
      return `${Number(value).toLocaleString("en-IN")} kcal`;
    }

    return Number(value).toLocaleString("en-IN");
  };

  // Format unlocked date
  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Loading screen
  if (loading) {
    return (
      <div className="achievement-loading">
        <RefreshCw className="achievement-spinner" size={30} />
        <p>Loading your achievements...</p>
      </div>
    );
  }

  // Error screen
  if (error && !summary) {
    return (
      <div className="achievement-error">
        <h2>Unable to Load Achievements</h2>
        <p>{error}</p>

        <button onClick={() => fetchAchievements()}>
          <RefreshCw size={17} />
          Try Again
        </button>

        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const achievements = summary?.achievements || [];

  const totalBadges = summary?.total_badges || 0;
  const unlockedCount = summary?.unlocked_badges || 0;
  const lockedCount = Math.max(0, totalBadges - unlockedCount);

  // Cross-check unlocked badges from both API responses
  const unlockedCodes = new Set(
    unlockedBadges.map((badge) => badge.badge_code)
  );

  // Badge icons
  const badgeIcons = {
    WORKOUT_WARRIOR: Activity,
    CONSISTENCY_CHAMPION: Trophy,
    CALORIE_CRUSHER: Medal,
  };

  return (
    <div className="achievement-page">
      {/* Header */}
      <header className="achievement-header">
        <div className="achievement-brand">
          <div className="achievement-brand-icon">
            <Trophy size={25} />
          </div>

          <div>
            <h1>FitTrack</h1>
            <p>Achievement Badges</p>
          </div>
        </div>

        <button
          className="achievement-back-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>
      </header>

      <main className="achievement-content">
        {/* Welcome Section */}
        <section className="achievement-welcome">
          <div>
            <span className="achievement-eyebrow">
              FITNESS MILESTONES
            </span>

            <h2>Your Achievements</h2>

            <p>
              Celebrate every milestone, challenge yourself,
              and unlock new badges as you progress.
            </p>
          </div>

          <div className="achievement-welcome-icon">
            <Trophy size={58} />
          </div>
        </section>

        {/* Error and Success Messages */}
        {error && (
          <div className="achievement-alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="achievement-alert success">
            <CheckCircle2 size={19} />
            {success}
          </div>
        )}

        {/* Summary Cards */}
        <section className="achievement-summary">
          <article className="achievement-summary-card">
            <div className="achievement-summary-icon purple">
              <Trophy size={25} />
            </div>

            <div>
              <p>Unlocked</p>
              <h3>{unlockedCount}</h3>
              <span>Badges earned</span>
            </div>
          </article>

          <article className="achievement-summary-card">
            <div className="achievement-summary-icon orange">
              <LockKeyhole size={25} />
            </div>

            <div>
              <p>Locked</p>
              <h3>{lockedCount}</h3>
              <span>Still to achieve</span>
            </div>
          </article>

          <article className="achievement-summary-card">
            <div className="achievement-summary-icon blue">
              <Award size={25} />
            </div>

            <div>
              <p>Total Badges</p>
              <h3>{totalBadges}</h3>
              <span>Available achievements</span>
            </div>
          </article>
        </section>

        {/* Overall Progress */}
        <section className="achievement-overall">
          <div className="achievement-overall-heading">
            <div>
              <h3>Overall Achievement Progress</h3>
              <p>
                Keep working towards your fitness milestones.
              </p>
            </div>

            <strong>
              {totalBadges > 0
                ? Math.round(
                    (unlockedCount / totalBadges) * 100
                  )
                : 0}
              %
            </strong>
          </div>

          <div className="achievement-progress-track">
            <div
              className="achievement-progress-fill overall-fill"
              style={{
                width: `${
                  totalBadges > 0
                    ? (unlockedCount / totalBadges) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          <p className="achievement-overall-caption">
            {unlockedCount} of {totalBadges} badges unlocked
          </p>
        </section>

        {/* Achievement Cards */}
        <section className="achievement-list-section">
          <div className="achievement-section-heading">
            <div>
              <span>YOUR COLLECTION</span>
              <h2>Available Badges</h2>
            </div>
          </div>

          <div className="achievement-grid">
            {achievements.map((badge) => {
              const Icon =
                badgeIcons[badge.badge_code] || Award;

              const percentage =
                badge.target_value > 0
                  ? Math.min(
                      100,
                      (badge.current_value / badge.target_value) *
                        100
                    )
                  : 0;

              // Check both API responses for unlocked status
              const unlocked =
                badge.is_unlocked ||
                unlockedCodes.has(badge.badge_code);

              return (
                <article
                  className={`achievement-card ${
                    unlocked ? "unlocked" : "locked"
                  }`}
                  key={badge.badge_code}
                >
                  <div className="achievement-card-top">
                    <div
                      className={`achievement-badge-icon ${
                        unlocked ? "earned" : "pending"
                      }`}
                    >
                      {unlocked ? (
                        <Icon size={34} />
                      ) : (
                        <LockKeyhole size={30} />
                      )}
                    </div>

                    <span
                      className={`achievement-status ${
                        unlocked
                          ? "earned-status"
                          : "locked-status"
                      }`}
                    >
                      {unlocked ? "UNLOCKED" : "LOCKED"}
                    </span>
                  </div>

                  <h3>{badge.badge_name}</h3>

                  <p className="achievement-description">
                    {badge.description}
                  </p>

                  {unlocked ? (
                    <div className="achievement-earned-info">
                      <CheckCircle2 size={17} />
                      <span>Unlocked successfully</span>
                    </div>
                  ) : (
                    <div className="achievement-card-progress">
                      <div className="achievement-progress-label">
                        <span>Progress</span>

                        <strong>
                          {formatValue(
                            badge.current_value,
                            badge.badge_code
                          )}{" "}
                          /{" "}
                          {formatValue(
                            badge.target_value,
                            badge.badge_code
                          )}
                        </strong>
                      </div>

                      <div className="achievement-progress-track">
                        <div
                          className="achievement-progress-fill"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <p>
                        {Math.round(percentage)}% completed
                      </p>
                    </div>
                  )}

                  {unlocked && badge.unlocked_at && (
                    <div className="achievement-unlocked-date">
                      Earned on {formatDate(badge.unlocked_at)}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* Motivation */}
        <section className="achievement-motivation">
          <Sparkles size={30} />

          <div>
            <h3>Every milestone matters!</h3>
            <p>
              Stay consistent, complete workouts, and
              unlock every achievement in FitTrack.
            </p>
          </div>
        </section>

        {/* Actions */}
        <div className="achievement-actions">
          <button
            className="achievement-check-button"
            onClick={handleCheckAchievements}
            disabled={checking}
          >
            <Trophy size={18} />

            {checking
              ? "Checking Achievements..."
              : "Check Achievements"}
          </button>

          <button
            className="achievement-refresh-button"
            onClick={() => fetchAchievements()}
            disabled={checking}
          >
            <RefreshCw size={17} />
            Refresh Data
          </button>
        </div>
      </main>
    </div>
  );
}

export default Achievements;