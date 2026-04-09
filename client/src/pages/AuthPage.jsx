import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiClient } from '../services/apiClient.js';
import LogoMark from '../components/LogoMark.jsx';
import Footer from '../components/Footer.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Map server field names → friendly messages
const SERVER_MSG = {
  'Username is required':                        { field: 'username',        msg: 'Username is required' },
  'Username must be 3-30 characters':            { field: 'username',        msg: 'Username must be 3–30 characters' },
  'Username can only contain letters, numbers, and underscores': { field: 'username', msg: 'Only letters, numbers and underscores allowed' },
  'Display name is required':                    { field: 'displayName',     msg: 'Display name is required' },
  'Display name too long':                       { field: 'displayName',     msg: 'Display name is too long' },
  'Invalid email address':                       { field: 'email',           msg: 'Check your email address' },
  'Password must be 8+ characters with letters and numbers': { field: 'password', msg: 'Password needs 8+ chars with letters and numbers' },
  'Email or username is required':               { field: 'identifier',      msg: 'Enter your email or username' },
  'Password is required':                        { field: 'password',        msg: 'Enter your password' },
};

// Map controller-level messages
const CTRL_MSG = {
  'Email already registered':  { field: 'email',      msg: 'That email is already registered' },
  'Username already taken':    { field: 'username',   msg: 'That username is already taken' },
  'Account not found':         { field: 'identifier', msg: 'No account found with that email or username' },
  'Password is incorrect':     { field: 'password',   msg: 'Password is incorrect' },
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '', displayName: '', email: '',
    password: '', confirmPassword: '', biography: '',
  });

  const clearField = (field) =>
    setFieldErrors((p) => { const n = { ...p }; delete n[field]; return n; });

  const handleLoginChange = (e) => {
    setLoginForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    clearField(e.target.name);
  };

  const handleRegisterChange = (e) => {
    setRegisterForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    clearField(e.target.name);
  };

  // Parse server error response into { field: msg } object
  const parseServerErrors = (err) => {
    const data = err.response?.data;
    if (!data) return { _general: 'Something went wrong. Try again.' };

    // Validation errors array from express-validator
    if (data.errors?.length) {
      const mapped = {};
      data.errors.forEach(({ message }) => {
        const entry = SERVER_MSG[message];
        if (entry) mapped[entry.field] = entry.msg;
        else mapped['_general'] = message;
      });
      return mapped;
    }

    // Single message from controller
    const entry = CTRL_MSG[data.message];
    if (entry) return { [entry.field]: entry.msg };

    return { _general: data.message || 'Something went wrong. Try again.' };
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!loginForm.identifier.trim()) errs.identifier = 'Enter your email or username';
    if (!loginForm.password) errs.password = 'Enter your password';
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    setFieldErrors({});
    try {
      const { data } = await apiClient.post('/auth/login', loginForm);
      login(data);
      navigate('/home', { replace: true });
    } catch (err) {
      setFieldErrors(parseServerErrors(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!registerForm.username.trim()) errs.username = 'Username is required';
    if (!registerForm.displayName.trim()) errs.displayName = 'Display name is required';
    if (!EMAIL_RE.test(registerForm.email)) errs.email = 'Check your email address';
    if (registerForm.password.length < 8) errs.password = 'Password needs 8+ characters';
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(registerForm.password)) errs.password = 'Password needs letters and numbers';
    if (registerForm.password !== registerForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    setFieldErrors({});
    try {
      const { data } = await apiClient.post('/auth/register', {
        username: registerForm.username,
        displayName: registerForm.displayName,
        email: registerForm.email,
        password: registerForm.password,
        biography: registerForm.biography,
      });
      login(data);
      navigate('/home', { replace: true });
    } catch (err) {
      setFieldErrors(parseServerErrors(err));
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === 'register';
  const fe = fieldErrors;

  return (
    <div className="ap-page">

      {/* Left panel */}
      <div className="ap-left">
        <div className="ap-left-inner">
          <LogoMark height={56} />
          <h1 className="ap-left-title">
            Your next collab<br />starts here.
          </h1>
          <p className="ap-left-sub">
            Every creator needs a stage.<br />
            Every brand needs a voice.<br />
            NextGen is where you perform.
          </p>
          <button className="ap-back" onClick={() => navigate('/')}>
            ← Back to home
          </button>
        </div>
      </div>

      {/* Right form */}
      <div className="ap-right">
        <div className="ap-form-wrap">

          <div className="ap-tabs">
            <button className={mode === 'login' ? 'ap-tab active' : 'ap-tab'}
              onClick={() => { setMode('login'); setFieldErrors({}); }}>
              Log in
            </button>
            <button className={mode === 'register' ? 'ap-tab active' : 'ap-tab'}
              onClick={() => { setMode('register'); setFieldErrors({}); }}>
              Sign up
            </button>
          </div>

          <h2 className="ap-form-title">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="ap-form-sub">
            {isRegister ? 'Join NextGen and start collaborating.' : 'Sign in to continue to NextGen.'}
          </p>

          {fe._general && <div className="ap-error">{fe._general}</div>}

          {isRegister ? (
            <form onSubmit={handleRegisterSubmit} autoComplete="off" className="ap-form">
              <div className="ap-row">
                <Field label="Username" error={fe.username}>
                  <input name="username" type="text" value={registerForm.username}
                    onChange={handleRegisterChange} placeholder="e.g. regan_b"
                    className={fe.username ? 'ap-input-err' : ''} />
                </Field>
                <Field label="Display Name" error={fe.displayName}>
                  <input name="displayName" type="text" value={registerForm.displayName}
                    onChange={handleRegisterChange} placeholder="Your name"
                    className={fe.displayName ? 'ap-input-err' : ''} />
                </Field>
              </div>
              <Field label="Email" error={fe.email}>
                <input name="email" type="text" value={registerForm.email}
                  onChange={handleRegisterChange} placeholder="you@example.com"
                  className={fe.email ? 'ap-input-err' : ''} />
              </Field>
              <div className="ap-row">
                <Field label="Password" error={fe.password}>
                  <input name="password" type="password" value={registerForm.password}
                    onChange={handleRegisterChange} placeholder="8+ chars, letters & numbers"
                    className={fe.password ? 'ap-input-err' : ''} />
                </Field>
                <Field label="Confirm Password" error={fe.confirmPassword}>
                  <input name="confirmPassword" type="password" value={registerForm.confirmPassword}
                    onChange={handleRegisterChange} placeholder="Re-enter password"
                    className={fe.confirmPassword ? 'ap-input-err' : ''} />
                </Field>
              </div>
              <Field label={<>Bio <span className="ap-optional">(optional)</span></>}>
                <input name="biography" type="text" value={registerForm.biography}
                  onChange={handleRegisterChange} placeholder="Tell us about yourself" />
              </Field>
              <button type="submit" disabled={loading} className="ap-submit">
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} autoComplete="off" className="ap-form">
              <Field label="Email or Username" error={fe.identifier}>
                <input name="identifier" type="text" value={loginForm.identifier}
                  onChange={handleLoginChange} placeholder="you@example.com or username"
                  className={fe.identifier ? 'ap-input-err' : ''} />
              </Field>
              <Field label="Password" error={fe.password}>
                <input name="password" type="password" value={loginForm.password}
                  onChange={handleLoginChange} placeholder="Enter your password"
                  className={fe.password ? 'ap-input-err' : ''} />
              </Field>
              <button type="submit" disabled={loading} className="ap-submit">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="ap-field">
      <label>{label}</label>
      {children}
      {error && <span className="ap-field-error">{error}</span>}
    </div>
  );
}
