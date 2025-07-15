import { useState, useEffect } from "react";
import { notificationsAPI } from "../../src/api/notifications";
import "./NotificationBell.css";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const result = await notificationsAPI.getNotifications(1, 10);
      if (result.success) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const result = await notificationsAPI.markAsRead(notificationId);
      if (result.success) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const result = await notificationsAPI.markAllAsRead();
      if (result.success) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'PLAN_READY':
        return '📋';
      case 'PLAN_FAILED':
        return 'X';
      case 'PROGRESS_ALERT':
        return '📊';
      case 'MILESTONE':
        return '🎉';
      case 'WEEKLY_SUMMARY':
        return '📈';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="notification-overlay"
            onClick={() => setShowDropdown(false)}
          />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={markAllAsRead}
                  disabled={loading}
                >
                  {loading ? 'Marking...' : 'Mark all read'}
                </button>
              )}
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <span className="no-notif-icon">🔕</span>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.title}
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="unread-indicator" />
                    )}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notification-footer">
                <button
                  className="view-all-btn"
                  onClick={() => {
                    setShowDropdown(false);
                    window.location.href = '/notifications';
                  }}
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
