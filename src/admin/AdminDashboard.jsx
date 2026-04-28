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
  /* =========================
     SAFE AUTH CONTEXT
  ========================= */
  const {
    users = [],
    currentUser = null,
    token = null,
    dashboardStats = {
      users: 0,
      incidents: 0,
    },
    incidents = [],
    fraudReports = [],
    analystReports = [],
    createUser,
    updateUser,
    deleteUser,
    updateFraudReport,
    deleteFraudReport,
  } = useContext(AuthContext);

  const [activeSection, setActiveSection] = useState("overview");
  const [showDebug, setShowDebug] = useState(false);

  /* =========================
     LOADING GUARD
  ========================= */
  if (!currentUser) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.2rem",
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  /* =========================
     USERS BY ROLE
  ========================= */
  const usersByRole = useMemo(
    () =>
      users.reduce(
        (accumulator, user) => {
          const safeRole = (user.role || "citizen").toLowerCase();

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

  /* =========================
     FRAUD STATUS
  ========================= */
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

  /* =========================
     INCIDENT SEVERITY
  ========================= */
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

  /* =========================
     HOTSPOTS
  ========================= */
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

  /* =========================
     RECENT FRAUD REPORTS
  ========================= */
  const recentFraudReports = useMemo(
    () =>
      [...fraudReports]
        .sort(
          (first, second) =>
            new Date(second.createdAt || 0).getTime() -
            new Date(first.createdAt || 0).getTime()
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
    {
      key: "under-review",
      label: "Under Review",
      value: fraudByStatus["under-review"],
    },
    { key: "verified", label: "Verified", value: fraudByStatus.verified },
    { key: "rejected", label: "Rejected", value: fraudByStatus.rejected },
  ];

  const hotspotMax = hotspots.length
    ? Math.max(...hotspots.map((item) => item.count))
    : 0;

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
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "1rem",
            }}
          >
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => setShowDebug((s) => !s)}
            >
              {showDebug ? "Hide Debug" : "Show Debug"}
            </button>
          </div>

          {showDebug && (
            <section className="panel">
              <h4>Debug: Auth Context</h4>
              <pre>
                {JSON.stringify(
                  {
                    token,
                    currentUser,
                    dashboardStats,
                    usersCount: users.length,
                    incidentsCount: incidents.length,
                    fraudCount: fraudReports.length,
                    analystCount: analystReports.length,
                  },
                  null,
                  2
                )}
              </pre>
            </section>
          )}

          {activeSection === "overview" && (
            <>
              <section className="panel">
                <h3>Administrative Command Center</h3>

                <div className="admin-metric-grid">
                  <article>
                    <strong>Total Users:</strong> {dashboardStats.users}
                  </article>

                  <article>
                    <strong>Open Incidents:</strong> {dashboardStats.incidents}
                  </article>

                  <article>
                    <strong>Pending Fraud:</strong>{" "}
                    {fraudByStatus.submitted +
                      fraudByStatus["under-review"]}
                  </article>

                  <article>
                    <strong>Analyst Reports:</strong>{" "}
                    {analystReports.length}
                  </article>
                </div>
              </section>

              <section className="panel">
                <h3>User Role Distribution</h3>

                {roleBars.map((item) => (
                  <div key={item.key}>
                    <strong>{item.label}</strong>: {item.value}
                  </div>
                ))}
              </section>

              <section className="panel">
                <h3>Fraud Workflow Status</h3>

                {fraudBars.map((item) => (
                  <div key={item.key}>
                    <strong>{item.label}</strong>: {item.value}
                  </div>
                ))}
              </section>

              <section className="panel">
                <h3>Top Risk Locations</h3>

                {hotspots.length ? (
                  hotspots.map((item) => (
                    <div key={item.location}>
                      <strong>{item.location}</strong>: {item.count}
                    </div>
                  ))
                ) : (
                  <p>No location data available yet.</p>
                )}
              </section>

              <section className="panel">
                <h3>Recent Fraud Submissions</h3>

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
                          <td>{report.title}</td>
                          <td>{report.location}</td>
                          <td>{report.status}</td>
                          <td>{report.createdBy}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>
                          No fraud submissions available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>
            </>
          )}

          {activeSection === "users" && (
            <ManageUser
              users={users}
              currentUserId={currentUser?.id}
              onCreate={createUser}
              onUpdate={updateUser}
              onDelete={deleteUser}
            />
          )}

          {activeSection === "fraud" && (
            <FraudReports
              reports={fraudReports}
              onUpdate={updateFraudReport}
              onDelete={deleteFraudReport}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;