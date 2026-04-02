import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import StatsCard from '../../components/admin/StatsCard.jsx';
import AdminChart from '../../components/admin/AdminChart.jsx';
import {
  Users, Handshake, Link2, Bell, TrendingUp,
  UserPlus, Clock, CheckCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { apiFetch } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, activityRes, growthRes] = await Promise.all([
          apiFetch('/stats'),
          apiFetch('/activity'),
          apiFetch('/reports/growth'),
        ]);
        setStats(await statsRes.json());
        setActivity(await activityRes.json());
        setGrowth(await growthRes.json());
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        <StatsCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} trend={stats?.newUsersWeek} color="#6c5ce7" />
        <StatsCard icon={Handshake} label="Collaborations" value={stats?.totalCollaborations || 0} trend={stats?.activeCollabs} color="#00b894" />
        <StatsCard icon={Link2} label="Connections" value={stats?.totalConnections || 0} color="#0984e3" />
        <StatsCard icon={Bell} label="Notifications" value={stats?.totalNotifications || 0} color="#fdcb6e" />
        <StatsCard icon={Clock} label="Pending Requests" value={stats?.pendingRequests || 0} color="#e17055" />
        <StatsCard icon={CheckCircle} label="Active Collabs" value={stats?.activeCollabs || 0} color="#00cec9" />
        <StatsCard icon={UserPlus} label="New This Week" value={stats?.newUsersWeek || 0} color="#a29bfe" />
        <StatsCard icon={TrendingUp} label="Categories" value={stats?.totalCategories || 0} color="#fd79a8" />
      </div>

      <div className="admin-charts-grid">
        <div className="admin-card">
          <AdminChart data={growth?.userGrowth || []} label="User Growth (Last 30 Days)" color="#6c5ce7" height={220} />
        </div>
        <div className="admin-card">
          <AdminChart data={growth?.collabGrowth || []} label="Collaborations (Last 30 Days)" color="#00b894" height={220} />
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">&#9889; Quick Actions</h3>
        <div className="admin-quick-actions">
          <Link to="/admin/users" className="admin-quick-btn"><Users size={18} /> Manage Users</Link>
          <Link to="/admin/collaborations" className="admin-quick-btn"><Handshake size={18} /> View Collaborations</Link>
          <Link to="/admin/reports" className="admin-quick-btn"><TrendingUp size={18} /> View Reports</Link>
          <Link to="/admin/notifications" className="admin-quick-btn"><Bell size={18} /> Send Notification</Link>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3 className="admin-card-title">Recent Users</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Niche</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {activity?.recentUsers?.length > 0 ? activity.recentUsers.map(u => (
                  <tr key={u.id}>
                    <td className="admin-td-bold">{u.display_name}</td>
                    <td>{u.email}</td>
                    <td><span className="admin-badge">{u.niche || u.role || '\u2014'}</span></td>
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
