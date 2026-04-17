import { useNotifications } from '../context/NotificationContext.jsx';
import NotificationItem from '../components/NotificationItem.jsx';
import { Bell, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const unreadCount = notifications.filter(n => !(n.isRead || n.is_read)).length;

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <div className="notifications-header-content">
          <h1 className="notifications-page-title">
            <Bell size={32} />
            Notifications
          </h1>
          <p className="notifications-page-subtitle">
            {notifications.length} total
            {unreadCount > 0 && ` • ${unreadCount} unread`}
          </p>
        </div>

        {unreadCount > 0 && (
          <div className="notifications-actions">
            <button
              className="btn-secondary"
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        ) : (
          <div className="notifications-empty">
            <Bell size={64} />
            <h2>No notifications</h2>
            <p>You're all caught up! Check back later for updates</p>
          </div>
        )}
      </div>
    </div>
  );
}
