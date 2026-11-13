import { useEffect, useState } from "react";
import {
  Activity,
  Flame,
  Clock,
  CalendarDays,
  RefreshCw,
  TrendingUp,
  Target,
  Trophy,
  CheckCircle2,
  AlertCircle,
  ListChecks,
} from "lucide-react";

import api from "../api/axios";
import AnalyticsCharts from "../components/AnalyticsCharts";
import "./Analytics.css";

function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [period, setPeriod] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/analytics/advanced");
      setAnalyticsData(response.data);
    } catch (err) {
      console.error("Advanced analytics API error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load analytics. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics-loading">
        <RefreshCw className="analytics-spinner" size={28} />
        <p>Loading your advanced fitness analytics...</p>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="analytics-page">
        <div className="analytics-error">
          <h2>Unable to Load Analytics</h2>
          <p>{error}</p>

          <button onClick={() => fetchAnalytics()}>
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const weeklyData = analyticsData?.weekly;
  const monthlyData = analyticsData?.monthly;
  const goals = analyticsData?.goals || {};
  const consistency = analyticsData?.consistency || {};
  const insights = analyticsData?.insights?.insights || [];

  const selectedReport =
    period === "weekly" ? weeklyData : monthlyData;

  const dailyData = selectedReport?.daily_breakdown || [];

  const workouts = selectedReport?.total_workouts || 0;
  const calories = selectedReport?.total_calories || 0;
  const duration = selectedReport?.total_duration || 0;

  const activeDays = dailyData.filter(
    (day) => day.total_workouts > 0
  ).length;

  const completionRate = goals.completion_rate || 0;
  const consistencyRate = consistency.consistency_percentage || 0;

  const periodLabel =
    period === "weekly"
      ? `Weekly Report: ${weeklyData?.start_date} to ${weeklyData?.end_date}`
      : `Monthly Report: ${monthlyData?.month_name} ${monthlyData?.year}`;

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <span className="analytics-eyebrow">
            FITNESS PERFORMANCE
          </span>

          <h1>Reports & Analytics</h1>

          <p>
            Understand your performance, workout consistency,
            and fitness goal progress.
          </p>
        </div>

        <button
          className="analytics-refresh"
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "analytics-spinner" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="analytics-inline-error">
          {error}
        </div>
      )}

      <div className="analytics-toolbar">
        <div className="analytics-period">
          <CalendarDays size={18} />
          <span>{periodLabel}</span>
        </div>

        <div className="analytics-period-toggle">
          <button
            className={period === "weekly" ? "active" : ""}
            onClick={() => setPeriod("weekly")}
          >
            Weekly
          </button>

          <button
            className={period === "monthly" ? "active" : ""}
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="analytics-summary">
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon purple">
            <Activity size={24} />
          </div>

          <div>
            <p>Total Workouts</p>
            <h2>{workouts}</h2>
            <span>
              Workouts this {period === "weekly" ? "week" : "month"}
            </span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon orange">
            <Flame size={24} />
          </div>

          <div>
            <p>Calories Burned</p>
            <h2>{calories.toLocaleString("en-IN")}</h2>
            <span>Calories burned</span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon green">
            <Clock size={24} />
          </div>

          <div>
            <p>Total Duration</p>
            <h2>{duration}</h2>
            <span>Duration units from API</span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon blue">
            <CalendarDays size={24} />
          </div>

          <div>
            <p>Active Days</p>
            <h2>{activeDays}</h2>
            <span>Days with workouts in this period</span>
          </div>
        </div>
      </div>

      <div className="analytics-section-heading">
        <div>
          <h2>{period === "weekly" ? "Weekly" : "Monthly"} Performance</h2>
          <p>Your workout activity and performance trends</p>
        </div>
      </div>

      <AnalyticsCharts
        dailyData={dailyData}
        periodLabel={period === "weekly" ? "Weekly" : "Monthly"}
      />

      <div className="analytics-section-heading analytics-lower-heading">
        <div>
          <h2>Fitness Progress Analysis</h2>
          <p>Your goal completion and workout consistency</p>
        </div>
      </div>

      <div className="analytics-insight-grid">
        <section className="analytics-panel">
          <div className="analytics-panel-heading">
            <div className="analytics-panel-icon purple">
              <Target size={21} />
            </div>
            <div>
              <h3>Goal Completion</h3>
              <p>Your overall fitness goal progress</p>
            </div>
          </div>

          <div className="analytics-progress-overview">
            <div>
              <strong>{completionRate}%</strong>
              <span>Completion rate</span>
            </div>

            <div className="analytics-progress-track">
              <div
                className="analytics-progress-fill purple-fill"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </div>
          </div>

          <div className="analytics-goal-counts">
            <div>
              <CheckCircle2 size={17} />
              <span>Completed</span>
              <strong>{goals.completed_goals || 0}</strong>
            </div>

            <div>
              <TrendingUp size={17} />
              <span>In Progress</span>
              <strong>{goals.in_progress_goals || 0}</strong>
            </div>

            <div>
              <AlertCircle size={17} />
              <span>Overdue</span>
              <strong>{goals.overdue_goals || 0}</strong>
            </div>

            <div>
              <ListChecks size={17} />
              <span>Not Started</span>
              <strong>{goals.not_started_goals || 0}</strong>
            </div>
          </div>

          <div className="analytics-panel-footer">
            {goals.completed_goals || 0} of {goals.total_goals || 0} goals completed
          </div>
        </section>

        <section className="analytics-panel">
          <div className="analytics-panel-heading">
            <div className="analytics-panel-icon green">
              <Activity size={21} />
            </div>
            <div>
              <h3>Workout Consistency</h3>
              <p>Your activity over the last 30 days</p>
            </div>
          </div>

          <div className="analytics-consistency-score">
            <strong>{consistencyRate}%</strong>
            <span>Consistency score</span>
          </div>

          <div className="analytics-progress-track">
            <div
              className="analytics-progress-fill green-fill"
              style={{ width: `${Math.min(consistencyRate, 100)}%` }}
            />
          </div>

          <div className="analytics-consistency-stats">
            <div>
              <strong>{consistency.active_days || 0}</strong>
              <span>Active days</span>
            </div>

            <div>
              <strong>{consistency.inactive_days || 0}</strong>
              <span>Inactive days</span>
            </div>

            <div>
              <strong>{consistency.total_workouts || 0}</strong>
              <span>Total workouts</span>
            </div>
          </div>

          <div className="analytics-panel-footer">
            Average {consistency.average_workouts_per_week || 0} workouts per week
          </div>
        </section>
      </div>

      <section className="analytics-insights-panel">
        <div className="analytics-panel-heading">
          <div className="analytics-panel-icon orange">
            <Trophy size={21} />
          </div>

          <div>
            <h3>Performance Insights</h3>
            <p>Personalized observations based on your fitness data</p>
          </div>
        </div>

        {insights.length > 0 ? (
          <div className="analytics-insights-list">
            {insights.map((insight, index) => (
              <div className="analytics-insight-item" key={index}>
                <span className="analytics-insight-number">
                  {index + 1}
                </span>
                <p>{insight}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="analytics-empty-insights">
            No performance insights are available yet.
          </p>
        )}
      </section>
    </div>
  );
}

export default Analytics;
