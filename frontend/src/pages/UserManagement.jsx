import { useEffect, useMemo, useState } from "react";
import api from "../api";

const EMPTY_FORM = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  role: "OFFICER",
  is_active: true,
  password: "",
};

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showCreate, setShowCreate] =
    useState(false);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("ALL");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    loadUsers();
    loadStatistics();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "users/"
      );

      const data = Array.isArray(
        response.data
      )
        ? response.data
        : response.data?.results || [];

      setUsers(data);
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(
          err.response?.data,
          "Unable to load system users."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadStatistics() {
    try {
      const response = await api.get(
        "users/statistics/"
      );

      setStatistics(response.data);
    } catch (err) {
      console.error(err);
    }
  }

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowCreate(false);
    setForm(EMPTY_FORM);
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (!form.username.trim()) {
      setError(
        "Username is required."
      );
      return;
    }

    if (!form.first_name.trim()) {
      setError(
        "First name is required."
      );
      return;
    }

    if (!form.password) {
      setError(
        "Password is required."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        "users/",
        {
          username:
            form.username.trim(),

          first_name:
            form.first_name.trim(),

          last_name:
            form.last_name.trim(),

          email:
            form.email.trim(),

          phone_number:
            form.phone_number.trim(),

          role:
            form.role,

          is_active:
            form.is_active,

          password:
            form.password,
        }
      );

      setUsers((current) => [
        response.data,
        ...current,
      ]);

      setShowCreate(false);
      setForm(EMPTY_FORM);

      setSuccess(
        "User account created successfully."
      );

      loadStatistics();
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(
          err.response?.data,
          "Unable to create user account."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(user) {
    if (
      user.id ===
      getCurrentUserId()
    ) {
      setError(
        "You cannot deactivate your own account."
      );
      return;
    }

    const action =
      user.is_active
        ? "deactivate"
        : "activate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${user.username}?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await api.patch(
        `users/${user.id}/`,
        {
          is_active:
            !user.is_active,
        }
      );

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? response.data
            : item
        )
      );

      setSuccess(
        `User ${action}d successfully.`
      );

      loadStatistics();
    } catch (err) {
      console.error(err);

      setError(
        formatApiError(
          err.response?.data,
          `Unable to ${action} user.`
        )
      );
    }
  }

  const filteredUsers =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return users.filter((user) => {
        const name =
          `${user.first_name || ""} ${
            user.last_name || ""
          }`.toLowerCase();

        const username =
          String(
            user.username || ""
          ).toLowerCase();

        const email =
          String(
            user.email || ""
          ).toLowerCase();

        const matchesSearch =
          !query ||
          name.includes(query) ||
          username.includes(query) ||
          email.includes(query);

        const matchesRole =
          roleFilter === "ALL" ||
          user.role === roleFilter;

        const matchesStatus =
          statusFilter === "ALL" ||
          (
            statusFilter === "ACTIVE" &&
            user.is_active
          ) ||
          (
            statusFilter === "INACTIVE" &&
            !user.is_active
          );

        return (
          matchesSearch &&
          matchesRole &&
          matchesStatus
        );
      });
    }, [
      users,
      search,
      roleFilter,
      statusFilter,
    ]);

  return (
    <div className="module-page">

      <div className="page-heading">

        <div>

          <p className="welcome">
            ADMINISTRATION
          </p>

          <h1>
            User Management
          </h1>

          <p className="subtitle">
            Manage system accounts, roles and
            account activation status.
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setError("");
            setSuccess("");
            setForm(EMPTY_FORM);
            setShowCreate(true);
          }}
        >
          + New User
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
            Total Users
          </span>

          <strong>
            {statistics?.total ??
              users.length}
          </strong>

          <small>
            Registered accounts
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Active
          </span>

          <strong>
            {statistics?.active ??
              users.filter(
                (user) =>
                  user.is_active
              ).length}
          </strong>

          <small>
            Active accounts
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Inactive
          </span>

          <strong>
            {statistics?.inactive ??
              users.filter(
                (user) =>
                  !user.is_active
              ).length}
          </strong>

          <small>
            Disabled accounts
          </small>
        </div>

        <div className="module-stat-card">
          <span>
            Administrators
          </span>

          <strong>
            {statistics?.roles?.admins ??
              users.filter(
                (user) =>
                  user.role === "ADMIN"
              ).length}
          </strong>

          <small>
            System administrators
          </small>
        </div>

      </div>

      <section className="module-panel">

        <div className="module-panel-header">

          <div>

            <h2>
              User Register
            </h2>

            <p>
              System accounts and their assigned
              roles.
            </p>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              loadUsers();
              loadStatistics();
            }}
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
              placeholder="Search name, username or email..."
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
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value
              )
            }
          >

            <option value="ALL">
              All roles
            </option>

            <option value="ADMIN">
              Administrator
            </option>

            <option value="OFFICER">
              Commission Officer
            </option>

            <option value="CASE_OFFICER">
              Case Officer
            </option>

            <option value="MEDIATOR">
              Mediator
            </option>

            <option value="HEARING_OFFICER">
              Hearing Officer
            </option>

          </select>

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

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>

          </select>

        </div>

        {loading ? (

          <div className="module-message">

            <div className="loading-spinner"></div>

            Loading users...

          </div>

        ) : filteredUsers.length === 0 ? (

          <div className="module-empty">

            <div className="empty-icon">
              ♙
            </div>

            <h3>
              No users found
            </h3>

            <p>
              No accounts match the selected
              filters.
            </p>

          </div>

        ) : (

          <div className="module-table-wrapper">

            <table className="module-table">

              <thead>

                <tr>

                  <th>
                    User
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredUsers.map(
                  (user) => (

                    <tr key={user.id}>

                      <td>

                        <div className="table-primary">

                          {user.first_name ||
                            user.last_name
                            ? `${user.first_name || ""} ${
                                user.last_name || ""
                              }`.trim()
                            : user.username}

                        </div>

                        <div className="table-secondary">

                          @{user.username}

                        </div>

                      </td>

                      <td>
                        {user.email ||
                          "—"}
                      </td>

                      <td>
                        {user.phone_number ||
                          "—"}
                      </td>

                      <td>

                        <span className="status-badge status-info">

                          {formatStatus(
                            user.role
                          )}

                        </span>

                      </td>

                      <td>

                        <span
                          className={`status-badge ${
                            user.is_active
                              ? "status-success"
                              : "status-danger"
                          }`}
                        >

                          {user.is_active
                            ? "Active"
                            : "Inactive"}

                        </span>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            toggleUser(
                              user
                            )
                          }
                        >
                          {user.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

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

          <div className="modal-card large-modal">

            <div className="modal-header">

              <div>

                <span className="module-eyebrow">
                  ACCOUNT INTAKE
                </span>

                <h2>
                  Create User
                </h2>

                <p>
                  Create a new authorized system
                  account.
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
                  Account Information
                </div>

                <div className="form-grid">

                  <div className="form-field">

                    <label>
                      Username *
                    </label>

                    <input
                      type="text"
                      name="username"
                      value={
                        form.username
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>

                  <div className="form-field">

                    <label>
                      Role *
                    </label>

                    <select
                      name="role"
                      value={form.role}
                      onChange={
                        handleChange
                      }
                    >

                      <option value="OFFICER">
                        Commission Officer
                      </option>

                      <option value="CASE_OFFICER">
                        Case Officer
                      </option>

                      <option value="MEDIATOR">
                        Mediator
                      </option>

                      <option value="HEARING_OFFICER">
                        Hearing Officer
                      </option>

                      <option value="ADMIN">
                        System Administrator
                      </option>

                    </select>

                  </div>

                  <div className="form-field">

                    <label>
                      First Name *
                    </label>

                    <input
                      type="text"
                      name="first_name"
                      value={
                        form.first_name
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>

                  <div className="form-field">

                    <label>
                      Last Name
                    </label>

                    <input
                      type="text"
                      name="last_name"
                      value={
                        form.last_name
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  <div className="form-field">

                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  <div className="form-field">

                    <label>
                      Phone Number
                    </label>

                    <input
                      type="text"
                      name="phone_number"
                      value={
                        form.phone_number
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  <div className="form-field">

                    <label>
                      Initial Password *
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={
                        form.password
                      }
                      onChange={
                        handleChange
                      }
                      minLength="8"
                      required
                    />

                  </div>

                </div>

                <label className="checkbox-field">

                  <input
                    type="checkbox"
                    name="is_active"
                    checked={
                      form.is_active
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <span>
                    Account active
                  </span>

                </label>

                <div className="response-security-note">

                  <span>
                    🔐
                  </span>

                  <div>

                    <strong>
                      Security protected
                    </strong>

                    <p>
                      Passwords are never returned
                      through the user API. Account
                      activation and role changes
                      are administrator-controlled.
                    </p>

                  </div>

                </div>

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
                  disabled={saving}
                >
                  {saving
                    ? "Creating..."
                    : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

function getCurrentUserId() {
  try {
    const stored =
      localStorage.getItem(
        "user"
      );

    if (!stored) {
      return null;
    }

    return JSON.parse(stored)?.id;
  } catch {
    return null;
  }
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

export default UserManagement;