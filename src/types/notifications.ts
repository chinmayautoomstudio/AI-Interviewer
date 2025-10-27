// Notification Types and Interfaces
// Real-time notification system for admin dashboard

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 
  | 'exam_started'
  | 'exam_completed'
  | 'exam_expired'
  | 'exam_terminated'
  | 'candidate_registered'
  | 'system_alert'
  | 'general';

export interface ExamNotificationData {
  examSessionId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobDescriptionId: string;
  jobTitle: string;
  examToken: string;
  durationMinutes: number;
  totalQuestions: number;
  startedAt?: string;
  completedAt?: string;
  score?: number;
  percentage?: number;
}

export interface CandidateNotificationData {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobDescriptionId: string;
  jobTitle: string;
}

export interface SystemNotificationData {
  alertType: 'error' | 'warning' | 'info' | 'success';
  component?: string;
  action?: string;
  details?: Record<string, any>;
}

export type NotificationData = 
  | ExamNotificationData 
  | CandidateNotificationData 
  | SystemNotificationData;

export interface NotificationPreferences {
  id: string;
  userId: string;
  examStarted: boolean;
  examCompleted: boolean;
  examExpired: boolean;
  examTerminated: boolean;
  candidateRegistered: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  recentActivity: {
    examStarted: number;
    examCompleted: number;
    examExpired: number;
    examTerminated: number;
  };
}

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  userId?: string; // If null, sends to all admins
}

export interface NotificationFilter {
  type?: NotificationType;
  isRead?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}
