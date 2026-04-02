export default function AdminChart({ data, label, color = '#6c5ce7', height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="admin-chart-empty" style={{ height }}>
        <p>No data available</p>
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="admin-chart">
      <div className="admin-chart-header">
        <span className="admin-chart-label">{label}</span>
      </div>
      <div className="admin-chart-body" style={{ height }}>
        <div className="admin-chart-bars">
          {data.map((item, i) => (
            <div key={i} className="admin-chart-bar-group">
              <div className="admin-chart-bar-wrapper">
                <div
                  className="admin-chart-bar"
                  style={{
                    height: `${(item.count / max) * 100}%`,
                    backgroundColor: color,
                  }}
                  title={`${item.date || item.name}: ${item.count}`}
                />
              </div>
              <span className="admin-chart-bar-label">
                {item.date ? item.date.slice(5) : item.name?.slice(0, 6)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
