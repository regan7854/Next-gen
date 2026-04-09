import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import LogoMark from '../../components/LogoMark.jsx';
import { Eye, EyeOff } from 'lucide-react';

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
    <div className="adm-login-page">

      {/* Left panel */}
      <div className="adm-login-left">
        <div className="adm-login-left-inner">
          <LogoMark height={56} />
          <h1 className="adm-login-left-title">
            Admin Control<br />Center
          </h1>
          <p className="adm-login-left-sub">
            Manage users, collaborations,<br />
            and platform analytics<br />
            all in one place.
          </p>
          <a className="adm-back" href="/">
            ← Back to website
          </a>
        </div>
      </div>

      {/* Right form */}
      <div className="adm-login-right">
        <div className="adm-login-form-wrap">

          <div className="adm-login-brand-row">
            <span className="adm-login-shield">&#128737;</span>
            <span className="adm-login-brand-label">Admin Portal</span>
          </div>

          <h2 className="adm-login-form-title">Welcome back</h2>
          <p className="adm-login-form-sub">Sign in to access the admin dashboard.</p>

          {error && <div className="adm-login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="adm-login-form" autoComplete="off">
            <div className="adm-login-field">
              <label htmlFor="admin-user">Username or Email</label>
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

            <div className="adm-login-field">
              <label htmlFor="admin-pass">Password</label>
              <div className="adm-login-pass-wrap">
                <input
                  id="admin-pass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="adm-login-eye"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="adm-login-submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in to Dashboard'}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
