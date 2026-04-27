import { useContext, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ManageUser from "./ManageUser";
import FraudReports from "./FraudReports";

const buildPercent = (value, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
};

const normalizeLocation = (value) => {
  if (!value || typeof value !== "string") {
    return "Unknown";
  }

  const safeValue = value.trim();
  return safeValue || "Unknown";
};

function AdminDashboard() {
  const {
    users,
    currentUser,
    dashboardStats,
    incidents,
    fraudReports,
    analystReports,
    createUser,
    updateUser,
    deleteUser,
    updateFraudReport,
    deleteFraudReport,
  } = useContext(AuthContext);

  const [activeSection, setActiveSection] = useState("overview");

  const usersByRole = useMemo(
    () =>
      users.reduce(
        (accumulator, user) => {
          const safeRole = user.role || "citizen";
          if (accumulator[safeRole] === undefined) {
            return accumulator;
          }

          return {
            ...accumulator,
            [safeRole]: accumulator[safeRole] + 1,
          };
        },
        { admin: 0, citizen: 0, observer: 0, analyst: 0 }
      ),
    [users]
  );

  const fraudByStatus = useMemo(
    () =>
      fraudReports.reduce(
        (accumulator, report) => {
          const safeStatus = report.status || "submitted";
          if (accumulator[safeStatus] === undefined) {
            return accumulator;
          }

          return {
            ...accumulator,
            [safeStatus]: accumulator[safeStatus] + 1,
          };
        },
        { submitted: 0, "under-review": 0, verified: 0, rejected: 0 }
      ),
    [fraudReports]
  );

  const incidentsBySeverity = useMemo(
    () =>
      incidents.reduce(
        (accumulator, incident) => {
          const safeSeverity = incident.severity || "medium";
          if (accumulator[safeSeverity] === undefined) {
            return accumulator;
          }

          return {
            ...accumulator,
            [safeSeverity]: accumulator[safeSeverity] + 1,
          };
        },
        { low: 0, medium: 0, high: 0 }
      ),
    [incidents]
  );

  const hotspots = useMemo(() => {
    const locationMap = {};

    incidents.forEach((item) => {
      const safeLocation = normalizeLocation(item.location);
      locationMap[safeLocation] = (locationMap[safeLocation] || 0) + 1;
    });

    fraudReports.forEach((item) => {
      const safeLocation = normalizeLocation(item.location);
      locationMap[safeLocation] = (locationMap[safeLocation] || 0) + 1;
    });

    return Object.entries(locationMap)
      .map(([location, count]) => ({ location, count }))
      .sort((first, second) => second.count - first.count)
      .slice(0, 6);
  }, [incidents, fraudReports]);

  const recentFraudReports = useMemo(
    () =>
      [...fraudReports]
        .sort(
          (first, second) =>
            new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime()
        )
        .slice(0, 5),
    [fraudReports]
  );

  const roleBars = [
    { key: "admin", label: "Admins", value: usersByRole.admin },
    { key: "citizen", label: "Citizens", value: usersByRole.citizen },
    { key: "observer", label: "Observers", value: usersByRole.observer },
    { key: "analyst", label: "Analysts", value: usersByRole.analyst },
  ];

  const fraudBars = [
    { key: "submitted", label: "Submitted", value: fraudByStatus.submitted },
    { key: "under-review", label: "Under Review", value: fraudByStatus["under-review"] },
    { key: "verified", label: "Verified", value: fraudByStatus.verified },
    { key: "rejected", label: "Rejected", value: fraudByStatus.rejected },
  ];

  const severityBars = [
    { key: "high", label: "High", value: incidentsBySeverity.high },
    { key: "medium", label: "Medium", value: incidentsBySeverity.medium },
    { key: "low", label: "Low", value: incidentsBySeverity.low },
  ];

  const hotspotMax = hotspots.length ? Math.max(...hotspots.map((item) => item.count)) : 0;

  const adminHighlights = [
    {
      key: "users",
      label: "Total Users",
      value: dashboardStats.users,
      note: "Active accounts",
      icon: "👥",
    },
    {
      key: "incidents",
      label: "Open Incidents",
      value: dashboardStats.incidents,
      note: "Observer logs",
      icon: "🚨",
    },
    {
      key: "fraud",
      label: "Pending Fraud",
      value: fraudByStatus.submitted + fraudByStatus["under-review"],
      note: "Needs review",
      icon: "🛡️",
    },
    {
      key: "analysts",
      label: "Analyst Reports",
      value: analystReports.length,
      note: "Intelligence briefs",
      icon: "📊",
    },
  ];

  const sections = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users", count: users.length },
    { key: "fraud", label: "Fraud Reports", count: fraudReports.length },
  ];

  return (
    <div className="dashboard-page">
      <Navbar title="Admin Dashboard" />

      <div className="dashboard-layout">
        <Sidebar
          title="Admin Menu"
          items={sections}
          activeItem={activeSection}
          onChange={setActiveSection}
        />

        <main className="dashboard-main">
          {activeSection === "overview" ? (
            <>
              <section className="panel analyst-overview-panel">
                <div className="analyst-overview-head">
                  <div>
                    <h3>Administrative Command Center</h3>
                    <p>Monitor platform health, risk workflow, and user distribution in real time.</p>
                  </div>
                  <div className="analyst-live-chip">
                    <span>Pending Fraud Cases</span>
                    <strong>{fraudByStatus.submitted + fraudByStatus["under-review"]}</strong>
                  </div>
                </div>

                <div className="admin-metric-grid">
                  {adminHighlights.map((item) => (
                    <article className="admin-metric-card" key={item.key}>
                      <div className="admin-metric-icon" aria-hidden="true">
                        {item.icon}
                      </div>
                      <div>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <small>{item.note}</small>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="analyst-kpi-grid">
                  <article className="analyst-kpi-card">
                    <span>Total Users</span>
                    <strong>{dashboardStats.users}</strong>
                  </article>
                  <article className="analyst-kpi-card">
                    <span>Open Incidents</span>
                    <strong>{dashboardStats.incidents}</strong>
                  </article>
                  <article className="analyst-kpi-card">
                    <span>Analyst Reports</span>
                    <strong>{analystReports.length}</strong>
                  </article>
                </div>

                <div className="pro-toolbar">
                  <button className="btn btn-primary" type="button" onClick={() => setActiveSection("users")}>
                    Manage Users
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => setActiveSection("fraud")}>
                    Review Fraud Desk
                  </button>
                </div>
              </section>

              <section className="analyst-chart-grid">
                <article className="panel analyst-chart-card">
                  <h3>User Role Distribution</h3>
                  <p>Role-wise account composition for governance planning.</p>
                  <div className="result-bar-list">
                    {roleBars.map((item) => (
                      <div key={item.key} className="result-bar-row">
                        <div className="result-bar-head">
                          <strong>{item.label}</strong>
                          <span>{item.value}</span>
                        </div>
                        <div className="result-bar-track">
                          <div
                            className="result-bar-fill"
                            style={{ "--bar-width": `${buildPercent(item.value, users.length)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel analyst-chart-card">
                  <h3>Fraud Workflow Status</h3>
                  <p>Case progression from submission to closure.</p>
                  <div className="result-bar-list">
                    {fraudBars.map((item) => (
                      <div key={item.key} className="result-bar-row">
                        <div className="result-bar-head">
                          <strong>{item.label}</strong>
                          <span>{item.value}</span>
                        </div>
                        <div className="result-bar-track">
                          <div
                            className="result-bar-fill alt"
                            style={{ "--bar-width": `${buildPercent(item.value, fraudReports.length)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="grid two-cols">
                <article className="panel analyst-live-panel">
                  <h3>Incident Severity Mix</h3>
                  <p>Distribution of field incident urgency levels.</p>
                  <div className="result-bar-list">
                    {severityBars.map((item) => (
                      <div key={item.key} className="result-bar-row">
                        <div className="result-bar-head">
                          <strong>{item.label}</strong>
                          <span>{item.value}</span>
                        </div>
                        <div className="result-bar-track">
                          <div
                            className="result-bar-fill"
                            style={{ "--bar-width": `${buildPercent(item.value, incidents.length)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel analyst-live-panel">
                  <h3>Top Risk Locations</h3>
                  <p>Highest concentration of incidents and fraud complaints.</p>
                  <div className="result-bar-list">
                    {hotspots.length ? (
                      hotspots.map((item) => (
                        <div key={item.location} className="result-bar-row">
                          <div className="result-bar-head">
                            <strong>{item.location}</strong>
                            <span>{item.count}</span>
                          </div>
                          <div className="result-bar-track">
                            <div
                              className="result-bar-fill alt"
                              style={{ "--bar-width": `${buildPercent(item.count, hotspotMax)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="muted">No location data available yet.</p>
                    )}
                  </div>
                </article>
              </section>

              <section className="panel">
                <h3>Recent Fraud Submissions</h3>
                <p>Latest incoming cases for admin awareness.</p>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Reporter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentFraudReports.length ? (
                        recentFraudReports.map((report) => (
                          <tr key={report.id}>
                            <td className="pro-strong-cell">{report.title}</td>
                            <td>{report.location}</td>
                            <td>
                              <span className="pill">{report.status}</span>
                            </td>
                            <td>{report.createdBy}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="muted">
                            No fraud submissions available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}

          {activeSection === "users" ? (
            <ManageUser
              users={users}
              currentUserId={currentUser?.id}
              onCreate={createUser}
              onUpdate={updateUser}
              onDelete={deleteUser}
            />
          ) : null}

          {activeSection === "fraud" ? (
            <FraudReports
              reports={fraudReports}
              onUpdate={updateFraudReport}
              onDelete={deleteFraudReport}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
