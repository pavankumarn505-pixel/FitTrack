
import { useCallback, useEffect, useState } from "react";

import {
  Activity,
  Flame,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  CalendarDays,
  Dumbbell,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

import api from "../api/axios";
import "./ProgressComparison.css";

const METRICS = [
  {
    key: "workouts",
    field: "total_workouts",
    title: "Total Workouts",
    description: "Completed workout sessions",
    icon: Activity,
    color: "purple",
    unit: "",
  },
  {
    key: "calories",
    field: "total_calories",
    title: "Calories Burned",
    description: "Total calories burned",
    icon: Flame,
    color: "orange",
    unit: "cal",
  },
  {
    key: "duration",
    field: "total_duration",
    title: "Workout Duration",
    description: "Total workout time",
    icon: Clock,
    color: "green",
    unit: "min",
  },
];

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString("en-IN");
}

function formatDate(value) {
  if (!value) return "--";

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getStatusIcon(status) {
  if (status === "improved") return TrendingUp;
  if (status === "declined") return TrendingDown;
  return Minus;
}

function getStatusLabel(status) {
  const labels = {
    improved: "Improved",
    declined: "Declined",
    unchanged: "Unchanged",
    new: "New activity",
  };

  return labels[status] || "Unchanged";
}

function getPercentageLabel(metric) {
  if (metric.percentage_change === null ||
      metric.percentage_change === undefined) {
    return metric.status === "new"
      ? "New activity"
      : "No previous activity";
  }

  const value = Number(metric.percentage_change);

  return `${value > 0 ? "+" : ""}${value.toLocaleString(
    "en-IN"
  )}%`;
}

function getChangeLabel(metric, unit) {
  const change = Number(metric.change ?? 0);

  const formatted = formatNumber(Math.abs(change));

  const sign = change > 0 ? "+" : change < 0 ? "-" : "";

  return `${sign}${formatted}${unit ? ` ${unit}` : ""}`;
}

function ComparisonChart({ metric }) {
  const data = [
    {
      period: "Previous",
      value: Number(metric.previous ?? 0),
    },
    {
      period: "Current",
      value: Number(metric.current ?? 0),
    },
  ];

  return (
    <div className="comparison-mini-chart">
      <ResponsiveContainer width="100%" height={150}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 5,
            right: 25,
            left: 5,
            bottom: 5,
          }}
          barSize={22}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#e2e8f0"
          />

          <XAxis
            type="number"
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
          />

          <YAxis
            type="category"
            dataKey="period"
            axisLine={false}
            tickLine={false}
            width={65}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />

          <Tooltip
            formatter={(value) => [
              formatNumber(value),
              "Value",
            ]}
            contentStyle={{
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
            }}
          />

          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
          >
            <Cell fill="#94a3b8" />
            <Cell fill="#6366f1" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProgressComparison() {
  const [period, setPeriod] = useState("weekly");
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchComparison = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const endpoint =
        period === "weekly"
          ? "/analytics/compare/weekly"
          : "/analytics/compare/monthly";

      const response = await api.get(endpoint);

      setComparison(response.data);
    } catch (err) {
      console.error("Comparison API error:", err);

      setComparison(null);

      setError(
        err.response?.data?.detail ||
        "Unable to load progress comparison."
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const getMetricValues = (item) => {
    const metric = comparison?.metrics?.[item.key] || {};

    return {
      current:
        metric.current ??
        comparison?.current_period?.[item.field] ??
        0,

      previous:
        metric.previous ??
        comparison?.previous_period?.[item.field] ??
        0,

      change: metric.change ?? 0,

      percentage_change: metric.percentage_change,

      status: metric.status || "unchanged",
    };
  };

  return (
    <div className="comparison-page">

      {/* HEADER */}

      <header className="comparison-header">
        <div className="comparison-header-content">

          <span className="comparison-eyebrow">
            FITNESS PERFORMANCE
          </span>

          <h1>Progress Comparison</h1>

          <p>
            Track your fitness progress by comparing
            your current and previous performance.
          </p>

        </div>

        <button
          className="comparison-refresh"
          onClick={fetchComparison}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "comparison-spinning" : ""}
          />

          Refresh
        </button>
      </header>

      {/* PERIOD SELECTOR */}

      <section className="comparison-controls">

        <div className="comparison-period-buttons">

          <button
            className={period === "weekly" ? "active" : ""}
            onClick={() => setPeriod("weekly")}
            disabled={loading}
          >
            <CalendarDays size={17} />
            Weekly Comparison
          </button>

          <button
            className={period === "monthly" ? "active" : ""}
            onClick={() => setPeriod("monthly")}
            disabled={loading}
          >
            <CalendarDays size={17} />
            Monthly Comparison
          </button>

        </div>

      </section>

      {/* LOADING */}

      {loading && (
        <div className="comparison-loading">
          <RefreshCw
            size={30}
            className="comparison-spinning"
          />

          <p>Loading progress comparison...</p>
        </div>
      )}

      {/* ERROR */}

      {!loading && error && (
        <div className="comparison-error">

          <h2>Unable to Load Comparison</h2>

          <p>{error}</p>

          <button onClick={fetchComparison}>
            <RefreshCw size={17} />
            Try Again
          </button>

        </div>
      )}

      {/* COMPARISON DATA */}

      {!loading && !error && comparison && (
        <>

          {/* DATE INFORMATION */}

          <section className="comparison-date-info">

            <div className="comparison-date-icon">
              <CalendarDays size={22} />
            </div>

            <div className="comparison-date-block">

              <span>Current Period</span>

              <strong>
                {formatDate(
                  comparison.current_period?.start_date
                )}

                {" — "}

                {formatDate(
                  comparison.current_period?.end_date
                )}
              </strong>

            </div>

            <div className="comparison-date-divider" />

            <div className="comparison-date-block">

              <span>Previous Period</span>

              <strong>
                {formatDate(
                  comparison.previous_period?.start_date
                )}

                {" — "}

                {formatDate(
                  comparison.previous_period?.end_date
                )}
              </strong>

            </div>

          </section>

          {/* SUMMARY CARDS */}

          <section className="comparison-summary">

            {METRICS.map((item) => {
              const metric = getMetricValues(item);

              const Icon = item.icon;

              const StatusIcon = getStatusIcon(
                metric.status
              );

              return (
                <article
                  className="comparison-stat-card"
                  key={item.key}
                >

                  <div className="comparison-stat-top">

                    <div
                      className={`comparison-stat-icon ${item.color}`}
                    >
                      <Icon size={23} />
                    </div>

                    <span
                      className={`comparison-status ${metric.status}`}
                    >
                      <StatusIcon size={14} />

                      {getStatusLabel(metric.status)}
                    </span>

                  </div>

                  <div className="comparison-stat-content">

                    <p className="comparison-stat-title">
                      {item.title}
                    </p>

                    <h2>
                      {formatNumber(metric.current)}
                      {item.unit === "cal" ? " cal" : ""}
                      {item.unit === "min" ? " min" : ""}
                    </h2>

                    <span className="comparison-previous-value">
                      Previous: {formatNumber(metric.previous)}
                      {item.unit === "cal" ? " cal" : ""}
                      {item.unit === "min" ? " min" : ""}
                    </span>

                    <div className="comparison-change">

                      <strong>
                        {getChangeLabel(metric, item.unit)}
                      </strong>

                      <span>
                        {getPercentageLabel(metric)}
                      </span>

                    </div>

                    <span className="comparison-description">
                      {item.description}
                    </span>

                  </div>

                </article>
              );
            })}

          </section>

          {/* PERFORMANCE CHARTS */}

          <section className="comparison-chart-section">

            <div className="comparison-section-heading">

              <div>
                <span className="comparison-eyebrow">
                  PERFORMANCE ANALYSIS
                </span>

                <h2>Performance Overview</h2>

                <p>
                  Compare each metric independently
                  across both periods.
                </p>
              </div>

              <div className="comparison-chart-legend">

                <span>
                  <i className="legend-previous" />
                  Previous
                </span>

                <span>
                  <i className="legend-current" />
                  Current
                </span>

              </div>

            </div>

            <div className="comparison-chart-grid">

              {METRICS.map((item) => {
                const metric = getMetricValues(item);

                return (
                  <article
                    className="comparison-chart-card"
                    key={item.key}
                  >

                    <div className="comparison-chart-title">

                      <div>
                        <h3>{item.title}</h3>

                        <p>
                          {item.description}
                        </p>
                      </div>

                      <span>
                        {formatNumber(metric.current)}
                      </span>

                    </div>

                    <ComparisonChart metric={metric} />

                  </article>
                );
              })}

            </div>

          </section>

          {/* SUMMARY */}

          <section className="comparison-insight">

            <div className="comparison-insight-icon">
              <Dumbbell size={23} />
            </div>

            <div>
              <h3>Your Fitness Progress</h3>

              <p>
                {METRICS.every(
                  (item) =>
                    getMetricValues(item).current === 0
                )
                  ? "No workouts have been recorded in this period yet. Start exercising to track your progress."
                  : "Your current period contains recorded workout activity. Keep tracking your workouts to monitor your fitness journey."}
              </p>
            </div>

          </section>

        </>
      )}

    </div>
  );
}

export default ProgressComparison;
