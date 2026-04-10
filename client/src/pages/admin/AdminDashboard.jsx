import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { BarChart, PieChart } from '../../components/admin/AdminChart.jsx';
import { Users, Handshake, Clock, UserPlus, Bell } from 'lucide-react';

const POLL_MS = 5_000;

export default function AdminDashboard() {
  const { apiFetch } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchAll = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const [statsRes, activityRes, growthRes] = await Promise.all([
        apiFetch('/stats'),
        apiFetch('/activity'),
        apiFetch('/reports/growth'),
      ]);
      const [s, a, g] = await Promise.all([
        statsRes.json().catch(() => null),
        activityRes.json().catch(() => null),
        growthRes.json().catch(() => null),
      ]);
      if (s) setStats(s);
      if (a) setActivity(a);
      if (g) setGrowth(g);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      if (initial) setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchAll(true);
    timerRef.current = setInterval(() => fetchAll(false), POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const cards = [
    { icon: Users,     label: 'Total Users',      value: stats?.totalUsers || 0,          color: '#6c5ce7' },
    { icon: Handshake, label: 'Collaborations',    value: stats?.totalCollaborations || 0, color: '#00b894' },
    { icon: Clock,     label: 'Pending Requests',  value: stats?.pendingRequests || 0,     color: '#e17055' },
    { icon: UserPlus,  label: 'New This Week',     value: stats?.newUsersWeek || 0,        color: '#a29bfe' },
  ];

  return (
    <div className="admin-dashboard">

      {/* Stats Cards */}
      <div className="dash-stats-grid">
        {cards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: `${color}18`, color }}>
              <Icon size={20} />
            </div>
            <div className="dash-stat-info">
              <span className="dash-stat-value">{value}</span>
              <span className="dash-stat-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="admin-charts-grid">
        <div className="admin-card">
          <BarChart data={growth?.userGrowth} label="New Users (Last 30 Days)" color="#6c5ce7" />
        </div>
        <div className="admin-card">
          <PieChart
            label="Collaboration Status"
            slices={[
              { label: 'Active',    value: stats?.activeCollabs   || 0, color: '#00b894' },
              { label: 'Pending',   value: stats?.pendingRequests || 0, color: '#fdcb6e' },
              { label: 'Completed', value: Math.max((stats?.totalCollaborations || 0) - (stats?.activeCollabs || 0) - (stats?.pendingRequests || 0), 0), color: '#6c5ce7' },
            ]}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-card">
        <h3 className="admin-card-title">Quick Actions</h3>
        <div className="admin-quick-actions">
          <Link to="/admin/users" className="admin-quick-btn"><Users size={18} /> Manage Users</Link>
          <Link to="/admin/collaborations" className="admin-quick-btn"><Handshake size={18} /> Collaborations</Link>
          <Link to="/admin/notifications" className="admin-quick-btn"><Bell size={18} /> Notifications</Link>
        </div>
      </div>

      {/* Recent Activity */}
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
                    <td><span className="admin-badge">{u.role || '—'}</span></td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
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
                    <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
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
