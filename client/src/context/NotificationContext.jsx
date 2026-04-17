import { createContext, useContext, useState, useEffect } from 'react';
import { getNotifications, markNotificationRead } from '../services/apiClient.js';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    getNotifications()
      .then(({ notifications }) => setNotifications(notifications || []))
      .catch(() => setNotifications([]));
  }, []);

  const unreadCount = notifications.filter(n => !(n.isRead || n.is_read)).length;

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {
      // silently fail
    }
  };

  const markAllAsRead = () => {
    notifications
      .filter(n => !(n.isRead || n.is_read))
      .forEach(n => markAsRead(n.id));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
