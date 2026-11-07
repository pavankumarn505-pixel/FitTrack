
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  Trophy,
  Dumbbell,
  Info,
  AlertCircle,
} from "lucide-react";

import api from "../api/axios";
import "./Notifications.css";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [notificationResponse, countResponse] =
        await Promise.all([
          api.get("/notifications/"),
          api.get("/notifications/unread-count"),
        ]);

      setNotifications(notificationResponse.data);
      setUnreadCount(countResponse.data.unread_count);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Unable to load notifications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      await api.patch(
        `/notifications/${notificationId}/read`
      );

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
      setSuccess("Notification marked as read.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update notification."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      await api.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setUnreadCount(0);
      setSuccess("All notifications marked as read.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setUpdating(false);
    }
  };

  const getNotificationIcon = (title = "") => {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle.includes("goal")) {
      return <Trophy size={22} />;
    }

    if (normalizedTitle.includes("workout")) {
      return <Dumbbell size={22} />;
    }

    return <Info size={22} />;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="notifications-page">
      <div className="notifications-container">

        <header className="notifications-header">
          <div>
            <button
              className="notifications-back-button"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft size={17} />
              Dashboard
            </button>

            <h1>
              <Bell size={29} />
              Notifications
            </h1>

            <p>
              Stay updated with your fitness activities and goals.
            </p>
          </div>

          <button
            className="notification-refresh-button"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </header>

        <section className="notification-summary">
          <div className="notification-summary-icon">
            <Bell size={25} />
          </div>

          <div>
            <span>Unread Notifications</span>
            <h2>{unreadCount}</h2>
          </div>

          <div className="notification-summary-total">
            <span>Total Notifications</span>
            <strong>{notifications.length}</strong>
          </div>
        </section>

        {error && (
          <div className="notification-alert notification-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="notification-alert notification-success">
            <Check size={18} />
            {success}
          </div>
        )}

        <section className="notification-list-section">

          <div className="notification-list-header">
            <div>
              <h2>Recent Notifications</h2>
              <p>Your latest fitness updates.</p>
            </div>

            <button
              className="mark-all-button"
              onClick={handleMarkAllAsRead}
              disabled={updating || unreadCount === 0}
            >
              <CheckCheck size={17} />
              Mark All as Read
            </button>
          </div>

          {loading ? (
            <div className="notification-empty">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <Bell size={42} />
              <h3>No Notifications Yet</h3>
              <p>
                Your fitness updates and reminders will appear here.
              </p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`notification-card ${
                    notification.is_read
                      ? "notification-read"
                      : "notification-unread"
                  }`}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.title)}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title-row">
                      <h3>{notification.title}</h3>

                      {!notification.is_read && (
                        <span className="unread-badge">
                          New
                        </span>
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <span className="notification-date">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>

                  {!notification.is_read && (
                    <button
                      className="mark-read-button"
                      onClick={() =>
                        handleMarkAsRead(notification.id)
                      }
                      disabled={updating}
                      title="Mark as read"
                    >
                      <Check size={18} />
                      <span>Mark Read</span>
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default Notifications;
