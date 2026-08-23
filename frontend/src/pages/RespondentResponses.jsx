import { useEffect, useState } from "react";
import api from "../api";

const EMPTY_FORM = {
  complaint: "",
  notice: "",
  response_text: "",
};

function RespondentResponses() {
  const [responses, setResponses] = useState([]);
  const [availableComplaints, setAvailableComplaints] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingComplaints, setLoadingComplaints] =
    useState(false);

  const [showCreate, setShowCreate] =
    useState(false);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [search, setSearch] = useState("");

  const loadResponses = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "respondent-responses/"
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setResponses(data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load respondent responses."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableComplaints = async () => {
    setLoadingComplaints(true);

    try {
      const response = await api.get(
        "respondent-responses/available-complaints/"
      );

      setAvailableComplaints(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load complaints eligible for a respondent response."
      );
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    loadResponses();
  }, []);

  const openCreateForm = async () => {
    setError("");
    setSuccess("");
    setForm(EMPTY_FORM);

    await loadAvailableComplaints();

    setShowCreate(true);
  };

  const closeCreateForm = () => {
    if (saving) {
      return;
    }

    setShowCreate(false);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        complaint: Number(form.complaint),
        response_text:
          form.response_text.trim(),
      };

      if (form.notice) {
        payload.notice = Number(form.notice);
      }

      const response = await api.post(
        "respondent-responses/",
        payload
      );

      setResponses((current) => [
        response.data,
        ...current,
      ]);

      setSuccess(
        "Respondent response created successfully."
      );

      closeCreateForm();
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(
          err.response?.data
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredResponses = responses.filter(
    (response) => {
      const normalizedSearch =
        search.trim().toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        String(
          response.complaint?.case_number ||
          response.complaint ||
          ""
        )
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(
          response.respondent?.full_name ||
          response.respondent ||
          ""
        )
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(
          response.response_text || ""
        )
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        response.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  const draftCount = responses.filter(
    (item) => item.status === "DRAFT"
  ).length;

  const submittedCount = responses.filter(
    (item) => item.status === "SUBMITTED"
  ).length;

  const acceptedCount = responses.filter(
    (item) => item.status === "ACCEPTED"
  ).length;

  const rejectedCount = responses.filter(
    (item) => item.status === "REJECTED"
  ).length;

  return (
    <div className="module-page">

      {/* HEADER */}

      <div className="page-heading">

        <div>
          <p className="welcome">
            CASE WORKFLOW
          </p>

          <h1>
            Respondent Responses
          </h1>

          <p className="subtitle">
            Manage responses submitted by
            respondents to complaint notices.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + Add Response
        </button>

      </div>

      {/* ALERTS */}

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

      {/* STATISTICS */}

      <div className="module-stats">

        <div className="module-stat-card">
          <span>Total Responses</span>
          <strong>
            {responses.length}
          </strong>
          <small>
            Recorded responses
          </small>
        </div>

        <div className="module-stat-card">
          <span>Draft</span>
          <strong>
            {draftCount}
          </strong>
          <small>
            Responses being prepared
          </small>
        </div>

        <div className="module-stat-card">
          <span>Submitted</span>
          <strong>
            {submittedCount}
          </strong>
          <small>
            Submitted responses
          </small>
        </div>

        <div className="module-stat-card">
          <span>Accepted / Rejected</span>
          <strong>
            {acceptedCount + rejectedCount}
          </strong>
          <small>
            Responses reviewed
          </small>
        </div>

      </div>

      {/* REGISTER */}

      <section className="module-panel">

        <div className="module-panel-header">

          <div>
            <h2>
              Respondent Response Register
            </h2>

            <p>
              Responses associated with complaint
              cases.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadResponses}
          >
            Refresh
          </button>

        </div>

        {/* TOOLBAR */}

        <div className="module-toolbar">

          <div className="search-box">

            <span>⌕</span>

            <input
              type="search"
              placeholder="Search case, respondent or response..."
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

            <option value="DRAFT">
              Draft
            </option>

            <option value="SUBMITTED">
              Submitted
            </option>

            <option value="ACCEPTED">
              Accepted
            </option>

            <option value="REJECTED">
              Rejected
            </option>
          </select>

        </div>

        {/* TABLE */}

        {loading ? (
          <div className="module-message">
            <div className="loading-spinner"></div>
            Loading respondent responses...
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="module-empty">

            <div className="empty-icon">
              ◉
            </div>

            <h3>
              No respondent responses found
            </h3>

            <p>
              Responses will appear here when
              they are registered.
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
                    Respondent
                  </th>

                  <th>
                    Response
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Submitted
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredResponses.map(
                  (item) => (

                    <tr key={item.id}>

                      <td>
                        <strong className="case-reference">
                          {getCaseNumber(
                            item.complaint
                          )}
                        </strong>
                      </td>

                      <td>
                        {getPartyName(
                          item.respondent
                        )}
                      </td>

                      <td>
                        <div className="table-primary">
                          {truncate(
                            item.response_text,
                            90
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${responseStatusClass(
                            item.status
                          )}`}
                        >
                          {formatStatus(
                            item.status
                          )}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          item.submitted_at ||
                          item.created_at
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* CREATE RESPONSE */}

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

          <div className="modal-card">

            <div className="modal-header">

              <div>
                <span className="module-eyebrow">
                  RESPONSE INTAKE
                </span>

                <h2>
                  Add Respondent Response
                </h2>

                <p>
                  Register a response against an
                  eligible complaint.
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
                  Response Information
                </div>

                {loadingComplaints ? (

                  <div className="module-message">
                    Loading eligible complaints...
                  </div>

                ) : availableComplaints.length ===
                  0 ? (

                  <div className="module-empty">
                    <div className="empty-icon">
                      ◉
                    </div>

                    <h3>
                      No eligible complaints
                    </h3>

                    <p>
                      Only complaints in the
                      notice/response stage can
                      receive a respondent response.
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
                        onChange={
                          handleFormChange
                        }
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
                              {" — "}
                              {complaint.respondent
                                ?.full_name ||
                                "Respondent"}
                            </option>

                          )
                        )}

                      </select>

                    </div>

                    <div className="form-field">

                      <label>
                        Response
                        <span className="required-mark">
                          *
                        </span>
                      </label>

                      <textarea
                        name="response_text"
                        value={
                          form.response_text
                        }
                        onChange={
                          handleFormChange
                        }
                        rows="7"
                        placeholder="Enter the respondent's response..."
                        required
                      />

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
                          New responses are
                          created as DRAFT.
                          Status changes are
                          validated by Django.
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
                    loadingComplaints ||
                    availableComplaints.length === 0
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save Response"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
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

function getPartyName(party) {
  if (!party) {
    return "—";
  }

  if (typeof party === "string") {
    return party;
  }

  return (
    party.full_name ||
    party.organization_name ||
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

function responseStatusClass(status) {
  switch (status) {
    case "ACCEPTED":
      return "status-success";

    case "REJECTED":
      return "status-danger";

    case "SUBMITTED":
      return "status-info";

    default:
      return "status-warning";
  }
}

function truncate(text, length) {
  if (!text) {
    return "—";
  }

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length)}...`;
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

function formatApiError(data) {
  if (!data) {
    return "Unable to save respondent response.";
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

export default RespondentResponses;