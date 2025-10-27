// Notification Context
// Real-time notification system for admin dashboard

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types/notifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Add notification to the list
  const addNotification = useCallback((notification: Notification) => {
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
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    
    // Update in database
    await notificationService.markAsRead(notificationId, 'admin');
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    
    // Update in database
    await notificationService.markAllAsRead('admin');
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    console.log('🔔 Setting up notification subscription...');
    
    try {
      const subId = notificationService.subscribeToNotifications('admin', (notification) => {
        console.log('📨 Received notification:', notification);
        addNotification(notification);
      });
      
      setSubscriptionId(subId);
      setIsConnected(true);
      console.log('✅ Notification subscription established');
    } catch (error) {
      console.error('❌ Failed to setup notification subscription:', error);
      setIsConnected(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionId) {
        notificationService.unsubscribeFromNotifications(subscriptionId);
        console.log('🔔 Notification subscription cleaned up');
      }
    };
  }, [addNotification, subscriptionId]);

  // Load initial notifications
  useEffect(() => {
    const loadInitialNotifications = async () => {
      try {
        const result = await notificationService.getNotifications('admin', { limit: 20 });
        if (result.success && result.data) {
          setNotifications(result.data);
        }
      } catch (error) {
        console.error('Failed to load initial notifications:', error);
      }
    };

    loadInitialNotifications();
  }, []);

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