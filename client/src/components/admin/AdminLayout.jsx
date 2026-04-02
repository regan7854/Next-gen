import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';
import AdminTopbar from './AdminTopbar.jsx';

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminTopbar />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
