// Notification Service
// Real-time notification system for admin dashboard using Supabase

import { supabase } from './supabase';
import { 
  Notification, 
  NotificationType, 
  CreateNotificationRequest, 
  NotificationFilter, 
  NotificationStats,
  ExamNotificationData,
  CandidateNotificationData,
  SystemNotificationData
} from '../types/notifications';

export class NotificationService {
  private static instance: NotificationService;
  private subscribers: Map<string, (notification: Notification) => void> = new Map();
  private realtimeSubscription: any = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create a new notification
   */
  async createNotification(request: CreateNotificationRequest): Promise<{ success: boolean; data?: Notification; error?: string }> {
    try {
      const notificationData = {
        type: request.type,
        title: request.title,
        message: request.message,
        data: request.data || null,
        is_read: false,
        user_id: request.userId || null, // null means all admins
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: this.transformNotification(data) };
    } catch (error) {
      console.error('Error in createNotification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, filter?: NotificationFilter): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${userId}`) // Get notifications for all admins or specific user
        .order('created_at', { ascending: false });

      if (filter) {
        if (filter.type) {
          query = query.eq('type', filter.type);
        }
        if (filter.isRead !== undefined) {
          query = query.eq('is_read', filter.isRead);
        }
        if (filter.dateFrom) {
          query = query.gte('created_at', filter.dateFrom);
        }
        if (filter.dateTo) {
          query = query.lte('created_at', filter.dateTo);
        }
        if (filter.limit) {
          query = query.limit(filter.limit);
        }
        if (filter.offset) {
          query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, error: error.message };
      }

      const notifications = data?.map(n => this.transformNotification(n)) || [];
      return { success: true, data: notifications };
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .or(`user_id.is.null,user_id.eq.${userId}`);

      if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          updated_at: new Date().toISOString() 
        })
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .or(`user_id.is.null,user_id.eq.${userId}`);

      if (error) {
        console.error('Error deleting notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string): Promise<{ success: boolean; data?: NotificationStats; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, is_read, created_at')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) {
        console.error('Error fetching notification stats:', error);
        return { success: false, error: error.message };
      }

      const stats: NotificationStats = {
        total: data?.length || 0,
        unread: data?.filter(n => !n.is_read).length || 0,
        byType: {} as Record<NotificationType, number>,
        recentActivity: {
          examStarted: 0,
          examCompleted: 0,
          examExpired: 0,
          examTerminated: 0
        }
      };

      // Count by type
      data?.forEach(notification => {
        const type = notification.type as NotificationType;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
        
        // Count recent activity
        if (type === 'exam_started') stats.recentActivity.examStarted++;
        else if (type === 'exam_completed') stats.recentActivity.examCompleted++;
        else if (type === 'exam_expired') stats.recentActivity.examExpired++;
        else if (type === 'exam_terminated') stats.recentActivity.examTerminated++;
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error in getNotificationStats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void): string {
    const subscriptionId = `notification_${userId}_${Date.now()}`;
    this.subscribers.set(subscriptionId, callback);

    // Set up real-time subscription if not already active
    if (!this.realtimeSubscription) {
      this.realtimeSubscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `or(user_id.is.null,user_id.eq.${userId})`
          }, 
          (payload) => {
            const notification = this.transformNotification(payload.new);
            this.notifySubscribers(notification);
          }
        )
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'notifications',
            filter: `or(user_id.is.null,user_id.eq.${userId})`
          }, 
          (payload) => {
            const notification = this.transformNotification(payload.new);
            this.notifySubscribers(notification);
          }
        )
        .subscribe();
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications(subscriptionId: string): void {
    this.subscribers.delete(subscriptionId);
    
    // If no more subscribers, unsubscribe from real-time
    if (this.subscribers.size === 0 && this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(notification: Notification): void {
    this.subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  /**
   * Transform database notification to app notification
   */
  private transformNotification(dbNotification: any): Notification {
    return {
      id: dbNotification.id,
      type: dbNotification.type,
      title: dbNotification.title,
      message: dbNotification.message,
      data: dbNotification.data,
      isRead: dbNotification.is_read,
      createdAt: dbNotification.created_at,
      updatedAt: dbNotification.updated_at
    };
  }

  /**
   * Helper methods for creating specific notification types
   */
  async notifyExamStarted(examData: ExamNotificationData): Promise<void> {
    await this.createNotification({
      type: 'exam_started',
      title: 'Exam Started',
      message: `${examData.candidateName} has started the exam for ${examData.jobTitle}`,
      data: examData
    });
  }

  async notifyExamCompleted(examData: ExamNotificationData): Promise<void> {
    await this.createNotification({
      type: 'exam_completed',
      title: 'Exam Completed',
      message: `${examData.candidateName} has completed the exam for ${examData.jobTitle} with ${examData.percentage}% score`,
      data: examData
    });
  }

  async notifyExamExpired(examData: ExamNotificationData): Promise<void> {
    await this.createNotification({
      type: 'exam_expired',
      title: 'Exam Expired',
      message: `Exam for ${examData.candidateName} (${examData.jobTitle}) has expired`,
      data: examData
    });
  }

  async notifyExamTerminated(examData: ExamNotificationData): Promise<void> {
    await this.createNotification({
      type: 'exam_terminated',
      title: 'Exam Terminated',
      message: `Exam for ${examData.candidateName} (${examData.jobTitle}) has been terminated`,
      data: examData
    });
  }

  async notifyCandidateRegistered(candidateData: CandidateNotificationData): Promise<void> {
    await this.createNotification({
      type: 'candidate_registered',
      title: 'New Candidate Registered',
      message: `${candidateData.candidateName} has registered for ${candidateData.jobTitle}`,
      data: candidateData
    });
  }

  async notifySystemAlert(alertData: SystemNotificationData, title: string, message: string): Promise<void> {
    await this.createNotification({
      type: 'system_alert',
      title,
      message,
      data: alertData
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();