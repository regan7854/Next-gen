import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import AdminChart from '../../components/admin/AdminChart.jsx';

export default function Reports() {
  const { apiFetch } = useAdminAuth();
  const [growth, setGrowth] = useState(null);
  const [topNiches, setTopNiches] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [growthRes, nichesRes, usersRes] = await Promise.all([
          apiFetch('/reports/growth'),
          apiFetch('/reports/top-niches'),
          apiFetch('/reports/top-users'),
        ]);
        setGrowth(await growthRes.json());
        setTopNiches((await nichesRes.json()).topNiches || []);
        setTopUsers((await usersRes.json()).topUsers || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /><p>Loading reports...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header"><h2>Reports & Analytics</h2></div>
      <div className="admin-charts-grid">
        <div className="admin-card"><AdminChart data={growth?.userGrowth || []} label="User Registrations (30 days)" color="#6c5ce7" height={250} /></div>
        <div className="admin-card"><AdminChart data={growth?.collabGrowth || []} label="Collaborations (30 days)" color="#00b894" height={250} /></div>
      </div>
      <div className="admin-card">
        <h3 className="admin-card-title">Top Niches</h3>
        <div className="admin-categories-list">
          {topNiches.length > 0 ? topNiches.map((niche, i) => {
            const max = topNiches[0]?.count || 1;
            return (
              <div key={i} className="admin-category-item">
                <div className="admin-category-info">
                  <span className="admin-category-rank">#{i + 1}</span>
                  <span className="admin-category-name">{niche.name}</span>
                  <span className="admin-category-count">{niche.count} users</span>
                </div>
                <div className="admin-category-bar-wrapper">
                  <div className="admin-category-bar" style={{ width: `${(niche.count / max) * 100}%` }} />
                </div>
              </div>
            );
          }) : <p className="admin-td-empty" style={{ padding: '1rem', textAlign: 'center' }}>No data yet</p>}
        </div>
      </div>
      <div className="admin-card">
        <h3 className="admin-card-title">Most Active Users</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Rank</th><th>User</th><th>Role</th><th>Collaborations</th></tr></thead>
            <tbody>
              {topUsers.length > 0 ? topUsers.map((u, i) => (
                <tr key={u.id}>
                  <td><span className="admin-category-rank">#{i + 1}</span></td>
                  <td className="admin-td-bold">{u.display_name}</td>
                  <td><span className="admin-badge">{u.role || '\u2014'}</span></td>
                  <td>{u.collab_count}</td>
                </tr>
              )) : <tr><td colSpan={4} className="admin-td-empty">No data yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
