import { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext(null);

const API = import.meta.env.VITE_API_BASE_URL ?? '/api';

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      verifyAdmin(token);
    } else {
      setLoading(false);
    }
  }, []);

  async function verifyAdmin(token) {
    try {
      const res = await fetch(`${API}/admin/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data.admin);
      } else {
        localStorage.removeItem('adminToken');
        setAdmin(null);
      }
    } catch {
      localStorage.removeItem('adminToken');
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(username, password) {
    setError('');
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Login failed');
      localStorage.setItem('adminToken', data.token);
      setAdmin(data.admin);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  function logout() {
    localStorage.removeItem('adminToken');
    setAdmin(null);
  }

  function getToken() {
    return localStorage.getItem('adminToken');
  }

  async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const res = await fetch(`${API}/admin${endpoint}`, {
      cache: 'no-store',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      }
    });
    if (res.status === 401) {
      logout();
      throw new Error('Session expired');
    }
    return res;
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, error, login, logout, apiFetch }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
