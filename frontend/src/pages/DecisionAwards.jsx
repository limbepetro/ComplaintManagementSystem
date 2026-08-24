import { useEffect, useMemo, useState } from "react";
import api from "../api";

const EMPTY_FORM = {
  complaint_id: "",
  hearing_id: "",
  reference_number: "",
  decision_date: "",
  outcome: "COMPLAINT_ALLOWED",
  findings: "",
  orders: "",
  reasons: "",
  award_amount: "",
  costs_awarded: "",
};

function DecisionAwards() {
  const [awards, setAwards] = useState([]);
  const [availableCases, setAvailableCases] =
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
    loadAwards();
  }, []);

  async function loadAwards() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "decision-awards/"
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setAwards(data);
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
          err.response?.data,
          "Unable to load decisions and awards."
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
        "decision-awards/available-cases/"
      );

      setAvailableCases(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
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
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleCaseChange(event) {
    const complaintId = event.target.value;

    const selectedCase =
      availableCases.find(
        (item) =>
          String(item.complaint_id) ===
          String(complaintId)
      );

    setForm((current) => ({
      ...current,
      complaint_id: complaintId,
      hearing_id: selectedCase
        ? String(selectedCase.hearing_id)
        : "",
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (!form.complaint_id) {
      setError("Please select a case.");
      return;
    }

    if (!form.hearing_id) {
      setError(
        "A completed hearing must be selected."
      );
      return;
    }

    if (!form.reference_number.trim()) {
      setError(
        "Decision reference number is required."
      );
      return;
    }

    if (!form.decision_date) {
      setError(
        "Decision date is required."
      );
      return;
    }

    if (!form.findings.trim()) {
      setError(
        "Findings are required."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        complaint: Number(
          form.complaint_id
        ),
        hearing: Number(
          form.hearing_id
        ),
        reference_number:
          form.reference_number.trim(),
        decision_date:
          form.decision_date,
        outcome:
          form.outcome,
        findings:
          form.findings.trim(),
        orders:
          form.orders.trim(),
        reasons:
          form.reasons.trim(),
        award_amount:
          form.award_amount
            ? Number(form.award_amount)
            : null,
        costs_awarded:
          form.costs_awarded
            ? Number(form.costs_awarded)
            : null,
      };

      const response = await api.post(
        "decision-awards/",
        payload
      );

      setAwards((current) => [
        response.data,
        ...current,
      ]);

      setShowCreate(false);
      setForm(EMPTY_FORM);

      setSuccess(
        "Decision and award created as DRAFT."
      );
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
          err.response?.data,
          "Unable to create the decision and award."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function issueAward(awardId) {
    const confirmed = window.confirm(
      "Issue this draft decision and award?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        `decision-awards/${awardId}/issue/`
      );

      setAwards((current) =>
        current.map((item) =>
          item.id === awardId
            ? response.data
            : item
        )
      );

      setSuccess(
        "Decision and award issued successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
          err.response?.data,
          "Unable to issue the decision and award."
        )
      );
    }
  }

  const filteredAwards = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return awards.filter((award) => {
      const reference =
        String(
          award.reference_number || ""
        ).toLowerCase();

      const complaint =
        String(
          award.complaint || ""
        ).toLowerCase();

      const outcome =
        String(
          award.outcome || ""
        ).toLowerCase();

      const matchesSearch =
        !query ||
        reference.includes(query) ||
        complaint.includes(query) ||
        outcome.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        award.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    awards,
    search,
    statusFilter,
  ]);

  const draftCount =
    awards.filter(
      (item) => item.status === "DRAFT"
    ).length;

  const issuedCount =
    awards.filter(
      (item) => item.status === "ISSUED"
    ).length;

  const finalCount =
    awards.filter(
      (item) => item.status === "FINAL"
    ).length;

  const reviewCount =
    awards.filter(
      (item) => item.status === "UNDER_REVIEW"
    ).length;

  return (
    <div className="module-page">

      <div className="page-heading">

        <div>

          <p className="welcome">
            DETERMINATION
          </p>

          <h1>
            Decision & Awards
          </h1>

          <p className="subtitle">
            Prepare, issue and monitor formal
            decisions and awards.
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + New Decision
        </button>

      </div>

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

      <div className="module-stats">

        <div className="module-stat-card">
          <span>
            Total Decisions
          </span>

          <strong>
            {awards.length}
          </strong>

          <small>
            Decision records
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Draft
          </span>

          <strong>
            {draftCount}
          </strong>

          <small>
            Awaiting issue
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Issued
          </span>

          <strong>
            {issuedCount}
          </strong>

          <small>
            Formally issued
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Final
          </span>

          <strong>
            {finalCount}
          </strong>

          <small>
            {reviewCount} under review
          </small>
        </div>

      </div>

      <section className="module-panel">

        <div className="module-panel-header">

          <div>

            <h2>
              Decision & Award Register
            </h2>

            <p>
              Decisions generated from completed
              hearing proceedings.
            </p>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadAwards}
          >
            Refresh
          </button>

        </div>

        <div className="module-toolbar">

          <div className="search-box">

            <span>
              ⌕
            </span>

            <input
              type="search"
              placeholder="Search reference, case or outcome..."
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

            <option value="DRAFT">
              Draft
            </option>

            <option value="ISSUED">
              Issued
            </option>

            <option value="UNDER_REVIEW">
              Under Review
            </option>

            <option value="FINAL">
              Final
            </option>

            <option value="ENFORCEMENT">
              Enforcement
            </option>

            <option value="CLOSED">
              Closed
            </option>

          </select>

        </div>

        {loading ? (

          <div className="module-message">

            <div className="loading-spinner"></div>

            Loading decisions and awards...

          </div>

        ) : filteredAwards.length === 0 ? (

          <div className="module-empty">

            <div className="empty-icon">
              ◆
            </div>

            <h3>
              No decisions found
            </h3>

            <p>
              Decisions and awards will appear
              here after eligible hearings.
            </p>

          </div>

        ) : (

          <div className="module-table-wrapper">

            <table className="module-table">

              <thead>

                <tr>

                  <th>
                    Reference
                  </th>

                  <th>
                    Complaint
                  </th>

                  <th>
                    Decision Date
                  </th>

                  <th>
                    Outcome
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredAwards.map(
                  (award) => (

                    <tr
                      key={award.id}
                    >

                      <td>

                        <strong className="case-reference">
                          {award.reference_number}
                        </strong>

                      </td>

                      <td>
                        #{award.complaint}
                      </td>

                      <td>
                        {formatDate(
                          award.decision_date
                        )}
                      </td>

                      <td>
                        {formatStatus(
                          award.outcome
                        )}
                      </td>

                      <td>

                        <span
                          className={`status-badge ${
                            getStatusClass(
                              award.status
                            )
                          }`}
                        >
                          {formatStatus(
                            award.status
                          )}
                        </span>

                      </td>

                      <td>
                        {formatMoney(
                          award.award_amount
                        )}
                      </td>

                      <td>

                        {award.status === "DRAFT" ? (

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              issueAward(
                                award.id
                              )
                            }
                          >
                            Issue
                          </button>

                        ) : (

                          <span className="table-secondary">
                            No action
                          </span>

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
                  DECISION INTAKE
                </span>

                <h2>
                  New Decision & Award
                </h2>

                <p>
                  Prepare a draft decision after
                  a completed hearing.
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
                  Case & Decision
                </div>

                {formLoading ? (

                  <div className="module-message">
                    Loading eligible cases...
                  </div>

                ) : availableCases.length === 0 ? (

                  <div className="module-empty">

                    <div className="empty-icon">
                      ◆
                    </div>

                    <h3>
                      No eligible hearing cases
                    </h3>

                    <p>
                      A completed hearing with no
                      existing decision is required.
                    </p>

                  </div>

                ) : (

                  <>

                    <div className="form-field">

                      <label>
                        Hearing Case
                        <span className="required-mark">
                          *
                        </span>
                      </label>

                      <select
                        value={
                          form.complaint_id
                        }
                        onChange={
                          handleCaseChange
                        }
                        required
                      >

                        <option value="">
                          Select completed hearing
                        </option>

                        {availableCases.map(
                          (item) => (
                            <option
                              key={
                                item.hearing_id
                              }
                              value={
                                item.complaint_id
                              }
                            >
                              {item.case_number}
                              {" — "}
                              {item.title}
                              {" — Hearing "}
                              {formatDate(
                                item.hearing_date
                              )}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    <div className="form-grid">

                      <div className="form-field">

                        <label>
                          Reference Number
                          <span className="required-mark">
                            *
                          </span>
                        </label>

                        <input
                          type="text"
                          name="reference_number"
                          value={
                            form.reference_number
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="e.g. PDPC-DA-2026-0001"
                          required
                        />

                      </div>

                      <div className="form-field">

                        <label>
                          Decision Date
                          <span className="required-mark">
                            *
                          </span>
                        </label>

                        <input
                          type="date"
                          name="decision_date"
                          value={
                            form.decision_date
                          }
                          onChange={
                            handleChange
                          }
                          required
                        />

                      </div>

                    </div>

                    <div className="form-field">

                      <label>
                        Outcome
                        <span className="required-mark">
                          *
                        </span>
                      </label>

                      <select
                        name="outcome"
                        value={form.outcome}
                        onChange={
                          handleChange
                        }
                      >

                        <option value="COMPLAINT_ALLOWED">
                          Complaint Allowed
                        </option>

                        <option value="COMPLAINT_DISMISSED">
                          Complaint Dismissed
                        </option>

                        <option value="PARTIALLY_ALLOWED">
                          Partially Allowed
                        </option>

                        <option value="SETTLED">
                          Settled
                        </option>

                        <option value="OTHER">
                          Other
                        </option>

                      </select>

                    </div>

                    <div className="form-field">

                      <label>
                        Findings
                        <span className="required-mark">
                          *
                        </span>
                      </label>

                      <textarea
                        name="findings"
                        value={form.findings}
                        onChange={
                          handleChange
                        }
                        rows="6"
                        placeholder="Record the findings of the hearing..."
                        required
                      />

                    </div>

                    <div className="form-field">

                      <label>
                        Orders
                      </label>

                      <textarea
                        name="orders"
                        value={form.orders}
                        onChange={
                          handleChange
                        }
                        rows="4"
                        placeholder="Enter orders or directions..."
                      />

                    </div>

                    <div className="form-field">

                      <label>
                        Reasons
                      </label>

                      <textarea
                        name="reasons"
                        value={form.reasons}
                        onChange={
                          handleChange
                        }
                        rows="4"
                        placeholder="Provide reasons supporting the determination..."
                      />

                    </div>

                    <div className="form-grid">

                      <div className="form-field">

                        <label>
                          Award Amount
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="award_amount"
                          value={
                            form.award_amount
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="0.00"
                        />

                      </div>

                      <div className="form-field">

                        <label>
                          Costs Awarded
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="costs_awarded"
                          value={
                            form.costs_awarded
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="0.00"
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
                          New decisions are created
                          as DRAFT. Issuing a decision
                          is a separate controlled action.
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
                    formLoading ||
                    availableCases.length === 0
                  }
                >
                  {saving
                    ? "Creating..."
                    : "Create Draft"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
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
    case "FINAL":
    case "CLOSED":
      return "status-success";

    case "ISSUED":
      return "status-info";

    case "UNDER_REVIEW":
      return "status-warning";

    case "ENFORCEMENT":
      return "status-danger";

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

function formatMoney(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "—";
  }

  return number.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function getApiError(data, fallback) {
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

export default DecisionAwards;