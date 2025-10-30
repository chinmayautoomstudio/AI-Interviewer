// Notification Context
// Real-time notification system for admin dashboard

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const subscriptionRef = useRef<string | null>(null);
  
  // Admin user UUID for user-scoped notifications; falls back to global-only if missing/invalid
  const ADMIN_USER_ID = '09cca328-e054-4eae-ac08-59ef364de163';

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
    await notificationService.markAsRead(notificationId, ADMIN_USER_ID);
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    
    // Update in database
    await notificationService.markAllAsRead(ADMIN_USER_ID);
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    console.log('🔔 Setting up notification subscription...');
    try {
      if (!subscriptionRef.current) {
        const subId = notificationService.subscribeToNotifications(ADMIN_USER_ID, (notification) => {
          console.log('📨 Received notification:', notification);
          addNotification(notification);
        });
        subscriptionRef.current = subId;
        setIsConnected(true);
        console.log('✅ Notification subscription established');
      }
    } catch (error) {
      console.error('❌ Failed to setup notification subscription:', error);
      setIsConnected(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        notificationService.unsubscribeFromNotifications(subscriptionRef.current);
        subscriptionRef.current = null;
        console.log('🔔 Notification subscription cleaned up');
      }
    };
  }, [addNotification]);

  // Load initial notifications
  useEffect(() => {
    const loadInitialNotifications = async () => {
      try {
        const result = await notificationService.getNotifications(ADMIN_USER_ID, { limit: 20 });
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