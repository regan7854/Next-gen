import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { Search, Trash2, Edit2, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ManageUsers() {
  const { apiFetch } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [msg, setMsg] = useState('');

  async function fetchUsers(p = page, s = search) {
    setLoading(true);
    try {
      const res = await apiFetch(`/users?page=${p}&limit=15&search=${encodeURIComponent(s)}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, [page]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search);
  }

  function startEdit(user) {
    setEditingId(user.id);
    setEditForm({ display_name: user.display_name, email: user.email, role: user.role });
  }

  async function saveEdit(id) {
    try {
      const res = await apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(editForm) });
      const data = await res.json();
      setMsg(data.message || 'Updated');
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      setMsg('Update failed');
    }
    setTimeout(() => setMsg(''), 3000);
  }

  async function deleteUser(id, name) {
    if (!confirm(`Delete user "${name}"? This will remove all their data.`)) return;
    try {
      const res = await apiFetch(`/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      setMsg(data.message || 'Deleted');
      fetchUsers();
    } catch (err) {
      setMsg('Delete failed');
    }
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Manage Users <small className="admin-count-badge">{total}</small></h2>
        <form className="admin-search-form" onSubmit={handleSearch}>
          <div className="admin-input-wrapper">
            <Search size={16} className="admin-input-icon" />
            <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">Search</button>
        </form>
      </div>

      {msg && <div className="admin-flash">{msg}</div>}

      <div className="admin-card">
        <div className="admin-table-wrapper">
          {loading ? (
            <div className="admin-loading"><div className="admin-spinner" /></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map(u => (
                  <tr key={u.id}>
                    <td style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.id}</td>
                    <td>{editingId === u.id ? <input className="admin-inline-input" value={editForm.display_name} onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))} /> : <span className="admin-td-bold">{u.display_name}</span>}</td>
                    <td>{editingId === u.id ? <input className="admin-inline-input" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /> : u.email}</td>
                    <td>{editingId === u.id ? (
                      <select className="admin-inline-select" value={editForm.role || 'user'} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                        <option value="influencer">Influencer</option>
                        <option value="brand">Brand</option>
                        <option value="user">User</option>
                      </select>
                    ) : <span className={`admin-status admin-status-${u.role}`}>{u.role || '\u2014'}</span>}</td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '\u2014'}</td>
                    <td>
                      <div className="admin-action-btns">
                        {editingId === u.id ? (
                          <>
                            <button className="admin-icon-btn admin-icon-success" onClick={() => saveEdit(u.id)} title="Save"><Check size={15} /></button>
                            <button className="admin-icon-btn admin-icon-muted" onClick={() => setEditingId(null)} title="Cancel"><X size={15} /></button>
                          </>
                        ) : (
                          <>
                            <button className="admin-icon-btn admin-icon-edit" onClick={() => startEdit(u)} title="Edit"><Edit2 size={15} /></button>
                            <button className="admin-icon-btn admin-icon-danger" onClick={() => deleteUser(u.id, u.display_name)} title="Delete"><Trash2 size={15} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="admin-td-empty">No users found</td></tr>
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
