import { useEffect, useMemo, useState } from "react";
import api from "../api";

const EMPTY_FORM = {
  complaint: "",
  closure_reference: "",
  closure_date: "",
  reason: "ENFORCEMENT_COMPLETED",
  summary: "",
  notes: "",
};

function CaseClosure() {
  const [closures, setClosures] = useState([]);
  const [availableCases, setAvailableCases] =
    useState([]);

  const [loading, setLoading] =
    useState(true);
  const [formLoading, setFormLoading] =
    useState(false);
  const [saving, setSaving] =
    useState(false);

  const [showCreate, setShowCreate] =
    useState(false);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    loadClosures();
  }, []);

  async function loadClosures() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "case-closures/"
      );

      setClosures(
        Array.isArray(response.data)
          ? response.data
          : response.data?.results || []
      );
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
          err.response?.data,
          "Unable to load case closures."
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
        "case-closures/available-cases/"
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
          "Unable to load cases available for closure."
        )
      );
    } finally {
      setFormLoading(false);
    }
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowCreate(false);
    setForm(EMPTY_FORM);
  }

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (!form.complaint) {
      setError(
        "Please select a case."
      );
      return;
    }

    if (!form.closure_reference.trim()) {
      setError(
        "Closure reference is required."
      );
      return;
    }

    if (!form.closure_date) {
      setError(
        "Closure date is required."
      );
      return;
    }

    if (!form.summary.trim()) {
      setError(
        "Closure summary is required."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        "case-closures/",
        {
          complaint:
            Number(form.complaint),

          closure_reference:
            form.closure_reference.trim(),

          closure_date:
            form.closure_date,

          reason:
            form.reason,

          summary:
            form.summary.trim(),

          notes:
            form.notes.trim(),
        }
      );

      setClosures((current) => [
        response.data,
        ...current,
      ]);

      setShowCreate(false);
      setForm(EMPTY_FORM);

      setSuccess(
        "Case closed successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
          err.response?.data,
          "Unable to close the case."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredClosures =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return closures.filter(
        (item) => {
          const reference =
            String(
              item.closure_reference ||
                ""
            ).toLowerCase();

          const complaint =
            String(
              item.complaint || ""
            ).toLowerCase();

          return (
            !query ||
            reference.includes(query) ||
            complaint.includes(query)
          );
        }
      );
    }, [closures, search]);

  return (
    <div className="module-page">

      <div className="page-heading">

        <div>

          <p className="welcome">
            CASE COMPLETION
          </p>

          <h1>
            Case Closure
          </h1>

          <p className="subtitle">
            Complete and formally close cases
            after enforcement requirements have
            been satisfied.
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + Close Case
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
            Closed Cases
          </span>

          <strong>
            {closures.length}
          </strong>

          <small>
            Completed records
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Available
          </span>

          <strong>
            {availableCases.length}
          </strong>

          <small>
            Eligible for closure
          </small>
        </div>

      </div>

      <section className="module-panel">

        <div className="module-panel-header">

          <div>

            <h2>
              Case Closure Register
            </h2>

            <p>
              Cases formally completed in the
              complaint management system.
            </p>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadClosures}
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
              placeholder="Search closure reference or case..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

        </div>

        {loading ? (

          <div className="module-message">
            <div className="loading-spinner"></div>
            Loading case closures...
          </div>

        ) : filteredClosures.length === 0 ? (

          <div className="module-empty">

            <div className="empty-icon">
              ✓
            </div>

            <h3>
              No closed cases found
            </h3>

            <p>
              Completed closures will appear
              here.
            </p>

          </div>

        ) : (

          <div className="module-table-wrapper">

            <table className="module-table">

              <thead>

                <tr>
                  <th>
                    Closure Reference
                  </th>

                  <th>
                    Complaint
                  </th>

                  <th>
                    Closure Date
                  </th>

                  <th>
                    Reason
                  </th>
                </tr>

              </thead>

              <tbody>

                {filteredClosures.map(
                  (item) => (

                    <tr key={item.id}>

                      <td>
                        <strong className="case-reference">
                          {
                            item.closure_reference
                          }
                        </strong>
                      </td>

                      <td>
                        #{item.complaint}
                      </td>

                      <td>
                        {formatDate(
                          item.closure_date
                        )}
                      </td>

                      <td>
                        {formatStatus(
                          item.reason
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
              closeForm();
            }
          }}
        >

          <div className="modal-card">

            <div className="modal-header">

              <div>

                <span className="module-eyebrow">
                  CLOSURE INTAKE
                </span>

                <h2>
                  Close Case
                </h2>

                <p>
                  Formally complete an eligible
                  enforcement case.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeForm}
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
                  Closure Information
                </div>

                {formLoading ? (

                  <div className="module-message">
                    Loading eligible cases...
                  </div>

                ) : availableCases.length === 0 ? (

                  <div className="module-empty">

                    <div className="empty-icon">
                      ✓
                    </div>

                    <h3>
                      No eligible cases
                    </h3>

                    <p>
                      A complaint must have a
                      completed enforcement case
                      before it can be closed.
                    </p>

                  </div>

                ) : (

                  <>

                    <div className="form-field">

                      <label>
                        Case
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
                          Select case
                        </option>

                        {availableCases.map(
                          (item) => (
                            <option
                              key={item.id}
                              value={item.id}
                            >
                              {item.case_number}
                              {" — "}
                              {item.title}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    <div className="form-grid">

                      <div className="form-field">

                        <label>
                          Closure Reference
                          <span className="required-mark">
                            *
                          </span>
                        </label>

                        <input
                          type="text"
                          name="closure_reference"
                          value={
                            form.closure_reference
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="e.g. PDPC-CLOSE-2026-0001"
                          required
                        />

                      </div>

                      <div className="form-field">

                        <label>
                          Closure Date
                          <span className="required-mark">
                            *
                          </span>
                        </label>

                        <input
                          type="date"
                          name="closure_date"
                          value={
                            form.closure_date
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
                        Closure Reason
                        <span className="required-mark">
                          *
                        </span>
                      </label>

                      <select
                        name="reason"
                        value={form.reason}
                        onChange={
                          handleChange
                        }
                      >

                        <option value="AWARD_COMPLIED">
                          Award Complied With
                        </option>

                        <option value="SETTLEMENT_REACHED">
                          Settlement Reached
                        </option>

                        <option value="REVIEW_COMPLETED">
                          Review Completed
                        </option>

                        <option value="ENFORCEMENT_COMPLETED">
                          Enforcement Completed
                        </option>

                        <option value="OTHER">
                          Other
                        </option>

                      </select>

                    </div>

                    <div className="form-field">

                      <label>
                        Summary
                        <span className="required-mark">
                          *
                        </span>
                      </label>

                      <textarea
                        name="summary"
                        value={form.summary}
                        onChange={
                          handleChange
                        }
                        rows="6"
                        placeholder="Summarize how the case was completed..."
                        required
                      />

                    </div>

                    <div className="form-field">

                      <label>
                        Notes
                      </label>

                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={
                          handleChange
                        }
                        rows="4"
                        placeholder="Additional closure notes..."
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
                          The backend only permits
                          closure after enforcement
                          has been completed.
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
                  onClick={closeForm}
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
                    ? "Closing..."
                    : "Close Case"}
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

export default CaseClosure;