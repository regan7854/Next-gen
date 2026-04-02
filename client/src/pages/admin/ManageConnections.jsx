import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ManageConnections() {
  const { apiFetch } = useAdminAuth();
  const [collabs, setCollabs] = useState([]);
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
      setCollabs(data.connections || []);
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
      const data = await res.json();
      setMsg(data.message);
      fetchConnections();
    } catch { setMsg('Delete failed'); }
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Manage Connections <small className="admin-count-badge">{total}</small></h2>
      </div>
      {msg && <div className="admin-flash">{msg}</div>}
      <div className="admin-card">
        <div className="admin-table-wrapper">
          {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
            <table className="admin-table">
              <thead><tr><th>ID</th><th>Sender</th><th>Receiver</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {collabs.length > 0 ? collabs.map(cn => (
                  <tr key={cn.id}>
                    <td style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{cn.id}</td>
                    <td className="admin-td-bold">{cn.sender_name || `#${cn.sender_id}`}</td>
                    <td className="admin-td-bold">{cn.receiver_name || `#${cn.receiver_id}`}</td>
                    <td><span className={`admin-status admin-status-${cn.status}`}>{cn.status}</span></td>
                    <td>{cn.created_at ? new Date(cn.created_at).toLocaleDateString() : '\u2014'}</td>
                    <td><button className="admin-icon-btn admin-icon-danger" onClick={() => deleteConnection(cn.id)} title="Delete"><Trash2 size={15} /></button></td>
                  </tr>
                )) : <tr><td colSpan={6} className="admin-td-empty">No connections found</td></tr>}
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
