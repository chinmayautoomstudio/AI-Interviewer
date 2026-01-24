# 📧 Email Setup Guide for Interview Notifications

This guide explains how to set up email notifications for interview scheduling in the AI Interviewer application.

## 🚀 Quick Setup

### 1. Choose an Email Service Provider

#### Option A: Resend (Recommended)
- **Why**: Modern, developer-friendly, great React integration
- **Cost**: Free tier (3,000 emails/month), then $20/month
- **Setup**: Simple API integration

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add to your environment variables:
   ```bash
   REACT_APP_RESEND_API_KEY=re_your_api_key_here
   ```

#### Option B: SendGrid
- **Why**: Enterprise-grade, reliable, extensive features
- **Cost**: Free tier (100 emails/day), then $19.95/month
- **Setup**: More complex but very robust

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Add to your environment variables:
   ```bash
   REACT_APP_SENDGRID_API_KEY=SG.your_api_key_here
   ```

#### Option C: Nodemailer + SMTP
- **Why**: Free, full control
- **Cons**: Requires SMTP server setup, less reliable
- **Setup**: More complex, requires backend implementation

### 2. Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# Email Service Configuration
REACT_APP_RESEND_API_KEY=your_resend_api_key_here
# OR
# REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key_here

# Email Settings
REACT_APP_FROM_EMAIL=noreply@yourcompany.com
REACT_APP_COMPANY_NAME=Your Company Name
REACT_APP_COMPANY_WEBSITE=https://yourcompany.com
REACT_APP_SUPPORT_EMAIL=support@yourcompany.com
```

### 3. Update Email Configuration

Edit `src/services/emailService.ts` and update the `EMAIL_CONFIG` object:

```typescript
const EMAIL_CONFIG = {
  provider: 'resend', // Change to 'sendgrid' or 'nodemailer' as needed
  
  // Update these with your actual values
  resend: {
    apiKey: process.env.REACT_APP_RESEND_API_KEY,
    fromEmail: 'noreply@yourcompany.com', // Must be verified in Resend
  },
  
  company: {
    name: 'Your Company Name',
    website: 'https://yourcompany.com',
    supportEmail: 'support@yourcompany.com',
  }
};
```

## 📧 Email Features

### What Gets Sent
When an interview is scheduled, candidates receive:

1. **Professional HTML Email** with:
   - Company branding
   - Interview details (date, time, duration, type)
   - AI agent information (if applicable)
   - Interview link for online interviews
   - Temporary login credentials
   - Preparation tips
   - Contact information

2. **Interview Details Include**:
   - Position title
   - Scheduled date and time
   - Duration
   - Interview type (technical, behavioral, etc.)
   - AI agent name (if using AI interviewer)
   - Special notes
   - Direct interview link

3. **Candidate Access**:
   - One-click interview link
   - Temporary login credentials
   - Mobile-friendly design

### Email Template Features
- **Responsive Design**: Works on all devices
- **Professional Styling**: Company-branded appearance
- **Clear Information**: Easy-to-read interview details
- **Action Buttons**: Direct links to join interview
- **Fallback Text**: Plain text version for all email clients

## 🔧 Customization

### Customize Email Template
Edit the `generateInterviewEmail()` function in `src/services/emailService.ts` to:
- Change colors and styling
- Add your company logo
- Modify the content structure
- Add additional information

### Add More Email Types
You can extend the service to send:
- Interview reminders
- Interview completion confirmations
- Interview rescheduling notifications
- Interview feedback emails

### Example: Add Interview Reminder
```typescript
// In emailService.ts
static async sendInterviewReminder(interview: Interview): Promise<{ success: boolean; error?: string }> {
  // Implementation for reminder emails
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"API key not configured" error**
   - Check your environment variables
   - Ensure the API key is correct
   - Restart your development server

2. **"From email not verified" error (Resend)**
   - Verify your domain in Resend dashboard
   - Use a verified email address

3. **Emails not being sent**
   - Check browser console for errors
   - Verify API key permissions
   - Check email service provider dashboard

4. **Emails going to spam**
   - Set up SPF, DKIM, and DMARC records
   - Use a professional from email address
   - Avoid spam trigger words

### Testing
1. Use the development environment first
2. Test with your own email address
3. Check email service provider logs
4. Verify email delivery in different email clients

## 📊 Monitoring

### Track Email Delivery
- **Resend**: Check dashboard for delivery stats
- **SendGrid**: Use activity feed and statistics
- **Custom**: Implement logging in your application

### Log Email Events
The service automatically logs:
- Successful email sends
- Failed email attempts
- Error messages

## 🔒 Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Email Validation**: Validate email addresses before sending
3. **Rate Limiting**: Implement rate limiting for email sending
4. **Data Privacy**: Ensure compliance with email privacy laws

## 📈 Scaling

### For High Volume
- Consider using a dedicated email service
- Implement email queuing for bulk sends
- Set up email templates in your provider's dashboard
- Use webhooks for delivery tracking

### Performance Optimization
- Cache email templates
- Use background jobs for email sending
- Implement retry logic for failed sends
- Monitor email service quotas

## 🆘 Support

If you need help:
1. Check the email service provider documentation
2. Review the console logs for error messages
3. Test with a simple email first
4. Contact the email service provider support

## 📝 Next Steps

After setting up email notifications:
1. Test the complete interview flow
2. Customize the email template
3. Set up email monitoring
4. Consider adding more email types
5. Implement email preferences for candidates
