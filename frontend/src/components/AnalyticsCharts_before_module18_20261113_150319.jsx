
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function AnalyticsCharts({ dailyData = [] }) {
  const chartData = dailyData.map((item) => ({
    date: formatDate(item.date),
    workouts: item.total_workouts || 0,
    calories: item.total_calories || 0,
    duration: item.total_duration || 0,
  }));

  return (
    <div className="analytics-charts">
      <section className="analytics-chart-card">
        <div className="analytics-chart-heading">
          <div>
            <h3>Weekly Workout Activity</h3>
            <p>Number of workouts completed each day</p>
          </div>
        </div>

        <div className="analytics-chart">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="workouts"
                  name="Workouts"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="analytics-empty">
              No workout data available.
            </p>
          )}
        </div>
      </section>

      <section className="analytics-chart-card">
        <div className="analytics-chart-heading">
          <div>
            <h3>Calories Burned</h3>
            <p>Daily calories burned through workouts</p>
          </div>
        </div>

        <div className="analytics-chart">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="calories"
                  name="Calories"
                  stroke="#f97316"
                  strokeWidth={3}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="analytics-empty">
              No calorie data available.
            </p>
          )}
        </div>
      </section>

      <section className="analytics-chart-card">
        <div className="analytics-chart-heading">
          <div>
            <h3>Workout Duration</h3>
            <p>Daily exercise duration</p>
          </div>
        </div>

        <div className="analytics-chart">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="duration"
                  name="Duration"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="analytics-empty">
              No duration data available.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default AnalyticsCharts;
