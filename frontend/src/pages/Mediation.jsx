import { useEffect, useState } from "react";
import api from "../api";

function Mediation() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await api.get(
          "mediation-sessions/"
        );

        setSessions(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (err) {
        console.error(err);
        setError(
          "Unable to load mediation sessions."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  return (
    <div className="module-page">

      <div className="module-heading">

        <div>
          <span className="module-eyebrow">
            CASE SETTLEMENT
          </span>

          <h1>
            Mediation
          </h1>

          <p>
            Manage and monitor mediation sessions
            associated with complaints.
          </p>
        </div>

        <button className="primary-button">
          + New Mediation
        </button>

      </div>

      <div className="module-summary">

        <strong>
          {sessions.length}
        </strong>

        <span>
          Mediation Sessions
        </span>

      </div>

      <section className="module-panel">

        <div className="module-panel-header">

          <div>
            <h2>
              Mediation Sessions
            </h2>

            <p>
              Sessions recorded in the system
            </p>
          </div>

        </div>

        {loading && (
          <div className="module-message">
            Loading mediation sessions...
          </div>
        )}

        {error && (
          <div className="module-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          sessions.length === 0 && (
            <div className="module-empty">
              No mediation sessions found.
            </div>
          )}

        {!loading &&
          !error &&
          sessions.length > 0 && (

            <div className="module-table-wrapper">

              <table className="module-table">

                <thead>

                  <tr>
                    <th>ID</th>
                    <th>Complaint</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>

                </thead>

                <tbody>

                  {sessions.map((session) => (

                    <tr key={session.id}>

                      <td>
                        {session.id}
                      </td>

                      <td>
                        {session.complaint ?? "—"}
                      </td>

                      <td>
                        {session.session_date ??
                          session.date ??
                          "—"}
                      </td>

                      <td>
                        <span className="table-status">
                          {session.status ?? "—"}
                        </span>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

      </section>

    </div>
  );
}

export default Mediation;