// Notification Bell Component
// Real-time notification system for admin dashboard

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Trash2,
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  UserPlus
} from 'lucide-react';
import { Notification, NotificationType, NotificationStats } from '../../types/notifications';
import { notificationService } from '../../services/notificationService';

interface NotificationBellProps {
  userId: string;
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId, className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications and stats
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [notificationsResult, statsResult] = await Promise.all([
        notificationService.getNotifications(userId, { limit: 20 }),
        notificationService.getNotificationStats(userId)
      ]);

      if (notificationsResult.success) {
        setNotifications(notificationsResult.data || []);
      } else {
        setError(notificationsResult.error || 'Failed to load notifications');
      }

      if (statsResult.success) {
        setStats(statsResult.data || null);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Subscribe to real-time notifications
  useEffect(() => {
    loadNotifications();

    const subscriptionId = notificationService.subscribeToNotifications(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Update stats
      setStats(prev => {
        if (!prev) return null;
        return {
          ...prev,
          total: prev.total + 1,
          unread: prev.unread + 1,
          byType: {
            ...prev.byType,
            [notification.type]: (prev.byType[notification.type] || 0) + 1
          }
        };
      });
    });

    return () => {
      notificationService.unsubscribeFromNotifications(subscriptionId);
    };
  }, [userId, loadNotifications]);

  // Handle notification actions
  const handleMarkAsRead = async (notificationId: string) => {
    const result = await notificationService.markAsRead(notificationId, userId);
    if (result.success) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null);
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await notificationService.markAllAsRead(userId);
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setStats(prev => prev ? { ...prev, unread: 0 } : null);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const result = await notificationService.deleteNotification(notificationId, userId);
    if (result.success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setStats(prev => prev ? { ...prev, total: Math.max(0, prev.total - 1) } : null);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'exam_started':
        return <Timer className="h-4 w-4 text-blue-600" />;
      case 'exam_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'exam_expired':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'exam_terminated':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'candidate_registered':
        return <UserPlus className="h-4 w-4 text-purple-600" />;
      case 'system_alert':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get notification color
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'exam_started':
        return 'border-l-blue-500 bg-blue-50';
      case 'exam_completed':
        return 'border-l-green-500 bg-green-50';
      case 'exam_expired':
        return 'border-l-orange-500 bg-orange-50';
      case 'exam_terminated':
        return 'border-l-red-500 bg-red-50';
      case 'candidate_registered':
        return 'border-l-purple-500 bg-purple-50';
      case 'system_alert':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const unreadCount = stats?.unread || 0;

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8 text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mb-2" />
                <span>No notifications yet</span>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                      !notification.isRead ? 'bg-opacity-100' : 'bg-opacity-50'
                    } hover:bg-opacity-100 transition-colors`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 ${
                              !notification.isRead ? 'text-gray-800' : 'text-gray-600'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={loadNotifications}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
