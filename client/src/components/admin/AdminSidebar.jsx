import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Handshake, Link2,
  Settings, LogOut
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import LogoMark from '../LogoMark.jsx';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Manage Users', icon: Users },
  { path: '/admin/collaborations', label: 'Collaborations', icon: Handshake },
  { path: '/admin/connections', label: 'Connections', icon: Link2 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const { logout } = useAdminAuth();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-brand">
          <LogoMark height={60} />
          <small>Admin</small>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button className="admin-nav-item admin-logout-btn" onClick={logout}>
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
