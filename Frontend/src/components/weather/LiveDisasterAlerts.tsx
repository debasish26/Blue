import React, { useEffect, useState } from 'react';
import { AlertTriangle, Globe, LogIn, Bell, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface DisasterAlert {
  id: string;
  type: string;
  severity: string;
  location: string;
  description: string;
  source: string;
  date: string;
  isNearby: boolean;
}

interface UserNotification {
  _id: string;
  type: string;
  severity: string;
  location: string;
  description: string;
  source: string;
  isRead: boolean;
  sentAt: string;
  title: string;
  icon?: string;
}

const userLocation = "India"; // Change this dynamically if needed

const LiveDisasterAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    if (token) {
      const fetchUserNotifications = async () => {
        try {
          setLoading(true);
          const response = await axios.get('http://localhost:5050/api/user/notifications', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          // Extract the 'notifications' array from response.data
          setUserNotifications(response.data.notifications || []);
        } catch (error) {
          console.error('Error fetching user notifications:', error);
          setUserNotifications([]); // Fallback to empty array on error
        } finally {
          setLoading(false);
        }
      };

      fetchUserNotifications();
      const notificationInterval = setInterval(fetchUserNotifications, 300000); // 5 minutes
      return () => clearInterval(notificationInterval);
    } else {
      setLoading(false); // If not authenticated, stop loading
    }
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('https://api.reliefweb.int/v1/reports?appname=yourappname&limit=10&profile=full');
        const data = await response.json();

        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const transformedAlerts = data.data
          .map((alert: any) => {
            const alertDate = new Date(alert.fields.date.created);
            return {
              id: alert.id,
              type: alert.fields.primary_type || 'General Alert',
              severity: alert.fields.severity || 'Moderate',
              location: alert.fields.country?.[0]?.name || 'Unknown',
              description: alert.fields.body.slice(0, 200) + '...',
              source: alert.fields.source?.[0]?.name || 'ReliefWeb',
              date: alertDate.toLocaleDateString(),
              isNearby: alert.fields.country?.[0]?.name === userLocation,
            };
          })
          .filter((alert: DisasterAlert) => new Date(alert.date) >= thirtyDaysAgo);

        setAlerts(transformedAlerts);
      } catch (error) {
        console.error('Error fetching disaster alerts:', error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5050/api/user/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUserNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-500/20 text-red-300';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'low':
        return 'bg-green-500/20 text-green-300';
      default:
        return 'bg-blue-500/20 text-blue-300';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'weather':
        return '🌦️';
      case 'flood':
        return '🌊';
      case 'earthquake':
        return '🌍';
      case 'cyclone':
        return '🌪️';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <Bell className="w-6 h-6 text-blue-400" />
            ) : (
              <Globe className="w-6 h-6 text-red-400" />
            )}
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {isAuthenticated ? 'Your Notifications' : 'Live Disaster Alerts'}
            </h2>
          </div>
          {!isAuthenticated && (
            <Link
              to="/auth"
              className="flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg text-blue-300 transition-all duration-300"
            >
              <LogIn className="w-4 h-4" />
              <span>Login for Notifications</span>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {isAuthenticated ? (
              userNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No notifications yet</p>
                </div>
              ) : (
                userNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`group relative bg-gray-800/50 rounded-xl p-5 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer ${
                      !notification.isRead ? 'border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => markAsRead(notification._id)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">{notification.title || notification.type}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs ${getSeverityColor(notification.severity)}`}>
                            {notification.severity}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{notification.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Globe className="w-3 h-3 mr-1" />
                              {notification.location}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}
                            </span>
                          </div>
                          {notification.isRead && (
                            <span className="flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1 text-green-400" />
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))    
              )
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-black/20 rounded-lg p-4 ${
                    alert.isNearby ? 'border-red-500 border' : 'border-yellow-500 border'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">{alert.type}</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      alert.isNearby ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {alert.isNearby ? 'Nearby Alert' : alert.severity + ' Risk'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{alert.description}</p>
                  <div className="text-sm text-gray-400">
                    <p>Location: {alert.location}</p>
                    <p>Date: {alert.date}</p>
                    <p>Source: {alert.source}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDisasterAlerts;
