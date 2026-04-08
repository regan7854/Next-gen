import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import LogoMark from '../../components/LogoMark.jsx';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const { admin, login, error, loading } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="admin-loading" style={{ minHeight: '100vh' }}>
        <div className="admin-spinner" />
      </div>
    );
  }

  if (admin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    await login(username, password);
    setSubmitting(false);
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <LogoMark height={72} />
          <h1>Admin</h1>
          <p>Sign in to access the admin dashboard</p>
        </div>

        {error && <div className="admin-login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label htmlFor="admin-user">Username or Email</label>
            <div className="admin-input-wrapper">
              <Shield size={16} className="admin-input-icon" />
              <input
                id="admin-user"
                type="text"
                placeholder="Enter username or email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-pass">Password</label>
            <div className="admin-input-wrapper">
              <button
                type="button"
                className="admin-pass-toggle"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <input
                id="admin-pass"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="admin-login-btn" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in to Dashboard'}
          </button>
        </form>

        <div className="admin-login-footer">
          <a href="/">&larr; Back to Website</a>
        </div>
      </div>
    </div>
  );
}
