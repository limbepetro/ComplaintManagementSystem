import { useEffect, useMemo, useState } from "react";
import api from "../api";

const EMPTY_FORM = {
  decision_award: "",
  bill_reference: "",
  filing_date: "",
  amount_claimed: "",
};

function CostTaxation() {
  const [taxations, setTaxations] = useState([]);
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
    loadTaxations();
  }, []);

  async function loadTaxations() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "cost-taxations/"
      );

      setTaxations(
        Array.isArray(response.data)
          ? response.data
          : response.data?.results || []
      );
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(
          err.response?.data,
          "Unable to load cost taxation records."
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
        "cost-taxations/available-awards/"
      );

      setAvailableAwards(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(
          err.response?.data,
          "Unable to load awards available for taxation."
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

    if (!form.decision_award) {
      setError(
        "Please select a decision and award."
      );
      return;
    }

    if (!form.bill_reference.trim()) {
      setError(
        "Bill reference is required."
      );
      return;
    }

    if (!form.filing_date) {
      setError(
        "Filing date is required."
      );
      return;
    }

    if (!form.amount_claimed) {
      setError(
        "Amount claimed is required."
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
        bill_reference:
          form.bill_reference.trim(),
        filing_date:
          form.filing_date,
        amount_claimed:
          Number(form.amount_claimed),
      };

      const response = await api.post(
        "cost-taxations/",
        payload
      );

      setTaxations((current) => [
        response.data,
        ...current,
      ]);

      setShowCreate(false);
      setForm(EMPTY_FORM);

      setSuccess(
        "Cost taxation application submitted successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(
          err.response?.data,
          "Unable to submit cost taxation."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredTaxations = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return taxations.filter((item) => {
      const reference =
        String(
          item.bill_reference || ""
        ).toLowerCase();

      const award =
        String(
          item.decision_award || ""
        ).toLowerCase();

      const matchesSearch =
        !query ||
        reference.includes(query) ||
        award.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    taxations,
    search,
    statusFilter,
  ]);

  const submittedCount =
    countStatus(
      taxations,
      "SUBMITTED"
    );

  const taxationCount =
    countStatus(
      taxations,
      "UNDER_TAXATION"
    );

  const taxedCount =
    countStatus(
      taxations,
      "TAXED"
    );

  const completedCount =
    countStatus(
      taxations,
      "COMPLETED"
    );

  return (
    <div className="module-page">

      <div className="page-heading">

        <div>

          <p className="welcome">
            COSTS & TAXATION
          </p>

          <h1>
            Cost Taxation
          </h1>

          <p className="subtitle">
            Manage bills of costs and taxation
            decisions associated with awards.
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + New Taxation
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
            Total Bills
          </span>

          <strong>
            {taxations.length}
          </strong>

          <small>
            Cost taxation applications
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Submitted
          </span>

          <strong>
            {submittedCount}
          </strong>

          <small>
            Awaiting taxation
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Under Taxation
          </span>

          <strong>
            {taxationCount}
          </strong>

          <small>
            Currently assessed
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
            {taxedCount} taxed
          </small>
        </div>

      </div>

      <section className="module-panel">

        <div className="module-panel-header">

          <div>

            <h2>
              Cost Taxation Register
            </h2>

            <p>
              Bills submitted for assessment
              against decisions and awards.
            </p>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadTaxations}
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
              placeholder="Search bill reference or award..."
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

            <option value="SUBMITTED">
              Submitted
            </option>

            <option value="UNDER_TAXATION">
              Under Taxation
            </option>

            <option value="TAXED">
              Taxed
            </option>

            <option value="DISALLOWED">
              Disallowed
            </option>

            <option value="COMPLETED">
              Completed
            </option>

          </select>

        </div>

        {loading ? (

          <div className="module-message">

            <div className="loading-spinner"></div>

            Loading taxation records...

          </div>

        ) : filteredTaxations.length === 0 ? (

          <div className="module-empty">

            <div className="empty-icon">
              ▰
            </div>

            <h3>
              No taxation records found
            </h3>

            <p>
              Taxation applications will appear
              here when they are submitted.
            </p>

          </div>

        ) : (

          <div className="module-table-wrapper">

            <table className="module-table">

              <thead>

                <tr>

                  <th>
                    Bill Reference
                  </th>

                  <th>
                    Award
                  </th>

                  <th>
                    Filing Date
                  </th>

                  <th>
                    Amount Claimed
                  </th>

                  <th>
                    Amount Allowed
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredTaxations.map(
                  (item) => (

                    <tr
                      key={item.id}
                    >

                      <td>

                        <strong className="case-reference">
                          {item.bill_reference}
                        </strong>

                      </td>

                      <td>
                        #{item.decision_award}
                      </td>

                      <td>
                        {formatDate(
                          item.filing_date
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          item.amount_claimed
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          item.amount_allowed
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

          <div className="modal-card">

            <div className="modal-header">

              <div>

                <span className="module-eyebrow">
                  TAXATION INTAKE
                </span>

                <h2>
                  New Cost Taxation
                </h2>

                <p>
                  Submit a bill of costs for
                  taxation.
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
                  Taxation Information
                </div>

                {formLoading ? (

                  <div className="module-message">
                    Loading eligible awards...
                  </div>

                ) : availableAwards.length === 0 ? (

                  <div className="module-empty">

                    <div className="empty-icon">
                      ▰
                    </div>

                    <h3>
                      No eligible awards
                    </h3>

                    <p>
                      An eligible decision or award
                      without active taxation is
                      required.
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
                          handleChange
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
                                award.status
                              )}
                              {" — "}
                              {award.case_number}
                            </option>

                          )
                        )}

                      </select>

                    </div>

                    <div className="form-grid">

                      <div className="form-field">

                        <label>

                          Bill Reference

                          <span className="required-mark">
                            *
                          </span>

                        </label>

                        <input
                          type="text"
                          name="bill_reference"
                          value={
                            form.bill_reference
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="e.g. PDPC-COST-2026-0001"
                          required
                        />

                      </div>

                      <div className="form-field">

                        <label>

                          Filing Date

                          <span className="required-mark">
                            *
                          </span>

                        </label>

                        <input
                          type="date"
                          name="filing_date"
                          value={
                            form.filing_date
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

                        Amount Claimed

                        <span className="required-mark">
                          *
                        </span>

                      </label>

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="amount_claimed"
                        value={
                          form.amount_claimed
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="0.00"
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
                          New taxation applications
                          start as SUBMITTED. Taxation
                          decisions are controlled by
                          the backend.
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
                    ? "Submitting..."
                    : "Submit Taxation"}
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
    case "TAXED":
    case "COMPLETED":
      return "status-success";

    case "UNDER_TAXATION":
      return "status-info";

    case "DISALLOWED":
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

export default CostTaxation;