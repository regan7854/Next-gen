import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LogoMark from './LogoMark.jsx';
import NotificationBell from './NotificationBell.jsx';
import Footer from './Footer.jsx';
import { LayoutDashboard, Compass, Handshake, LogOut, TrendingUp } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const initial = user?.displayName?.[0]?.toUpperCase() || '?';

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar-inner">
          <NavLink to="/home" className="navbar-brand">
            <LogoMark height={72} />
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
              <span className="nav-label">Collaborations</span>
            </NavLink>
          </nav>

          <div className="navbar-right">
            <NotificationBell />
            
            <button type="button" className="btn-logout-nav" onClick={logout}>
              <LogOut size={14} />
              Log out
            </button>

            <Link to="/profile" title="My Profile">
              <div className="nav-avatar">
                {initial}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}