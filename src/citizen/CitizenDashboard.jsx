import { useContext, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const initialForm = {
  title: "",
  category: "vote-buying",
  location: "",
  description: "",
};

const discussionStorageKey = "ems_citizen_discussions_v1";

const formatDateTime = (value) => {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return parsed.toLocaleString();
};

const mapStatusLabel = (status) => {
  if (status === "under-review") {
    return "Under Review";
  }

  if (status === "in-progress") {
    return "In Progress";
  }

  if (!status) {
    return "--";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
};

const readDiscussion = () => {
  const raw = localStorage.getItem(discussionStorageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function CitizenDashboard() {
  const {
    currentUser,
    fraudReports,
    electionResults,
    createFraudReport,
    updateFraudReport,
    deleteFraudReport,
  } = useContext(AuthContext);

  const [activeSection, setActiveSection] = useState("overview");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [reportSearch, setReportSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [discussionInput, setDiscussionInput] = useState("");
  const [discussions, setDiscussions] = useState(readDiscussion);
  const [editingReportId, setEditingReportId] = useState(null);
  const [editingDiscussionId, setEditingDiscussionId] = useState(null);

  const myReports = useMemo(
    () => fraudReports.filter((report) => report.createdById === currentUser?.id),
    [fraudReports, currentUser?.id]
  );

  const sortedReports = useMemo(
    () =>
      [...myReports].sort(
        (first, second) =>
          new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime()
      ),
    [myReports]
  );

  const filteredReports = useMemo(() => {
    const safeSearch = reportSearch.trim().toLowerCase();
    if (!safeSearch) {
      return sortedReports;
    }

    return sortedReports.filter((report) => {
      const searchable = `${report.title} ${report.location} ${report.category} ${report.status}`.toLowerCase();
      return searchable.includes(safeSearch);
    });
  }, [sortedReports, reportSearch]);

  const resultStatusCount = useMemo(
    () =>
      electionResults.reduce(
        (accumulator, item) => {
          const safeStatus = item.status || "in-progress";
          if (accumulator[safeStatus] === undefined) {
            return accumulator;
          }

          return {
            ...accumulator,
            [safeStatus]: accumulator[safeStatus] + 1,
          };
        },
        { final: 0, "in-progress": 0 }
      ),
    [electionResults]
  );

  const filteredResults = useMemo(() => {
    if (resultFilter === "all") {
      return electionResults;
    }

    return electionResults.filter((item) => item.status === resultFilter);
  }, [electionResults, resultFilter]);

  const sortedDiscussions = useMemo(
    () =>
      [...discussions].sort(
        (first, second) =>
          new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime()
      ),
    [discussions]
  );

  const myDiscussionCount = useMemo(
    () => discussions.filter((item) => item.createdById === currentUser?.id).length,
    [discussions, currentUser?.id]
  );

  const sections = [
    { key: "overview", label: "Overview" },
    { key: "report", label: "New Report" },
    { key: "my-reports", label: "My Reports", count: myReports.length },
    { key: "results", label: "Election Process", count: electionResults.length },
    { key: "discussion", label: "Civic Discussion", count: discussions.length },
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      title: form.title.trim(),
      category: form.category,
      location: form.location.trim(),
      description: form.description.trim(),
    };

    if (!payload.title || !payload.location || !payload.description) {
      setMessage({ type: "error", text: "Title, location, and description are required." });
      return;
    }

    const result = editingReportId
      ? await updateFraudReport(editingReportId, payload)
      : await createFraudReport(payload);
    setMessage({ type: result.success ? "success" : "error", text: result.message });
    if (result.success) {
      setForm(initialForm);
      setEditingReportId(null);
      setActiveSection("my-reports");
    }
  };

  const startEditReport = (report) => {
    setForm({
      title: report.title,
      category: report.category,
      location: report.location,
      description: report.description,
    });
    setEditingReportId(report.id);
    setMessage({ type: "", text: "" });
    setActiveSection("report");
  };

  const handleDeleteReport = async (reportId) => {
    const result = await deleteFraudReport(reportId);
    setMessage({ type: result.success ? "success" : "error", text: result.message });
  };

  const handleDiscussionSubmit = (event) => {
    event.preventDefault();

    const safeContent = discussionInput.trim();
    if (!safeContent) {
      setMessage({ type: "error", text: "Discussion message cannot be empty." });
      return;
    }

    if (safeContent.length > 280) {
      setMessage({ type: "error", text: "Discussion message must be 280 characters or less." });
      return;
    }

    const safeTimestamp = new Date().toISOString();

    const item = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      createdBy: currentUser?.name || "Citizen",
      createdById: currentUser?.id,
      content: safeContent,
      createdAt: safeTimestamp,
      updatedAt: safeTimestamp,
    };

    setDiscussions((prev) => {
      const next = editingDiscussionId
        ? prev.map((existing) =>
            existing.id === editingDiscussionId
              ? {
                  ...existing,
                  content: safeContent,
                  updatedAt: safeTimestamp,
                }
              : existing
          )
        : [item, ...prev];
      localStorage.setItem(discussionStorageKey, JSON.stringify(next));
      return next;
    });

    setDiscussionInput("");
    setEditingDiscussionId(null);
    setMessage({
      type: "success",
      text: editingDiscussionId ? "Discussion post updated." : "Discussion post published.",
    });
  };

  const startEditDiscussion = (item) => {
    setDiscussionInput(item.content);
    setEditingDiscussionId(item.id);
    setMessage({ type: "", text: "" });
  };

  const handleDeleteDiscussion = (discussionId) => {
    setDiscussions((prev) => {
      const next = prev.filter((item) => item.id !== discussionId);
      localStorage.setItem(discussionStorageKey, JSON.stringify(next));
      return next;
    });

    if (editingDiscussionId === discussionId) {
      setEditingDiscussionId(null);
      setDiscussionInput("");
    }

    setMessage({ type: "success", text: "Discussion post deleted." });
  };

  return (
    <div className="dashboard-page">
      <Navbar title="Citizen Dashboard" />

      <div className="dashboard-layout">
        <Sidebar
          title="Citizen Menu"
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
                    <h3>Citizen Participation Center</h3>
                    <p>
                      Track election progress, report suspicious activity, and engage in
                      responsible civic discussion.
                    </p>
                  </div>
                  <div className="analyst-live-chip">
                    <span>My Open Reports</span>
                    <strong>
                      {
                        myReports.filter(
                          (report) => report.status !== "verified" && report.status !== "rejected"
                        ).length
                      }
                    </strong>
                  </div>
                </div>

                <div className="analyst-kpi-grid">
                  <article className="analyst-kpi-card">
                    <span>Reports Submitted</span>
                    <strong>{myReports.length}</strong>
                  </article>
                  <article className="analyst-kpi-card">
                    <span>Results Published</span>
                    <strong>{electionResults.length}</strong>
                  </article>
                  <article className="analyst-kpi-card">
                    <span>My Discussion Posts</span>
                    <strong>{myDiscussionCount}</strong>
                  </article>
                </div>

                <div className="pro-toolbar">
                  <button className="btn btn-primary" type="button" onClick={() => setActiveSection("report")}>
                    Report an Issue
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => setActiveSection("results")}>
                    Track Election Process
                  </button>
                </div>
              </section>

              <section className="grid two-cols">
                <article className="panel analyst-live-panel citizen-overview-card">
                  <h3>How Citizen Role Works</h3>
                  <div className="citizen-process-list">
                    <div className="citizen-process-item">
                      <span>1</span>
                      <p>Track verified election updates across constituencies and booths.</p>
                    </div>
                    <div className="citizen-process-item">
                      <span>2</span>
                      <p>Submit structured issue reports with clear location and details.</p>
                    </div>
                    <div className="citizen-process-item">
                      <span>3</span>
                      <p>Participate in civic discussions with concise, accountable posts.</p>
                    </div>
                  </div>
                </article>

                <article className="panel analyst-live-panel citizen-overview-card">
                  <h3>Election Status Summary</h3>
                  <div className="result-bar-list">
                    <div className="result-bar-row">
                      <div className="result-bar-head">
                        <strong>Final Results</strong>
                        <span>{resultStatusCount.final}</span>
                      </div>
                      <div className="result-bar-track">
                        <div
                          className="result-bar-fill"
                          style={{
                            "--bar-width": `${
                              electionResults.length
                                ? Math.round((resultStatusCount.final / electionResults.length) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="result-bar-row">
                      <div className="result-bar-head">
                        <strong>In Progress</strong>
                        <span>{resultStatusCount["in-progress"]}</span>
                      </div>
                      <div className="result-bar-track">
                        <div
                          className="result-bar-fill alt"
                          style={{
                            "--bar-width": `${
                              electionResults.length
                                ? Math.round((resultStatusCount["in-progress"] / electionResults.length) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              </section>
            </>
          ) : null}

          {activeSection === "report" ? (
            <section className="panel">
              <h3>Submit fraud report</h3>
              <p>Provide clear and factual details about suspicious activity near polling locations.</p>
              {message.text ? (
                <p className={`status-note ${message.type === "error" ? "error" : "success"}`}>
                  {message.text}
                </p>
              ) : null}

              <form className="compact-form" onSubmit={handleSubmit}>
                <input
                  placeholder="Report title"
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                >
                  <option value="vote-buying">Vote Buying</option>
                  <option value="intimidation">Voter Intimidation</option>
                  <option value="booth-capturing">Booth Capturing</option>
                  <option value="other">Other</option>
                </select>
                <input
                  placeholder="Location"
                  required
                  value={form.location}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, location: event.target.value }))
                  }
                />
                <textarea
                  placeholder="Describe what happened"
                  required
                  rows={6}
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
                <div className="form-row">
                  <button className="btn btn-primary" type="submit">
                    {editingReportId ? "Update Report" : "Submit Report"}
                  </button>
                  {editingReportId ? (
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => {
                        setEditingReportId(null);
                        setForm(initialForm);
                      }}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            </section>
          ) : null}

          {activeSection === "my-reports" ? (
            <section className="panel">
              <h3>My reports</h3>
              <p>Track review status of your submitted complaints.</p>

              <div className="citizen-table-tools">
                <input
                  type="search"
                  placeholder="Search by title, location, category, or status"
                  value={reportSearch}
                  onChange={(event) => setReportSearch(event.target.value)}
                />
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Location</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length ? (
                      filteredReports.map((report) => (
                        <tr key={report.id}>
                          <td>{report.title}</td>
                          <td>{report.location}</td>
                          <td>{report.category}</td>
                          <td>
                            <span className="pill">{mapStatusLabel(report.status)}</span>
                          </td>
                          <td>{formatDateTime(report.createdAt)}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn btn-outline"
                                type="button"
                                onClick={() => startEditReport(report)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                type="button"
                                onClick={() => handleDeleteReport(report.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="muted">
                          No reports submitted yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === "results" ? (
            <section className="panel">
              <h3>Election process tracker</h3>
              <p>Monitor published constituency updates and follow process completion status.</p>

              <div className="citizen-table-tools">
                <select
                  value={resultFilter}
                  onChange={(event) => setResultFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="final">Final</option>
                  <option value="in-progress">In Progress</option>
                </select>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Constituency</th>
                      <th>Booth</th>
                      <th>Winner</th>
                      <th>Party</th>
                      <th>Votes</th>
                      <th>Status</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.length ? (
                      filteredResults.map((result) => (
                        <tr key={result.id}>
                          <td>{result.constituency}</td>
                          <td>{result.boothName}</td>
                          <td>{result.winner}</td>
                          <td>{result.party}</td>
                          <td>
                            {Number(result.votes).toLocaleString()} / {Number(result.totalVotes).toLocaleString()}
                          </td>
                          <td>
                            <span className="pill">{mapStatusLabel(result.status)}</span>
                          </td>
                          <td>{formatDateTime(result.updatedAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="muted">
                          No election updates available for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === "discussion" ? (
            <section className="panel">
              <h3>Civic discussion board</h3>
              <p>Share constructive public observations and keep discussion respectful.</p>

              <form className="compact-form" onSubmit={handleDiscussionSubmit}>
                <textarea
                  placeholder="Share your civic observation (max 280 characters)"
                  rows={4}
                  maxLength={280}
                  value={discussionInput}
                  onChange={(event) => setDiscussionInput(event.target.value)}
                />
                <div className="citizen-section-head">
                  <small className="muted">{discussionInput.trim().length}/280</small>
                  <button className="btn btn-primary" type="submit">
                    {editingDiscussionId ? "Update Discussion" : "Post Discussion"}
                  </button>
                  {editingDiscussionId ? (
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => {
                        setEditingDiscussionId(null);
                        setDiscussionInput("");
                      }}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>

              {sortedDiscussions.length ? (
                <div className="citizen-discussion-list">
                  {sortedDiscussions.map((item) => (
                    <article className="citizen-discussion-item" key={item.id}>
                      <p>{item.content}</p>
                      <div className="citizen-meta">
                        <span>{item.createdBy}</span>
                        <small>{formatDateTime(item.updatedAt || item.createdAt)}</small>
                      </div>
                      {item.createdById === currentUser?.id ? (
                        <div className="table-actions">
                          <button
                            className="btn btn-outline"
                            type="button"
                            onClick={() => startEditDiscussion(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => handleDeleteDiscussion(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted citizen-empty">No discussions yet. Be the first to contribute.</p>
              )}
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default CitizenDashboard;
