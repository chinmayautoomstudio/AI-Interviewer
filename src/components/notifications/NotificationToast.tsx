// Notification Toast Component
// Real-time toast notifications for immediate alerts

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock, 
  Timer,
  UserPlus
} from 'lucide-react';
import { Notification, NotificationType } from '../../types/notifications';
import { notificationService } from '../../services/notificationService';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ 
  notification, 
  onClose, 
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Get notification icon and color
  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case 'exam_started':
        return {
          icon: <Timer className="h-5 w-5" />,
          bgColor: 'bg-blue-500',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-800'
        };
      case 'exam_completed':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          bgColor: 'bg-green-500',
          borderColor: 'border-green-500',
          textColor: 'text-green-800'
        };
      case 'exam_expired':
        return {
          icon: <Clock className="h-5 w-5" />,
          bgColor: 'bg-orange-500',
          borderColor: 'border-orange-500',
          textColor: 'text-orange-800'
        };
      case 'exam_terminated':
        return {
          icon: <X className="h-5 w-5" />,
          bgColor: 'bg-red-500',
          borderColor: 'border-red-500',
          textColor: 'text-red-800'
        };
      case 'candidate_registered':
        return {
          icon: <UserPlus className="h-5 w-5" />,
          bgColor: 'bg-purple-500',
          borderColor: 'border-purple-500',
          textColor: 'text-purple-800'
        };
      case 'system_alert':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          bgColor: 'bg-yellow-500',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-800'
        };
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          bgColor: 'bg-gray-500',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-800'
        };
    }
  };

  const style = getNotificationStyle(notification.type);

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${style.borderColor} transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${style.textColor}`}>
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(notification.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Notification Toast Manager
interface NotificationToastManagerProps {
  userId: string;
}

export const NotificationToastManager: React.FC<NotificationToastManagerProps> = ({ userId }) => {
  const [toasts, setToasts] = useState<Notification[]>([]);

  useEffect(() => {
    const subscriptionId = notificationService.subscribeToNotifications(userId, (notification) => {
      // Only show toast for important notifications
      const importantTypes: NotificationType[] = [
        'exam_started',
        'exam_completed',
        'exam_expired',
        'exam_terminated',
        'candidate_registered',
        'system_alert'
      ];

      if (importantTypes.includes(notification.type)) {
        setToasts(prev => [...prev, notification]);
      }
    });

    return () => {
      notificationService.unsubscribeFromNotifications(subscriptionId);
    };
  }, [userId]);

  const removeToast = (notificationId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== notificationId));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          notification={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default NotificationToast;
