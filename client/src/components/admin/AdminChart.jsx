import { useState, useId } from 'react';

/* ── Nice tick calculation so labels never repeat ── */
function niceTicks(maxVal, count = 5) {
  if (maxVal <= 0) return [0];
  const rough = maxVal / (count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / mag;
  let nice;
  if (residual <= 1.5) nice = 1 * mag;
  else if (residual <= 3) nice = 2 * mag;
  else if (residual <= 7) nice = 5 * mag;
  else nice = 10 * mag;
  const ticks = [];
  for (let v = 0; v <= maxVal + nice * 0.01; v += nice) ticks.push(Math.round(v * 100) / 100);
  if (ticks[ticks.length - 1] < maxVal) ticks.push(ticks[ticks.length - 1] + nice);
  return ticks;
}

/* ── Smooth cubic bezier path builder ── */
function smoothLine(pts) {
  if (pts.length < 2) return `M${pts[0].x},${pts[0].y}`;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

/* ── Format date label ── */
function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AdminChart({ data, label, color = '#6c5ce7', height = 240 }) {
  const [hovered, setHovered] = useState(null);
  const uid = useId().replace(/:/g, '');

  if (!data || data.length === 0) {
    return (
      <div className="ac-empty" style={{ height }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M7 16l4-6 4 4 5-8"/></svg>
        <p>No data available</p>
      </div>
    );
  }

  const values = data.map(d => d.count);
  const rawMax = Math.max(...values, 1);
  const total = values.reduce((s, v) => s + v, 0);
  const avg = (total / values.length).toFixed(1);
  const ticks = niceTicks(rawMax, 5);
  const ceilMax = ticks[ticks.length - 1];

  const padL = 48, padR = 16, padTop = 16, padBot = 36;
  const svgW = 640;
  const svgH = height;
  const cW = svgW - padL - padR;
  const cH = svgH - padTop - padBot;

  const step = data.length > 1 ? cW / (data.length - 1) : cW;
  const pts = data.map((d, i) => ({
    x: padL + i * step,
    y: padTop + cH - (d.count / ceilMax) * cH,
    ...d,
  }));

  const linePath = smoothLine(pts);
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${padTop + cH} L${pts[0].x},${padTop + cH} Z`;

  const gid = `g-${uid}`;
  const sid = `s-${uid}`;

  /* X labels — show ~7 evenly spaced */
  const xStep = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div className="ac-wrap">
      <div className="ac-head">
        <span className="ac-title">{label}</span>
        <div className="ac-meta">
          <span className="ac-pill">Total <b>{total.toLocaleString()}</b></span>
          <span className="ac-pill">Avg <b>{avg}</b>/day</span>
        </div>
      </div>
      <div className="ac-body">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet" className="ac-svg">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <filter id={sid} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor={color} floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Horizontal grid + Y labels */}
          {ticks.map((v, i) => {
            const y = padTop + cH - (v / ceilMax) * cH;
            return (
              <g key={`y${i}`}>
                <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#ececec" strokeWidth="0.7" />
                <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#b0b0b0" fontFamily="system-ui">{v}</text>
              </g>
            );
          })}

          {/* Area gradient */}
          <path d={areaPath} fill={`url(#${gid})`} />

          {/* Smooth line */}
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${sid})`} />

          {/* Hover vertical guide */}
          {hovered !== null && (
            <line x1={pts[hovered].x} y1={padTop} x2={pts[hovered].x} y2={padTop + cH}
              stroke={color} strokeWidth="1" strokeDasharray="4,3" opacity="0.35" />
          )}

          {/* Data dots + hover zones */}
          {pts.map((p, i) => {
            const isActive = hovered === i;
            return (
              <g key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
                {isActive && <circle cx={p.x} cy={p.y} r="8" fill={color} opacity="0.12" />}
                <circle cx={p.x} cy={p.y} r={isActive ? 4.5 : 3}
                  fill="#fff" stroke={color} strokeWidth={isActive ? 2.5 : 2}
                  style={{ transition: 'r 0.15s ease' }} />
              </g>
            );
          })}

          {/* X labels */}
          {pts.map((p, i) => {
            if (i % xStep !== 0 && i !== data.length - 1) return null;
            return (
              <text key={`x${i}`} x={p.x} y={svgH - 8} textAnchor="middle"
                fontSize="10" fill="#b0b0b0" fontFamily="system-ui">
                {fmtDate(p.date) || p.name?.slice(0, 6) || ''}
              </text>
            );
          })}

          {/* Tooltip */}
          {hovered !== null && (() => {
            const p = pts[hovered];
            const txt = `${fmtDate(p.date) || p.name || ''}: ${p.count}`;
            const tw = Math.max(txt.length * 6.5, 70);
            let tx = p.x - tw / 2;
            if (tx < padL) tx = padL;
            if (tx + tw > svgW - padR) tx = svgW - padR - tw;
            const ty = p.y - 38;
            return (
              <g>
                <rect x={tx} y={ty} width={tw} height="26" rx="8"
                  fill="#1e1e2e" opacity="0.92" />
                <polygon
                  points={`${p.x - 5},${ty + 26} ${p.x + 5},${ty + 26} ${p.x},${ty + 32}`}
                  fill="#1e1e2e" opacity="0.92" />
                <text x={tx + tw / 2} y={ty + 17} textAnchor="middle"
                  fontSize="11" fill="#fff" fontWeight="600" fontFamily="system-ui">
                  {txt}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
