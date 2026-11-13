import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Footprints,
  HeartPulse,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Unplug,
} from "lucide-react";

import api from "../api/axios";
import "./HealthIntegration.css";

const PROVIDERS = [
  {
    id: "HEALTH_CONNECT",
    name: "Health Connect",
    description:
      "Android health-data platform. A native Android integration is required to authorize and read device data.",
    platform: "Android",
  },
  {
    id: "APPLE_HEALTH",
    name: "Apple Health",
    description:
      "Apple's health-data platform. A native iOS integration is required to authorize and read device data.",
    platform: "Apple devices",
  },
];

const formatNumber = (value) =>
  Number(value || 0).toLocaleString();

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
};

const getErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  "An unexpected error occurred.";

const getStatusLabel = (status) => {
  switch (status) {
    case "CONNECTED":
      return "Connected";
    case "DISCONNECTED":
      return "Disconnected";
    case "PERMISSION_DENIED":
      return "Permission denied";
    default:
      return "Unknown status";
  }
};

const getSyncStatusClass = (status) =>
  String(status || "unknown").toLowerCase();

function HealthIntegration() {
  const navigate = useNavigate();

  const [providers, setProviders] = useState([]);
  const [activities, setActivities] = useState([]);
  const [syncs, setSyncs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyProvider, setBusyProvider] = useState("");
  const [pageError, setPageError] = useState("");
  const [sectionErrors, setSectionErrors] = useState({});
  const [actionMessage, setActionMessage] = useState("");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setPageError("");
    setSectionErrors({});

    const results = await Promise.allSettled([
      api.get("/health-integrations/providers"),
      api.get("/health-integrations/activities", {
        params: { limit: 30 },
      }),
      api.get("/health-integrations/syncs", {
        params: { limit: 30 },
      }),
    ]);

    const errors = {};

    if (results[0].status === "fulfilled") {
      setProviders(
        Array.isArray(results[0].value.data)
          ? results[0].value.data
          : []
      );
    } else {
      errors.providers = getErrorMessage(results[0].reason);
    }

    if (results[1].status === "fulfilled") {
      setActivities(
        Array.isArray(results[1].value.data)
          ? results[1].value.data
          : []
      );
    } else {
      errors.activities = getErrorMessage(results[1].reason);
    }

    if (results[2].status === "fulfilled") {
      setSyncs(
        Array.isArray(results[2].value.data)
          ? results[2].value.data
          : []
      );
    } else {
      errors.syncs = getErrorMessage(results[2].reason);
    }

    setSectionErrors(errors);

    if (
      results.every((result) => result.status === "rejected")
    ) {
      setPageError(
        "The health integration data could not be loaded. Check that the backend is running and that you are signed in."
      );
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const registerProvider = async (provider) => {
    setBusyProvider(provider);
    setActionMessage("");
    setPageError("");

    try {
      await api.post("/health-integrations/providers/register", {
        provider,
      });

      setActionMessage(
        `${PROVIDERS.find((item) => item.id === provider)?.name || provider} registration saved. The provider is not connected to a device.`
      );

      await loadData(true);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setBusyProvider("");
    }
  };

  const disconnectProvider = async (provider) => {
    setBusyProvider(provider);
    setActionMessage("");
    setPageError("");

    try {
      await api.put(
        `/health-integrations/providers/${provider}/disconnect`
      );

      setActionMessage("Provider disconnected successfully.");
      await loadData(true);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setBusyProvider("");
    }
  };

  const getProviderRecord = (providerId) =>
    providers.find((item) => item.provider === providerId);

  const registeredCount = providers.length;

  const successfulSyncCount = syncs.filter(
    (item) => item.status === "SUCCESS"
  ).length;

  if (loading) {
    return (
      <main className="health-integration-page">
        <div className="health-loading">
          <LoaderCircle className="health-spin" size={32} />
          <p>Loading health integration data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="health-integration-page">
      <div className="health-page-container">
        <header className="health-page-header">
          <button
            type="button"
            className="health-back-button"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div className="health-heading-row">
            <div>
              <div className="health-title-icon">
                <HeartPulse size={28} />
              </div>
              <h1>Health Integrations</h1>
              <p className="health-subtitle">
                Manage provider registrations and review imported
                health activity.
              </p>
            </div>

            <button
              type="button"
              className="health-refresh-button"
              onClick={() => loadData(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={17}
                className={refreshing ? "health-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        <section className="health-browser-notice">
          <Smartphone size={23} />
          <div>
            <h2>Device connection requirements</h2>
            <p>
              FitTrack is currently running as a web application.
              A browser page cannot directly authorize Apple Health
              or Android Health Connect. A native mobile app or
              secure device integration bridge is required before
              real device data can be connected and synchronized.
            </p>
          </div>
        </section>

        {pageError && (
          <div className="health-alert health-alert-error">
            <AlertCircle size={19} />
            <span>{pageError}</span>
          </div>
        )}

        {actionMessage && (
          <div className="health-alert health-alert-success">
            <CheckCircle2 size={19} />
            <span>{actionMessage}</span>
          </div>
        )}

        <section className="health-summary-grid">
          <article className="health-summary-card">
            <div className="health-summary-icon">
              <ShieldCheck size={21} />
            </div>
            <div>
              <span>Registered providers</span>
              <strong>{formatNumber(registeredCount)}</strong>
            </div>
          </article>

          <article className="health-summary-card">
            <div className="health-summary-icon">
              <Activity size={21} />
            </div>
            <div>
              <span>Imported activity records</span>
              <strong>{formatNumber(activities.length)}</strong>
            </div>
          </article>

          <article className="health-summary-card">
            <div className="health-summary-icon">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <span>Successful syncs</span>
              <strong>{formatNumber(successfulSyncCount)}</strong>
            </div>
          </article>
        </section>

        <section className="health-section">
          <div className="health-section-heading">
            <div>
              <h2>Health providers</h2>
              <p>
                Registration records currently stored in FitTrack.
              </p>
            </div>
          </div>

          {sectionErrors.providers && (
            <div className="health-section-error">
              Could not load providers: {sectionErrors.providers}
            </div>
          )}

          <div className="health-provider-grid">
            {PROVIDERS.map((provider) => {
              const record = getProviderRecord(provider.id);
              const status = record?.status;
              const isConnected = status === "CONNECTED";
              const isRegistered = Boolean(record);
              const isBusy = busyProvider === provider.id;

              return (
                <article
                  className="health-provider-card"
                  key={provider.id}
                >
                  <div className="health-provider-top">
                    <div className="health-provider-icon">
                      <HeartPulse size={25} />
                    </div>

                    <span
                      className={`health-status ${
                        status
                          ? status.toLowerCase()
                          : "not-registered"
                      }`}
                    >
                      {status
                        ? getStatusLabel(status)
                        : "Not registered"}
                    </span>
                  </div>

                  <h3>{provider.name}</h3>
                  <span className="health-platform">
                    {provider.platform}
                  </span>
                  <p>{provider.description}</p>

                  {record && (
                    <div className="health-provider-meta">
                      <span>
                        Registered: {formatDate(record.created_at)}
                      </span>
                      <span>
                        Last sync: {formatDateTime(record.last_sync_at)}
                      </span>
                    </div>
                  )}

                  {!isRegistered ? (
                    <button
                      type="button"
                      className="health-action-button"
                      onClick={() => registerProvider(provider.id)}
                      disabled={Boolean(busyProvider)}
                    >
                      {isBusy ? (
                        <LoaderCircle
                          size={17}
                          className="health-spin"
                        />
                      ) : (
                        <ShieldCheck size={17} />
                      )}
                      Register provider
                    </button>
                  ) : isConnected ? (
                    <button
                      type="button"
                      className="health-action-button health-disconnect-button"
                      onClick={() =>
                        disconnectProvider(provider.id)
                      }
                      disabled={Boolean(busyProvider)}
                    >
                      {isBusy ? (
                        <LoaderCircle
                          size={17}
                          className="health-spin"
                        />
                      ) : (
                        <Unplug size={17} />
                      )}
                      Disconnect provider
                    </button>
                  ) : (
                    <div className="health-provider-note">
                      <AlertCircle size={16} />
                      Registration exists, but device connection
                      is not active.
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <p className="health-registration-note">
            Registering a provider only creates a FitTrack
            registration record. It does not grant device
            permissions, connect a phone, or start synchronization.
          </p>
        </section>

        <section className="health-section">
          <div className="health-section-heading">
            <div>
              <h2>Imported activity</h2>
              <p>
                Activity records returned by the FitTrack backend.
              </p>
            </div>
          </div>

          {sectionErrors.activities && (
            <div className="health-section-error">
              Could not load activity records: {sectionErrors.activities}
            </div>
          )}

          {activities.length === 0 ? (
            <div className="health-empty-state">
              <Footprints size={30} />
              <h3>No imported activity yet</h3>
              <p>
                When a supported device integration is implemented
                and real activity data is synchronized, records
                will appear here.
              </p>
            </div>
          ) : (
            <div className="health-table-wrapper">
              <table className="health-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Provider</th>
                    <th>Steps</th>
                    <th>Active minutes</th>
                    <th>Calories</th>
                    <th>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id}>
                      <td>{formatDate(activity.activity_date)}</td>
                      <td>{activity.provider || "—"}</td>
                      <td>{formatNumber(activity.steps)}</td>
                      <td>
                        {formatNumber(activity.active_minutes)}
                      </td>
                      <td>
                        {formatNumber(activity.calories_burned)}
                      </td>
                      <td>
                        {(
                          Number(activity.distance_meters || 0) /
                          1000
                        ).toFixed(2)}{" "}
                        km
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="health-section">
          <div className="health-section-heading">
            <div>
              <h2>Synchronization history</h2>
              <p>
                Recent synchronization attempts recorded by the
                backend.
              </p>
            </div>
          </div>

          {sectionErrors.syncs && (
            <div className="health-section-error">
              Could not load sync history: {sectionErrors.syncs}
            </div>
          )}

          {syncs.length === 0 ? (
            <div className="health-empty-state">
              <Clock3 size={30} />
              <h3>No synchronization history</h3>
              <p>
                Sync attempts will be listed here after a real
                provider integration submits activity data.
              </p>
            </div>
          ) : (
            <div className="health-table-wrapper">
              <table className="health-table">
                <thead>
                  <tr>
                    <th>Started</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Records synced</th>
                    <th>Completed</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {syncs.map((sync) => (
                    <tr key={sync.id}>
                      <td>{formatDateTime(sync.started_at)}</td>
                      <td>{sync.provider || "—"}</td>
                      <td>
                        <span
                          className={`health-sync-status ${getSyncStatusClass(
                            sync.status
                          )}`}
                        >
                          {sync.status || "Unknown"}
                        </span>
                      </td>
                      <td>{formatNumber(sync.records_synced)}</td>
                      <td>{formatDateTime(sync.completed_at)}</td>
                      <td>{sync.error_message || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="health-implementation-note">
          <ShieldCheck size={21} />
          <div>
            <h3>Integration status</h3>
            <p>
              Provider registration, activity retrieval, and sync
              history are connected to the backend API. Native
              device authorization and automatic synchronization
              are not implemented by this web page. No device
              connection or health data is simulated.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default HealthIntegration;
