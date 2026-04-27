function SummaryCard({ icon, title, value, gradient }) {
  return (
    <article className={`analyst-summary-card ${gradient}`}>
      <div className="analyst-summary-icon" aria-hidden="true">
        {icon}
      </div>
      <p>{title}</p>
      <strong>{value}</strong>
    </article>
  );
}

export default SummaryCard;
