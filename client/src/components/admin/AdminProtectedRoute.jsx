import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';

export default function AdminProtectedRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return children;
}
