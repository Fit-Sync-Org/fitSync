import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../../src/api/notifications';
import './NotificationCenter.css';

export default function NotificationCenter({ compact = false, onClose }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [filterType, showUnreadOnly]);

  const fetchNotifications = async () => {
    setLoading(true);
    const result = await notificationsAPI.getNotifications(1, compact ? 5 : 20);
    if (result.success) {
      const notifications = result.data.notifications || [];
      setNotifications(notifications);

      // Calculate stats from notifications data
      const unreadCount = notifications.filter(n => !n.isRead).length;
      setStats({ unreadCount });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    const result = await notificationsAPI.markAsRead(notificationId);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
      // Recalculate stats after marking as read
      const unreadCount = notifications.filter(n => !n.isRead).length - 1;
      setStats({ unreadCount: Math.max(0, unreadCount) });
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await notificationsAPI.markAllAsRead(
      filterType === 'all' ? undefined : filterType,
    );
    if (result.success) {
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
      // Recalculate stats after marking all as read
      setStats({ unreadCount: 0 });
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    const result = await notificationsAPI.deleteNotification(notificationId);
    if (result.success) {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId),
      );
      // Recalculate stats after deletion
      const remainingNotifications = notifications.filter(n => n.id !== notificationId);
      const unreadCount = remainingNotifications.filter(n => !n.isRead).length;
      setStats({ unreadCount });
    }
  };

  const filterTypes = [
    { value: 'all', label: 'All', icon: 'ALL' },
    { value: 'PLAN_READY', label: 'Plan Ready', icon: 'PLN' },
    { value: 'PROGRESS_ALERT', label: 'Progress', icon: 'PRG' },
    { value: 'MILESTONE', label: 'Milestones', icon: 'MST' },
    { value: 'WEEKLY_SUMMARY', label: 'Weekly', icon: 'WKY' },
  ];

  if (loading) {
    return (
      <div className={`notification-center ${compact ? 'compact' : ''}`}>
        <div className="notification-loading">
          <div className="loading-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`notification-center ${compact ? 'compact' : ''}`}>
        <div className="notification-error">
          <div className="error-icon"></div>
          <p>Failed to load notifications</p>
          <button onClick={fetchNotifications} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="notification-center compact">
        <div className="notification-header">
          <h3>Recent Notifications</h3>
          <div className="notification-badge">{stats.unreadCount || 0}</div>
        </div>
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <div className="no-notifications-icon"></div>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="notification-list compact">
            {notifications.slice(0, 3).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteNotification}
                compact={true}
              />
            ))}
            {notifications.length > 3 && (
              <div className="more-notifications">
                <button
                  className="view-all-btn"
                  onClick={() => (window.location.href = '/notifications')}
                >
                  View All ({notifications.length - 3} more)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Group notifications by date
  const groupNotificationsByDate = (notifications) => {
    const groups = {};
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString();
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });
    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <div className="notification-center full">
      <div className="notification-header">
        <div className="header-left">
          <button
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h2>Notifications</h2>
          <div className="notification-stats">
            <span className="total-count">{notifications.length} total</span>
            {stats.unreadCount > 0 && (
              <span className="unread-count">{stats.unreadCount} unread</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          {stats.unreadCount > 0 && (
            <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
              Mark All Read
            </button>
          )}
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              CLOSE
            </button>
          )}
        </div>
      </div>
      <div className="notification-filters">
        <div className="filter-tabs">
          {filterTypes.map((filter) => (
            <button
              key={filter.value}
              className={`filter-tab ${
                filterType === filter.value ? 'active' : ''
              }`}
              onClick={() => setFilterType(filter.value)}
            >
              <span className="filter-icon">{filter.icon}</span>
              <span className="filter-label">{filter.label}</span>
            </button>
          ))}
        </div>
        <div className="filter-options">
          <label className="unread-toggle">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
            />
            <span>Unread only</span>
          </label>
        </div>
      </div>
      <div className="notification-content">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <div className="no-notifications-icon"></div>
            <h3>No notifications found</h3>
            <p>
              {showUnreadOnly
                ? "You're all caught up! No unread notifications."
                : filterType === 'all'
                  ? "No notifications yet. We'll notify you about your progress and milestones."
                  : `No ${filterType.toLowerCase()} notifications found.`}
            </p>
          </div>
        ) : (
          <div className="notification-groups">
            {Object.entries(groupedNotifications).map(
              ([date, dateNotifications]) => (
                <div key={date} className="notification-group">
                  <h4 className="group-date">{date}</h4>
                  <div className="notification-list">
                    {dateNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDeleteNotification}
                        compact={false}
                      />
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(notification.id);
    setIsDeleting(false);
  };

  const handleMarkAsRead = async () => {
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`notification-item ${
        notification.isRead ? 'read' : 'unread'
      } ${compact ? 'compact' : ''}`}
      onClick={handleMarkAsRead}
    >
      <div className="notification-icon">
        {notification.icon || 'NOT'}
      </div>
      <div className="notification-content-text">
        <div className="notification-header-text">
          <h4 className="notification-title">{notification.title}</h4>
          <span className="notification-time">{notification.timeAgo}</span>
        </div>
        <p className="notification-message">{notification.message}</p>
        {notification.type === 'PROGRESS_ALERT' && (
          <div className="progress-alert-details">
            <span className="alert-badge">Action Required</span>
          </div>
        )}
        {notification.type === 'MILESTONE' && (
          <div className="milestone-details">
            <span className="milestone-badge">Achievement</span>
          </div>
        )}
      </div>
      {!compact && (
        <div className="notification-actions">
          {!notification.isRead && (
            <button
              className="mark-read-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead();
              }}
              title="Mark as read"
            >
              READ
            </button>
          )}
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting}
            title="Delete notification"
          >
            {isDeleting ? '...' : 'DEL'}
          </button>
        </div>
      )}
    </div>
  );
}
