import { useEffect, useState } from "react";
import api from "../api";

function Hearings() {
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHearings = async () => {
      try {
        const response = await api.get(
          "hearings/"
        );

        setHearings(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load hearings."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHearings();
  }, []);

  return (
    <div className="module-page">

      <div className="module-heading">

        <div>
          <span className="module-eyebrow">
            CASE PROCEEDINGS
          </span>

          <h1>
            Hearings
          </h1>

          <p>
            Manage hearing proceedings and
            scheduled case hearings.
          </p>
        </div>

        <button className="primary-button">
          + Schedule Hearing
        </button>

      </div>

      <div className="module-summary">

        <strong>
          {hearings.length}
        </strong>

        <span>
          Hearing Records
        </span>

      </div>

      <section className="module-panel">

        <div className="module-panel-header">

          <div>

            <h2>
              Hearing Records
            </h2>

            <p>
              Hearings recorded in the system
            </p>

          </div>

        </div>

        {loading && (
          <div className="module-message">
            Loading hearings...
          </div>
        )}

        {error && (
          <div className="module-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          hearings.length === 0 && (
            <div className="module-empty">
              No hearings found.
            </div>
          )}

        {!loading &&
          !error &&
          hearings.length > 0 && (

            <div className="module-table-wrapper">

              <table className="module-table">

                <thead>

                  <tr>

                    <th>
                      ID
                    </th>

                    <th>
                      Complaint
                    </th>

                    <th>
                      Hearing Date
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {hearings.map((hearing) => (

                    <tr key={hearing.id}>

                      <td>
                        {hearing.id}
                      </td>

                      <td>
                        {hearing.complaint ?? "—"}
                      </td>

                      <td>
                        {hearing.hearing_date ??
                          hearing.date ??
                          "—"}
                      </td>

                      <td>

                        <span className="table-status">
                          {hearing.status ?? "—"}
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

export default Hearings;