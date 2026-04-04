import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'nextgen-auth';

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : { token: null, user: null };
      // Set header synchronously so it's ready before first render
      if (parsed.token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${parsed.token}`;
      }
      return parsed;
    } catch (error) {
      console.warn('Failed to parse auth storage', error);
      return { token: null, user: null };
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
  }, [authState]);

  useEffect(() => {
    if (authState.token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${authState.token}`;
    } else {
      delete apiClient.defaults.headers.common.Authorization;
    }
  }, [authState.token]);

  const login = useCallback((payload) => {
    setAuthState(payload);
  }, []);

  const logout = useCallback(() => {
    setAuthState({ token: null, user: null });
  }, []);

  const value = useMemo(() => ({
    token: authState.token,
    user: authState.user,
    isAuthenticated: Boolean(authState.token),
    login,
    logout,
  }), [authState, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
