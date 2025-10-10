import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface InterviewNotification {
  id: string;
  type: 'interview_started' | 'interview_completed' | 'interview_failed';
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  sessionId: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    duration?: number;
    score?: number;
    error?: string;
  };
}

export interface NotificationSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

class NotificationService {
  private subscriptions: Map<string, NotificationSubscription> = new Map();
  private listeners: Set<(notification: InterviewNotification) => void> = new Set();

  /**
   * Subscribe to interview notifications
   */
  subscribeToInterviewNotifications(
    onNotification: (notification: InterviewNotification) => void
  ): NotificationSubscription {
    // Add listener
    this.listeners.add(onNotification);

    // Create real-time subscription to interview_sessions table
    const channel = supabase
      .channel('interview_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interview_sessions',
          filter: 'status=eq.in_progress'
        },
        async (payload) => {
          console.log('🔔 Interview started notification:', payload);
          await this.handleInterviewStarted(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'interview_sessions',
          filter: 'status=eq.completed'
        },
        async (payload) => {
          console.log('🔔 Interview completed notification:', payload);
          await this.handleInterviewCompleted(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'interview_sessions',
          filter: 'status=eq.failed'
        },
        async (payload) => {
          console.log('🔔 Interview failed notification:', payload);
          await this.handleInterviewFailed(payload.new);
        }
      )
      .subscribe();

    const subscription: NotificationSubscription = {
      channel,
      unsubscribe: () => {
        this.listeners.delete(onNotification);
        if (this.listeners.size === 0) {
          channel.unsubscribe();
        }
      }
    };

    this.subscriptions.set('interview_notifications', subscription);
    return subscription;
  }

  /**
   * Handle interview started event
   */
  private async handleInterviewStarted(sessionData: any) {
    try {
      // Fetch candidate and job details
      const { data: candidate } = await supabase
        .from('candidates')
        .select('name')
        .eq('id', sessionData.candidate_id)
        .single();

      const { data: jobDescription } = await supabase
        .from('job_descriptions')
        .select('title')
        .eq('id', sessionData.job_description_id)
        .single();

      const notification: InterviewNotification = {
        id: `interview_started_${sessionData.id}`,
        type: 'interview_started',
        candidateId: sessionData.candidate_id,
        candidateName: candidate?.name || 'Unknown Candidate',
        jobTitle: jobDescription?.title || 'Unknown Position',
        sessionId: sessionData.session_id,
        timestamp: new Date().toISOString(),
        read: false,
        metadata: {
          duration: sessionData.duration_minutes
        }
      };

      this.notifyListeners(notification);
    } catch (error) {
      console.error('Error handling interview started notification:', error);
    }
  }

  /**
   * Handle interview completed event
   */
  private async handleInterviewCompleted(sessionData: any) {
    try {
      // Fetch candidate and job details
      const { data: candidate } = await supabase
        .from('candidates')
        .select('name')
        .eq('id', sessionData.candidate_id)
        .single();

      const { data: jobDescription } = await supabase
        .from('job_descriptions')
        .select('title')
        .eq('id', sessionData.job_description_id)
        .single();

      // Try to get interview results for score
      const { data: results } = await supabase
        .from('interview_results')
        .select('overall_score')
        .eq('session_id', sessionData.session_id)
        .single();

      const notification: InterviewNotification = {
        id: `interview_completed_${sessionData.id}`,
        type: 'interview_completed',
        candidateId: sessionData.candidate_id,
        candidateName: candidate?.name || 'Unknown Candidate',
        jobTitle: jobDescription?.title || 'Unknown Position',
        sessionId: sessionData.session_id,
        timestamp: new Date().toISOString(),
        read: false,
        metadata: {
          duration: sessionData.duration_minutes,
          score: results?.overall_score
        }
      };

      this.notifyListeners(notification);
    } catch (error) {
      console.error('Error handling interview completed notification:', error);
    }
  }

  /**
   * Handle interview failed event
   */
  private async handleInterviewFailed(sessionData: any) {
    try {
      // Fetch candidate and job details
      const { data: candidate } = await supabase
        .from('candidates')
        .select('name')
        .eq('id', sessionData.candidate_id)
        .single();

      const { data: jobDescription } = await supabase
        .from('job_descriptions')
        .select('title')
        .eq('id', sessionData.job_description_id)
        .single();

      const notification: InterviewNotification = {
        id: `interview_failed_${sessionData.id}`,
        type: 'interview_failed',
        candidateId: sessionData.candidate_id,
        candidateName: candidate?.name || 'Unknown Candidate',
        jobTitle: jobDescription?.title || 'Unknown Position',
        sessionId: sessionData.session_id,
        timestamp: new Date().toISOString(),
        read: false,
        metadata: {
          error: 'Interview session failed'
        }
      };

      this.notifyListeners(notification);
    } catch (error) {
      console.error('Error handling interview failed notification:', error);
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(notification: InterviewNotification) {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  /**
   * Get recent notifications from database
   */
  async getRecentNotifications(limit: number = 10): Promise<InterviewNotification[]> {
    // This would require a notifications table in the database
    // For now, we'll return an empty array
    // In a full implementation, you'd query a notifications table
    return [];
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      // This would require a notifications table in the database
      // For now, we'll just log it
      console.log('Marking notification as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    this.listeners.clear();
  }
}

export const notificationService = new NotificationService();
