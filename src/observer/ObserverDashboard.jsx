import { useContext, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const initialForm = {
  id: null,
  title: "",
  location: "",
  severity: "medium",
  status: "open",
  details: "",
};

const incidentFlow = {
  open: "investigating",
  investigating: "resolved",
  resolved: "resolved",
};

const buildPercent = (value, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
};

function ObserverDashboard() {
  const {
    currentUser,
    incidents,
    fraudReports,
    analystReports,
    createIncident,
    updateIncident,
    deleteIncident,
  } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState("overview");
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");

  const myIncidents = useMemo(
    () => incidents.filter((incident) => incident.createdById === currentUser?.id),
    [incidents, currentUser?.id]
  );

  const myIncidentStatus = useMemo(
    () =>
      myIncidents.reduce(
        (accumulator, item) => {
          const safeStatus = item.status || "open";
          if (accumulator[safeStatus] === undefined) {
            return accumulator;
          }

          return {
            ...accumulator,
            [safeStatus]: accumulator[safeStatus] + 1,
          };
        },
        { open: 0, investigating: 0, resolved: 0 }
      ),
    [myIncidents]
  );

  const myIncidentSeverity = useMemo(
    () =>
      myIncidents.reduce(
        (accumulator, item) => {
          const safeSeverity = item.severity || "medium";
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
    [myIncidents]
  );

  const fraudStatus = useMemo(
    () =>
      fraudReports.reduce(
        (accumulator, item) => {
          const safeStatus = item.status || "submitted";
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

  const filteredIncidents = useMemo(() => {
    const safeSearch = search.trim().toLowerCase();

    return [...myIncidents]
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) {
          return false;
        }

        if (!safeSearch) {
          return true;
        }

        const searchable = `${item.title} ${item.location} ${item.details}`.toLowerCase();
        return searchable.includes(safeSearch);
      })
      .sort(
        (first, second) =>
          new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime()
      );
  }, [myIncidents, search, statusFilter]);

  const incidentStatusBars = [
    { key: "open", label: "Open", value: myIncidentStatus.open },
    { key: "investigating", label: "Investigating", value: myIncidentStatus.investigating },
    { key: "resolved", label: "Resolved", value: myIncidentStatus.resolved },
  ];

  const incidentSeverityBars = [
    { key: "high", label: "High", value: myIncidentSeverity.high },
    { key: "medium", label: "Medium", value: myIncidentSeverity.medium },
    { key: "low", label: "Low", value: myIncidentSeverity.low },
  ];

  const fraudStatusBars = [
    { key: "submitted", label: "Submitted", value: fraudStatus.submitted },
    { key: "under-review", label: "Under Review", value: fraudStatus["under-review"] },
    { key: "verified", label: "Verified", value: fraudStatus.verified },
    { key: "rejected", label: "Rejected", value: fraudStatus.rejected },
  ];

  const recentAnalystReports = useMemo(
    () =>
      [...analystReports]
        .sort(
          (first, second) =>
            new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime()
        )
        .slice(0, 5),
    [analystReports]
  );

  const sections = [
    { key: "overview", label: "Overview" },
    { key: "incidents", label: "My Incidents", count: myIncidents.length },
    { key: "report", label: form.id ? "Edit Incident" : "New Incident" },
    { key: "fraud", label: "Fraud Feed", count: fraudReports.length },
    { key: "analysis", label: "Analyst Feed", count: analystReports.length },
  ];

  const resetForm = () => setForm(initialForm);

  const moveIncidentStatus = async (incident, status) => {
    const result = await updateIncident(incident.id, {
      title: incident.title,
      location: incident.location,
      severity: incident.severity,
      status,
      details: incident.details,
    });
    setMessage(result.message);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      title: form.title.trim(),
      location: form.location.trim(),
      severity: form.severity,
      status: form.status,
      details: form.details.trim(),
    };

    if (!payload.title || !payload.location || !payload.details) {
      setMessage("Title, location, and details are required.");
      return;
    }

    if (form.id) {
      const result = await updateIncident(form.id, {
        ...payload,
      });
      setMessage(result.message);
      resetForm();
      setActiveSection("incidents");
      return;
    }

    const result = await createIncident(payload);
    setMessage(result.message);
    resetForm();
    setActiveSection("incidents");
  };

  return (
    <div className="dashboard-page">
      <Navbar title="Observer Dashboard" />

      <div className="dashboard-layout">
        <Sidebar
          title="Observer Menu"
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
                    <h3>Observer Operations Center</h3>
                    <p>
                      Monitor your field activity and live civic risk signals across reporting channels.
                    </p>
                  </div>
                  <div className="analyst-live-chip">
                    <span>My Active Cases</span>
                    <strong>{myIncidentStatus.open + myIncidentStatus.investigating}</strong>
                  </div>
                </div>

                <div className="analyst-kpi-grid">
                  <article className="analyst-kpi-card">
                    <span>My Incidents</span>
                    <strong>{myIncidents.length}</strong>
                  </article>
                  <article className="analyst-kpi-card">
                    <span>Resolved Cases</span>
                    <strong>{myIncidentStatus.resolved}</strong>
                  </article>
                  <article className="analyst-kpi-card">
                    <span>Fraud Feed Size</span>
                    <strong>{fraudReports.length}</strong>
                  </article>
                </div>

                <div className="pro-toolbar">
                  <button className="btn btn-primary" type="button" onClick={() => setActiveSection("report")}>
                    Add New Incident
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => setActiveSection("incidents")}>
                    View My Incident Desk
                  </button>
                </div>
              </section>

              <section className="analyst-chart-grid">
                <article className="panel analyst-chart-card">
                  <h3>My Incident Status</h3>
                  <p>Operational workload by current case state.</p>
                  <div className="result-bar-list">
                    {incidentStatusBars.map((item) => (
                      <div key={item.key} className="result-bar-row">
                        <div className="result-bar-head">
                          <strong>{item.label}</strong>
                          <span>{item.value}</span>
                        </div>
                        <div className="result-bar-track">
                          <div
                            className="result-bar-fill"
                            style={{ "--bar-width": `${buildPercent(item.value, myIncidents.length)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel analyst-chart-card">
                  <h3>Incident Severity Profile</h3>
                  <p>Distribution of urgency across your incidents.</p>
                  <div className="result-bar-list">
                    {incidentSeverityBars.map((item) => (
                      <div key={item.key} className="result-bar-row">
                        <div className="result-bar-head">
                          <strong>{item.label}</strong>
                          <span>{item.value}</span>
                        </div>
                        <div className="result-bar-track">
                          <div
                            className="result-bar-fill alt"
                            style={{ "--bar-width": `${buildPercent(item.value, myIncidents.length)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="grid two-cols">
                <article className="panel analyst-live-panel">
                  <h3>Fraud Feed Workflow</h3>
                  <p>Current state of citizen-submitted complaints.</p>
                  <div className="result-bar-list">
                    {fraudStatusBars.map((item) => (
                      <div key={item.key} className="result-bar-row">
                        <div className="result-bar-head">
                          <strong>{item.label}</strong>
                          <span>{item.value}</span>
                        </div>
                        <div className="result-bar-track">
                          <div
                            className="result-bar-fill"
                            style={{ "--bar-width": `${buildPercent(item.value, fraudReports.length)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel analyst-live-panel">
                  <h3>Latest Analyst Signals</h3>
                  <p>Most recent intelligence briefs from analysts.</p>
                  {recentAnalystReports.length ? (
                    recentAnalystReports.map((report) => (
                      <div className="list-item" key={report.id}>
                        <strong>{report.title}</strong>
                        <p>
                          <span className="pill">{report.status}</span> · {report.createdBy}
                        </p>
                        <p>{report.summary}</p>
                      </div>
                    ))
                  ) : (
                    <p className="muted">No analyst signals available.</p>
                  )}
                </article>
              </section>
            </>
          ) : null}

          {activeSection === "incidents" ? (
            <section className="panel">
              <h3>Field incidents</h3>
              <p>Create and maintain incident logs from polling stations.</p>
              {message ? <p className="muted">{message}</p> : null}

              <div className="pro-toolbar">
                <div className="pro-toolbar-group">
                  <input
                    type="search"
                    placeholder="Search by title, location, or details"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">All statuses</option>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="button" onClick={() => setActiveSection("report")}>
                  New Incident
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Location</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.length ? (
                      filteredIncidents.map((incident) => (
                        <tr key={incident.id}>
                          <td className="pro-strong-cell">{incident.title}</td>
                          <td>{incident.location}</td>
                          <td>
                            <span className="pill">{incident.severity}</span>
                          </td>
                          <td>{incident.status}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn btn-outline"
                                type="button"
                                onClick={() => {
                                  setForm({
                                    id: incident.id,
                                    title: incident.title,
                                    location: incident.location,
                                    severity: incident.severity,
                                    status: incident.status,
                                    details: incident.details,
                                  });
                                  setActiveSection("report");
                                }}
                              >
                                Edit
                              </button>
                              {incident.status !== "resolved" ? (
                                <button
                                  className="btn btn-primary"
                                  type="button"
                                  onClick={() =>
                                    moveIncidentStatus(incident, incidentFlow[incident.status])
                                  }
                                >
                                  Move to {incidentFlow[incident.status]}
                                </button>
                              ) : null}
                              <button
                                className="btn btn-danger"
                                type="button"
                                onClick={async () => {
                                  const result = await deleteIncident(incident.id);
                                  setMessage(result.message);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="muted">
                          No incidents match your search and status filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === "report" ? (
            <section className="panel">
              <h3>{form.id ? "Update incident" : "Record new incident"}</h3>
              <p>Capture factual events and keep case status current.</p>

              <form className="compact-form" onSubmit={handleSubmit}>
                <input
                  placeholder="Incident title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
                <input
                  placeholder="Location"
                  required
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                />
                <select
                  value={form.severity}
                  onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
                <textarea
                  placeholder="Incident details"
                  required
                  rows={6}
                  value={form.details}
                  onChange={(e) => setForm((prev) => ({ ...prev, details: e.target.value }))}
                />
                <div className="form-row">
                  <button className="btn btn-primary" type="submit">
                    {form.id ? "Save Changes" : "Add Incident"}
                  </button>
                  {form.id ? (
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => {
                        resetForm();
                        setActiveSection("incidents");
                      }}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            </section>
          ) : null}

          {activeSection === "fraud" ? (
            <section className="panel">
              <h3>Fraud report feed</h3>
              <p>Monitor citizen fraud reports alongside field observations.</p>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Reporter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fraudReports.length ? (
                      fraudReports.map((report) => (
                        <tr key={report.id}>
                          <td>{report.title}</td>
                          <td>{report.category}</td>
                          <td>{report.location}</td>
                          <td>{report.status}</td>
                          <td>{report.createdBy}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="muted">
                          No fraud reports are available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === "analysis" ? (
            <section className="panel">
              <h3>Analyst intelligence feed</h3>
              <p>Track current analytical findings to guide on-ground operations.</p>

              {recentAnalystReports.length ? (
                recentAnalystReports.map((report) => (
                  <article className="list-item" key={report.id}>
                    <strong>{report.title}</strong>
                    <p>
                      Status: {report.status} • Analyst: {report.createdBy}
                    </p>
                    <p>{report.summary}</p>
                    <p>
                      <strong>Recommendation:</strong> {report.recommendation}
                    </p>
                  </article>
                ))
              ) : (
                <p className="muted">No analyst reports are available yet.</p>
              )}
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default ObserverDashboard;