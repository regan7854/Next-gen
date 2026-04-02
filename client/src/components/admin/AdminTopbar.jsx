import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { Shield, LogOut } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const pageTitles = {
  '/admin/dashboard': 'Dashboard Overview',
  '/admin/users': 'Manage Users',
  '/admin/collaborations': 'Manage Collaborations',
  '/admin/connections': 'Manage Connections',
  '/admin/categories': 'Manage Categories',
  '/admin/notifications': 'Manage Notifications',
  '/admin/reports': 'Reports & Analytics',
  '/admin/settings': 'Settings',
};

export default function AdminTopbar() {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Admin Panel';

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <h1 className="admin-topbar-title">{title}</h1>
      </div>
      <div className="admin-topbar-right">
        <Link to="/" className="admin-view-site-btn" target="_blank">
          View Site
        </Link>
        <div className="admin-topbar-user">
          <div className="admin-topbar-avatar">
            <Shield size={16} />
          </div>
          <div className="admin-topbar-info">
            <span className="admin-topbar-name">{admin?.username || 'Admin'}</span>
            <span className="admin-topbar-role">{admin?.role || 'Administrator'}</span>
          </div>
        </div>
        <button className="admin-topbar-logout" onClick={logout} title="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
