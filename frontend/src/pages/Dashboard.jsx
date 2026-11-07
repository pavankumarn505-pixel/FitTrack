
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Activity,
  Dumbbell,
  HeartPulse,
  LogOut,
  User,
  ArrowRight,
  Target,
  BarChart3,
  Bell,
  CalendarDays,
  BookOpen,
  GitCompareArrows,
  Flame,
  Trophy,
  Clock3,
  Award,
} from "lucide-react";

import api from "../api/axios";

// =====================================
// DASHBOARD HELPERS
// =====================================

const panelStyle = {
  background: "var(--card-bg, #162033)",
  border: "1px solid var(--border-color, #29384d)",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "24px",
};

const sectionTitleStyle = {
  fontSize: "20px",
  fontWeight: "700",
  marginBottom: "18px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
  marginBottom: "20px",
};

const miniStatStyle = {
  background: "rgba(100, 116, 139, 0.12)",
  border: "1px solid var(--border-color, #29384d)",
  padding: "14px",
  borderRadius: "10px",
};

const progressTrackStyle = {
  width: "100%",
  height: "9px",
  background: "rgba(148, 163, 184, 0.2)",
  borderRadius: "20px",
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  background: "#10b981",
  borderRadius: "20px",
  transition: "width 0.3s ease",
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString();

const formatDate = (value) => {
  if (!value) return "—";

  const parsed = new Date(
    `${value.toString().slice(0, 10)}T00:00:00`
  );

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getPercentage = (current, target) => {
  const currentNumber = Number(current || 0);
  const targetNumber = Number(target || 0);

  if (targetNumber <= 0) return 0;

  return Math.min(
    100,
    Math.max(0, (currentNumber / targetNumber) * 100)
  );
};

const getStatusColor = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "COMPLETED") {
    return {
      background: "rgba(16, 185, 129, 0.15)",
      color: "#10b981",
    };
  }

  if (
    normalized === "OVERDUE" ||
    normalized === "EXPIRED"
  ) {
    return {
      background: "rgba(239, 68, 68, 0.15)",
      color: "#ef4444",
    };
  }

  return {
    background: "rgba(59, 130, 246, 0.15)",
    color: "#60a5fa",
  };
};

// =====================================
// DAILY ACTIVITY CHART
// =====================================

function DailyActivityChart({ data = [], monthly = false }) {
  const maximum = Math.max(
    1,
    ...data.map((item) => Number(item.total_workouts || 0))
  );

  if (!data.length) {
    return <p>No activity data available.</p>;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: monthly ? "5px" : "12px",
        minHeight: "150px",
        overflowX: "auto",
        padding: "15px 4px 5px",
      }}
    >
      {data.map((item, index) => {
        const count = Number(item.total_workouts || 0);

        const height =
          count === 0
            ? 4
            : Math.max(12, (count / maximum) * 105);

        const day = new Date(`${item.date}T00:00:00`);

        const label = monthly
          ? index === 0 ||
            (index + 1) % 5 === 0 ||
            index === data.length - 1
            ? day.getDate()
            : ""
          : day.toLocaleDateString("en-IN", {
              weekday: "short",
            });

        return (
          <div
            key={item.date}
            title={`${item.date}: ${count} workouts, ${formatNumber(
              item.total_calories
            )} calories, ${item.total_duration} minutes`}
            style={{
              flex: monthly ? "0 0 18px" : "1 0 0",
              minWidth: monthly ? "18px" : "28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: "#94a3b8",
              }}
            >
              {count || ""}
            </span>

            <div
              style={{
                height: "105px",
                width: "100%",
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${height}px`,
                  background: count > 0 ? "#10b981" : "#334155",
                  borderRadius: "5px 5px 2px 2px",
                  minHeight: "4px",
                }}
              />
            </div>

            <span
              style={{
                fontSize: "10px",
                color: "#94a3b8",
                minHeight: "14px",
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// =====================================
// MAIN DASHBOARD
// =====================================

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const [personalizedData, setPersonalizedData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  // =====================================
  // FETCH AUTHENTICATED USER
  // =====================================

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/", { replace: true });
        return;
      }

      try {
        const response = await api.get("/auth/me");

        setUser(response.data);

        localStorage.setItem(
          "user",
          JSON.stringify(response.data)
        );
      } catch (error) {
        console.error("User authentication error:", error);

        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // =====================================
  // FETCH NOTIFICATIONS
  // =====================================

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get(
          "/notifications/unread-count"
        );

        setUnreadCount(response.data.unread_count || 0);
      } catch (error) {
        console.error(
          "Unable to fetch notification count:",
          error
        );
      }
    };

    if (localStorage.getItem("access_token")) {
      fetchUnreadCount();
    }
  }, []);

  // =====================================
  // FETCH PERSONALIZED DASHBOARD
  // =====================================

  useEffect(() => {
    const fetchPersonalizedDashboard = async () => {
      try {
        const response = await api.get(
          "/dashboard/personalized"
        );

        setPersonalizedData(response.data);
        setDashboardError("");
      } catch (error) {
        console.error(
          "Unable to fetch personalized dashboard:",
          error
        );

        setDashboardError(
          "Unable to load personalized dashboard data."
        );
      } finally {
        setDashboardLoading(false);
      }
    };

    if (localStorage.getItem("access_token")) {
      fetchPersonalizedDashboard();
    } else {
      setDashboardLoading(false);
    }
  }, []);

  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/", { replace: true });
  };

  // =====================================
  // NAVIGATION
  // =====================================

  const openWorkouts = () => navigate("/workouts");
  const openProgress = () => navigate("/progress");
  const openGoals = () => navigate("/goals");
  const openAnalytics = () => navigate("/analytics");

  const openProgressComparison = () =>
    navigate("/progress-comparison");

  const openNotifications = () =>
    navigate("/notifications");

  const openWorkoutPlanner = () =>
    navigate("/workout-planner");

  const openExerciseLibrary = () =>
    navigate("/exercise-library");

  const openStreaks = () => navigate("/streaks");

  const openAchievements = () =>
    navigate("/achievements");

  const handleCardKeyDown = (event, action) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading your dashboard...
      </div>
    );
  }

  // =====================================
  // DASHBOARD DATA
  // =====================================

  const analytics = personalizedData?.analytics;
  const streak = personalizedData?.streak;

  const achievementProgress =
    personalizedData?.achievement_progress;

  const weekly = personalizedData?.weekly_statistics;
  const monthly = personalizedData?.monthly_statistics;

  const achievements =
    achievementProgress?.achievements || [];

  const goals = personalizedData?.goals || [];

  return (
    <div className="dashboard-container">

      {/* ================================= */}
      {/* DASHBOARD HEADER */}
      {/* ================================= */}

      <header className="dashboard-header">

        <div className="dashboard-brand">
          <div className="logo-icon">
            <Activity size={24} />
          </div>

          <span>FitTrack</span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="logout-button"
            onClick={openNotifications}
            aria-label={`Notifications, ${unreadCount} unread`}
          >
            <Bell size={18} />
            Notifications

            {unreadCount > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#ffffff",
                  borderRadius: "50%",
                  minWidth: "22px",
                  height: "22px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "0 5px",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

      </header>

      <main className="dashboard-content">

        {/* ================================= */}
        {/* WELCOME SECTION */}
        {/* ================================= */}

        <section className="welcome-section">

          <div>
            <p className="dashboard-eyebrow">
              FITNESS OVERVIEW
            </p>

            <h1>
              Welcome,{" "}
              {user?.username || user?.full_name || "User"}!
            </h1>

            <p className="welcome-description">
              Your fitness journey starts here.
              Stay active and track your progress.
            </p>
          </div>

          <div className="profile-icon">
            <User size={28} />
          </div>

        </section>

        {/* ================================= */}
        {/* PERSONALIZED FITNESS SUMMARY */}
        {/* ================================= */}

        <section className="dashboard-summary-section">

          <h2>Personalized Fitness Summary</h2>

          {dashboardLoading ? (
            <p>Loading fitness summary...</p>
          ) : dashboardError ? (
            <p>{dashboardError}</p>
          ) : (
            <div className="dashboard-cards">

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <Dumbbell size={24} />
                </div>

                <h3>Total Workouts</h3>

                <h2>
                  {analytics?.total_workouts ?? 0}
                </h2>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <Flame size={24} />
                </div>

                <h3>Total Calories</h3>

                <h2>
                  {formatNumber(analytics?.total_calories)}
                </h2>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <Activity size={24} />
                </div>

                <h3>Total Duration</h3>

                <h2>
                  {analytics?.total_duration ?? 0} min
                </h2>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <Flame size={24} />
                </div>

                <h3>Current Streak</h3>

                <h2>
                  {streak?.current_streak ?? 0} Days
                </h2>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <Trophy size={24} />
                </div>

                <h3>Unlocked Achievements</h3>

                <h2>
                  {achievementProgress?.unlocked_badges ?? 0}
                  {" / "}
                  {achievementProgress?.total_badges ?? 0}
                </h2>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon">
                  <Target size={24} />
                </div>

                <h3>Weekly Workouts</h3>

                <h2>
                  {weekly?.total_workouts ?? 0}
                </h2>
              </div>

            </div>
          )}

        </section>

        {/* ================================= */}
        {/* UPCOMING WORKOUTS */}
        {/* ================================= */}

        {!dashboardLoading && personalizedData && (
          <section className="account-section">

            <h2>Upcoming Workouts</h2>

            {personalizedData.upcoming_workouts?.length > 0 ? (
              personalizedData.upcoming_workouts.map(
                (workout) => (
                  <div
                    className="account-details"
                    key={workout.id}
                  >
                    <div>
                      <span>Workout</span>
                      <strong>{workout.workout_name}</strong>
                    </div>

                    <div>
                      <span>Category</span>
                      <strong>{workout.category}</strong>
                    </div>

                    <div>
                      <span>Date</span>
                      <strong>{workout.scheduled_date}</strong>
                    </div>

                    <div>
                      <span>Duration</span>
                      <strong>{workout.duration} minutes</strong>
                    </div>
                  </div>
                )
              )
            ) : (
              <p>No upcoming workouts scheduled.</p>
            )}

          </section>
        )}

        {/* ================================= */}
        {/* 1. WEEKLY STATISTICS */}
        {/* ================================= */}

        {!dashboardLoading && !dashboardError && (
          <section style={panelStyle}>

            <h2 style={sectionTitleStyle}>
              <Activity
                size={21}
                style={{
                  verticalAlign: "middle",
                  marginRight: "8px",
                  color: "#10b981",
                }}
              />
              Weekly Workout Statistics
            </h2>

            <p style={{ color: "#94a3b8" }}>
              {formatDate(weekly?.start_date)}
              {" — "}
              {formatDate(weekly?.end_date)}
            </p>

            <div style={statsGridStyle}>

              <div style={miniStatStyle}>
                <Dumbbell color="#10b981" size={20} />
                <p>Total Workouts</p>
                <h2>{weekly?.total_workouts ?? 0}</h2>
              </div>

              <div style={miniStatStyle}>
                <Flame color="#f59e0b" size={20} />
                <p>Calories Burned</p>
                <h2>
                  {formatNumber(weekly?.total_calories)}
                </h2>
              </div>

              <div style={miniStatStyle}>
                <Clock3 color="#60a5fa" size={20} />
                <p>Total Duration</p>
                <h2>{weekly?.total_duration ?? 0} min</h2>
              </div>

            </div>

            <h3 style={{ fontSize: "15px" }}>
              Daily Workout Activity
            </h3>

            <DailyActivityChart
              data={weekly?.daily_breakdown || []}
            />

          </section>
        )}

        {/* ================================= */}
        {/* 2. MONTHLY STATISTICS */}
        {/* ================================= */}

        {!dashboardLoading && !dashboardError && (
          <section style={panelStyle}>

            <h2 style={sectionTitleStyle}>
              <CalendarDays
                size={21}
                style={{
                  verticalAlign: "middle",
                  marginRight: "8px",
                  color: "#10b981",
                }}
              />
              Monthly Workout Statistics
            </h2>

            <p style={{ color: "#94a3b8" }}>
              {monthly?.month_name || "Current Month"}
              {" "}
              {monthly?.year || ""}
            </p>

            <div style={statsGridStyle}>

              <div style={miniStatStyle}>
                <Dumbbell color="#10b981" size={20} />
                <p>Total Workouts</p>
                <h2>{monthly?.total_workouts ?? 0}</h2>
              </div>

              <div style={miniStatStyle}>
                <Flame color="#f59e0b" size={20} />
                <p>Calories Burned</p>
                <h2>
                  {formatNumber(monthly?.total_calories)}
                </h2>
              </div>

              <div style={miniStatStyle}>
                <Clock3 color="#60a5fa" size={20} />
                <p>Total Duration</p>
                <h2>{monthly?.total_duration ?? 0} min</h2>
              </div>

            </div>

            <h3 style={{ fontSize: "15px" }}>
              Daily Monthly Activity
            </h3>

            <DailyActivityChart
              data={monthly?.daily_breakdown || []}
              monthly
            />

          </section>
        )}

        {/* ================================= */}
        {/* 3. ACHIEVEMENT PROGRESS */}
        {/* ================================= */}

        {!dashboardLoading && !dashboardError && (
          <section style={panelStyle}>

            <h2 style={sectionTitleStyle}>
              <Trophy
                size={21}
                style={{
                  verticalAlign: "middle",
                  marginRight: "8px",
                  color: "#f59e0b",
                }}
              />
              Achievement Progress
            </h2>

            <p style={{ color: "#94a3b8" }}>
              Unlocked{" "}
              {achievementProgress?.unlocked_badges ?? 0}
              {" / "}
              {achievementProgress?.total_badges ?? 0}
              {" achievements"}
            </p>

            {achievements.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(230px, 1fr))",
                  gap: "15px",
                }}
              >

                {achievements.map((achievement) => {
                  const percentage = getPercentage(
                    achievement.current_value,
                    achievement.target_value
                  );

                  return (
                    <div
                      key={achievement.badge_code}
                      style={{
                        ...miniStatStyle,
                        padding: "18px",
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "12px",
                        }}
                      >
                        <Award
                          size={25}
                          color={
                            achievement.is_unlocked
                              ? "#f59e0b"
                              : "#94a3b8"
                          }
                        />

                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            color: achievement.is_unlocked
                              ? "#10b981"
                              : "#94a3b8",
                          }}
                        >
                          {achievement.is_unlocked
                            ? "UNLOCKED"
                            : "IN PROGRESS"}
                        </span>
                      </div>

                      <h3
                        style={{
                          fontSize: "16px",
                          marginBottom: "6px",
                        }}
                      >
                        {achievement.badge_name}
                      </h3>

                      <p
                        style={{
                          fontSize: "13px",
                          color: "#94a3b8",
                          marginBottom: "14px",
                        }}
                      >
                        {achievement.description}
                      </p>

                      <div style={progressTrackStyle}>
                        <div
                          style={{
                            ...progressFillStyle,
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "9px",
                          fontSize: "12px",
                          color: "#94a3b8",
                        }}
                      >
                        <span>
                          {achievement.current_value}
                          {" / "}
                          {achievement.target_value}
                        </span>

                        <strong>
                          {Math.round(percentage)}%
                        </strong>
                      </div>

                    </div>
                  );
                })}

              </div>
            ) : (
              <p>No achievement progress available.</p>
            )}

            <button
              className="workout-dashboard-button"
              onClick={openAchievements}
              style={{ marginTop: "18px" }}
            >
              View All Achievements
              <ArrowRight size={16} />
            </button>

          </section>
        )}

        {/* ================================= */}
        {/* 4. FITNESS GOALS */}
        {/* ================================= */}

        {!dashboardLoading && !dashboardError && (
          <section style={panelStyle}>

            <h2 style={sectionTitleStyle}>
              <Target
                size={21}
                style={{
                  verticalAlign: "middle",
                  marginRight: "8px",
                  color: "#10b981",
                }}
              />
              Fitness Goals
            </h2>

            {goals.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(230px, 1fr))",
                  gap: "15px",
                }}
              >

                {goals.map((goal) => {
                  const status = String(
                    goal.status || "IN_PROGRESS"
                  ).toUpperCase();

                  const statusColor = getStatusColor(status);

                  const isWeightLoss =
                    String(goal.goal_type).toLowerCase() ===
                    "weight loss";

                  const percentage = getPercentage(
                    goal.current_value,
                    goal.target_value
                  );

                  return (
                    <div
                      key={goal.id}
                      style={{
                        ...miniStatStyle,
                        padding: "18px",
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "15px",
                        }}
                      >
                        <Target size={24} color="#10b981" />

                        <span
                          style={{
                            ...statusColor,
                            borderRadius: "20px",
                            padding: "5px 10px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {status.replaceAll("_", " ")}
                        </span>
                      </div>

                      <h3
                        style={{
                          fontSize: "17px",
                          marginBottom: "12px",
                        }}
                      >
                        {goal.goal_type}
                      </h3>

                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: "13px",
                        }}
                      >
                        Current Value
                      </p>

                      <h2 style={{ margin: "4px 0 12px" }}>
                        {goal.current_value}
                      </h2>

                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: "13px",
                        }}
                      >
                        Target Value:{" "}
                        <strong style={{ color: "inherit" }}>
                          {isWeightLoss ? "≤ " : ""}
                          {goal.target_value}
                        </strong>
                      </p>

                      {!isWeightLoss && (
                        <>
                          <div
                            style={{
                              ...progressTrackStyle,
                              marginTop: "14px",
                            }}
                          >
                            <div
                              style={{
                                ...progressFillStyle,
                                width: `${percentage}%`,
                              }}
                            />
                          </div>

                          <p
                            style={{
                              fontSize: "12px",
                              color: "#94a3b8",
                              marginTop: "7px",
                            }}
                          >
                            {Math.round(percentage)}% completed
                          </p>
                        </>
                      )}

                      <div
                        style={{
                          marginTop: "15px",
                          paddingTop: "12px",
                          borderTop:
                            "1px solid var(--border-color, #29384d)",
                          fontSize: "12px",
                          color: "#94a3b8",
                        }}
                      >
                        <CalendarDays
                          size={14}
                          style={{
                            verticalAlign: "middle",
                            marginRight: "6px",
                          }}
                        />

                        Deadline: {formatDate(goal.deadline)}
                      </div>

                    </div>
                  );
                })}

              </div>
            ) : (
              <p>
                No fitness goals created yet.
                Start by setting your first fitness goal.
              </p>
            )}

            <button
              className="workout-dashboard-button"
              onClick={openGoals}
              style={{ marginTop: "18px" }}
            >
              Manage Fitness Goals
              <ArrowRight size={16} />
            </button>

          </section>
        )}

        {/* ================================= */}
        {/* EXISTING DASHBOARD NAVIGATION */}
        {/* ================================= */}

        <section className="dashboard-cards">

          {/* Daily Progress */}
          <div
            className="dashboard-card workout-dashboard-card"
            onClick={openProgress}
            role="button"
            tabIndex={0}
            onKeyDown={(event) =>
              handleCardKeyDown(event, openProgress)
            }
          >
            <div className="dashboard-card-icon">
              <Activity size={24} />
            </div>

            <h3>Daily Progress Tracking</h3>

            <p>
              Monitor your daily workouts, calories burned,
              exercise duration and fitness progress.
            </p>

            <button
              className="workout-dashboard-button"
              onClick={(event) => {
                event.stopPropagation();
                openProgress();
              }}
            >
              View Daily Progress <ArrowRight size={16} />
            </button>
          </div>

          {/* Workout Management */}
          <div
            className="dashboard-card workout-dashboard-card"
            onClick={openWorkouts}
            role="button"
            tabIndex={0}
            onKeyDown={(event) =>
              handleCardKeyDown(event, openWorkouts)
            }
          >
            <div className="dashboard-card-icon">
              <Dumbbell size={24} />
            </div>

            <h3>Workout Management</h3>

            <p>
              Add, view, update and delete your workouts.
              Track workout duration and calories burned.
            </p>

            <button
              className="workout-dashboard-button"
              onClick={(event) => {
                event.stopPropagation();
                openWorkouts();
              }}
            >
              Manage Workouts <ArrowRight size={16} />
            </button>
          </div>

          {/* Exercise Library */}
          <div
            className="dashboard-card workout-dashboard-card"
            onClick={openExerciseLibrary}
            role="button"
            tabIndex={0}
            onKeyDown={(event) =>
              handleCardKeyDown(event, openExerciseLibrary)
            }
          >
            <div className="dashboard-card-icon">
              <BookOpen size={24} />
            </div>

            <h3>Exercise Library</h3>

            <p>
              Explore Cardio, Strength and Yoga exercises.
              Search exercises and add them to your workout plan.
            </p>

            <button
              className="workout-dashboard-button"
              onClick={(event) => {
                event.stopPropagation();
                openExerciseLibrary();
              }}
            >
              Explore Exercises <ArrowRight size={16} />
            </button>
          </div>

          {/* Workout Planner */}
          <div
            className="dashboard-card workout-dashboard-card"
            onClick={openWorkoutPlanner}
            role="button"
            tabIndex={0}
            onKeyDown={(event) =>
              handleCardKeyDown(event, openWorkoutPlanner)
            }
          >
            <div className="dashboard-card-icon">
              <CalendarDays size={24} />
            </div>

            <h3>Workout Planner</h3>

            <p>
              Plan upcoming workouts and schedule exercise sessions.
            </p>

            <button
              className="workout-dashboard-button"
              onClick={(event) => {
                event.stopPropagation();
                openWorkoutPlanner();
              }}
            >
              Open Workout Planner <ArrowRight size={16} />
            </button>
          </div>

          {/* Goals */}
          <div
            className="dashboard-card workout-dashboard-card"
            onClick={openGoals}
            role="button"
            tabIndex={0}
            onKeyDown={(event) =>
              handleCardKeyDown(event, openGoals)
            }
          >
            <div className="dashboard-card-icon">
              <Target size={24} />
            </div>

            <h3>Goal Setting</h3>

            <p>
              Set fitness goals and track your progress.
            </p>

            <button
              className="workout-dashboard-button"
              onClick={(event) => {
                event.stopPropagation();
                openGoals();
              }}
            >
              Manage Goals <ArrowRight size={16} />
            </button>
          </div>

          {/* Analytics */}
          <div
            className="dashboard-card workout-dashboard-card"
            onClick={openAnalytics}
            role="button"
            tabIndex={0}
            onKeyDown={(event) =>
              handleCardKeyDown(event, openAnalytics)
            }
          >
            <div className="dashboard-card-icon">
              <BarChart3 size={24} />
            </div>

            <h3>Reports & Analytics</h3>

            <p>
              View weekly and monthly workout reports.
            </p>

            <button
              className="workout-dashboard-button"
              onClick={(event) => {
                event.stopPropagation();
                openAnalytics();
              }}
            >
              View Analytics <ArrowRight size={16} />
            </button>
          </div>

          {/* Progress Comparison */}
          <div
            className="dashboard-card workout-dashboard-card"
            onClick={openProgressComparison}
            role="button"
            tabIndex={0}
            onKeyDown={(event) =>
              handleCardKeyDown(event, openProgressComparison)
            }
          >
            <div className="dashboard-card-icon">
              <GitCompareArrows size={24} />
            </div>

            <h3>Progress Comparison</h3>

            <p>
              Compare weekly and monthly workout performance.
            </p>

            <button
              className="workout-dashboard-button"
              onClick={(event) => {
                event.stopPropagation();
                openProgressComparison();
              }}
            >
              Compare Progress <ArrowRight size={16} />
            </button>
          </div>

          {/* Streak Tracking */}
          <div
            className="dashboard-card workout-dashboard-card"
            onClick={openStreaks}
            role="button"
            tabIndex={0}
            onKeyDown={(event) =>
              handleCardKeyDown(event, openStreaks)
            }
          >
            <div className="dashboard-card-icon">
              <Flame size={24} />
            </div>

            <h3>Streak Tracking</h3>

            <p>
              Track current streak, longest streak and active days.
            </p>

            <button
              className="workout-dashboard-button"
              onClick={(event) => {
                event.stopPropagation();
                openStreaks();
              }}
            >
              View Workout Streaks <ArrowRight size={16} />
            </button>
          </div>

          {/* Achievements */}
          <div
            className="dashboard-card workout-dashboard-card"
            onClick={openAchievements}
            role="button"
            tabIndex={0}
            onKeyDown={(event) =>
              handleCardKeyDown(event, openAchievements)
            }
          >
            <div className="dashboard-card-icon">
              <Trophy size={24} />
            </div>

            <h3>Achievements</h3>

            <p>
              Celebrate milestones and unlock fitness badges.
            </p>

            <button
              className="workout-dashboard-button"
              onClick={(event) => {
                event.stopPropagation();
                openAchievements();
              }}
            >
              Explore Achievements <ArrowRight size={16} />
            </button>
          </div>

          {/* Notifications */}
          <div
            className="dashboard-card workout-dashboard-card"
            onClick={openNotifications}
            role="button"
            tabIndex={0}
            onKeyDown={(event) =>
              handleCardKeyDown(event, openNotifications)
            }
          >
            <div className="dashboard-card-icon">
              <Bell size={24} />
            </div>

            <h3>Notifications</h3>

            <p>
              Stay updated with workout reminders and alerts.
            </p>

            <p>
              <strong>{unreadCount}</strong> unread notification(s)
            </p>

            <button
              className="workout-dashboard-button"
              onClick={(event) => {
                event.stopPropagation();
                openNotifications();
              }}
            >
              View Notifications <ArrowRight size={16} />
            </button>
          </div>

          {/* Health Progress */}
          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              <HeartPulse size={24} />
            </div>

            <h3>Health Progress</h3>

            <p>
              Track health information and fitness improvements.
            </p>

            <span className="coming-soon">
              Coming Soon
            </span>
          </div>

        </section>

        {/* ================================= */}
        {/* ACCOUNT INFORMATION */}
        {/* ================================= */}

        <section className="account-section">

          <h2>Account Information</h2>

          <div className="account-details">

            <div>
              <span>Username</span>

              <strong>
                {user?.username || user?.full_name || "—"}
              </strong>
            </div>

            <div>
              <span>Email Address</span>

              <strong>{user?.email || "—"}</strong>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;
