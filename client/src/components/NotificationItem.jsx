import { X, MessageSquare, Handshake, TrendingUp, Users, Star, CheckCircle } from 'lucide-react';

export default function NotificationItem({ notification, onMarkAsRead, onDelete }) {
  const getIcon = (iconType) => {
    const iconProps = { size: 20, strokeWidth: 1.5 };
    switch (iconType) {
      case 'message':
        return <MessageSquare {...iconProps} />;
      case 'handshake':
        return <Handshake {...iconProps} />;
      case 'trending':
        return <TrendingUp {...iconProps} />;
      case 'user':
        return <Users {...iconProps} />;
      case 'star':
        return <Star {...iconProps} />;
      case 'check':
        return <CheckCircle {...iconProps} />;
      default:
        return <MessageSquare {...iconProps} />;
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
      <div className="notification-icon">
        {getIcon(notification.icon)}
      </div>
      
      <div className="notification-content">
        <h4 className="notification-title">{notification.title}</h4>
        <p className="notification-description">{notification.description}</p>
        <span className="notification-time">{getTimeAgo(notification.timestamp)}</span>
      </div>

      <div className="notification-actions">
        {!notification.read && (
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
