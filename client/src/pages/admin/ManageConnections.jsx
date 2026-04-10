import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ManageConnections() {
  const { apiFetch } = useAdminAuth();
  const [connections, setConnections] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function fetchConnections(p = page) {
    setLoading(true);
    try {
      const res = await apiFetch(`/connections?page=${p}&limit=15`);
      const data = await res.json();
      setConnections(data.connections || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchConnections(); }, [page]);

  async function deleteConnection(id) {
    if (!confirm('Delete this connection?')) return;
    try {
      const res = await apiFetch(`/connections/${id}`, { method: 'DELETE' });
      setMsg((await res.json()).message);
      fetchConnections();
    } catch { setMsg('Delete failed'); }
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Connections History <small className="admin-count-badge">{total}</small></h2>
      </div>
      {msg && <div className="admin-flash">{msg}</div>}
      <div className="admin-card">
        <div className="admin-table-wrapper">
          {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
            <table className="admin-table">
              <thead>
                <tr><th>From</th><th>To</th><th>Status</th><th>Connected On</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {connections.length > 0 ? connections.map(cn => (
                  <tr key={cn.id}>
                    <td className="admin-td-bold">{cn.sender_name || `#${cn.sender_id}`}</td>
                    <td className="admin-td-bold">{cn.receiver_name || `#${cn.receiver_id}`}</td>
                    <td><span className={`admin-status admin-status-${cn.status}`}>{cn.status}</span></td>
                    <td>{cn.created_at ? new Date(cn.created_at).toLocaleDateString() : '—'}</td>
                    <td><button className="admin-icon-btn admin-icon-danger" onClick={() => deleteConnection(cn.id)} title="Delete"><Trash2 size={15} /></button></td>
                  </tr>
                )) : <tr><td colSpan={5} className="admin-td-empty">No connections found</td></tr>}
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
