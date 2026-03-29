import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <button 
      className="btn-notification-bell"
      onClick={() => navigate('/notifications')}
      title={`${unreadCount} unread notifications`}
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount}</span>
      )}
    </button>
  );
}
