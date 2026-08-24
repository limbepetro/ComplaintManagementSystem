import { useEffect, useState } from "react";
import api from "../api";

const EMPTY_PASSWORD_FORM = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function Settings() {
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [passwordForm, setPasswordForm] =
    useState(EMPTY_PASSWORD_FORM);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("me/");
      setProfile(response.data);
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
          err.response?.data,
          "Unable to load your profile."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!passwordForm.current_password) {
      setError(
        "Current password is required."
      );
      return;
    }

    if (!passwordForm.new_password) {
      setError(
        "New password is required."
      );
      return;
    }

    if (
      passwordForm.new_password.length < 8
    ) {
      setError(
        "New password must contain at least 8 characters."
      );
      return;
    }

    if (
      passwordForm.new_password !==
      passwordForm.confirm_password
    ) {
      setError(
        "New password and confirmation do not match."
      );
      return;
    }

    setChangingPassword(true);

    try {
      await api.post(
        "users/change-password/",
        passwordForm
      );

      setPasswordForm(
        EMPTY_PASSWORD_FORM
      );

      setSuccess(
        "Password changed successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        getApiError(
          err.response?.data,
          "Unable to change your password."
        )
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="module-page">

      <div className="page-heading">

        <div>

          <p className="welcome">
            ACCOUNT SETTINGS
          </p>

          <h1>
            Settings
          </h1>

          <p className="subtitle">
            Manage your account information
            and security settings.
          </p>

        </div>

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

      {loading ? (

        <div className="module-panel">

          <div className="module-message">

            <div className="loading-spinner"></div>

            Loading account information...

          </div>

        </div>

      ) : (

        <div className="settings-grid">

          {/* PROFILE */}

          <section className="module-panel">

            <div className="module-panel-header">

              <div>

                <h2>
                  My Profile
                </h2>

                <p>
                  Your current system account
                  information.
                </p>

              </div>

            </div>

            <div className="settings-profile">

              <div className="settings-avatar">

                {(
                  profile?.first_name ||
                  profile?.username ||
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div>

                <h3>

                  {profile?.first_name ||
                    profile?.last_name
                    ? `${profile?.first_name || ""} ${
                        profile?.last_name || ""
                      }`.trim()
                    : profile?.username}

                </h3>

                <p>
                  @{profile?.username}
                </p>

              </div>

            </div>

            <div className="settings-fields">

              <div className="settings-field">

                <span>
                  First Name
                </span>

                <strong>
                  {profile?.first_name ||
                    "—"}
                </strong>

              </div>

              <div className="settings-field">

                <span>
                  Last Name
                </span>

                <strong>
                  {profile?.last_name ||
                    "—"}
                </strong>

              </div>

              <div className="settings-field">

                <span>
                  Username
                </span>

                <strong>
                  {profile?.username ||
                    "—"}
                </strong>

              </div>

              <div className="settings-field">

                <span>
                  Email
                </span>

                <strong>
                  {profile?.email ||
                    "—"}
                </strong>

              </div>

              <div className="settings-field">

                <span>
                  Phone Number
                </span>

                <strong>
                  {profile?.phone_number ||
                    "—"}
                </strong>

              </div>

              <div className="settings-field">

                <span>
                  Role
                </span>

                <strong>
                  {formatStatus(
                    profile?.role
                  )}
                </strong>

              </div>

              <div className="settings-field">

                <span>
                  Account Status
                </span>

                <strong>

                  <span
                    className={`status-badge ${
                      profile?.is_active
                        ? "status-success"
                        : "status-danger"
                    }`}
                  >
                    {profile?.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>

                </strong>

              </div>

            </div>

          </section>

          {/* PASSWORD */}

          <section className="module-panel">

            <div className="module-panel-header">

              <div>

                <h2>
                  Change Password
                </h2>

                <p>
                  Update your account password
                  securely.
                </p>

              </div>

            </div>

            <form
              className="complaint-form"
              onSubmit={
                handleChangePassword
              }
            >

              <div className="form-field">

                <label>
                  Current Password
                  <span className="required-mark">
                    *
                  </span>
                </label>

                <input
                  type="password"
                  name="current_password"
                  value={
                    passwordForm.current_password
                  }
                  onChange={
                    handlePasswordChange
                  }
                  autoComplete="current-password"
                  required
                />

              </div>

              <div className="form-field">

                <label>
                  New Password
                  <span className="required-mark">
                    *
                  </span>
                </label>

                <input
                  type="password"
                  name="new_password"
                  value={
                    passwordForm.new_password
                  }
                  onChange={
                    handlePasswordChange
                  }
                  autoComplete="new-password"
                  minLength="8"
                  required
                />

                <small className="field-help">
                  Minimum 8 characters.
                </small>

              </div>

              <div className="form-field">

                <label>
                  Confirm New Password
                  <span className="required-mark">
                    *
                  </span>
                </label>

                <input
                  type="password"
                  name="confirm_password"
                  value={
                    passwordForm.confirm_password
                  }
                  onChange={
                    handlePasswordChange
                  }
                  autoComplete="new-password"
                  minLength="8"
                  required
                />

              </div>

              <div className="response-security-note">

                <span>
                  🔐
                </span>

                <div>

                  <strong>
                    Account security
                  </strong>

                  <p>
                    Your password is never returned
                    by the API. The current password
                    must be verified before a new
                    password is saved.
                  </p>

                </div>

              </div>

              <div className="settings-actions">

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    changingPassword
                  }
                >
                  {changingPassword
                    ? "Changing..."
                    : "Change Password"}
                </button>

              </div>

            </form>

          </section>

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

export default Settings;