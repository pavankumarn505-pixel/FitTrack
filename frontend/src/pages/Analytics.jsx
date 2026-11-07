
import { useEffect, useState } from "react";
import {
  Activity,
  Flame,
  Clock,
  CalendarDays,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import api from "../api/axios";
import AnalyticsCharts from "../components/AnalyticsCharts";
import "./Analytics.css";

function Analytics() {
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/analytics/weekly");

      setWeeklyData(response.data);
    } catch (err) {
      console.error("Analytics API error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load analytics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics-loading">
        <RefreshCw className="analytics-spinner" size={28} />
        <p>Loading your fitness analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-error">
          <h2>Unable to Load Analytics</h2>
          <p>{error}</p>

          <button onClick={fetchAnalytics}>
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const workouts = weeklyData?.total_workouts || 0;
  const calories = weeklyData?.total_calories || 0;
  const duration = weeklyData?.total_duration || 0;
  const dailyData = weeklyData?.daily_breakdown || [];

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <span className="analytics-eyebrow">
            FITNESS PERFORMANCE
          </span>

          <h1>Reports & Analytics</h1>

          <p>
            Track your workouts, calories and fitness progress.
          </p>
        </div>

        <button
          className="analytics-refresh"
          onClick={fetchAnalytics}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="analytics-period">
        <CalendarDays size={18} />

        <span>
          Weekly Report: {weeklyData?.start_date} to{" "}
          {weeklyData?.end_date}
        </span>
      </div>

      <div className="analytics-summary">
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon purple">
            <Activity size={24} />
          </div>

          <div>
            <p>Total Workouts</p>
            <h2>{workouts}</h2>
            <span>Workouts this week</span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon orange">
            <Flame size={24} />
          </div>

          <div>
            <p>Calories Burned</p>
            <h2>{calories.toLocaleString("en-IN")}</h2>
            <span>Calories this week</span>
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
            <TrendingUp size={24} />
          </div>

          <div>
            <p>Active Days</p>
            <h2>
              {
                dailyData.filter(
                  (day) => day.total_workouts > 0
                ).length
              }
            </h2>
            <span>Days with workouts</span>
          </div>
        </div>
      </div>

      <div className="analytics-section-heading">
        <h2>Weekly Performance</h2>
        <p>Your daily fitness activity overview</p>
      </div>

      <AnalyticsCharts dailyData={dailyData} />
    </div>
  );
}

export default Analytics;
