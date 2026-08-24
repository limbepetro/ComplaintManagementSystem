import { useEffect, useMemo, useState } from "react";
import api from "../api";

const EMPTY_FORM = {
  complaint: "",
  hearing_date: "",
  start_time: "",
  end_time: "",
  location: "",
};

function Hearings() {
  const [hearings, setHearings] = useState([]);
  const [availableComplaints, setAvailableComplaints] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] =
    useState(false);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    loadHearings();
  }, []);

  async function loadHearings() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "hearings/"
      );

      const data = Array.isArray(
        response.data
      )
        ? response.data
        : response.data?.results || [];

      setHearings(data);
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(
          err.response?.data,
          "Unable to load hearings."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function openCreateForm() {
    setShowCreate(true);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setFormLoading(true);

    try {
      const response = await api.get(
        "hearings/available-complaints/"
      );

      setAvailableComplaints(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(
          err.response?.data,
          "Unable to load eligible hearing cases."
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
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (!form.complaint) {
      setError(
        "Please select a complaint."
      );
      return;
    }

    if (!form.hearing_date) {
      setError(
        "Please select a hearing date."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        complaint: Number(
          form.complaint
        ),
        hearing_date:
          form.hearing_date,
        start_time:
          form.start_time || null,
        end_time:
          form.end_time || null,
        location:
          form.location.trim(),
      };

      const response = await api.post(
        "hearings/",
        payload
      );

      setHearings((current) => [
        response.data,
        ...current,
      ]);

      setShowCreate(false);
      setForm(EMPTY_FORM);

      setSuccess(
        "Hearing scheduled successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(
          err.response?.data,
          "Unable to schedule the hearing."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredHearings =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return hearings.filter(
        (hearing) => {
          const caseNumber =
            String(
              hearing.complaint_case_number ||
                hearing.complaint ||
                ""
            ).toLowerCase();

          const title =
            String(
              hearing.complaint_title ||
                ""
            ).toLowerCase();

          const location =
            String(
              hearing.location || ""
            ).toLowerCase();

          const matchesSearch =
            !query ||
            caseNumber.includes(query) ||
            title.includes(query) ||
            location.includes(query);

          const matchesStatus =
            statusFilter === "ALL" ||
            hearing.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      hearings,
      search,
      statusFilter,
    ]);

  const scheduledCount =
    countStatus(
      hearings,
      "SCHEDULED"
    );

  const inProgressCount =
    countStatus(
      hearings,
      "IN_PROGRESS"
    );

  const completedCount =
    countStatus(
      hearings,
      "COMPLETED"
    );

  const adjournedCount =
    countStatus(
      hearings,
      "ADJOURNED"
    );

  return (
    <div className="module-page">

      {/* HEADER */}

      <div className="page-heading">

        <div>
          <p className="welcome">
            CASE PROCEEDINGS
          </p>

          <h1>
            Hearings
          </h1>

          <p className="subtitle">
            Schedule and manage formal
            complaint hearing proceedings.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + Schedule Hearing
        </button>

      </div>

      {/* ALERTS */}

      {success && (
        <div className="success-banner">

          <strong>
            Success
          </strong>

          <span>
            {success}
          </span>

        </div>
      )}

      {error && (
        <div className="error-banner">

          <strong>
            Error
          </strong>

          <span>
            {error}
          </span>

        </div>
      )}

      {/* STATISTICS */}

      <div className="module-stats">

        <div className="module-stat-card">
          <span>
            Total Hearings
          </span>

          <strong>
            {hearings.length}
          </strong>

          <small>
            Hearing records accessible
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Scheduled
          </span>

          <strong>
            {scheduledCount}
          </strong>

          <small>
            Upcoming hearings
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            In Progress
          </span>

          <strong>
            {inProgressCount}
          </strong>

          <small>
            Active proceedings
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Completed
          </span>

          <strong>
            {completedCount}
          </strong>

          <small>
            {adjournedCount} adjourned
          </small>
        </div>

      </div>

      {/* REGISTER */}

      <section className="module-panel">

        <div className="module-panel-header">

          <div>

            <h2>
              Hearing Register
            </h2>

            <p>
              Formal hearing proceedings
              recorded in the system.
            </p>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadHearings}
          >
            Refresh
          </button>

        </div>

        {/* FILTERS */}

        <div className="module-toolbar">

          <div className="search-box">

            <span>
              ⌕
            </span>

            <input
              type="search"
              placeholder="Search case, title or location..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
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

            <option value="ADJOURNED">
              Adjourned
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>

          </select>

        </div>

        {/* TABLE */}

        {loading ? (

          <div className="module-message">

            <div className="loading-spinner"></div>

            Loading hearings...

          </div>

        ) : filteredHearings.length === 0 ? (

          <div className="module-empty">

            <div className="empty-icon">
              ▣
            </div>

            <h3>
              No hearings found
            </h3>

            <p>
              Hearings will appear here when
              they are scheduled.
            </p>

          </div>

        ) : (

          <div className="module-table-wrapper">

            <table className="module-table">

              <thead>

                <tr>

                  <th>
                    Case Number
                  </th>

                  <th>
                    Complaint
                  </th>

                  <th>
                    Hearing Date
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredHearings.map(
                  (hearing) => (

                    <tr
                      key={hearing.id}
                    >

                      <td>
                        <strong className="case-reference">
                          {hearing.complaint_case_number ||
                            `#${hearing.complaint}`}
                        </strong>
                      </td>

                      <td>

                        <div className="table-primary">
                          {hearing.complaint_title ||
                            "Complaint"}
                        </div>

                      </td>

                      <td>
                        {formatDate(
                          hearing.hearing_date
                        )}
                      </td>

                      <td>
                        {hearing.location ||
                          "—"}
                      </td>

                      <td>

                        <span
                          className={`status-badge ${getStatusClass(
                            hearing.status
                          )}`}
                        >
                          {formatStatus(
                            hearing.status
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

      {/* CREATE MODAL */}

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
                  HEARING INTAKE
                </span>

                <h2>
                  Schedule Hearing
                </h2>

                <p>
                  Schedule a hearing for a
                  complaint currently at the
                  hearing stage.
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
                  Hearing Information
                </div>

                {formLoading ? (

                  <div className="module-message">

                    Loading eligible cases...

                  </div>

                ) : availableComplaints.length === 0 ? (

                  <div className="module-empty">

                    <div className="empty-icon">
                      ▣
                    </div>

                    <h3>
                      No eligible complaints
                    </h3>

                    <p>
                      A complaint must be in
                      the HEARING stage before
                      a hearing can be scheduled.
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
                        value={
                          form.complaint
                        }
                        onChange={
                          handleChange
                        }
                        required
                      >

                        <option value="">
                          Select complaint
                        </option>

                        {availableComplaints.map(
                          (complaint) => (

                            <option
                              key={
                                complaint.id
                              }
                              value={
                                complaint.id
                              }
                            >

                              {
                                complaint.case_number
                              }

                              {" — "}

                              {
                                complaint.title
                              }

                            </option>

                          )
                        )}

                      </select>

                    </div>

                    <div className="form-grid">

                      <div className="form-field">

                        <label>

                          Hearing Date

                          <span className="required-mark">
                            *
                          </span>

                        </label>

                        <input
                          type="date"
                          name="hearing_date"
                          value={
                            form.hearing_date
                          }
                          onChange={
                            handleChange
                          }
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
                          value={
                            form.location
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="e.g. PDPC Hearing Room"
                        />

                      </div>

                      <div className="form-field">

                        <label>
                          Start Time
                        </label>

                        <input
                          type="time"
                          name="start_time"
                          value={
                            form.start_time
                          }
                          onChange={
                            handleChange
                          }
                        />

                      </div>

                      <div className="form-field">

                        <label>
                          End Time
                        </label>

                        <input
                          type="time"
                          name="end_time"
                          value={
                            form.end_time
                          }
                          onChange={
                            handleChange
                          }
                        />

                      </div>

                    </div>

                    <div className="response-security-note">

                      <span>
                        🔐
                      </span>

                      <div>

                        <strong>
                          Workflow protected
                        </strong>

                        <p>
                          New hearings begin as
                          SCHEDULED. Completed
                          hearings must contain
                          proceedings.
                        </p>

                      </div>

                    </div>

                  </>

                )}

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeCreateForm
                  }
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
                    availableComplaints.length === 0
                  }
                >
                  {saving
                    ? "Scheduling..."
                    : "Schedule Hearing"}
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

    case "ADJOURNED":
      return "status-warning";

    case "CANCELLED":
      return "status-danger";

    default:
      return "status-warning";
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

export default Hearings;