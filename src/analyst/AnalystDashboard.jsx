import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

import AnalystSidebar from "./components/AnalystSidebar";
import AnalystTopbar from "./components/AnalystTopbar";
import SummaryCard from "./components/SummaryCard";

import VotesPerCandidateChart from "./components/charts/VotesPerCandidateChart";
import ParticipationPieChart from "./components/charts/ParticipationPieChart";
import VotingTrendLineChart from "./components/charts/VotingTrendLineChart";
import RegionResultsChart from "./components/charts/RegionResultsChart";

import "./AnalystDashboard.css";

const formatNumber = (value) => Number(value).toLocaleString();

const reportInitialForm = {
  id: null,
  title: "",
  summary: "",
  recommendation: "",
  status: "draft",
};

function AnalystDashboard() {
  const {
    currentUser,
    logout,
    analystReports,
    electionResults,
    uploadElectionData,
    createAnalystReport,
    updateAnalystReport,
    deleteAnalystReport,
  } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [now, setNow] = useState(() => new Date());
  const [reportForm, setReportForm] = useState(reportInitialForm);
  const [reportMessage, setReportMessage] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const notifications = useMemo(
    () => analystReports?.filter((item) => item.status === "draft").length || 0,
    [analystReports]
  );

  const liveElectionSummary = useMemo(() => {
    if (!electionResults || !electionResults.length) {
      return {
        totalRegisteredVoters: 0,
        totalVotesCast: 0,
        participationPercentage: 0,
        leadingCandidate: "N/A",
        candidateTotals: {},
      };
    }

    const totalVotesCast = electionResults.reduce((sum, result) => sum + (result.votes || 0), 0);
    const totalRegistered = electionResults.reduce((sum, result) => sum + (result.totalVotes || 0), 0);
    const candidateTotals = electionResults.reduce((map, result) => {
      const name = result.winner || result.party || "Unknown";
      map[name] = (map[name] || 0) + (result.votes || 0);
      return map;
    }, {});

    const leadingCandidate = Object.entries(candidateTotals)
      .sort(([, aVotes], [, bVotes]) => bVotes - aVotes)
      .map(([name]) => name)[0] || "N/A";

    return {
      totalRegisteredVoters: totalRegistered,
      totalVotesCast: totalVotesCast,
      participationPercentage: totalRegistered > 0 ? Number(((totalVotesCast / totalRegistered) * 100).toFixed(2)) : 0,
      leadingCandidate,
      candidateTotals,
    };
  }, [electionResults]);

  const summaryCards = [
    {
      title: "Total Registered Voters",
      value: formatNumber(liveElectionSummary.totalRegisteredVoters),
      icon: "👥",
      gradient: "gradient-1",
    },
    {
      title: "Total Votes Cast",
      value: formatNumber(liveElectionSummary.totalVotesCast),
      icon: "🗳️",
      gradient: "gradient-2",
    },
    {
      title: "Voter Participation",
      value: `${liveElectionSummary.participationPercentage}%`,
      icon: "📈",
      gradient: "gradient-3",
    },
    {
      title: "Leading Candidate",
      value: liveElectionSummary.leadingCandidate,
      icon: "🏆",
      gradient: "gradient-4",
    },
  ];

  const votesPerCandidateData = useMemo(() => {
    if (!electionResults || !electionResults.length) {
      return [];
    }

    return Object.entries(liveElectionSummary.candidateTotals || {})
      .map(([name, votes]) => ({ name, votes }))
      .sort((a, b) => b.votes - a.votes);
  }, [electionResults, liveElectionSummary.candidateTotals]);

  const participationData = useMemo(() => {
    if (!electionResults || !electionResults.length) {
      return [
        { name: "Voted", value: 0 },
        { name: "Not Voted", value: 0 },
      ];
    }

    const voted = liveElectionSummary.totalVotesCast;
    const notVoted = Math.max(liveElectionSummary.totalRegisteredVoters - voted, 0);
    return [
      { name: "Voted", value: voted },
      { name: "Not Voted", value: notVoted },
    ];
  }, [electionResults, liveElectionSummary.totalVotesCast, liveElectionSummary.totalRegisteredVoters]);

  const votingTrendData = useMemo(() => {
    if (!electionResults || !electionResults.length) {
      return [];
    }

    const trendMap = {};
    electionResults.forEach((result) => {
      const updatedAt = result.updatedAt ? new Date(result.updatedAt) : null;
      const timeKey = updatedAt
        ? updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : result.boothName || result.constituency || "Unknown";
      trendMap[timeKey] = (trendMap[timeKey] || 0) + (result.votes || 0);
    });

    return Object.entries(trendMap).map(([time, votes]) => ({ time, votes }));
  }, [electionResults]);

  const regionResultsData = useMemo(() => {
    if (!electionResults || !electionResults.length) {
      return [];
    }

    const regionMap = {};
    electionResults.forEach((result) => {
      const region = result.constituency || result.boothName || "Unknown";
      regionMap[region] = (regionMap[region] || 0) + (result.votes || 0);
    });

    return Object.entries(regionMap)
      .map(([region, votes]) => ({ region, votes }))
      .sort((a, b) => b.votes - a.votes);
  }, [electionResults]);

  const constituencyRows = useMemo(
    () =>
      regionResultsData.map((item) => ({
        ...item,
        share: liveElectionSummary.totalVotesCast
          ? ((item.votes / liveElectionSummary.totalVotesCast) * 100).toFixed(2)
          : "0.00",
      })),
    [regionResultsData, liveElectionSummary.totalVotesCast]
  );

  const candidateRows = useMemo(() => {
    const safeSearch = candidateSearch.trim().toLowerCase();

    return [...votesPerCandidateData]
      .filter((item) => item.name.toLowerCase().includes(safeSearch))
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }, [candidateSearch, votesPerCandidateData]);

  const myReports = useMemo(
    () =>
      analystReports
        .filter((item) => item.createdById === currentUser?.id)
        .sort(
          (first, second) =>
            new Date(second.updatedAt || second.createdAt || 0).getTime() -
            new Date(first.updatedAt || first.createdAt || 0).getTime()
        ),
    [analystReports, currentUser?.id]
  );

  const resetReportForm = () => {
    setReportForm(reportInitialForm);
  };

  const handleUploadFileChange = (event) => {
    setUploadFile(event.target.files?.[0] || null);
    setUploadMessage("");
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();
    if (!uploadFile) {
      setUploadMessage("Please choose an Excel file to upload.");
      return;
    }

    setUploading(true);
    setUploadMessage("");

    const result = await uploadElectionData(uploadFile);
    setUploadMessage(result.message);
    setUploading(false);
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      title: reportForm.title.trim(),
      summary: reportForm.summary.trim(),
      recommendation: reportForm.recommendation.trim(),
      status: reportForm.status,
    };

    if (!payload.title || !payload.summary || !payload.recommendation || !payload.status) {
      setReportMessage("All report fields are required.");
      return;
    }

    if (reportForm.id) {
      const result = await updateAnalystReport(reportForm.id, payload);
      setReportMessage(result.message);
      if (result.success) {
        resetReportForm();
      }
      return;
    }

    const result = await createAnalystReport(payload);
    setReportMessage(result.message);
    if (result.success) {
      resetReportForm();
    }
  };

  const beginEditReport = (report) => {
    setReportForm({
      id: report.id,
      title: report.title,
      summary: report.summary,
      recommendation: report.recommendation,
      status: report.status,
    });
  };

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "reports", label: "Reports", icon: "📁" },
    { key: "constituencies", label: "Constituencies", icon: "🗺️" },
    { key: "candidates", label: "Candidates", icon: "👤" },
    {
      key: "logout",
      label: "Logout",
      icon: "↩️",
      action: async () => {
        logout();
        navigate("/");
      },
    },
  ];

  return (
    <div className="analyst-shell">
      <AnalystSidebar navItems={navItems} activeItem={activeSection} onSelect={setActiveSection} />

      <div className="analyst-shell-content">
        <AnalystTopbar
          analystName={currentUser?.name || "Election Analyst"}
          now={now}
          notifications={notifications}
        />

        <main className="analyst-main-grid">
          {activeSection === "dashboard" ? (
            <>
              {currentUser?.role === "analyst" ? (
                <section className="analyst-upload-card">
                  <div className="analyst-table-header">
                    <h3>Bulk Excel Upload</h3>
                    <p>
                      Upload election data, turnout, regional statistics, and fraud reports via Excel. The dashboard
                      refreshes dynamically after import.
                    </p>
                  </div>
                  <form className="analyst-upload-form" onSubmit={handleUploadSubmit}>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleUploadFileChange}
                      disabled={uploading}
                    />
                    <button type="submit" disabled={uploading}>
                      {uploading ? "Uploading..." : "Upload Excel File"}
                    </button>
                  </form>
                  {uploadMessage && <p className="upload-message">{uploadMessage}</p>}
                </section>
              ) : null}

              <section className="analyst-summary-grid">
                {summaryCards.map((card) => (
                  <SummaryCard
                    key={card.title}
                    icon={card.icon}
                    title={card.title}
                    value={card.value}
                    gradient={card.gradient}
                  />
                ))}
              </section>

              <section className="analyst-charts-grid">
                <VotesPerCandidateChart data={votesPerCandidateData} />
                <ParticipationPieChart data={participationData} />
                <VotingTrendLineChart data={votingTrendData} />
                <RegionResultsChart data={regionResultsData} />
              </section>

              <section className="analyst-table-card">
                <div className="analyst-table-header">
                  <h3>Recent Activity</h3>
                  <p>Latest voter verification events across regions.</p>
                </div>

                <div className="analyst-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Constituency</th>
                        <th>Booth</th>
                        <th>Last Updated</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {electionResults && electionResults.length ? (
                        [...electionResults]
                          .sort(
                            (a, b) =>
                              new Date(b.updatedAt || b.createdAt || 0).getTime() -
                              new Date(a.updatedAt || a.createdAt || 0).getTime()
                          )
                          .slice(0, 8)
                          .map((item) => (
                            <tr key={item.id}>
                              <td>{item.constituency || "N/A"}</td>
                              <td>{item.boothName || "N/A"}</td>
                              <td>
                                {item.updatedAt
                                  ? new Date(item.updatedAt).toLocaleString()
                                  : item.createdAt
                                  ? new Date(item.createdAt).toLocaleString()
                                  : "N/A"}
                              </td>
                              <td>
                                <span
                                  className={`activity-status ${
                                    item.status?.toLowerCase() === "verified" ? "verified" : "pending"
                                  }`}
                                >
                                  {item.status || "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={4}>No activity yet. Upload an Excel file to populate dashboard data.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}

          {activeSection === "reports" ? (
            <section className="analyst-table-card analyst-stack-card">
              <div className="analyst-table-header">
                <h3>Analyst Reports</h3>
                <p>Create, edit, and manage your analytical reports.</p>
              </div>

              <form className="analyst-report-form" onSubmit={handleReportSubmit}>
                <input
                  type="text"
                  placeholder="Report title"
                  value={reportForm.title}
                  onChange={(event) =>
                    setReportForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
                <textarea
                  rows={3}
                  placeholder="Summary"
                  value={reportForm.summary}
                  onChange={(event) =>
                    setReportForm((prev) => ({ ...prev, summary: event.target.value }))
                  }
                />
                <textarea
                  rows={3}
                  placeholder="Recommendation"
                  value={reportForm.recommendation}
                  onChange={(event) =>
                    setReportForm((prev) => ({ ...prev, recommendation: event.target.value }))
                  }
                />
                <div className="analyst-report-actions">
                  <select
                    value={reportForm.status}
                    onChange={(event) =>
                      setReportForm((prev) => ({ ...prev, status: event.target.value }))
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="published">Published</option>
                  </select>
                  <button className="btn btn-primary" type="submit">
                    {reportForm.id ? "Update Report" : "Create Report"}
                  </button>
                  {reportForm.id ? (
                    <button className="btn btn-outline" type="button" onClick={resetReportForm}>
                      Cancel
                    </button>
                  ) : null}
                </div>
                {reportMessage ? <p className="analyst-inline-note">{reportMessage}</p> : null}
              </form>

              <div className="analyst-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReports.length ? (
                      myReports.map((item) => (
                        <tr key={item.id}>
                          <td>{item.title}</td>
                          <td>
                            <span className="activity-status pending">{item.status}</span>
                          </td>
                          <td>{new Date(item.updatedAt || item.createdAt || Date.now()).toLocaleString()}</td>
                          <td>
                            <div className="analyst-action-row">
                              <button
                                className="btn btn-outline"
                                type="button"
                                onClick={() => beginEditReport(item)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                type="button"
                                onClick={async () => {
                                  const result = await deleteAnalystReport(item.id);
                                  setReportMessage(result.message);
                                  if (reportForm.id === item.id) {
                                    resetReportForm();
                                  }
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
                        <td colSpan={4}>No reports found for this analyst.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === "constituencies" ? (
            <section className="analyst-table-card">
              <div className="analyst-table-header">
                <h3>Constituency Results</h3>
                <p>Region-level vote count and share contribution.</p>
              </div>

              <div className="analyst-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Region</th>
                      <th>Votes</th>
                      <th>Share of Total Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {constituencyRows.map((item) => (
                      <tr key={item.region}>
                        <td>{item.region}</td>
                        <td>{formatNumber(item.votes)}</td>
                        <td>{item.share}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === "candidates" ? (
            <section className="analyst-table-card analyst-stack-card">
              <div className="analyst-table-header">
                <h3>Candidate Performance</h3>
                <p>Search and track candidate vote performance rankings.</p>
              </div>

              <div className="analyst-search-row">
                <input
                  type="search"
                  placeholder="Search candidate name"
                  value={candidateSearch}
                  onChange={(event) => setCandidateSearch(event.target.value)}
                />
              </div>

              <div className="analyst-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Candidate</th>
                      <th>Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidateRows.length ? (
                      candidateRows.map((item) => (
                        <tr key={item.name}>
                          <td>#{item.rank}</td>
                          <td>{item.name}</td>
                          <td>{formatNumber(item.votes)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3}>No candidate match found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default AnalystDashboard;
