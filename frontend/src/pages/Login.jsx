import { useState } from "react";
import { login } from "../services/authService";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user = await login(username, password);

      onLogin(user);
    } catch (error) {
      console.error(error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 400
      ) {
        setError("Invalid username or password.");
      } else if (
        error.message === "This account is inactive."
      ) {
        setError("This account has been deactivated.");
      } else {
        setError(
          "Unable to connect to the server. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-glow glow-one"></div>
        <div className="login-glow glow-two"></div>
      </div>

      <div className="login-card">

        <div className="login-header">

          <div className="login-logo">
            <span>PDPC</span>
          </div>

          <div className="login-brand">
            <h1>PDPC-CMS</h1>
            <p>
              Personal Data Protection Commission
            </p>
          </div>

        </div>

        <div className="login-welcome">
          <h2>Welcome back</h2>

          <p>
            Sign in to access the Personal Data
            Protection Complaints Management System.
          </p>
        </div>

        {error && (
          <div className="login-error">
            <span className="error-icon">!</span>

            <span>{error}</span>
          </div>
        )}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label htmlFor="username">
              Username
            </label>

            <div className="input-wrapper">

              <span className="input-icon">
                👤
              </span>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Enter your username"
                autoComplete="username"
                required
                disabled={loading}
              />

            </div>

          </div>

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="input-wrapper">

              <span className="input-icon">
                🔒
              </span>

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? "🙈" : "👁"}
              </button>

            </div>

          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner"></span>
                Authenticating...
              </>
            ) : (
              <>
                Sign In
                <span className="login-arrow">
                  →
                </span>
              </>
            )}
          </button>

        </form>

        <div className="security-notice">

          <span className="security-icon">
            🔐
          </span>

          <div>
            <strong>Secure Access</strong>

            <p>
              Authorized personnel only. Your
              credentials are protected.
            </p>
          </div>

        </div>

        <div className="login-footer">

          <span>
            Personal Data Protection Commission
          </span>

          <span>•</span>

          <span>Complaint Management System</span>

        </div>

      </div>
    </div>
  );
}

export default Login;