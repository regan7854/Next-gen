import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiClient } from '../services/apiClient.js';
import AuthCard from '../components/AuthCard.jsx';
import LogoMark from '../components/LogoMark.jsx';
import { Handshake, BarChart3, Zap } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    biography: '',
  });

  const handleLoginChange = (e) => {
    setLoginForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', loginForm);
      login(data);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
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
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left hero panel */}
      <div className="auth-hero">
        <div className="auth-hero-content">
          <LogoMark size={56} />
          <h1>NextGen<br />Collaborate</h1>
          <p>
            Smart influencer-brand matchmaking crafted for Nepal&apos;s creator economy.
            Connect, collaborate, and grow together.
          </p>
          <div className="hero-features">
            <div className="hero-feature">
              <span className="feature-icon"><Handshake size={18} /></span>
              <span>Find perfect brand partners</span>
            </div>
            <div className="hero-feature">
              <span className="feature-icon"><BarChart3 size={18} /></span>
              <span>Track campaign performance</span>
            </div>
            <div className="hero-feature">
              <span className="feature-icon"><Zap size={18} /></span>
              <span>Streamlined collaboration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right auth form */}
      <div className="auth-form-area">
        <AuthCard
          mode={mode}
          onModeChange={setMode}
          loginForm={loginForm}
          registerForm={registerForm}
          onLoginChange={handleLoginChange}
          onRegisterChange={handleRegisterChange}
          onLoginSubmit={handleLoginSubmit}
          onRegisterSubmit={handleRegisterSubmit}
          loading={loading}
          error={error}
        />
        <p className="auth-footer">&copy; 2026 NextGen Collaborate</p>
      </div>
    </div>
  );
}
