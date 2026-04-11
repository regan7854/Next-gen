import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, Handshake, TrendingUp, Users, Star, CheckCircle } from 'lucide-react';

export default function NotificationItem({ notification, onMarkAsRead, onDelete }) {
  const navigate = useNavigate();
  const getIcon = (type) => {
    const iconProps = { size: 20, strokeWidth: 1.5 };
    switch (type) {
      case 'message':    return <MessageSquare {...iconProps} />;
      case 'collab':
      case 'handshake':  return <Handshake {...iconProps} />;
      case 'trending':   return <TrendingUp {...iconProps} />;
      case 'user':       return <Users {...iconProps} />;
      case 'star':
      case 'review':     return <Star {...iconProps} />;
      case 'check':
      case 'accepted':   return <CheckCircle {...iconProps} />;
      default:           return <MessageSquare {...iconProps} />;
    }
  };

  const getTimeAgo = (date) => {
    const parsed = new Date(date);
    if (!date || isNaN(parsed.getTime())) return '—';
    const diff = Date.now() - parsed;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const isRead = notification.is_read;

  const isCollabNotif = ['collab_request', 'collab_response'].includes(notification.type);

  const handleClick = () => {
    if (isCollabNotif) {
      if (!isRead) onMarkAsRead(notification.id);
      navigate('/collaborations');
    }
  };

  return (
    <div
      className={`notification-item ${isRead ? 'read' : 'unread'}`}
      style={{ cursor: isCollabNotif ? 'pointer' : undefined }}
      onClick={handleClick}
    >
      <div className="notification-icon">
        {getIcon(notification.type)}
      </div>

      <div className="notification-content">
        <h4 className="notification-title">{notification.title}</h4>
        <p className="notification-description">{notification.body}</p>
        <span className="notification-time">{getTimeAgo(notification.created_at)}</span>
      </div>

      <div className="notification-actions">
        {!isRead && (
          <button
            className="btn-mark-read"
            onClick={() => onMarkAsRead(notification.id)}
            title="Mark as read"
          >
            •
          </button>
        )}
        <button
          className="btn-delete"
          onClick={() => onDelete(notification.id)}
          title="Delete"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
