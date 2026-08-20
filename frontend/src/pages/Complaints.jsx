import { useEffect, useMemo, useState } from "react";
import api from "../api";

const EMPTY_FORM = {
  case_number: "",
  title: "",
  description: "",

  complainant: {
    party_type: "INDIVIDUAL",
    full_name: "",
    organization_name: "",
    email: "",
    phone_number: "",
    address: "",
  },

  respondent: {
    party_type: "INDIVIDUAL",
    full_name: "",
    organization_name: "",
    email: "",
    phone_number: "",
    address: "",
  },
};

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [showCreate, setShowCreate] =
    useState(false);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadComplaints = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get(
        "complaints/",
        { params }
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setComplaints(data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load complaints."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const filteredComplaints = useMemo(() => {
    if (statusFilter === "ALL") {
      return complaints;
    }

    return complaints.filter(
      (complaint) =>
        complaint.status === statusFilter
    );
  }, [complaints, statusFilter]);

  const updateParty = (
    party,
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [party]: {
        ...current[party],
        [field]: value,
      },
    }));
  };

  const handleChange = (event) => {
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
      const response = await api.post(
        "complaints/",
        form
      );

      setComplaints((current) => [
        response.data,
        ...current,
      ]);

      setSuccess(
        `Complaint ${form.case_number} created successfully.`
      );

      setForm(EMPTY_FORM);
      setShowCreate(false);
    } catch (err) {
      console.error(err);

      const responseData =
        err.response?.data;

      if (responseData) {
        setError(
          formatApiError(responseData)
        );
      } else {
        setError(
          "Unable to create the complaint."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    "ALL",
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "NOTICE_SENT",
    "RESPONSE_PENDING",
    "MEDIATION",
    "HEARING",
    "DECIDED",
    "REVIEW",
    "ENFORCEMENT",
    "CLOSED",
  ];

  return (
    <div className="module-page">

      {/* Header */}

      <div className="page-heading">

        <div>
          <p className="welcome">
            CASE MANAGEMENT
          </p>

          <h1>
            Complaints
          </h1>

          <p className="subtitle">
            Register, monitor and manage
            complaint cases.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setError("");
            setSuccess("");
            setShowCreate(true);
          }}
        >
          + New Complaint
        </button>

      </div>

      {/* Notifications */}

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

      {/* Summary */}

      <div className="module-stats">

        <div className="module-stat-card">
          <span>Total Complaints</span>
          <strong>
            {complaints.length}
          </strong>
          <small>
            Cases accessible to you
          </small>
        </div>

        <div className="module-stat-card">
          <span>Under Review</span>
          <strong>
            {countStatus(
              complaints,
              "UNDER_REVIEW"
            )}
          </strong>
          <small>
            Cases under assessment
          </small>
        </div>

        <div className="module-stat-card">
          <span>In Mediation</span>
          <strong>
            {countStatus(
              complaints,
              "MEDIATION"
            )}
          </strong>
          <small>
            Active mediation cases
          </small>
        </div>

        <div className="module-stat-card">
          <span>Closed</span>
          <strong>
            {countStatus(
              complaints,
              "CLOSED"
            )}
          </strong>
          <small>
            Completed cases
          </small>
        </div>

      </div>

      {/* Main Panel */}

      <section className="module-panel">

        <div className="module-panel-header">

          <div>
            <h2>
              Complaint Register
            </h2>

            <p>
              Search and monitor registered cases.
            </p>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={loadComplaints}
          >
            Refresh
          </button>

        </div>

        {/* Filters */}

        <div className="module-toolbar">

          <div className="search-box">

            <span>⌕</span>

            <input
              type="search"
              placeholder="Search case number, title, complainant..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  loadComplaints();
                }
              }}
            />

          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="filter-select"
          >

            {statusOptions.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status === "ALL"
                  ? "All statuses"
                  : formatStatus(status)}
              </option>
            ))}

          </select>

        </div>

        {/* Table */}

        {loading ? (
          <div className="module-message">
            <div className="loading-spinner"></div>
            Loading complaints...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="module-empty">

            <div className="empty-icon">
              ◈
            </div>

            <h3>
              No complaints found
            </h3>

            <p>
              Try changing your search or
              status filter.
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
                    Complainant
                  </th>

                  <th>
                    Respondent
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Created
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredComplaints.map(
                  (complaint) => (

                    <tr
                      key={complaint.id}
                    >

                      <td>

                        <strong className="case-reference">
                          {complaint.case_number}
                        </strong>

                      </td>

                      <td>

                        <div className="table-primary">
                          {complaint.title}
                        </div>

                        <div className="table-secondary">
                          {truncate(
                            complaint.description,
                            70
                          )}
                        </div>

                      </td>

                      <td>
                        {complaint.complainant
                          ?.full_name ||
                          "—"}
                      </td>

                      <td>
                        {complaint.respondent
                          ?.full_name ||
                          "—"}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${statusClass(
                            complaint.status
                          )}`}
                        >
                          {formatStatus(
                            complaint.status
                          )}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          complaint.created_at
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

      {/* Create Complaint Modal */}

      {showCreate && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCreate(false);
            }
          }}
        >

          <div className="modal-card large-modal">

            <div className="modal-header">

              <div>
                <span className="module-eyebrow">
                  NEW CASE
                </span>

                <h2>
                  Register Complaint
                </h2>

                <p>
                  Create a new complaint case.
                  The case will start as DRAFT.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                ×
              </button>

            </div>

            <form
              className="complaint-form"
              onSubmit={handleCreate}
            >

              {/* Case Information */}

              <div className="form-section">

                <div className="form-section-title">
                  Case Information
                </div>

                <div className="form-grid">

                  <FormField
                    label="Case Number"
                    required
                  >
                    <input
                      name="case_number"
                      value={form.case_number}
                      onChange={handleChange}
                      placeholder="e.g. PDPC-2026-0002"
                      required
                    />
                  </FormField>

                  <FormField
                    label="Complaint Title"
                    required
                  >
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Enter complaint title"
                      required
                    />
                  </FormField>

                </div>

                <FormField
                  label="Description"
                  required
                >
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the complaint..."
                    rows="5"
                    required
                  />
                </FormField>

              </div>

              {/* Complainant */}

              <div className="form-section">

                <div className="form-section-title">
                  Complainant
                </div>

                <div className="form-grid">

                  <FormField
                    label="Party Type"
                    required
                  >
                    <select
                      value={
                        form.complainant
                          .party_type
                      }
                      onChange={(event) =>
                        updateParty(
                          "complainant",
                          "party_type",
                          event.target.value
                        )
                      }
                    >
                      <option value="INDIVIDUAL">
                        Individual
                      </option>

                      <option value="ORGANIZATION">
                        Organization
                      </option>
                    </select>
                  </FormField>

                  <FormField
                    label="Full Name"
                    required
                  >
                    <input
                      value={
                        form.complainant
                          .full_name
                      }
                      onChange={(event) =>
                        updateParty(
                          "complainant",
                          "full_name",
                          event.target.value
                        )
                      }
                      required
                    />
                  </FormField>

                  <FormField
                    label="Organization"
                  >
                    <input
                      value={
                        form.complainant
                          .organization_name
                      }
                      onChange={(event) =>
                        updateParty(
                          "complainant",
                          "organization_name",
                          event.target.value
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Email">
                    <input
                      type="email"
                      value={
                        form.complainant.email
                      }
                      onChange={(event) =>
                        updateParty(
                          "complainant",
                          "email",
                          event.target.value
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Phone">
                    <input
                      value={
                        form.complainant
                          .phone_number
                      }
                      onChange={(event) =>
                        updateParty(
                          "complainant",
                          "phone_number",
                          event.target.value
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Address">
                    <input
                      value={
                        form.complainant.address
                      }
                      onChange={(event) =>
                        updateParty(
                          "complainant",
                          "address",
                          event.target.value
                        )
                      }
                    />
                  </FormField>

                </div>

              </div>

              {/* Respondent */}

              <div className="form-section">

                <div className="form-section-title">
                  Respondent
                </div>

                <div className="form-grid">

                  <FormField
                    label="Party Type"
                    required
                  >
                    <select
                      value={
                        form.respondent
                          .party_type
                      }
                      onChange={(event) =>
                        updateParty(
                          "respondent",
                          "party_type",
                          event.target.value
                        )
                      }
                    >
                      <option value="INDIVIDUAL">
                        Individual
                      </option>

                      <option value="ORGANIZATION">
                        Organization
                      </option>
                    </select>
                  </FormField>

                  <FormField
                    label="Full Name"
                    required
                  >
                    <input
                      value={
                        form.respondent
                          .full_name
                      }
                      onChange={(event) =>
                        updateParty(
                          "respondent",
                          "full_name",
                          event.target.value
                        )
                      }
                      required
                    />
                  </FormField>

                  <FormField label="Organization">
                    <input
                      value={
                        form.respondent
                          .organization_name
                      }
                      onChange={(event) =>
                        updateParty(
                          "respondent",
                          "organization_name",
                          event.target.value
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Email">
                    <input
                      type="email"
                      value={
                        form.respondent.email
                      }
                      onChange={(event) =>
                        updateParty(
                          "respondent",
                          "email",
                          event.target.value
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Phone">
                    <input
                      value={
                        form.respondent
                          .phone_number
                      }
                      onChange={(event) =>
                        updateParty(
                          "respondent",
                          "phone_number",
                          event.target.value
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Address">
                    <input
                      value={
                        form.respondent.address
                      }
                      onChange={(event) =>
                        updateParty(
                          "respondent",
                          "address",
                          event.target.value
                        )
                      }
                    />
                  </FormField>

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Creating..."
                    : "Create Complaint"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}


function FormField({
  label,
  required,
  children,
}) {
  return (
    <div className="form-field">

      <label>
        {label}

        {required && (
          <span className="required-mark">
            *
          </span>
        )}
      </label>

      {children}

    </div>
  );
}


function countStatus(
  complaints,
  status
) {
  return complaints.filter(
    (complaint) =>
      complaint.status === status
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


function statusClass(status) {
  if (status === "CLOSED") {
    return "status-success";
  }

  if (
    status === "UNDER_REVIEW" ||
    status === "RESPONSE_PENDING"
  ) {
    return "status-warning";
  }

  if (
    status === "ENFORCEMENT"
  ) {
    return "status-danger";
  }

  if (
    status === "MEDIATION" ||
    status === "HEARING"
  ) {
    return "status-info";
  }

  return "status-neutral";
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleDateString();
}


function truncate(text, length) {
  if (!text) {
    return "";
  }

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length)}...`;
}


export default Complaints;