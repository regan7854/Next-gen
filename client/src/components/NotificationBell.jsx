import { useEffect, useRef, useState } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Handshake, Star, CheckCircle, Megaphone } from 'lucide-react';

function getIcon(type) {
  const p = { size: 16, strokeWidth: 1.5 };
  switch (type) {
    case 'collab_request':
    case 'collab_response': return <Handshake {...p} />;
    case 'negotiation':     return <MessageSquare {...p} />;
    case 'review':          return <Star {...p} />;
    case 'accepted':        return <CheckCircle {...p} />;
    case 'admin_broadcast': return <Megaphone {...p} />;
    default:                return <Bell {...p} />;
  }
}

function getRoute(notification) {
  const type = notification.type;
  if (['collab_request', 'collab_response', 'negotiation'].includes(type)) return '/collaborations';
  if (type === 'review') return notification.related_id ? `/profile/${notification.related_id}` : '/profile';
  return null;
}

function timeAgo(date) {
  const parsed = new Date(date);
  if (!date || isNaN(parsed.getTime())) return '—';
  const diff = Date.now() - parsed;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleNotifClick(n) {
    if (!(n.isRead || n.is_read)) markAsRead(n.id);
    const route = getRoute(n);
    if (route) navigate(route);
    setOpen(false);
  }

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button
        className="btn-notification-bell"
        onClick={() => setOpen((o) => !o)}
        title={`${unreadCount} unread notifications`}
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-dropdown-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No notifications yet</div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`notif-dropdown-item ${(n.isRead || n.is_read) ? 'read' : 'unread'}`}
                  onClick={() => handleNotifClick(n)}
                >
                  <div className="notif-item-icon">{getIcon(n.type)}</div>
                  <div className="notif-item-body">
                    <p className="notif-item-title">{n.title}</p>
                    {n.body && <p className="notif-item-desc">{n.body}</p>}
                    <span className="notif-item-time">{timeAgo(n.created_at)}</span>
                  </div>
                  <button
                    className="notif-item-delete"
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    title="Dismiss"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
