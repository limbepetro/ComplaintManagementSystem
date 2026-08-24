import { useState } from "react";
import "./App.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import RespondentResponses from "./pages/RespondentResponses";
import Mediation from "./pages/Mediation";
import Hearings from "./pages/Hearings";
import DecisionAwards from "./pages/DecisionAwards";
import AwardReviews from "./pages/AwardReviews";
import Enforcement from "./pages/Enforcement";
import CostTaxation from "./pages/CostTaxation";
import CaseClosure from "./pages/CaseClosure";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";

import {
  getStoredUser,
  isAuthenticated,
  logout,
} from "./services/authService";

function App() {
  const [authenticated, setAuthenticated] = useState(
    isAuthenticated()
  );

  const [user, setUser] = useState(
    getStoredUser()
  );

  const [activePage, setActivePage] =
    useState("Dashboard");

  const userRole = user?.role || null;

  const navigation = [
    {
      name: "Dashboard",
      icon: "◆",
      roles: [
        "ADMIN",
        "OFFICER",
        "CASE_OFFICER",
        "MEDIATOR",
        "HEARING_OFFICER",
      ],
    },
    {
      name: "Complaints",
      icon: "◈",
      roles: [
        "ADMIN",
        "OFFICER",
      ],
    },
    {
      name: "Respondent Responses",
      icon: "◉",
      roles: [
        "ADMIN",
        "CASE_OFFICER",
      ],
    },
    {
      name: "Mediation",
      icon: "⚖",
      roles: [
        "ADMIN",
        "MEDIATOR",
      ],
    },
    {
      name: "Hearings",
      icon: "▣",
      roles: [
        "ADMIN",
        "HEARING_OFFICER",
      ],
    },
    {
      name: "Decision & Awards",
      icon: "◆",
      roles: [
        "ADMIN",
        "HEARING_OFFICER",
      ],
    },
    {
      name: "Award Reviews",
      icon: "↻",
      roles: [
        "ADMIN",
        "OFFICER",
      ],
    },
    {
      name: "Enforcement",
      icon: "◈",
      roles: [
        "ADMIN",
        "OFFICER",
      ],
    },
    {
      name: "Cost Taxation",
      icon: "▰",
      roles: [
        "ADMIN",
        "OFFICER",
      ],
    },
    {
      name: "Case Closure",
      icon: "✓",
      roles: [
        "ADMIN",
        "OFFICER",
      ],
    },
    {
      name: "User Management",
      icon: "♙",
      roles: [
        "ADMIN",
      ],
    },
  ];

  const visibleNavigation =
    navigation.filter((item) =>
      item.roles.includes(userRole)
    );

  const getRoleName = () => {
    switch (userRole) {
      case "ADMIN":
        return "System Administrator";

      case "OFFICER":
        return "Commission Officer";

      case "CASE_OFFICER":
        return "Case Officer";

      case "MEDIATOR":
        return "Mediator";

      case "HEARING_OFFICER":
        return "Hearing Officer";

      default:
        return "User";
    }
  };

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setAuthenticated(true);
    setActivePage("Dashboard");
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setAuthenticated(false);
    setActivePage("Dashboard");
  };

  const handleNewComplaint = () => {
    setActivePage("Complaints");
  };

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return (
          <Dashboard
            onNewComplaint={
              handleNewComplaint
            }
          />
        );

      case "Complaints":
        return <Complaints />;

      case "Respondent Responses":
        return <RespondentResponses />;

      case "Mediation":
        return <Mediation />;

      case "Hearings":
        return <Hearings />;

      case "Decision & Awards":
        return <DecisionAwards />;

      case "Award Reviews":
        return <AwardReviews />;

      case "Enforcement":
        return <Enforcement />;

      case "Cost Taxation":
        return <CostTaxation />;

      case "Case Closure":
        return <CaseClosure />;

      case "User Management":
        return <UserManagement />;

      case "Settings":
                    return <Settings />;

      default:
        return (
          <Dashboard
            onNewComplaint={
              handleNewComplaint
            }
          />
        );
    }
  };

  if (!authenticated || !user) {
    return (
      <Login
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="app">

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">

            <img
              src="/pdpc-logo.png"
              alt="PDPC Tanzania"
              className="brand-logo-image"
            />

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

          {visibleNavigation.map(
            (item) => (

              <button
                key={item.name}
                type="button"
                className={`nav-item ${
                  activePage === item.name
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActivePage(
                    item.name
                  )
                }
              >

                <span className="nav-icon">
                  {item.icon}
                </span>

                <span>
                  {item.name}
                </span>

              </button>

            )
          )}

        </nav>

        <div className="sidebar-bottom">

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              setActivePage("Settings")
            }
          >

            <span className="nav-icon">
              ⚙
            </span>

            <span>
              Settings
            </span>

          </button>

          <button
            type="button"
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

      <main className="main">

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

            <button
              type="button"
              className="notification"
              aria-label="Notifications"
            >
              🔔
              <span></span>
            </button>

            <div className="profile">

              <div className="avatar">

                {(
                  user?.first_name ||
                  user?.username ||
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div className="profile-info">

                <strong>
                  {user?.first_name ||
                    user?.username ||
                    "User"}
                </strong>

                <small>
                  {getRoleName()}
                </small>

              </div>

              <span className="arrow">
                ▾
              </span>

            </div>

          </div>

        </header>

        <section className="content">

          {renderPage()}

        </section>

      </main>

    </div>
  );
}

export default App;