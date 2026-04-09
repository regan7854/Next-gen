import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import StatsCard from '../../components/admin/StatsCard.jsx';
import AdminChart from '../../components/admin/AdminChart.jsx';
import {
  Users, Handshake, Link2, Bell, TrendingUp,
  UserPlus, Clock, CheckCircle, PieChart,
  ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';

const POLL_INTERVAL = 15_000; // 15 seconds

export default function AdminDashboard() {
  const { apiFetch } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timer = useRef(null);

  const safeJson = async (res) => {
    try { return await res.json(); } catch { return null; }
  };

  const fetchAll = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [statsRes, activityRes, growthRes] = await Promise.all([
        apiFetch('/stats'),
        apiFetch('/activity'),
        apiFetch('/reports/growth'),
      ]);
      const [s, a, g] = await Promise.all([
        safeJson(statsRes),
        safeJson(activityRes),
        safeJson(growthRes),
      ]);
      if (s) setStats(s);
      if (a) setActivity(a);
      if (g) setGrowth(g);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchAll(true);
    timer.current = setInterval(() => fetchAll(false), POLL_INTERVAL);
    return () => clearInterval(timer.current);
  }, [fetchAll]);

  if (loading && !stats) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  /* ── Derived metrics from real data ── */
  const totalUsers = stats?.totalUsers || 0;
  const influencers = stats?.influencers || 0;
  const brandsCount = stats?.brands || 0;
  const othersCount = Math.max(totalUsers - influencers - brandsCount, 0);
  const roleData = [
    { name: 'Influencers', count: influencers, color: '#6c5ce7' },
    { name: 'Brands', count: brandsCount, color: '#00b894' },
    { name: 'Others', count: othersCount, color: '#fdcb6e' },
  ];
  const roleTotal = roleData.reduce((s, r) => s + r.count, 0) || 1;

  /* Week-over-week change from real growth data */
  function weekChange(arr) {
    if (!arr || arr.length < 14) return 0;
    const thisWeek = arr.slice(-7).reduce((s, d) => s + d.count, 0);
    const lastWeek = arr.slice(-14, -7).reduce((s, d) => s + d.count, 0);
    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round(((thisWeek / lastWeek) - 1) * 100);
  }
  const userChange = weekChange(growth?.userGrowth);
  const collabChange = weekChange(growth?.collabGrowth);

  return (
    <div className="admin-dashboard">

      {/* ── Live indicator ── */}
      <div className="ac-live-bar">
        <span className="ac-live-dot" />
        <span className="ac-live-text">
          Live — updated {lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}
        </span>
        <button className="ac-refresh-btn" onClick={() => fetchAll(false)} title="Refresh now">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="admin-stats-grid">
        <StatsCard icon={Users} label="Total Users" value={totalUsers} trend={stats?.newUsersWeek} color="#6c5ce7" />
        <StatsCard icon={Handshake} label="Collaborations" value={stats?.totalCollaborations || 0} trend={stats?.activeCollabs} color="#00b894" />
        <StatsCard icon={Link2} label="Connections" value={stats?.totalConnections || 0} color="#0984e3" />
        <StatsCard icon={Bell} label="Notifications" value={stats?.totalNotifications || 0} color="#fdcb6e" />
        <StatsCard icon={Clock} label="Pending Requests" value={stats?.pendingRequests || 0} color="#e17055" />
        <StatsCard icon={CheckCircle} label="Active Collabs" value={stats?.activeCollabs || 0} color="#00cec9" />
        <StatsCard icon={UserPlus} label="New This Week" value={stats?.newUsersWeek || 0} color="#a29bfe" />
        <StatsCard icon={TrendingUp} label="Categories" value={stats?.totalCategories || 0} color="#fd79a8" />
      </div>

      {/* ── Growth Charts (real data) ── */}
      <div className="admin-charts-grid">
        <div className="admin-card ac-card">
          <div className="ac-card-badge">
            {userChange >= 0
              ? <span className="ac-change ac-change-up"><ArrowUpRight size={13}/> {userChange}%</span>
              : <span className="ac-change ac-change-down"><ArrowDownRight size={13}/> {Math.abs(userChange)}%</span>}
            <span className="ac-change-label">vs last week</span>
          </div>
          <AdminChart data={growth?.userGrowth} label="New Users (Last 30 Days)" color="#6c5ce7" height={250} />
        </div>
        <div className="admin-card ac-card">
          <div className="ac-card-badge">
            {collabChange >= 0
              ? <span className="ac-change ac-change-up"><ArrowUpRight size={13}/> {collabChange}%</span>
              : <span className="ac-change ac-change-down"><ArrowDownRight size={13}/> {Math.abs(collabChange)}%</span>}
            <span className="ac-change-label">vs last week</span>
          </div>
          <AdminChart data={growth?.collabGrowth} label="Collaborations (Last 30 Days)" color="#00b894" height={250} />
        </div>
      </div>

      {/* ── Notifications Chart + User Distribution ── */}
      <div className="admin-charts-grid">
        <div className="admin-card ac-card">
          <AdminChart data={growth?.notifGrowth} label="Notifications (Last 30 Days)" color="#0984e3" height={220} />
        </div>

        <div className="admin-card ac-card ac-role-section">
          <div className="ac-head">
            <span className="ac-title"><PieChart size={15} style={{ marginRight: 6, verticalAlign: -2 }} />User Distribution</span>
          </div>
          <div className="ac-role-body">
            <div className="ac-donut-wrap">
              <svg viewBox="0 0 120 120" className="ac-donut-svg">
                {(() => {
                  let offset = 0;
                  const circ = 2 * Math.PI * 46;
                  return roleData.map((r, i) => {
                    const pct = r.count / roleTotal;
                    const dash = pct * circ;
                    const gap = circ - dash;
                    const el = (
                      <circle key={i} cx="60" cy="60" r="46" fill="none"
                        stroke={r.color} strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={-offset}
                        style={{ transition: 'all 0.6s ease' }} />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
                <text x="60" y="55" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1e1e2e">{totalUsers}</text>
                <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#aaa" fontWeight="500">Total Users</text>
              </svg>
            </div>
            <div className="ac-role-legend">
              {roleData.map((r, i) => (
                <div key={i} className="ac-role-row">
                  <span className="ac-role-dot" style={{ background: r.color }} />
                  <span className="ac-role-name">{r.name}</span>
                  <span className="ac-role-bar-wrap">
                    <span className="ac-role-bar" style={{ width: `${(r.count / roleTotal) * 100}%`, background: r.color }} />
                  </span>
                  <span className="ac-role-count">{r.count}</span>
                  <span className="ac-role-pct">{((r.count / roleTotal) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Metrics ── */}
      <div className="admin-card ac-card ac-highlights">
        <div className="ac-head">
          <span className="ac-title">Platform Summary</span>
        </div>
        <div className="ac-highlight-grid">
          {[
            { label: 'Total Users', value: totalUsers, icon: '👥', change: stats?.newUsersWeek ? `+${stats.newUsersWeek} this week` : '—' },
            { label: 'Total Collaborations', value: stats?.totalCollaborations || 0, icon: '🤝', change: `${stats?.activeCollabs || 0} active` },
            { label: 'Pending Requests', value: stats?.pendingRequests || 0, icon: '⏳', change: 'awaiting response' },
            { label: 'Acceptance Rate', value: (stats?.totalCollaborations ? ((stats?.activeCollabs || 0) / stats.totalCollaborations * 100).toFixed(0) : 0) + '%', icon: '✅', change: 'of all requests' },
            { label: 'Influencers', value: influencers, icon: '🎤', change: `${((influencers / roleTotal) * 100).toFixed(0)}% of users` },
            { label: 'Brands', value: brandsCount, icon: '🏢', change: `${((brandsCount / roleTotal) * 100).toFixed(0)}% of users` },
          ].map((m, i) => (
            <div key={i} className="ac-highlight-item">
              <span className="ac-highlight-icon">{m.icon}</span>
              <div className="ac-highlight-info">
                <span className="ac-highlight-val">{m.value}</span>
                <span className="ac-highlight-label">{m.label}</span>
              </div>
              <span className="ac-highlight-change up">{m.change}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="admin-card">
        <h3 className="admin-card-title">&#9889; Quick Actions</h3>
        <div className="admin-quick-actions">
          <Link to="/admin/users" className="admin-quick-btn"><Users size={18} /> Manage Users</Link>
          <Link to="/admin/collaborations" className="admin-quick-btn"><Handshake size={18} /> View Collaborations</Link>
          <Link to="/admin/reports" className="admin-quick-btn"><TrendingUp size={18} /> View Reports</Link>
          <Link to="/admin/notifications" className="admin-quick-btn"><Bell size={18} /> Send Notification</Link>
        </div>
      </div>

      {/* ── Recent Activity Tables ── */}
      <div className="admin-grid-2">
        <div className="admin-card">
          <h3 className="admin-card-title">Recent Users</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {activity?.recentUsers?.length > 0 ? activity.recentUsers.map(u => (
                  <tr key={u.id}>
                    <td className="admin-td-bold">{u.display_name}</td>
                    <td>{u.email}</td>
                    <td><span className="admin-badge">{u.role || '\u2014'}</span></td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '\u2014'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="admin-td-empty">No recent users</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">Recent Collaborations</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>From</th><th>To</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {activity?.recentCollabs?.length > 0 ? activity.recentCollabs.map(c => (
                  <tr key={c.id}>
                    <td className="admin-td-bold">{c.sender_name || 'Unknown'}</td>
                    <td>{c.receiver_name || 'Unknown'}</td>
                    <td><span className={`admin-status admin-status-${c.status}`}>{c.status}</span></td>
                    <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '\u2014'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="admin-td-empty">No recent collaborations</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
