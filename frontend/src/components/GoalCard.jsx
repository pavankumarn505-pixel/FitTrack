
import {
  Target,
  CalendarDays,
  TrendingUp,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Footprints,
  Dumbbell,
  Scale,
} from "lucide-react";

const statusConfig = {
  NOT_STARTED: {
    label: "Not Started",
    className: "goal-status-not-started",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "goal-status-progress",
    icon: TrendingUp,
  },
  COMPLETED: {
    label: "Completed",
    className: "goal-status-completed",
    icon: CheckCircle,
  },
  OVERDUE: {
    label: "Overdue",
    className: "goal-status-overdue",
    icon: AlertCircle,
  },
};

const goalIcons = {
  "Weight Loss": Scale,
  "Muscle Gain": Dumbbell,
  Steps: Footprints,
};

function GoalCard({ goal, onEdit, onDelete }) {
  const StatusIcon =
    statusConfig[goal.status]?.icon || Clock;

  const GoalIcon =
    goalIcons[goal.goal_type] || Target;

  const status =
    statusConfig[goal.status] || statusConfig.NOT_STARTED;

  const isWeightLoss = goal.goal_type === "Weight Loss";
  const isWeightGoal =
    goal.goal_type === "Weight Loss" ||
    goal.goal_type === "Muscle Gain";

  const current = Number(goal.current_value);
  const target = Number(goal.target_value);

  const remaining = isWeightLoss
    ? Math.max(0, current - target)
    : Math.max(0, target - current);

  const percentage = Math.min(
    100,
    Math.max(0, (current / target) * 100)
  );

  const formatValue = (value) =>
    Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const unit = isWeightGoal ? "kg" : "steps";

  return (
    <div className="goal-card">
      <div className="goal-card-header">
        <div className="goal-icon">
          <GoalIcon size={23} />
        </div>

        <span className={`goal-status ${status.className}`}>
          <StatusIcon size={14} />
          {status.label}
        </span>
      </div>

      <h3>{goal.goal_type}</h3>

      <div className="goal-values">
        <div>
          <span className="goal-label">Current Value</span>
          <h2>
            {formatValue(current)} {unit}
          </h2>
        </div>

        <div className="goal-target">
          <span className="goal-label">Target Value</span>
          <h2>
            {isWeightLoss ? "≤ " : ""}
            {formatValue(target)} {unit}
          </h2>
        </div>
      </div>

      {isWeightLoss ? (
        <div className="goal-progress-info">
          <p>
            {goal.status === "COMPLETED"
              ? "Weight target achieved!"
              : `${formatValue(remaining)} kg remaining to target`}
          </p>

          <small>
            Your current weight must reach or fall below your
            target weight.
          </small>
        </div>
      ) : (
        <div className="goal-progress-info">
          <div className="goal-progress-heading">
            <span>Progress</span>
            <strong>{percentage.toFixed(1)}%</strong>
          </div>

          <div className="goal-progress-track">
            <div
              className="goal-progress-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p>
            {formatValue(remaining)} {unit} remaining to reach
            your goal
          </p>
        </div>
      )}

      <div className="goal-deadline">
        <CalendarDays size={17} />
        <span>
          Deadline:{" "}
          {new Date(
            goal.deadline + "T00:00:00"
          ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="goal-card-actions">
        <button
          className="goal-edit-button"
          onClick={() => onEdit(goal)}
        >
          <Pencil size={16} />
          Edit Goal
        </button>

        <button
          className="goal-delete-button"
          onClick={() => onDelete(goal.id)}
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}

export default GoalCard;
