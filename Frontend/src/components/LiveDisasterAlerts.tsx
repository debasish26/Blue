import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, XCircle, Check } from 'lucide-react';

interface Notification {
  _id: string;
  subject: string;
  content: string;
  sentAt: string;
  type: 'weather' | 'task' | 'system';
  severity: 'low' | 'medium' | 'high' | 'info';
  isRead: boolean;
}

function LiveDisasterAlerts() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:5050/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://127.0.0.1:5050/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      setNotifications(prev =>
        prev.map(notif =>
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return '🌤️';
      case 'task':
        return '📝';
      default:
        return '📢';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 border-red-500/50';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500/50';
      case 'low':
        return 'bg-green-500/20 border-green-500/50';
      default:
        return 'bg-blue-500/20 border-blue-500/50';
    }
  };

  if (!localStorage.getItem('token')) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-blue-300 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h2>
        <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-500/20">
          <p className="text-gray-300">Please log in to view notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-blue-300 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Live Alerts
      </h2>

      {loading ? (
        <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-500/20">
          <p className="text-gray-300">Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-900/30 rounded-lg border border-red-500/20">
          <p className="text-red-300 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            {error}
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-500/20">
          <p className="text-gray-300">No notifications found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 rounded-lg border ${getSeverityColor(notification.severity)}
                transition-all duration-300 hover:scale-[1.02]
                ${notification.isRead ? 'opacity-75' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-white">{notification.subject}</h3>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-blue-400 hover:text-blue-300"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mt-1">{notification.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(notification.sentAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LiveDisasterAlerts;
