import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, InterviewNotification, NotificationSubscription } from '../services/notificationService';

interface NotificationContextType {
  notifications: InterviewNotification[];
  unreadCount: number;
  addNotification: (notification: InterviewNotification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<InterviewNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [subscription, setSubscription] = useState<NotificationSubscription | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Add notification to the list
  const addNotification = useCallback((notification: InterviewNotification) => {
    setNotifications(prev => {
      // Check if notification already exists (prevent duplicates)
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        return prev;
      }
      
      // Add new notification at the beginning
      return [notification, ...prev].slice(0, 50); // Keep only last 50 notifications
    });
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    
    // Update in database (if notifications table exists)
    await notificationService.markNotificationAsRead(notificationId);
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    console.log('🔔 Setting up notification subscription...');
    
    const subscription = notificationService.subscribeToInterviewNotifications(
      (notification) => {
        console.log('🔔 Received notification:', notification);
        addNotification(notification);
      }
    );

    setSubscription(subscription);
    setIsConnected(true);

    // Load recent notifications
    const loadRecentNotifications = async () => {
      try {
        const recent = await notificationService.getRecentNotifications(10);
        setNotifications(recent);
      } catch (error) {
        console.error('Error loading recent notifications:', error);
      }
    };

    loadRecentNotifications();

    return () => {
      console.log('🔔 Cleaning up notification subscription...');
      subscription.unsubscribe();
      setIsConnected(false);
    };
  }, [addNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [subscription]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    isConnected
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
