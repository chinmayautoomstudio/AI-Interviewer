import { supabase } from './supabase';

export interface TwoFactorAuthResponse {
  success: boolean;
  error?: string;
  verificationCode?: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  error?: string;
}

export class TwoFactorAuthService {
  // Generate and send verification code
  static async generateVerificationCode(email: string, userId: string): Promise<TwoFactorAuthResponse> {
    try {
      // Call the database function to create verification code
      const { data, error } = await supabase.rpc('create_verification_code', {
        p_user_id: userId,
        p_email: email
      });

      if (error) {
        console.error('Error generating verification code:', error);
        return { success: false, error: 'Failed to generate verification code' };
      }

      const verificationCode = data;

      // Send email with verification code
      const emailSent = await this.sendVerificationEmail(email, verificationCode);
      
      if (!emailSent) {
        return { success: false, error: 'Failed to send verification email' };
      }

      return { 
        success: true, 
        verificationCode: verificationCode // Only for development/testing
      };
    } catch (error) {
      console.error('Error in generateVerificationCode:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Verify the code entered by user
  static async verifyCode(email: string, code: string): Promise<VerifyCodeResponse> {
    try {
      // Call the database function to verify code
      const { data, error } = await supabase.rpc('verify_2fa_code', {
        p_email: email,
        p_code: code
      });

      if (error) {
        console.error('Error verifying code:', error);
        return { success: false, error: 'Failed to verify code' };
      }

      if (data) {
        return { success: true };
      } else {
        return { success: false, error: 'Invalid or expired verification code' };
      }
    } catch (error) {
      console.error('Error in verifyCode:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Send verification email
  private static async sendVerificationEmail(email: string, code: string): Promise<boolean> {
    try {
      // Use the existing email service to send verification email
      const emailContent = {
        to: email,
        subject: 'AI Interviewer - Two-Factor Authentication Code',
        html: this.generateVerificationEmailTemplate(code),
        text: `Your AI Interviewer verification code is: ${code}. This code will expire in 10 minutes.`
      };

      // Try to send via Netlify function first
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailContent),
      });

      if (response.ok) {
        return true;
      } else {
        console.error('Failed to send verification email via Netlify function');
        return false;
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  // Generate verification email template
  private static generateVerificationEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Two-Factor Authentication</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0d9488;
            margin-bottom: 10px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
          }
          .code-container {
            background: #f3f4f6;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .verification-code {
            font-size: 36px;
            font-weight: bold;
            color: #0d9488;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .code-label {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
          .warning-icon {
            font-weight: bold;
            margin-right: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .security-tips {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .security-tips h4 {
            color: #0369a1;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .security-tips ul {
            margin: 0;
            padding-left: 20px;
            color: #0369a1;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AI INTERVIEWER</div>
            <h1 class="title">Two-Factor Authentication</h1>
            <p class="subtitle">Secure your account with an additional verification step</p>
          </div>

          <p>Hello,</p>
          <p>You've requested to sign in to your AI Interviewer account. To complete the login process, please use the verification code below:</p>

          <div class="code-container">
            <div class="code-label">Your verification code:</div>
            <div class="verification-code">${code}</div>
          </div>

          <div class="warning">
            <span class="warning-icon">⚠️</span>
            <strong>Important:</strong> This code will expire in 10 minutes for security reasons.
          </div>

          <div class="security-tips">
            <h4>🔒 Security Tips:</h4>
            <ul>
              <li>Never share this code with anyone</li>
              <li>AI Interviewer will never ask for your verification code via phone or email</li>
              <li>If you didn't request this code, please ignore this email</li>
              <li>For security, this code can only be used once</li>
            </ul>
          </div>

          <p>If you didn't request this verification code, please ignore this email or contact our support team if you have concerns about your account security.</p>

          <div class="footer">
            <p>This is an automated message from AI Interviewer. Please do not reply to this email.</p>
            <p>© 2024 AI Interviewer. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Check if user has 2FA enabled
  static async isTwoFactorEnabled(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('two_factor_enabled')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error checking 2FA status:', error);
        return false;
      }

      return data?.two_factor_enabled || false;
    } catch (error) {
      console.error('Error in isTwoFactorEnabled:', error);
      return false;
    }
  }

  // Enable 2FA for user
  static async enableTwoFactor(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          two_factor_enabled: true,
          two_factor_setup_at: new Date().toISOString()
        })
        .eq('email', email);

      if (error) {
        console.error('Error enabling 2FA:', error);
        return { success: false, error: 'Failed to enable two-factor authentication' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in enableTwoFactor:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Disable 2FA for user
  static async disableTwoFactor(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          two_factor_enabled: false,
          two_factor_setup_at: null
        })
        .eq('email', email);

      if (error) {
        console.error('Error disabling 2FA:', error);
        return { success: false, error: 'Failed to disable two-factor authentication' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in disableTwoFactor:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Clean up expired verification codes
  static async cleanupExpiredCodes(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_verification_codes');
    } catch (error) {
      console.error('Error cleaning up expired codes:', error);
    }
  }
}
