export default function StatsCard({ icon: Icon, label, value, trend, color = 'var(--clr-primary)' }) {
  return (
    <div className="admin-stats-card">
      <div className="admin-stats-icon" style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={22} />
      </div>
      <div className="admin-stats-info">
        <span className="admin-stats-value">{value}</span>
        <span className="admin-stats-label">{label}</span>
      </div>
      {trend !== undefined && (
        <span className={`admin-stats-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? '\u2191' : '\u2193'} {Math.abs(trend)}
        </span>
      )}
    </div>
  );
}
