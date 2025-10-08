import { Interview, Candidate, JobDescription, AIAgent } from '../types';

// Email service configuration
const EMAIL_CONFIG = {
  // You can switch between different email providers
  provider: 'resend', // 'resend' | 'sendgrid' | 'nodemailer'
  
  // Resend configuration
  resend: {
    apiKey: process.env.REACT_APP_RESEND_API_KEY,
    fromEmail: process.env.REACT_APP_FROM_EMAIL || 'noreply@aiinterviewer.com',
  },
  
  // SendGrid configuration
  sendgrid: {
    apiKey: process.env.REACT_APP_SENDGRID_API_KEY,
    fromEmail: process.env.REACT_APP_FROM_EMAIL || 'noreply@aiinterviewer.com',
  },
  
  // Company information
  company: {
    name: process.env.REACT_APP_COMPANY_NAME || 'AI Interviewer',
    website: process.env.REACT_APP_COMPANY_WEBSITE || 'https://aiinterviewer.com',
    supportEmail: process.env.REACT_APP_SUPPORT_EMAIL || 'support@aiinterviewer.com',
  }
};

// Debug: Log the configuration (remove in production)
console.log('Email Config:', {
  provider: EMAIL_CONFIG.provider,
  hasResendKey: !!EMAIL_CONFIG.resend.apiKey,
  resendKeyLength: EMAIL_CONFIG.resend.apiKey?.length || 0,
  fromEmail: EMAIL_CONFIG.resend.fromEmail,
  companyName: EMAIL_CONFIG.company.name
});

export interface InterviewEmailData {
  candidate: Candidate;
  jobDescription: JobDescription;
  aiAgent?: AIAgent;
  interview: Interview;
  interviewLink?: string;
  candidateLoginCredentials?: {
    email: string;
    username: string;
    temporaryPassword: string;
  };
}

export class EmailService {
  /**
   * Check if email service is properly configured
   */
  static isConfigured(): boolean {
    const config = EMAIL_CONFIG;
    console.log('Email service configuration check:', {
      provider: config.provider,
      hasResendKey: !!config.resend.apiKey,
      fromEmail: config.resend.fromEmail,
      companyName: config.company.name
    });
    
    // For Resend, we need the API key for fallback (direct API) even if Netlify Function is available
    switch (config.provider) {
      case 'resend':
        return !!config.resend.apiKey; // Need API key for fallback
      case 'sendgrid':
        return !!config.sendgrid.apiKey;
      default:
        return false;
    }
  }

  /**
   * Send interview invitation email to candidate
   */
  static async sendInterviewInvitation(data: InterviewEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if email service is configured
      if (!this.isConfigured()) {
        const errorMsg = `Email service not configured. Please check your environment variables and restart the development server. Provider: ${EMAIL_CONFIG.provider}`;
        console.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      const emailContent = this.generateInterviewEmail(data);
      
      switch (EMAIL_CONFIG.provider) {
        case 'resend':
          return await this.sendViaResend(emailContent);
        case 'sendgrid':
          return await this.sendViaSendGrid(emailContent);
        case 'nodemailer':
          return await this.sendViaNodemailer(emailContent);
        default:
          throw new Error(`Unsupported email provider: ${EMAIL_CONFIG.provider}`);
      }
    } catch (error) {
      console.error('Error sending interview invitation email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  /**
   * Generate interview email content
   */
  private static generateInterviewEmail(data: InterviewEmailData) {
    const { candidate, jobDescription, aiAgent, interview, interviewLink, candidateLoginCredentials } = data;
    
    const interviewDate = new Date(interview.scheduledAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const interviewTime = new Date(interview.scheduledAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const subject = `Interview Invitation - ${jobDescription.title} at ${EMAIL_CONFIG.company.name}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Invitation</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .header-content { position: relative; z-index: 1; }
          .header h1 { 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header p { 
            font-size: 16px; 
            opacity: 0.9; 
            font-weight: 500;
          }
          .content { 
            padding: 40px 30px; 
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 24px;
          }
          .intro-text {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 32px;
            line-height: 1.7;
          }
          .card { 
            background: #ffffff; 
            padding: 24px; 
            border-radius: 12px; 
            margin: 24px 0; 
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
          }
          .card-icon {
            width: 24px;
            height: 24px;
            margin-right: 12px;
            background: #3b82f6;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
          }
          .card-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
          }
          .detail-value {
            color: #1f2937;
            font-size: 14px;
            text-align: right;
            flex: 1;
            margin-left: 16px;
          }
          .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0; 
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            transition: all 0.2s ease;
          }
          .cta-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
          }
          .credentials-card { 
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
            padding: 24px; 
            border-radius: 12px; 
            margin: 24px 0; 
            border: 1px solid #0ea5e9;
            position: relative;
          }
          .credentials-card::before {
            content: '🔐';
            position: absolute;
            top: -12px;
            left: 24px;
            background: #0ea5e9;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          }
          .credentials-title {
            font-size: 16px;
            font-weight: 600;
            color: #0c4a6e;
            margin-bottom: 16px;
          }
          .credential-item {
            background: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 8px 0;
            border: 1px solid #bae6fd;
          }
          .credential-label {
            font-size: 12px;
            color: #0369a1;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .credential-value {
            font-size: 16px;
            color: #0c4a6e;
            font-weight: 600;
            font-family: 'Courier New', monospace;
          }
          .tips-list {
            list-style: none;
            padding: 0;
          }
          .tips-list li {
            padding: 8px 0;
            color: #4b5563;
            font-size: 14px;
            position: relative;
            padding-left: 24px;
          }
          .tips-list li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
          }
          .footer { 
            background: #f8fafc;
            text-align: center; 
            padding: 32px 30px; 
            color: #6b7280; 
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .footer-logo {
            font-size: 18px;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 8px;
          }
          .footer-links {
            margin: 16px 0;
          }
          .footer-links a {
            color: #3b82f6;
            text-decoration: none;
            margin: 0 8px;
          }
          .footer-links a:hover {
            text-decoration: underline;
          }
          .security-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
          }
          .security-notice strong {
            color: #b45309;
          }
          @media (max-width: 600px) {
            .email-container { margin: 0; border-radius: 0; }
            .header, .content, .footer { padding: 24px 20px; }
            .detail-row { flex-direction: column; align-items: flex-start; }
            .detail-value { text-align: left; margin-left: 0; margin-top: 4px; }
            .cta-button { display: block; text-align: center; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="header-content">
              <h1>🎯 Interview Invitation</h1>
              <p>${EMAIL_CONFIG.company.name}</p>
            </div>
          </div>
        
          <div class="content">
            <div class="greeting">Dear ${candidate.name},</div>
            
            <div class="intro-text">
              Thank you for your interest in the <strong>${jobDescription.title}</strong> position at ${EMAIL_CONFIG.company.name}. We were impressed with your qualifications and would like to invite you for an interview.
            </div>
            
            <div class="card">
              <div class="card-header">
                <div class="card-icon">📅</div>
                <div class="card-title">Interview Details</div>
              </div>
              <div class="detail-row">
                <span class="detail-label">Position</span>
                <span class="detail-value">${jobDescription.title}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${interviewDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${interviewTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration</span>
                <span class="detail-value">${interview.duration} minutes</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Type</span>
                <span class="detail-value">${interview.interviewType?.replace('_', ' ').toUpperCase() || 'General'}</span>
              </div>
              ${aiAgent ? `
              <div class="detail-row">
                <span class="detail-label">Interviewer</span>
                <span class="detail-value">${aiAgent.name} (AI Assistant)</span>
              </div>
              ` : ''}
              ${interview.interviewNotes ? `
              <div class="detail-row">
                <span class="detail-label">Notes</span>
                <span class="detail-value">${interview.interviewNotes}</span>
              </div>
              ` : ''}
            </div>
            
            ${candidateLoginCredentials ? `
            <div class="credentials-card">
              <div class="credentials-title">Login Credentials</div>
              <p style="color: #0369a1; font-size: 14px; margin-bottom: 16px;">Use these credentials to access the interview platform:</p>
              <div class="credential-item">
                <div class="credential-label">Username</div>
                <div class="credential-value">${candidateLoginCredentials.username}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Temporary Password</div>
                <div class="credential-value">${candidateLoginCredentials.temporaryPassword}</div>
              </div>
              <div class="security-notice">
                <strong>🔒 Security Notice:</strong> Please change your password after your first login for security purposes.
              </div>
            </div>
            ` : ''}
            
            ${interviewLink ? `
            <div class="card">
              <div class="card-header">
                <div class="card-icon">🔗</div>
                <div class="card-title">Interview Access</div>
              </div>
              <p style="color: #4b5563; margin-bottom: 20px;">Your interview will be conducted online. Click the button below to access the candidate login page:</p>
              <a href="${interviewLink}" class="cta-button">Access Interview Platform</a>
              <p style="color: #6b7280; font-size: 14px; margin-top: 12px;">Please join 5 minutes before your scheduled time.</p>
            </div>
            ` : ''}
            
            <div class="card">
              <div class="card-header">
                <div class="card-icon">📋</div>
                <div class="card-title">Preparation Tips</div>
              </div>
              <ul class="tips-list">
                <li>Review the job description and company information</li>
                <li>Prepare examples of your relevant experience</li>
                <li>Have your resume and portfolio ready</li>
                <li>Test your internet connection and camera/microphone</li>
                <li>Find a quiet, well-lit space for the interview</li>
                <li>Ensure you have a stable internet connection</li>
              </ul>
            </div>
            
            <div class="security-notice">
              <strong>📧 Confirmation Required:</strong> Please reply to this email to confirm your attendance. If you need to reschedule, please contact us at least 24 hours in advance.
            </div>
            
            <p style="color: #4b5563; margin: 24px 0;">If you have any questions, feel free to contact us at <a href="mailto:${EMAIL_CONFIG.company.supportEmail}" style="color: #3b82f6; text-decoration: none;">${EMAIL_CONFIG.company.supportEmail}</a>.</p>
            
            <p style="color: #1f2937; font-weight: 600; margin: 24px 0;">We look forward to meeting you!</p>
            
            <p style="color: #4b5563; margin: 24px 0;">
              Best regards,<br>
              <strong>The ${EMAIL_CONFIG.company.name} Team</strong>
            </p>
          </div>
        
          <div class="footer">
            <div class="footer-logo">${EMAIL_CONFIG.company.name}</div>
            <div class="footer-links">
              <a href="${EMAIL_CONFIG.company.website}">Website</a>
              <a href="mailto:${EMAIL_CONFIG.company.supportEmail}">Support</a>
            </div>
            <p>This email was sent by ${EMAIL_CONFIG.company.name}</p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
              If you did not expect this email, please ignore it or contact our support team.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Interview Invitation - ${jobDescription.title} at ${EMAIL_CONFIG.company.name}
      
      Dear ${candidate.name},
      
      Thank you for your interest in the ${jobDescription.title} position at ${EMAIL_CONFIG.company.name}. We were impressed with your qualifications and would like to invite you for an interview.
      
      INTERVIEW DETAILS:
      - Position: ${jobDescription.title}
      - Date: ${interviewDate}
      - Time: ${interviewTime}
      - Duration: ${interview.duration} minutes
      - Type: ${interview.interviewType?.replace('_', ' ').toUpperCase() || 'General'}
      ${aiAgent ? `- Interviewer: ${aiAgent.name} (AI Assistant)` : ''}
      ${interview.interviewNotes ? `- Notes: ${interview.interviewNotes}` : ''}
      
      ${interviewLink ? `Interview Link: ${interviewLink}` : ''}
      
      ${candidateLoginCredentials ? `
      LOGIN CREDENTIALS:
      - Email: ${candidateLoginCredentials.email}
      - Temporary Password: ${candidateLoginCredentials.temporaryPassword}
      ` : ''}
      
      PREPARATION TIPS:
      - Review the job description and company information
      - Prepare examples of your relevant experience
      - Have your resume and portfolio ready
      - Test your internet connection and camera/microphone
      - Find a quiet, well-lit space for the interview
      
      Please reply to this email to confirm your attendance. If you need to reschedule, please contact us at least 24 hours in advance.
      
      If you have any questions, feel free to contact us at ${EMAIL_CONFIG.company.supportEmail}.
      
      We look forward to meeting you!
      
      Best regards,
      The ${EMAIL_CONFIG.company.name} Team
    `;

    return {
      to: candidate.email,
      subject,
      html: htmlContent,
      text: textContent,
    };
  }

  /**
   * Send email via Resend (using Netlify Function or direct API)
   */
  private static async sendViaResend(emailContent: any): Promise<{ success: boolean; error?: string }> {
    console.log('Attempting to send via Resend...');
    
    // Try Netlify Function first (for production and netlify dev)
    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailContent.to,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        }),
      });

      // Check if the response is HTML (404 page) or JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Netlify function not available - falling back to direct API');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }

      console.log('Email sent successfully via Netlify Function');
      return { success: true };
    } catch (netlifyError) {
      const errorMessage = netlifyError instanceof Error ? netlifyError.message : 'Unknown error';
      console.log('Netlify Function failed, trying direct API:', errorMessage);
      
      // Fallback to direct API call (for development with npm start)
      return await this.sendViaResendDirect(emailContent);
    }
  }

  /**
   * Send email via Resend API directly (fallback for development)
   */
  private static async sendViaResendDirect(emailContent: any): Promise<{ success: boolean; error?: string }> {
    console.log('Attempting to send via Resend API directly...');
    
    if (!EMAIL_CONFIG.resend.apiKey) {
      throw new Error('Resend API key not configured. Please check your .env file and restart the development server.');
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EMAIL_CONFIG.resend.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: EMAIL_CONFIG.resend.fromEmail,
          to: [emailContent.to],
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Resend API error: ${errorData.message || response.statusText}`);
      }

      console.log('Email sent successfully via direct API');
      return { success: true };
    } catch (error) {
      console.error('Error sending email via direct API:', error);
      throw error;
    }
  }

  /**
   * Send email via SendGrid
   */
  private static async sendViaSendGrid(emailContent: any): Promise<{ success: boolean; error?: string }> {
    if (!EMAIL_CONFIG.sendgrid.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_CONFIG.sendgrid.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: emailContent.to }],
          subject: emailContent.subject,
        }],
        from: { email: EMAIL_CONFIG.sendgrid.fromEmail },
        content: [
          { type: 'text/plain', value: emailContent.text },
          { type: 'text/html', value: emailContent.html },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`SendGrid API error: ${errorData || response.statusText}`);
    }

    return { success: true };
  }

  /**
   * Send email via Nodemailer (requires backend implementation)
   */
  private static async sendViaNodemailer(emailContent: any): Promise<{ success: boolean; error?: string }> {
    // This would require a backend endpoint
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailContent),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Email service error: ${errorData.message || response.statusText}`);
    }

    return { success: true };
  }

  /**
   * Generate temporary login credentials for candidate
   */
  static generateTemporaryCredentials(candidateEmail: string): { email: string; username: string; temporaryPassword: string } {
    const temporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    const username = candidateEmail.split('@')[0] + '_' + Math.random().toString(36).slice(-4);
    
    return {
      email: candidateEmail,
      username,
      temporaryPassword,
    };
  }

  /**
   * Generate interview link
   */
  static generateInterviewLink(interviewId: string, candidateId: string): string {
    const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:8888';
    return `${baseUrl}/candidate/login?interview=${interviewId}&candidate=${candidateId}`;
  }
}
