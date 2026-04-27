function Sidebar({ title, items, activeItem, onChange }) {
  return (
    <aside className="side-nav">
      <h3>{title}</h3>
      <div className="side-nav-list">
        {items.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${activeItem === item.key ? "active" : ""}`}
            type="button"
            onClick={() => onChange(item.key)}
          >
            <span>{item.label}</span>
            {typeof item.count === "number" ? <strong>{item.count}</strong> : null}
          </button>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;
