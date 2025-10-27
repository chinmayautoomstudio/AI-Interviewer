// Exam Email Service
// Service for sending exam invitations and managing exam-related email communications

import { supabase } from './supabase';
import { ExamSession } from '../types';

export interface ExamEmailData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  examDuration: number;
  examToken: string;
  expiresAt: string;
  examLink: string;
  customMessage?: string;
  companyName?: string;
}

export interface ExamEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export class ExamEmailService {
  /**
   * Generate exam invitation email HTML template
   */
  private static generateExamInvitationEmail(data: ExamEmailData): string {
    const companyName = data.companyName || 'AI Interviewer';
    const examUrl = data.examLink;
    const expiresDate = new Date(data.expiresAt).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Online Exam Invitation - ${companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #14B8A6; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
          .content { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .exam-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .exam-link { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #14B8A6; }
          .instructions { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .btn { background: #14B8A6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 8px 0; }
          .label { font-weight: bold; width: 120px; }
          .code { font-family: monospace; background: white; padding: 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">${companyName}</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Online Exam Invitation</p>
          </div>
          
          <!-- Main Content -->
          <div class="content">
            <h2 style="color: #14B8A6; margin-top: 0;">Hello ${data.candidateName}!</h2>
            
            <p>We are excited to invite you to take an online exam for the position of <strong>${data.jobTitle}</strong>.</p>
            
            <!-- Exam Details -->
            <div class="exam-details">
              <h3 style="color: #14B8A6; margin-top: 0;">Exam Details</h3>
              <table>
                <tr>
                  <td class="label">Position:</td>
                  <td>${data.jobTitle}</td>
                </tr>
                <tr>
                  <td class="label">Duration:</td>
                  <td>${data.examDuration} minutes</td>
                </tr>
                <tr>
                  <td class="label">Expires:</td>
                  <td>${expiresDate} (IST)</td>
                </tr>
                <tr>
                  <td class="label">Exam Type:</td>
                  <td>Multiple Choice Questions (MCQ)</td>
                </tr>
              </table>
            </div>
            
            <!-- Exam Link -->
            <div class="exam-link">
              <h3 style="color: #14B8A6; margin-top: 0;">Access Your Exam</h3>
              <p style="margin-bottom: 15px;">Click the button below to start your exam:</p>
              <div style="text-align: center;">
                <a href="${examUrl}" class="btn">Start Exam Now</a>
              </div>
              <p style="margin-top: 15px; font-size: 12px; color: #666;">
                Or copy and paste this link in your browser:<br>
                <span class="code">${examUrl}</span>
              </p>
            </div>
            
            <!-- Instructions -->
            <div class="instructions">
              <h3 style="color: #856404; margin-top: 0;">Important Instructions</h3>
              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                <li>Ensure you have a stable internet connection</li>
                <li>Use a quiet environment free from distractions</li>
                <li>Complete the exam within the time limit</li>
                <li>The exam will automatically submit when time expires</li>
                <li>Do not refresh the page during the exam</li>
                <li>Answer all questions to the best of your ability</li>
              </ul>
            </div>
            
            ${data.customMessage ? `
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #0c4a6e; margin-top: 0;">Additional Information</h3>
              <p style="color: #0c4a6e; margin: 0;">${data.customMessage}</p>
            </div>
            ` : ''}
            
            <!-- Support Information -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px;">
                If you have any questions or need technical support, please contact us at 
                <a href="mailto:support@ai-interviewer.com" style="color: #14B8A6;">support@ai-interviewer.com</a>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p>© 2025 ${companyName}. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send exam invitation email using Resend
   */
  static async sendExamInvitation(data: ExamEmailData): Promise<ExamEmailResult> {
    try {
      console.log('📧 Sending exam invitation to:', data.candidateEmail);

      // Generate exam link
      const examUrl = `${window.location.origin}/candidate/exam/${data.examToken}`;
      const emailData = {
        ...data,
        examLink: examUrl
      };

      // Generate HTML email content
      const htmlContent = this.generateExamInvitationEmail(emailData);
      
      // Generate plain text version
      const textContent = `
Dear ${data.candidateName},

You have been invited to take an online exam for the position of ${data.jobTitle}.

Exam Details:
- Duration: ${data.examDuration} minutes
- Expires: ${new Date(data.expiresAt).toLocaleString()}
- Exam Link: ${examUrl}

Instructions:
1. Click the exam link above to start your exam
2. Ensure you have a stable internet connection
3. Complete the exam within the time limit
4. The exam will automatically submit when time expires

${data.customMessage ? `Additional Information: ${data.customMessage}` : ''}

Good luck!

Best regards,
HR Team
      `;

      // Send email via Netlify function
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.candidateEmail,
          subject: `Online Exam Invitation - ${data.jobTitle}`,
          html: htmlContent,
          text: textContent
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ Email sending failed:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to send email'
        };
      }

      console.log('✅ Exam invitation email sent successfully:', result.messageId);

      // Store email record in database
      try {
        await supabase
          .from('exam_email_logs')
          .insert([{
            candidate_email: data.candidateEmail,
            candidate_name: data.candidateName,
            job_title: data.jobTitle,
            exam_token: data.examToken,
            email_type: 'exam_invitation',
            sent_at: new Date().toISOString(),
            message_id: result.messageId || null,
            status: 'sent'
          }]);
      } catch (dbError) {
        console.warn('⚠️ Failed to log email to database:', dbError);
        // Don't fail the email sending if logging fails
      }

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Error sending exam invitation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send bulk exam invitations
   */
  static async sendBulkExamInvitations(examDataList: ExamEmailData[]): Promise<ExamEmailResult[]> {
    const results: ExamEmailResult[] = [];
    
    for (const examData of examDataList) {
      const result = await this.sendExamInvitation(examData);
      results.push(result);
      
      // Add small delay between emails to avoid rate limiting
      if (examDataList.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Get email sending status
   */
  static async getEmailStatus(examToken: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('exam_email_logs')
        .select('*')
        .eq('exam_token', examToken)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching email status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEmailStatus:', error);
      return [];
    }
  }

  /**
   * Check if email service is configured
   */
  static isConfigured(): boolean {
    return !!process.env.REACT_APP_RESEND_API_KEY;
  }
}

export const examEmailService = new ExamEmailService();
