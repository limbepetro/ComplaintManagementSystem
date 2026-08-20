import { useState } from "react";
import "./App.css";
import Complaints from "./pages/Complaints";
import Login from "./pages/Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("access_token")
  );

  const [activePage, setActivePage] = useState("Dashboard");

  const navigation = [
    { name: "Dashboard", icon: "▣" },
    { name: "Complaints", icon: "▤" },
    { name: "Respondent Responses", icon: "◫" },
    { name: "Mediation", icon: "⚖" },
    { name: "Hearings", icon: "□" },
    { name: "Decision & Awards", icon: "◆" },
    { name: "Award Reviews", icon: "↻" },
    { name: "Enforcement", icon: "◈" },
    { name: "Cost Taxation", icon: "▥" },
    { name: "Case Closure", icon: "✓" },
  ];

  const stats = [
    {
      title: "Total Complaints",
      value: "1",
      change: "+12%",
      description: "Compared with last month",
      icon: "▤",
    },
    {
      title: "Under Review",
      value: "0",
      change: "0%",
      description: "Cases currently being reviewed",
      icon: "◷",
    },
    {
      title: "Mediation Cases",
      value: "1",
      change: "+5%",
      description: "Cases in mediation process",
      icon: "⚖",
    },
    {
      title: "Closed Cases",
      value: "1",
      change: "+18%",
      description: "Successfully completed cases",
      icon: "✓",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");

    setIsAuthenticated(false);
    setActivePage("Dashboard");
  };

  const renderDashboard = () => (
    <>
      <div className="page-heading">
        <div>
          <p className="welcome">WELCOME BACK</p>

          <h1>Dashboard</h1>

          <p className="subtitle">
            Monitor and manage complaint cases efficiently.
          </p>
        </div>

        <button className="primary-button">
          + New Complaint
        </button>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.title}>
            <div className="stat-top">
              <div className="stat-icon">
                {stat.icon}
              </div>

              <span className="change">
                {stat.change}
              </span>
            </div>

            <h3>{stat.value}</h3>

            <p className="stat-title">
              {stat.title}
            </p>

            <p className="stat-description">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">

        {/* Recent Cases */}
        <section className="panel cases-panel">
          <div className="panel-header">
            <div>
              <h2>Recent Cases</h2>

              <p>
                Latest complaints registered in the system
              </p>
            </div>

            <button
              className="view-button"
              onClick={() => setActivePage("Complaints")}
            >
              View all →
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Title</th>
                  <th>Complainant</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>
                    <strong>01</strong>
                  </td>

                  <td>
                    <div className="case-title">
                      PRIVACY DISCLOSURE
                    </div>
                  </td>

                  <td>
                    PETRO LIMBE
                  </td>

                  <td>
                    <span className="status closed">
                      Closed
                    </span>
                  </td>

                  <td>
                    18 Aug 2026
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Case Progress */}
        <section className="panel progress-panel">
          <div className="panel-header">
            <div>
              <h2>Case Progress</h2>

              <p>
                Current case workflow
              </p>
            </div>
          </div>

          <div className="progress-list">

            <div className="progress-item completed">
              <div className="progress-number">
                ✓
              </div>

              <div>
                <strong>
                  Complaint Submitted
                </strong>

                <span>
                  17 Aug 2026
                </span>
              </div>
            </div>

            <div className="progress-item completed">
              <div className="progress-number">
                ✓
              </div>

              <div>
                <strong>
                  Notice & Response
                </strong>

                <span>
                  17 Aug 2026
                </span>
              </div>
            </div>

            <div className="progress-item completed">
              <div className="progress-number">
                ✓
              </div>

              <div>
                <strong>
                  Mediation
                </strong>

                <span>
                  Completed
                </span>
              </div>
            </div>

            <div className="progress-item completed">
              <div className="progress-number">
                ✓
              </div>

              <div>
                <strong>
                  Decision & Award
                </strong>

                <span>
                  Completed
                </span>
              </div>
            </div>

            <div className="progress-item completed">
              <div className="progress-number">
                ✓
              </div>

              <div>
                <strong>
                  Enforcement
                </strong>

                <span>
                  Completed
                </span>
              </div>
            </div>

            <div className="progress-item completed">
              <div className="progress-number">
                ✓
              </div>

              <div>
                <strong>
                  Case Closure
                </strong>

                <span>
                  Completed
                </span>
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* System Overview */}
      <section className="panel overview">

        <div className="panel-header">
          <div>
            <h2>
              Case Management Overview
            </h2>

            <p>
              Summary of the complaint settlement workflow
            </p>
          </div>
        </div>

        <div className="workflow">

          <div className="workflow-step">
            <span>01</span>
            <strong>Complaint</strong>
            <small>Registration</small>
          </div>

          <div className="workflow-line"></div>

          <div className="workflow-step">
            <span>02</span>
            <strong>Review</strong>
            <small>Assessment</small>
          </div>

          <div className="workflow-line"></div>

          <div className="workflow-step">
            <span>03</span>
            <strong>Mediation</strong>
            <small>Settlement</small>
          </div>

          <div className="workflow-line"></div>

          <div className="workflow-step">
            <span>04</span>
            <strong>Hearing</strong>
            <small>Proceedings</small>
          </div>

          <div className="workflow-line"></div>

          <div className="workflow-step">
            <span>05</span>
            <strong>Award</strong>
            <small>Decision</small>
          </div>

          <div className="workflow-line"></div>

          <div className="workflow-step">
            <span>06</span>
            <strong>Closure</strong>
            <small>Completion</small>
          </div>

        </div>
      </section>
    </>
  );

  const renderPage = () => {
    if (activePage === "Dashboard") {
      return renderDashboard();
    }

    if (activePage === "Complaints") {
      return <Complaints />;
    }

    return (
      <section className="panel">

        <div className="panel-header">
          <div>
            <h2>{activePage}</h2>

            <p>
              This module will display information
              from the Django REST API.
            </p>
          </div>
        </div>

        <div className="empty-page">

          <div className="empty-icon">
            ◈
          </div>

          <h2>
            {activePage}
          </h2>

          <p>
            The {activePage} module is ready
            for API integration.
          </p>

        </div>

      </section>
    );
  };

  /*
   * If the user is not authenticated,
   * show the login page.
   */
  if (!isAuthenticated) {
    return (
      <Login
        onLogin={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            C
          </div>

          <div>
            <h2>
              PDPC-CMS
            </h2>

            <span>
              Complaint Management
            </span>
          </div>

        </div>

        <div className="menu-title">
          MAIN MENU
        </div>

        <nav>

          {navigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActivePage(item.name)
              }
            >

              <span className="nav-icon">
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>

            </button>
          ))}

        </nav>

        <div className="sidebar-bottom">

          <button className="nav-item">

            <span className="nav-icon">
              ⚙
            </span>

            <span>
              Settings
            </span>

          </button>

          <button
            className="nav-item logout"
            onClick={handleLogout}
          >

            <span className="nav-icon">
              ↪
            </span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* Main Content */}
      <main className="main">

        {/* Top Bar */}
        <header className="topbar">

          <div className="breadcrumb">

            <span>
              Personal Data Protection
              Commission
            </span>

            <strong>
              /
            </strong>

            <span className="current">
              {activePage}
            </span>

          </div>

          <div className="top-actions">

            <button className="notification">
              ♢
              <span></span>
            </button>

            <div className="profile">

              <div className="avatar">
                P
              </div>

              <div className="profile-info">

                <strong>
                  {localStorage.getItem(
                    "username"
                  ) || "PDPC"}
                </strong>

                <small>
                  Commission Officer
                </small>

              </div>

              <span className="arrow">
                ⌄
              </span>

            </div>

          </div>

        </header>

        {/* Page Content */}
        <section className="content">
          {renderPage()}
        </section>

      </main>

    </div>
  );
}

export default App;