function AnalystTopbar({ analystName, now, notifications }) {
  return (
    <header className="analyst-shell-topbar">
      <div>
        <p className="analyst-shell-kicker">Election Analyst Workspace</p>
        <h1>Dashboard Overview</h1>
      </div>

      <div className="analyst-shell-topbar-actions">
        <div className="analyst-shell-time">{now.toLocaleTimeString()}</div>

        <button type="button" className="analyst-shell-icon-btn" aria-label="Notifications">
          🔔
          {notifications > 0 ? <span>{notifications}</span> : null}
        </button>

        <div className="analyst-shell-profile" aria-label="Analyst profile">
          <div className="analyst-shell-avatar">{analystName.charAt(0).toUpperCase()}</div>
          <div>
            <strong>{analystName}</strong>
            <small>Election Analyst</small>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AnalystTopbar;
