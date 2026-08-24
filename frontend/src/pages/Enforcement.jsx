import { useEffect, useMemo, useState } from "react";
import api from "../api";

const EMPTY_FORM = {
  decision_award: "",
  enforcement_reference: "",
  issue_date: "",
  compliance_deadline: "",
  amount_due: "",
  enforcement_action: "",
  notes: "",
};

function Enforcement() {
  const [cases, setCases] = useState([]);
  const [availableAwards, setAvailableAwards] =
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
    loadCases();
  }, []);

  async function loadCases() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "enforcement-cases/"
      );

      setCases(
        Array.isArray(response.data)
          ? response.data
          : response.data?.results || []
      );
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
          err.response?.data,
          "Unable to load enforcement cases."
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
        "enforcement-cases/available-awards/"
      );

      setAvailableAwards(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
          err.response?.data,
          "Unable to load awards available for enforcement."
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

  function handleAwardChange(event) {
    const awardId = event.target.value;

    const selectedAward =
      availableAwards.find(
        (item) =>
          String(item.id) ===
          String(awardId)
      );

    setForm((current) => ({
      ...current,
      decision_award: awardId,
      amount_due:
        selectedAward?.award_amount ?? "",
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (!form.decision_award) {
      setError(
        "Please select a decision and award."
      );
      return;
    }

    if (!form.enforcement_reference.trim()) {
      setError(
        "Enforcement reference is required."
      );
      return;
    }

    if (!form.issue_date) {
      setError(
        "Issue date is required."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        decision_award:
          Number(form.decision_award),
        enforcement_reference:
          form.enforcement_reference.trim(),
        issue_date:
          form.issue_date,
        compliance_deadline:
          form.compliance_deadline || null,
        amount_due:
          form.amount_due
            ? Number(form.amount_due)
            : null,
        amount_paid: 0,
        enforcement_action:
          form.enforcement_action.trim(),
        notes:
          form.notes.trim(),
      };

      const response = await api.post(
        "enforcement-cases/",
        payload
      );

      setCases((current) => [
        response.data,
        ...current,
      ]);

      setShowCreate(false);
      setForm(EMPTY_FORM);

      setSuccess(
        "Enforcement case created successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
          err.response?.data,
          "Unable to create the enforcement case."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredCases = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return cases.filter((item) => {
      const reference =
        String(
          item.enforcement_reference || ""
        ).toLowerCase();

      const award =
        String(
          item.decision_award || ""
        ).toLowerCase();

      const status =
        String(
          item.status || ""
        ).toLowerCase();

      const matchesSearch =
        !query ||
        reference.includes(query) ||
        award.includes(query) ||
        status.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    cases,
    search,
    statusFilter,
  ]);

  const pendingCount =
    countStatus(
      cases,
      "PENDING"
    );

  const noticeCount =
    countStatus(
      cases,
      "NOTICE_ISSUED"
    );

  const complianceCount =
    countStatus(
      cases,
      "COMPLIANCE_PENDING"
    );

  const completedCount =
    countStatus(
      cases,
      "COMPLETED"
    );

  return (
    <div className="module-page">

      <div className="page-heading">

        <div>

          <p className="welcome">
            AWARD COMPLIANCE
          </p>

          <h1>
            Enforcement
          </h1>

          <p className="subtitle">
            Monitor implementation and compliance
            with issued decisions and awards.
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + New Enforcement
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
            Total Cases
          </span>

          <strong>
            {cases.length}
          </strong>

          <small>
            Enforcement records
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Pending
          </span>

          <strong>
            {pendingCount}
          </strong>

          <small>
            Awaiting first action
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Compliance Pending
          </span>

          <strong>
            {complianceCount}
          </strong>

          <small>
            Awaiting compliance
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
            {noticeCount} notices issued
          </small>
        </div>

      </div>

      <section className="module-panel">

        <div className="module-panel-header">

          <div>

            <h2>
              Enforcement Register
            </h2>

            <p>
              Cases arising from decisions and
              awards requiring compliance.
            </p>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadCases}
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
              placeholder="Search enforcement reference or award..."
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

            <option value="PENDING">
              Pending
            </option>

            <option value="NOTICE_ISSUED">
              Notice Issued
            </option>

            <option value="COMPLIANCE_PENDING">
              Compliance Pending
            </option>

            <option value="COMPLIED">
              Complied
            </option>

            <option value="NON_COMPLIANT">
              Non-Compliant
            </option>

            <option value="COMPLETED">
              Completed
            </option>

          </select>

        </div>

        {loading ? (

          <div className="module-message">

            <div className="loading-spinner"></div>

            Loading enforcement cases...

          </div>

        ) : filteredCases.length === 0 ? (

          <div className="module-empty">

            <div className="empty-icon">
              ◈
            </div>

            <h3>
              No enforcement cases found
            </h3>

            <p>
              Enforcement records will appear
              here when an award enters enforcement.
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
                    Award
                  </th>

                  <th>
                    Issue Date
                  </th>

                  <th>
                    Deadline
                  </th>

                  <th>
                    Amount Due
                  </th>

                  <th>
                    Paid
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredCases.map(
                  (item) => (

                    <tr
                      key={item.id}
                    >

                      <td>

                        <strong className="case-reference">
                          {item.enforcement_reference}
                        </strong>

                      </td>

                      <td>
                        #{item.decision_award}
                      </td>

                      <td>
                        {formatDate(
                          item.issue_date
                        )}
                      </td>

                      <td>
                        {formatDate(
                          item.compliance_deadline
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          item.amount_due
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          item.amount_paid
                        )}
                      </td>

                      <td>

                        <span
                          className={`status-badge ${
                            getStatusClass(
                              item.status
                            )
                          }`}
                        >
                          {formatStatus(
                            item.status
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
                  ENFORCEMENT INTAKE
                </span>

                <h2>
                  New Enforcement Case
                </h2>

                <p>
                  Begin enforcement against an
                  eligible decision or award.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeCreateForm
                }
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
                  Enforcement Information
                </div>

                {formLoading ? (

                  <div className="module-message">
                    Loading eligible awards...
                  </div>

                ) : availableAwards.length === 0 ? (

                  <div className="module-empty">

                    <div className="empty-icon">
                      ◈
                    </div>

                    <h3>
                      No eligible awards
                    </h3>

                    <p>
                      An issued, final, or
                      enforcement-stage award
                      without active enforcement
                      is required.
                    </p>

                  </div>

                ) : (

                  <>

                    <div className="form-field">

                      <label>

                        Decision & Award

                        <span className="required-mark">
                          *
                        </span>

                      </label>

                      <select
                        name="decision_award"
                        value={
                          form.decision_award
                        }
                        onChange={
                          handleAwardChange
                        }
                        required
                      >

                        <option value="">
                          Select decision and award
                        </option>

                        {availableAwards.map(
                          (award) => (

                            <option
                              key={award.id}
                              value={award.id}
                            >
                              {award.reference_number}
                              {" — "}
                              {formatStatus(
                                award.outcome
                              )}
                              {" — "}
                              {formatMoney(
                                award.award_amount
                              )}
                            </option>

                          )
                        )}

                      </select>

                    </div>

                    <div className="form-grid">

                      <div className="form-field">

                        <label>

                          Enforcement Reference

                          <span className="required-mark">
                            *
                          </span>

                        </label>

                        <input
                          type="text"
                          name="enforcement_reference"
                          value={
                            form.enforcement_reference
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="e.g. PDPC-ENF-2026-0001"
                          required
                        />

                      </div>

                      <div className="form-field">

                        <label>

                          Issue Date

                          <span className="required-mark">
                            *
                          </span>

                        </label>

                        <input
                          type="date"
                          name="issue_date"
                          value={
                            form.issue_date
                          }
                          onChange={
                            handleChange
                          }
                          required
                        />

                      </div>

                      <div className="form-field">

                        <label>
                          Compliance Deadline
                        </label>

                        <input
                          type="date"
                          name="compliance_deadline"
                          value={
                            form.compliance_deadline
                          }
                          onChange={
                            handleChange
                          }
                        />

                      </div>

                      <div className="form-field">

                        <label>
                          Amount Due
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="amount_due"
                          value={
                            form.amount_due
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="0.00"
                        />

                      </div>

                    </div>

                    <div className="form-field">

                      <label>
                        Enforcement Action
                      </label>

                      <textarea
                        name="enforcement_action"
                        value={
                          form.enforcement_action
                        }
                        onChange={
                          handleChange
                        }
                        rows="5"
                        placeholder="Describe the enforcement action..."
                      />

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
                        placeholder="Additional enforcement notes..."
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
                          New enforcement cases
                          start as PENDING.
                          Compliance transitions are
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
                    availableAwards.length === 0
                  }
                >
                  {saving
                    ? "Creating..."
                    : "Create Enforcement"}
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
    case "COMPLIED":
    case "COMPLETED":
      return "status-success";

    case "NOTICE_ISSUED":
      return "status-info";

    case "COMPLIANCE_PENDING":
      return "status-warning";

    case "NON_COMPLIANT":
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

export default Enforcement;