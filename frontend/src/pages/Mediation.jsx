import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { getStoredUser } from "../services/authService";

const EMPTY_FORM = {
  complaint: "",
  mediator: "",
  session_date: "",
  start_time: "",
  end_time: "",
  location: "",
  notes: "",
};

function Mediation() {
  const user = getStoredUser();
  const isAdmin = user?.role === "ADMIN";

  const [sessions, setSessions] = useState([]);
  const [availableComplaints, setAvailableComplaints] =
    useState([]);
  const [availableMediators, setAvailableMediators] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("mediation-sessions/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setSessions(data);
    } catch (err) {
      console.error(err);

      setError("Unable to load mediation sessions.");
    } finally {
      setLoading(false);
    }
  }

  async function openCreateForm() {
    setShowCreate(true);
    setForm({
      ...EMPTY_FORM,
      mediator: "",
    });

    setError("");
    setSuccess("");
    setFormLoading(true);

    try {
      const complaintsResponse = await api.get(
        "mediation-sessions/available-complaints/"
      );

      setAvailableComplaints(
        Array.isArray(complaintsResponse.data)
          ? complaintsResponse.data
          : []
      );

      if (isAdmin) {
        const mediatorsResponse = await api.get(
          "mediation-sessions/available-mediators/"
        );

        setAvailableMediators(
          Array.isArray(mediatorsResponse.data)
            ? mediatorsResponse.data
            : []
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(
          err.response?.data,
          "Unable to load mediation information."
        )
      );
    } finally {
      setFormLoading(false);
    }
  }

  function closeCreateForm() {
    if (saving) {
      return;
    }

    setShowCreate(false);
    setForm(EMPTY_FORM);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (!form.complaint) {
      setError("Please select a complaint.");
      return;
    }

    if (!form.session_date) {
      setError("Please select a session date.");
      return;
    }

    if (isAdmin && !form.mediator) {
      setError("Please select a mediator.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        complaint: Number(form.complaint),
        session_date: form.session_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        location: form.location.trim(),
        notes: form.notes.trim(),
      };

      if (isAdmin) {
        payload.mediator = Number(form.mediator);
      }

      const response = await api.post(
        "mediation-sessions/",
        payload
      );

      setSessions((current) => [
        response.data,
        ...current,
      ]);

      setShowCreate(false);
      setForm(EMPTY_FORM);

      setSuccess(
        "Mediation session created successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(
          err.response?.data,
          "Unable to create the mediation session."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sessions.filter((session) => {
      const caseNumber = getCaseNumber(
        session.complaint
      ).toLowerCase();

      const mediator = getMediatorName(
        session.mediator
      ).toLowerCase();

      const location = String(
        session.location || ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        caseNumber.includes(query) ||
        mediator.includes(query) ||
        location.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        session.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sessions, search, statusFilter]);

  const scheduledCount = countStatus(
    sessions,
    "SCHEDULED"
  );

  const inProgressCount = countStatus(
    sessions,
    "IN_PROGRESS"
  );

  const completedCount = countStatus(
    sessions,
    "COMPLETED"
  );

  const settledCount = sessions.filter(
    (session) => session.outcome === "SETTLED"
  ).length;

  return (
    <div className="module-page">

      <div className="page-heading">
        <div>
          <p className="welcome">
            CASE SETTLEMENT
          </p>

          <h1>Mediation</h1>

          <p className="subtitle">
            Manage and monitor mediation sessions
            associated with complaints.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + New Mediation
        </button>
      </div>

      {success && (
        <div className="success-banner">
          <strong>Success</strong>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <strong>Error</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="module-stats">

        <div className="module-stat-card">
          <span>Total Sessions</span>
          <strong>
            {sessions.length}
          </strong>
          <small>
            Accessible mediation sessions
          </small>
        </div>

        <div className="module-stat-card">
          <span>Scheduled</span>
          <strong>{scheduledCount}</strong>
          <small>
            Upcoming sessions
          </small>
        </div>

        <div className="module-stat-card">
          <span>In Progress</span>
          <strong>{inProgressCount}</strong>
          <small>
            Active sessions
          </small>
        </div>

        <div className="module-stat-card">
          <span>Completed</span>
          <strong>{completedCount}</strong>
          <small>
            {settledCount} settled
          </small>
        </div>

      </div>

      <section className="module-panel">

        <div className="module-panel-header">

          <div>
            <h2>
              Mediation Register
            </h2>

            <p>
              Sessions recorded in the system.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadSessions}
          >
            Refresh
          </button>

        </div>

        <div className="module-toolbar">

          <div className="search-box">

            <span>⌕</span>

            <input
              type="search"
              placeholder="Search case, mediator or location..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="ALL">
              All statuses
            </option>

            <option value="SCHEDULED">
              Scheduled
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>

        </div>

        {loading ? (
          <div className="module-message">
            <div className="loading-spinner"></div>
            Loading mediation sessions...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="module-empty">

            <div className="empty-icon">
              ⚖
            </div>

            <h3>
              No mediation sessions found
            </h3>

            <p>
              Create a mediation session for
              an eligible complaint.
            </p>

          </div>
        ) : (
          <div className="module-table-wrapper">

            <table className="module-table">

              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Mediator</th>
                  <th>Session Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Outcome</th>
                </tr>
              </thead>

              <tbody>

                {filteredSessions.map(
                  (session) => (
                    <tr key={session.id}>

                      <td>
                        <strong className="case-reference">
                          {getCaseNumber(
                            session.complaint
                          )}
                        </strong>
                      </td>

                      <td>
                        {getMediatorName(
                          session.mediator
                        )}
                      </td>

                      <td>
                        {formatDate(
                          session.session_date
                        )}
                      </td>

                      <td>
                        {session.location || "—"}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            getStatusClass(
                              session.status
                            )
                          }`}
                        >
                          {formatStatus(
                            session.status
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            getOutcomeClass(
                              session.outcome
                            )
                          }`}
                        >
                          {formatStatus(
                            session.outcome
                          )}
                        </span>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {showCreate && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCreateForm();
            }
          }}
        >

          <div className="modal-card large-modal">

            <div className="modal-header">

              <div>

                <span className="module-eyebrow">
                  MEDIATION INTAKE
                </span>

                <h2>
                  New Mediation Session
                </h2>

                <p>
                  Schedule a mediation session
                  for an eligible complaint.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeCreateForm}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form
              className="complaint-form"
              onSubmit={handleCreate}
            >

              <div className="form-section">

                <div className="form-section-title">
                  Session Information
                </div>

                {formLoading ? (

                  <div className="module-message">
                    Loading eligible complaints...
                  </div>

                ) : availableComplaints.length === 0 ? (

                  <div className="module-empty">

                    <div className="empty-icon">
                      ⚖
                    </div>

                    <h3>
                      No eligible complaints
                    </h3>

                    <p>
                      A complaint must be in
                      the MEDIATION stage before
                      a mediation session can
                      be created.
                    </p>

                  </div>

                ) : (

                  <>
                    <div className="form-field">

                      <label>
                        Complaint
                        <span className="required-mark">
                          *
                        </span>
                      </label>

                      <select
                        name="complaint"
                        value={form.complaint}
                        onChange={handleChange}
                        required
                      >

                        <option value="">
                          Select complaint
                        </option>

                        {availableComplaints.map(
                          (complaint) => (
                            <option
                              key={complaint.id}
                              value={complaint.id}
                            >
                              {complaint.case_number}
                              {" — "}
                              {complaint.title}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    {isAdmin && (
                      <div className="form-field">

                        <label>
                          Mediator
                          <span className="required-mark">
                            *
                          </span>
                        </label>

                        <select
                          name="mediator"
                          value={form.mediator}
                          onChange={handleChange}
                          required
                        >

                          <option value="">
                            Select mediator
                          </option>

                          {availableMediators.map(
                            (mediator) => (
                              <option
                                key={mediator.id}
                                value={mediator.id}
                              >
                                {mediator.name}
                                {" ("}
                                {mediator.username}
                                {")"}
                              </option>
                            )
                          )}

                        </select>

                      </div>
                    )}

                    <div className="form-grid">

                      <div className="form-field">

                        <label>
                          Session Date
                          <span className="required-mark">
                            *
                          </span>
                        </label>

                        <input
                          type="date"
                          name="session_date"
                          value={form.session_date}
                          onChange={handleChange}
                          required
                        />

                      </div>

                      <div className="form-field">

                        <label>
                          Location
                        </label>

                        <input
                          type="text"
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          placeholder="e.g. PDPC Mediation Room"
                        />

                      </div>

                      <div className="form-field">

                        <label>
                          Start Time
                        </label>

                        <input
                          type="time"
                          name="start_time"
                          value={form.start_time}
                          onChange={handleChange}
                        />

                      </div>

                      <div className="form-field">

                        <label>
                          End Time
                        </label>

                        <input
                          type="time"
                          name="end_time"
                          value={form.end_time}
                          onChange={handleChange}
                        />

                      </div>

                    </div>

                    <div className="form-field">

                      <label>
                        Notes
                      </label>

                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Additional mediation notes..."
                      />

                    </div>

                  </>
                )}

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeCreateForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving ||
                    formLoading ||
                    availableComplaints.length === 0 ||
                    (isAdmin && !form.mediator)
                  }
                >
                  {saving
                    ? "Creating..."
                    : "Create Mediation"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

function countStatus(items, status) {
  return items.filter(
    (item) => item.status === status
  ).length;
}

function getCaseNumber(complaint) {
  if (!complaint) {
    return "—";
  }

  if (typeof complaint === "string") {
    return complaint;
  }

  return (
    complaint.case_number ||
    `#${complaint.id || "—"}`
  );
}

function getMediatorName(mediator) {
  if (!mediator) {
    return "—";
  }

  if (typeof mediator === "string") {
    return mediator;
  }

  return (
    mediator.name ||
    mediator.username ||
    mediator.first_name ||
    "—"
  );
}

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getStatusClass(status) {
  switch (status) {
    case "COMPLETED":
      return "status-success";

    case "IN_PROGRESS":
      return "status-info";

    case "CANCELLED":
      return "status-danger";

    default:
      return "status-warning";
  }
}

function getOutcomeClass(outcome) {
  switch (outcome) {
    case "SETTLED":
      return "status-success";

    case "FAILED":
      return "status-danger";

    case "PARTIALLY_SETTLED":
      return "status-warning";

    default:
      return "status-neutral";
  }
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
}

function formatApiError(data, fallback) {
  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  return Object.entries(data)
    .map(([field, value]) => {
      const message = Array.isArray(value)
        ? value.join(", ")
        : String(value);

      return `${formatStatus(field)}: ${message}`;
    })
    .join(" | ");
}

export default Mediation;