import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { Trash2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function ManageCollaborations() {
  const { apiFetch } = useAdminAuth();
  const [collabs, setCollabs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function fetchCollabs(p = page, status = statusFilter) {
    setLoading(true);
    try {
      const params = `?page=${p}&limit=15${status ? `&status=${status}` : ''}`;
      const res = await apiFetch(`/collaborations${params}`);
      const data = await res.json();
      setCollabs(data.collaborations || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchCollabs(); }, [page, statusFilter]);

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  async function updateStatus(id, status) {
    try {
      const res = await apiFetch(`/collaborations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      flash((await res.json()).message);
      fetchCollabs();
    } catch { flash('Update failed'); }
  }

  async function deleteCollab(id) {
    if (!confirm('Delete this collaboration?')) return;
    try {
      const res = await apiFetch(`/collaborations/${id}`, { method: 'DELETE' });
      flash((await res.json()).message);
      fetchCollabs();
    } catch { flash('Delete failed'); }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Collaborations <small className="admin-count-badge">{total}</small></h2>
        <div className="admin-filter-group">
          <Filter size={16} />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-select">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {msg && <div className="admin-flash">{msg}</div>}

      <div className="admin-card">
        <div className="admin-table-wrapper">
          {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Influencer</th>
                  <th>Brand</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {collabs.length > 0 ? collabs.map(c => (
                  <tr key={c.id}>
                    <td className="admin-td-bold">
                      {c.influencer_name || c.sender_name || '—'}
                      <span className="admin-role-tag influencer">Influencer</span>
                    </td>
                    <td className="admin-td-bold">
                      {c.brand_name || c.receiver_name || '—'}
                      <span className="admin-role-tag brand">Brand</span>
                    </td>
                    <td>
                      <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)} className={`admin-inline-select admin-status-${c.status}`}>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <button className="admin-icon-btn admin-icon-danger" onClick={() => deleteCollab(c.id)} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="admin-td-empty">No collaborations found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="admin-page-btn"><ChevronLeft size={16} /> Prev</button>
            <span className="admin-page-info">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="admin-page-btn">Next <ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
