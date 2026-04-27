function AnalystSidebar({ navItems, activeItem, onSelect }) {
  return (
    <aside className="analyst-shell-sidebar">
      <div className="analyst-shell-brand">
        <span>EA</span>
        <div>
          <h3>Election Analytics</h3>
          <p>Monitoring Suite</p>
        </div>
      </div>

      <nav className="analyst-shell-nav" aria-label="Analyst Navigation">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`analyst-shell-nav-item ${activeItem === item.key ? "active" : ""}`}
            onClick={item.action || (() => onSelect(item.key))}
          >
            <span>{item.icon}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default AnalystSidebar;
