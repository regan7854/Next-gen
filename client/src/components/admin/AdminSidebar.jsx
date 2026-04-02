import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Handshake, Link2, Tag,
  Bell, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import LogoMark from '../LogoMark.jsx';
import { useState } from 'react';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Manage Users', icon: Users },
  { path: '/admin/collaborations', label: 'Collaborations', icon: Handshake },
  { path: '/admin/connections', label: 'Connections', icon: Link2 },
  { path: '/admin/categories', label: 'Categories', icon: Tag },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const { logout } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`admin-sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-brand">
          <LogoMark size={28} />
          {!collapsed && <span>NextGen <small>Admin</small></span>}
        </div>
        <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)} title="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
            title={label}
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button className="admin-nav-item admin-logout-btn" onClick={logout} title="Log out">
          <LogOut size={18} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
