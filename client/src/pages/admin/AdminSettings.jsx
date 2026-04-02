import { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminSettings() {
  const { admin, apiFetch } = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    setMsg(''); setError('');
    if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      const res = await apiFetch('/settings/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setMsg(data.message);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) { setError(err.message || 'Failed to update password'); }
    finally { setSaving(false); }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header"><h2>Settings</h2></div>
      <div className="admin-card">
        <h3 className="admin-card-title"><Shield size={18} /> Admin Account</h3>
        <div className="admin-settings-info">
          <div className="admin-settings-row"><span className="admin-settings-label">Username</span><span className="admin-settings-value">{admin?.username}</span></div>
          <div className="admin-settings-row"><span className="admin-settings-label">Email</span><span className="admin-settings-value">{admin?.email}</span></div>
          <div className="admin-settings-row"><span className="admin-settings-label">Role</span><span className="admin-badge">{admin?.role || 'admin'}</span></div>
        </div>
      </div>
      <div className="admin-card">
        <h3 className="admin-card-title"><Lock size={18} /> Change Password</h3>
        {msg && <div className="admin-flash admin-flash-success">{msg}</div>}
        {error && <div className="admin-flash admin-flash-error">{error}</div>}
        <form onSubmit={handleChangePassword} className="admin-settings-form">
          <div className="admin-form-group">
            <label>Current Password</label>
            <div className="admin-input-wrapper">
              <input type={showOld ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="Enter current password" />
              <button type="button" className="admin-pass-toggle" onClick={() => setShowOld(s => !s)} tabIndex={-1}>{showOld ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <div className="admin-form-group">
            <label>New Password</label>
            <div className="admin-input-wrapper">
              <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Enter new password (min 6 chars)" />
              <button type="button" className="admin-pass-toggle" onClick={() => setShowNew(s => !s)} tabIndex={-1}>{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <div className="admin-form-group">
            <label>Confirm New Password</label>
            <div className="admin-input-wrapper">
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Re-enter new password" />
            </div>
          </div>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );
}
