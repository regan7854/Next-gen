import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import LogoMark from './LogoMark.jsx';
import { LayoutDashboard, Compass, Handshake, User, LogOut, TrendingUp, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const initial = user?.displayName?.[0]?.toUpperCase() || '?';

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar-inner">
          <NavLink to="/home" className="navbar-brand">
            <LogoMark size={30} />
            <span>NextGen</span>
          </NavLink>

          <nav className="navbar-links">
            <NavLink to="/home" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
              <LayoutDashboard size={16} />
              <span className="nav-label">Dashboard</span>
            </NavLink>
            <NavLink to="/discover" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Compass size={16} />
              <span className="nav-label">Discover</span>
            </NavLink>
            <NavLink to="/trending" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <TrendingUp size={16} />
              <span className="nav-label">Trending</span>
            </NavLink>
            <NavLink to="/collaborations" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Handshake size={16} />
              <span className="nav-label">Collabs</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <User size={16} />
              <span className="nav-label">Profile</span>
            </NavLink>
          </nav>

          <div className="navbar-right">
            <button type="button" className="btn-logout-nav" onClick={logout}>
              <LogOut size={14} />
              Log out
            </button>

            <div className="theme-toggle" onClick={toggle} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              <Sun size={13} className="theme-icon sun" />
              <div className={`theme-track${dark ? ' dark' : ''}`}>
                <div className="theme-thumb" />
              </div>
              <Moon size={13} className="theme-icon moon" />
            </div>

            <div className="nav-avatar">
              {initial}
            </div>
          </div>
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
