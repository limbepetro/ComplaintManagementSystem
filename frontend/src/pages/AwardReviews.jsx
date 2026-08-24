import { useEffect, useMemo, useState } from "react";
import api from "../api";

const EMPTY_FORM = {
  decision_award: "",
  application_date: "",
  grounds: "",
};

function AwardReviews() {
  const [reviews, setReviews] = useState([]);
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
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "award-reviews/"
      );

      setReviews(
        Array.isArray(response.data)
          ? response.data
          : response.data?.results || []
      );
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
          err.response?.data,
          "Unable to load award reviews."
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
        "award-reviews/available-awards/"
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
          "Unable to load awards available for review."
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

    if (!form.application_date) {
      setError(
        "Application date is required."
      );
      return;
    }

    if (!form.grounds.trim()) {
      setError(
        "Review grounds are required."
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
        application_date:
          form.application_date,
        grounds:
          form.grounds.trim(),
      };

      const response = await api.post(
        "award-reviews/",
        payload
      );

      setReviews((current) => [
        response.data,
        ...current,
      ]);

      setShowCreate(false);
      setForm(EMPTY_FORM);

      setSuccess(
        "Award review submitted successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
          err.response?.data,
          "Unable to submit the award review."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredReviews = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return reviews.filter((review) => {
      const reference =
        String(
          review.decision_award?.reference_number ||
          review.decision_award ||
          ""
        ).toLowerCase();

      const grounds =
        String(
          review.grounds || ""
        ).toLowerCase();

      const matchesSearch =
        !query ||
        reference.includes(query) ||
        grounds.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        review.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    reviews,
    search,
    statusFilter,
  ]);

  const submittedCount =
    countStatus(
      reviews,
      "SUBMITTED"
    );

  const underReviewCount =
    countStatus(
      reviews,
      "UNDER_REVIEW"
    );

  const completedCount =
    countStatus(
      reviews,
      "COMPLETED"
    );

  const confirmedCount =
    reviews.filter(
      (review) =>
        review.outcome === "CONFIRMED"
    ).length;

  return (
    <div className="module-page">

      <div className="page-heading">

        <div>

          <p className="welcome">
            POST-DECISION REVIEW
          </p>

          <h1>
            Award Reviews
          </h1>

          <p className="subtitle">
            Manage applications to review
            decisions and awards.
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + New Review
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
            Total Reviews
          </span>

          <strong>
            {reviews.length}
          </strong>

          <small>
            Review applications
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
            Awaiting assessment
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Under Review
          </span>

          <strong>
            {underReviewCount}
          </strong>

          <small>
            Active reviews
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
            {confirmedCount} confirmed
          </small>
        </div>

      </div>

      <section className="module-panel">

        <div className="module-panel-header">

          <div>

            <h2>
              Award Review Register
            </h2>

            <p>
              Review applications associated
              with issued decisions and awards.
            </p>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadReviews}
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
              placeholder="Search reference or grounds..."
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

            <option value="UNDER_REVIEW">
              Under Review
            </option>

            <option value="APPROVED">
              Approved
            </option>

            <option value="REJECTED">
              Rejected
            </option>

            <option value="COMPLETED">
              Completed
            </option>

          </select>

        </div>

        {loading ? (

          <div className="module-message">

            <div className="loading-spinner"></div>

            Loading award reviews...

          </div>

        ) : filteredReviews.length === 0 ? (

          <div className="module-empty">

            <div className="empty-icon">
              ↻
            </div>

            <h3>
              No award reviews found
            </h3>

            <p>
              Review applications will appear
              here when submitted.
            </p>

          </div>

        ) : (

          <div className="module-table-wrapper">

            <table className="module-table">

              <thead>

                <tr>

                  <th>
                    Award Reference
                  </th>

                  <th>
                    Application Date
                  </th>

                  <th>
                    Grounds
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Outcome
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredReviews.map(
                  (review) => (

                    <tr
                      key={review.id}
                    >

                      <td>

                        <strong className="case-reference">
                          {getAwardReference(
                            review.decision_award
                          )}
                        </strong>

                      </td>

                      <td>
                        {formatDate(
                          review.application_date
                        )}
                      </td>

                      <td>

                        <div className="table-primary">
                          {truncate(
                            review.grounds,
                            90
                          )}
                        </div>

                      </td>

                      <td>

                        <span
                          className={`status-badge ${
                            getStatusClass(
                              review.status
                            )
                          }`}
                        >
                          {formatStatus(
                            review.status
                          )}
                        </span>

                      </td>

                      <td>

                        <span
                          className={`status-badge ${
                            getOutcomeClass(
                              review.outcome
                            )
                          }`}
                        >
                          {formatStatus(
                            review.outcome
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
                  REVIEW INTAKE
                </span>

                <h2>
                  New Award Review
                </h2>

                <p>
                  Submit a review application
                  against an issued decision.
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
                  Review Information
                </div>

                {formLoading ? (

                  <div className="module-message">
                    Loading eligible awards...
                  </div>

                ) : availableAwards.length === 0 ? (

                  <div className="module-empty">

                    <div className="empty-icon">
                      ↻
                    </div>

                    <h3>
                      No eligible awards
                    </h3>

                    <p>
                      An issued or final decision
                      without a completed review is
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
                              key={
                                award.id
                              }
                              value={
                                award.id
                              }
                            >
                              {
                                award.reference_number
                              }
                              {" — "}
                              {formatStatus(
                                award.outcome
                              )}
                              {" — "}
                              {formatDate(
                                award.decision_date
                              )}
                            </option>

                          )
                        )}

                      </select>

                    </div>

                    <div className="form-field">

                      <label>

                        Application Date

                        <span className="required-mark">
                          *
                        </span>

                      </label>

                      <input
                        type="date"
                        name="application_date"
                        value={
                          form.application_date
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />

                    </div>

                    <div className="form-field">

                      <label>

                        Grounds for Review

                        <span className="required-mark">
                          *
                        </span>

                      </label>

                      <textarea
                        name="grounds"
                        value={
                          form.grounds
                        }
                        onChange={
                          handleChange
                        }
                        rows="7"
                        placeholder="State the grounds for requesting review..."
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
                          New review applications
                          start as SUBMITTED.
                          Review outcomes are controlled
                          by the backend workflow.
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
                    : "Submit Review"}
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

function getAwardReference(award) {
  if (!award) {
    return "—";
  }

  if (typeof award === "string") {
    return award;
  }

  return (
    award.reference_number ||
    `Award #${award.id || "—"}`
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

    case "UNDER_REVIEW":
      return "status-info";

    case "REJECTED":
      return "status-danger";

    case "APPROVED":
      return "status-success";

    default:
      return "status-warning";
  }
}

function getOutcomeClass(outcome) {
  switch (outcome) {
    case "CONFIRMED":
      return "status-success";

    case "VARIED":
      return "status-warning";

    case "REVERSED":
      return "status-danger";

    default:
      return "status-neutral";
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

export default AwardReviews;