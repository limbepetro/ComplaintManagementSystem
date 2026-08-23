import { useEffect, useState } from "react";
import api from "../api";
import { getStoredUser } from "../services/authService";

function Dashboard({ onNewComplaint }) {
  const [data, setData] = useState({
    complaints: [],
    mediationSessions: [],
    hearings: [],
    decisionAwards: [],
    enforcementCases: [],
    caseClosures: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const user = getStoredUser();
      const role = user?.role;

      const requests = [];

      if (role === "ADMIN" || role === "OFFICER") {
        requests.push({
          key: "complaints",
          request: api.get("complaints/"),
        });

        requests.push({
          key: "enforcementCases",
          request: api.get("enforcement-cases/"),
        });

        requests.push({
          key: "caseClosures",
          request: api.get("case-closures/"),
        });
      }

      if (role === "ADMIN" || role === "MEDIATOR") {
        requests.push({
          key: "mediationSessions",
          request: api.get("mediation-sessions/"),
        });
      }

      if (
        role === "ADMIN" ||
        role === "HEARING_OFFICER"
      ) {
        requests.push({
          key: "hearings",
          request: api.get("hearings/"),
        });

        requests.push({
          key: "decisionAwards",
          request: api.get("decision-awards/"),
        });
      }

      try {
        const results = await Promise.allSettled(
          requests.map((item) => item.request)
        );

        const newData = {
          complaints: [],
          mediationSessions: [],
          hearings: [],
          decisionAwards: [],
          enforcementCases: [],
          caseClosures: [],
        };

        let hasError = false;

        results.forEach((result, index) => {
          const key = requests[index].key;

          if (result.status === "fulfilled") {
            newData[key] = getResponseData(result);
          } else {
            console.error(
              "Dashboard request failed:",
              key,
              result.reason
            );

            hasError = true;
          }
        });

        setData(newData);

        if (hasError) {
          setError(
            "Some dashboard information could not be loaded."
          );
        } else {
          setError("");
        }
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          "Unable to load dashboard information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = [
    {
      title: "Total Complaints",
      value: data.complaints.length,
      description:
        "Complaints registered in the system",
      icon: "◆",
      className: "blue",
    },
    {
      title: "Mediation Cases",
      value: data.mediationSessions.length,
      description: "Cases currently in mediation",
      icon: "⚖",
      className: "purple",
    },
    {
      title: "Hearings",
      value: data.hearings.length,
      description: "Hearing proceedings recorded",
      icon: "▣",
      className: "orange",
    },
    {
      title: "Decisions & Awards",
      value: data.decisionAwards.length,
      description:
        "Decisions and awards issued",
      icon: "◆",
      className: "green",
    },
    {
      title: "Enforcement",
      value: data.enforcementCases.length,
      description: "Cases under enforcement",
      icon: "◉",
      className: "red",
    },
    {
      title: "Closed Cases",
      value: data.caseClosures.length,
      description:
        "Successfully completed cases",
      icon: "✓",
      className: "teal",
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <p className="welcome">SYSTEM OVERVIEW</p>

          <h1>Dashboard</h1>

          <p className="subtitle">
            Monitor and manage complaint cases
            efficiently.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={onNewComplaint}
        >
          + New Complaint
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <strong>Notice</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="stats-grid">
        {stats.map((stat) => (
          <div
            className="stat-card"
            key={stat.title}
          >
            <div className="stat-top">
              <div
                className={"stat-icon " + stat.className}
              >
                {stat.icon}
              </div>

              <span className="stat-arrow">
                →
              </span>
            </div>

            <h3>
              {loading ? "—" : stat.value}
            </h3>

            <p className="stat-title">
              {stat.title}
            </p>

            <p className="stat-description">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel cases-panel">
          <div className="panel-header">
            <div>
              <h2>Recent Cases</h2>

              <p>
                Latest complaints registered
                in the system
              </p>
            </div>

            <button
              className="view-button"
              type="button"
              onClick={onNewComplaint}
            >
              View all →
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Complaint</th>
                  <th>Complainant</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="table-loading"
                    >
                      Loading cases...
                    </td>
                  </tr>
                ) : data.complaints.length > 0 ? (
                  data.complaints
                    .slice(0, 5)
                    .map((complaint) => (
                      <tr key={complaint.id}>
                        <td>
                          <strong>
                            {complaint.case_number}
                          </strong>
                        </td>

                        <td>
                          <div className="case-title">
                            {complaint.title ||
                              "Complaint"}
                          </div>
                        </td>

                        <td>
                          {getPartyName(
                            complaint.complainant
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              "status " +
                              String(
                                complaint.status || ""
                              ).toLowerCase()
                            }
                          >
                            {formatStatus(
                              complaint.status
                            )}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            complaint.created_at
                          )}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="empty-table"
                    >
                      No complaints have been
                      registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel progress-panel">
          <div className="panel-header">
            <div>
              <h2>Case Workflow</h2>

              <p>
                Complaint settlement process
              </p>
            </div>
          </div>

          <div className="progress-list">
            <ProgressItem
              number="01"
              title="Complaint"
              description="Registration"
              completed={
                data.complaints.length > 0
              }
            />

            <ProgressItem
              number="02"
              title="Respondent Response"
              description="Notice & response"
              completed={false}
            />

            <ProgressItem
              number="03"
              title="Mediation"
              description="Settlement"
              completed={
                data.mediationSessions.length > 0
              }
            />

            <ProgressItem
              number="04"
              title="Hearing"
              description="Proceedings"
              completed={
                data.hearings.length > 0
              }
            />

            <ProgressItem
              number="05"
              title="Decision & Award"
              description="Determination"
              completed={
                data.decisionAwards.length > 0
              }
            />

            <ProgressItem
              number="06"
              title="Closure"
              description="Completion"
              completed={
                data.caseClosures.length > 0
              }
            />
          </div>
        </section>
      </div>

      <section className="panel overview">
        <div className="panel-header">
          <div>
            <h2>
              Case Management Workflow
            </h2>

            <p>
              Complaint settlement process
              from registration to closure
            </p>
          </div>
        </div>

        <div className="workflow">
          <WorkflowStep
            number="01"
            title="Complaint"
            description="Registration"
          />

          <WorkflowLine />

          <WorkflowStep
            number="02"
            title="Review"
            description="Assessment"
          />

          <WorkflowLine />

          <WorkflowStep
            number="03"
            title="Mediation"
            description="Settlement"
          />

          <WorkflowLine />

          <WorkflowStep
            number="04"
            title="Hearing"
            description="Proceedings"
          />

          <WorkflowLine />

          <WorkflowStep
            number="05"
            title="Award"
            description="Decision"
          />

          <WorkflowLine />

          <WorkflowStep
            number="06"
            title="Closure"
            description="Completion"
          />
        </div>
      </section>
    </div>
  );
}

function getResponseData(response) {
  if (response.status !== "fulfilled") {
    return [];
  }

  const responseData = response.value?.data;

  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.results)) {
    return responseData.results;
  }

  return [];
}

function getPartyName(party) {
  if (!party) {
    return "—";
  }

  if (typeof party === "string") {
    return party;
  }

  return (
    party.full_name ||
    party.organization_name ||
    "—"
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

function ProgressItem({
  number,
  title,
  description,
  completed,
}) {
  return (
    <div
      className={
        "progress-item " +
        (completed ? "completed" : "")
      }
    >
      <div className="progress-number">
        {completed ? "✓" : number}
      </div>

      <div>
        <strong>{title}</strong>

        <span>{description}</span>
      </div>
    </div>
  );
}

function WorkflowStep({
  number,
  title,
  description,
}) {
  return (
    <div className="workflow-step">
      <span>{number}</span>

      <strong>{title}</strong>

      <small>{description}</small>
    </div>
  );
}

function WorkflowLine() {
  return <div className="workflow-line"></div>;
}

export default Dashboard;