import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { Send, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ManageNotifications() {
  const { apiFetch } = useAdminAuth();
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [sending, setSending] = useState(false);

  async function fetchNotifications(p = page) {
    setLoading(true);
    try {
      const res = await apiFetch(`/notifications?page=${p}&limit=20`);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchNotifications(); }, [page]);

  async function handleBroadcast(e) {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    if (!confirm(`Send "${broadcastMsg}" to ALL users?`)) return;
    setSending(true);
    try {
      const res = await apiFetch('/notifications/broadcast', { method: 'POST', body: JSON.stringify({ message: broadcastMsg }) });
      const data = await res.json();
      setMsg(data.message);
      setBroadcastMsg('');
      fetchNotifications();
    } catch { setMsg('Broadcast failed'); }
    finally { setSending(false); }
    setTimeout(() => setMsg(''), 4000);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Manage Notifications <small className="admin-count-badge">{total}</small></h2>
      </div>
      <div className="admin-card">
        <h3 className="admin-card-title">Broadcast Notification</h3>
        <form onSubmit={handleBroadcast} className="admin-broadcast-form">
          <input type="text" placeholder="Type a message to send to all users..." value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} className="admin-broadcast-input" required />
          <button type="submit" className="admin-btn admin-btn-primary" disabled={sending}><Send size={15} /> {sending ? 'Sending...' : 'Broadcast'}</button>
        </form>
      </div>
      {msg && <div className="admin-flash">{msg}</div>}
      <div className="admin-card">
        <h3 className="admin-card-title">Recent Notifications</h3>
        <div className="admin-table-wrapper">
          {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
            <table className="admin-table">
              <thead><tr><th>ID</th><th>User</th><th>Type</th><th>Title</th><th>Date</th></tr></thead>
              <tbody>
                {notifications.length > 0 ? notifications.map(n => (
                  <tr key={n.id}>
                    <td style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.id}</td>
                    <td className="admin-td-bold">{n.user_name || `#${n.user_id}`}</td>
                    <td><span className="admin-badge">{n.type || '\u2014'}</span></td>
                    <td className="admin-td-msg">{n.title}</td>
                    <td>{n.created_at ? new Date(n.created_at).toLocaleDateString() : '\u2014'}</td>
                  </tr>
                )) : <tr><td colSpan={5} className="admin-td-empty">No notifications found</td></tr>}
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
