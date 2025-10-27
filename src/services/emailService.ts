// Email Service for Exam Invitations
// Service for sending exam invitations and managing email templates

import { supabase } from './supabase';
import { ExamSession } from '../types';

export interface EmailInvitationRequest {
  exam_session_id: string;
  candidate_id: string;
  exam_token: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  exam_duration_minutes: number;
  expires_at: string;
  custom_message?: string;
}

export interface BulkInvitationRequest {
  exam_sessions: EmailInvitationRequest[];
  custom_message?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'exam_invitation' | 'exam_reminder' | 'exam_completion';
  is_active: boolean;
}

export class EmailService {
  // ===== EMAIL TEMPLATES =====

  /**
   * Get email templates
   */
  async getEmailTemplates(type?: string): Promise<EmailTemplate[]> {
    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error('Error fetching email templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEmailTemplates:', error);
      return [];
    }
  }

  /**
   * Get default exam invitation template
   */
  getDefaultExamInvitationTemplate(): EmailTemplate {
    return {
      id: 'default',
      name: 'Default Exam Invitation',
      subject: 'You have been invited to take an online exam - {{job_title}}',
      body: `
Dear {{candidate_name}},

You have been invited to take an online exam for the position of {{job_title}}.

Exam Details:
- Duration: {{exam_duration_minutes}} minutes
- Expires: {{expires_at}}
- Link: {{exam_link}}

Instructions:
1. Click the exam link above to start your exam
2. Ensure you have a stable internet connection
3. Complete the exam within the time limit
4. The exam will automatically submit when time expires

{{custom_message}}

Good luck!
      
      Best regards,
HR Team
      `,
      type: 'exam_invitation',
      is_active: true
    };
  }

  // ===== SINGLE INVITATION =====

  /**
   * Send exam invitation email
   */
  async sendExamInvitation(request: EmailInvitationRequest): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Sending exam invitation to:', request.candidate_email);

      // Get email template
      const templates = await this.getEmailTemplates('exam_invitation');
      const template = templates[0] || this.getDefaultExamInvitationTemplate();

      // Generate exam link
      const examUrl = `${window.location.origin}/candidate/exam/${request.exam_token}`;

      // Replace template variables
      const subject = this.replaceTemplateVariables(template.subject, {
        candidate_name: request.candidate_name,
        job_title: request.job_title,
        exam_duration_minutes: request.exam_duration_minutes,
        expires_at: new Date(request.expires_at).toLocaleString()
      });

      const body = this.replaceTemplateVariables(template.body, {
        candidate_name: request.candidate_name,
        job_title: request.job_title,
        exam_duration_minutes: request.exam_duration_minutes,
        expires_at: new Date(request.expires_at).toLocaleString(),
        exam_link: examUrl,
        custom_message: request.custom_message || ''
      });

      // For now, we'll use a simple email service
      // In production, this would integrate with SendGrid, AWS SES, etc.
      const emailData = {
        to: request.candidate_email,
        subject,
        body,
        exam_session_id: request.exam_session_id,
        sent_at: new Date().toISOString()
      };

      // Log the email (in production, this would be sent via email service)
      console.log('📧 Email would be sent:', emailData);

      // Store email record in database
      const { error } = await supabase
        .from('exam_invitations')
        .insert([{
          exam_session_id: request.exam_session_id,
          candidate_id: request.candidate_id,
          email_address: request.candidate_email,
          subject,
          body,
          sent_at: new Date().toISOString(),
          status: 'sent'
        }]);

      if (error) {
        console.error('Error storing email record:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in sendExamInvitation:', error);
        return {
          success: false,
        error: error instanceof Error ? error.message : 'Failed to send invitation' 
      };
    }
  }

  // ===== BULK INVITATIONS =====

  /**
   * Send bulk exam invitations
   */
  async sendBulkInvitations(request: BulkInvitationRequest): Promise<{ 
    success: boolean; 
    sent: number; 
    failed: number; 
    errors: string[] 
  }> {
    try {
      console.log('📧 Sending bulk invitations to:', request.exam_sessions.length, 'candidates');

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process invitations in parallel (with rate limiting)
      const batchSize = 5; // Send 5 emails at a time
      for (let i = 0; i < request.exam_sessions.length; i += batchSize) {
        const batch = request.exam_sessions.slice(i, i + batchSize);
        
        const promises = batch.map(async (invitation) => {
          try {
            const result = await this.sendExamInvitation({
              ...invitation,
              custom_message: request.custom_message
            });
            
            if (result.success) {
              return { success: true, error: null };
            } else {
              return { success: false, error: `${invitation.candidate_email}: ${result.error}` };
            }
          } catch (error) {
            return { success: false, error: `${invitation.candidate_email}: ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
        });

        const results = await Promise.all(promises);
        
        // Count results
        const successCount = results.filter(result => result.success).length;
        const failureCount = results.filter(result => !result.success).length;
        
        sent += successCount;
        failed += failureCount;
        
        // Add errors
        results.forEach(result => {
          if (!result.success && result.error) {
            errors.push(result.error);
          }
        });

        // Rate limiting delay
        if (i + batchSize < request.exam_sessions.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`📧 Bulk invitation complete: ${sent} sent, ${failed} failed`);

      return {
        success: failed === 0,
        sent,
        failed,
        errors
      };
    } catch (error) {
      console.error('Error in sendBulkInvitations:', error);
      return {
        success: false,
        sent: 0,
        failed: request.exam_sessions.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // ===== UTILITY FUNCTIONS =====

  /**
   * Replace template variables in email content
   */
  private replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value || ''));
    });

    return result;
  }

  /**
   * Generate exam invitation from session
   */
  async generateInvitationFromSession(session: ExamSession): Promise<EmailInvitationRequest> {
    return {
      exam_session_id: session.id,
      candidate_id: session.candidate_id,
      exam_token: session.exam_token,
      candidate_name: session.candidate?.name || 'Candidate',
      candidate_email: session.candidate?.email || '',
      job_title: session.job_description?.title || 'Position',
      exam_duration_minutes: session.duration_minutes,
      expires_at: session.expires_at,
    };
  }

  // ===== EMAIL TRACKING =====

  /**
   * Get invitation history for an exam session
   */
  async getInvitationHistory(examSessionId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('exam_invitations')
        .select('*')
        .eq('exam_session_id', examSessionId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitation history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getInvitationHistory:', error);
      return [];
    }
  }

  /**
   * Track email opens and clicks
   */
  async trackEmailEvent(invitationId: string, eventType: 'opened' | 'clicked', metadata?: any): Promise<void> {
    try {
      await supabase
        .from('email_events')
        .insert([{
          invitation_id: invitationId,
          event_type: eventType,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error tracking email event:', error);
    }
  }
}

export const emailService = new EmailService();