import { useState } from 'react';

function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Bar Chart ── */
export function BarChart({ data, label, color = '#6c5ce7' }) {
  const [hovered, setHovered] = useState(null); // used for bar highlight on hover

  if (!data || data.length === 0) {
    return (
      <div className="ac-wrap">
        <div className="ac-head"><span className="ac-title">{label}</span></div>
        <div className="ac-empty"><p>No data available</p></div>
      </div>
    );
  }

  const values = data.map(d => d.count);
  const maxVal = Math.max(...values, 1);
  const total = values.reduce((s, v) => s + v, 0);
  const avg = (total / values.length).toFixed(1);

  // Show ~10 evenly spaced bars for readability
  const step = Math.max(1, Math.ceil(data.length / 10));
  const visible = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="ac-wrap">
      <div className="ac-head">
        <span className="ac-title">{label}</span>
        <div className="ac-meta">
          <span className="ac-pill">Total <b>{total}</b></span>
          <span className="ac-pill">Avg <b>{avg}</b>/day</span>
        </div>
      </div>
      <div className="bar-chart">
        {visible.map((d, i) => {
          const pct = maxVal > 0 ? (d.count / maxVal) * 100 : 0;
          const isHovered = hovered === i;
          return (
            <div
              key={i}
              className="bar-col"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {d.count > 0 && (
                <span className="bar-count">{d.count}</span>
              )}
              <div
                className="bar-fill"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  background: isHovered ? color : `${color}bb`,
                  borderRadius: '4px 4px 0 0',
                }}
              />
              <span className="bar-label">{fmtDate(d.date)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Pie Chart ── */
export function PieChart({ label, slices }) {
  const [hovered, setHovered] = useState(null);

  if (!slices || slices.length === 0) {
    return (
      <div className="ac-wrap">
        <div className="ac-head"><span className="ac-title">{label}</span></div>
        <div className="ac-empty"><p>No data available</p></div>
      </div>
    );
  }

  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
  const cx = 80, cy = 80, r = 64;

  // Build SVG arcs
  let cumAngle = -Math.PI / 2;
  const arcs = slices.map((sl, i) => {
    const angle = (sl.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return {
      ...sl,
      d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`,
    };
  });

  const active = hovered !== null ? slices[hovered] : null;

  return (
    <div className="ac-wrap">
      <div className="ac-head">
        <span className="ac-title">{label}</span>
      </div>
      <div className="pie-body">
        <div className="pie-svg-wrap">
          <svg viewBox="0 0 160 160" className="pie-svg">
            {arcs.map((arc, i) => (
              <path
                key={i}
                d={arc.d}
                fill={arc.color}
                opacity={hovered === null || hovered === i ? 1 : 0.45}
                stroke="#fff"
                strokeWidth="2"
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
            {active ? (
              <>
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="#1A1916">{active.value}</text>
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#9B9891">{active.label}</text>
              </>
            ) : (
              <>
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="#1A1916">{total}</text>
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#9B9891">Total</text>
              </>
            )}
          </svg>
        </div>
        <div className="pie-legend">
          {slices.map((sl, i) => (
            <div
              key={i}
              className={`pie-legend-row${hovered === i ? ' pie-legend-active' : ''}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="pie-legend-dot" style={{ background: sl.color }} />
              <span className="pie-legend-label">{sl.label}</span>
              <span className="pie-legend-val">{sl.value}</span>
              <span className="pie-legend-pct">{((sl.value / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BarChart;
