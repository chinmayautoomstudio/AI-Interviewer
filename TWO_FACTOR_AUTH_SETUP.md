# Two-Factor Authentication (2FA) Setup Guide

## Overview

This guide explains how to set up and use the Two-Factor Authentication (2FA) system for the AI HR Saathi platform. The 2FA system uses email-based verification codes to add an extra layer of security to user accounts.

## Features

- ✅ **Email-based verification codes** - 6-digit codes sent to user's email
- ✅ **10-minute expiration** - Codes expire automatically for security
- ✅ **One-time use** - Each code can only be used once
- ✅ **Automatic cleanup** - Expired codes are automatically removed
- ✅ **User-friendly interface** - Clean, modern UI for verification
- ✅ **Settings management** - Users can enable/disable 2FA
- ✅ **Development support** - Console logging for testing

## Database Setup

### Step 1: Run the SQL Migration

Execute the following SQL script in your Supabase SQL Editor:

```sql
-- File: sql/create_2fa_verification_table.sql
-- This creates the necessary tables and functions for 2FA
```

The script creates:
- `two_factor_verification` table for storing verification codes
- `users` table updates with 2FA fields
- Database functions for code generation and verification
- Automatic cleanup triggers

### Step 2: Verify Database Schema

After running the migration, verify these tables exist:
- `users` table with `two_factor_enabled`, `two_factor_setup_at`, `last_verification_at` columns
- `two_factor_verification` table with proper indexes

## Configuration

### Environment Variables

Ensure your `.env` file has the required email configuration:

```env
# Email Configuration (for 2FA verification emails)
REACT_APP_RESEND_API_KEY=your_resend_api_key_here
REACT_APP_FROM_EMAIL=AI Interviewer <onboarding@resend.dev>
REACT_APP_REPLY_TO_EMAIL=support@aiinterviewer.com

# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How It Works

### 1. User Login Flow

```
User enters email/password
    ↓
System checks if 2FA is enabled
    ↓
If enabled: Generate & send verification code
    ↓
Show 2FA verification modal
    ↓
User enters 6-digit code
    ↓
System verifies code & completes login
```

### 2. Code Generation

- 6-digit numeric codes (000000-999999)
- 10-minute expiration time
- One-time use only
- Automatic cleanup of expired codes

### 3. Email Delivery

- Uses existing Resend email service
- Professional HTML email template
- Includes security tips and warnings
- Mobile-responsive design

## Usage

### For Users

#### Enabling 2FA
1. Go to **Settings** → **Two-Factor Authentication**
2. Click **"Enable 2FA"**
3. 2FA is now active for your account

#### Logging In with 2FA
1. Enter your email and password
2. Check your email for the 6-digit verification code
3. Enter the code in the verification modal
4. Click **"Verify Code"** to complete login

#### Disabling 2FA
1. Go to **Settings** → **Two-Factor Authentication**
2. Click **"Disable 2FA"**
3. 2FA is now disabled for your account

### For Developers

#### Testing 2FA

1. **Enable 2FA for a test user:**
   ```sql
   UPDATE users 
   SET two_factor_enabled = true 
   WHERE email = 'test@example.com';
   ```

2. **Check console logs** for verification codes during development
3. **Test the complete flow** from login to verification

#### Development Mode

In development, verification codes are logged to the console:
```
🔐 Development: Verification code is: 123456
```

## API Reference

### TwoFactorAuthService

#### `generateVerificationCode(email: string, userId: string)`
Generates and sends a verification code to the user's email.

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
  verificationCode?: string; // Only in development
}
```

#### `verifyCode(email: string, code: string)`
Verifies a 6-digit verification code.

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `isTwoFactorEnabled(email: string)`
Checks if 2FA is enabled for a user.

**Returns:** `boolean`

#### `enableTwoFactor(email: string)`
Enables 2FA for a user.

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `disableTwoFactor(email: string)`
Disables 2FA for a user.

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

### AuthService Updates

#### `signIn(email: string, password: string)`
Now returns additional fields for 2FA:

**Returns:**
```typescript
{
  user: User | null;
  error: string | null;
  requiresTwoFactor?: boolean;
  verificationCode?: string; // Development only
}
```

#### `completeTwoFactorAuth(email: string, verificationCode: string)`
Completes the 2FA verification process.

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
  user?: User;
}
```

#### `resendTwoFactorCode(email: string)`
Resends a verification code to the user.

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

## Security Features

### Code Security
- **Random generation** - Cryptographically secure random codes
- **Time-limited** - 10-minute expiration
- **Single-use** - Codes are marked as used after verification
- **Automatic cleanup** - Expired codes are automatically removed

### Email Security
- **Professional templates** - Builds user trust
- **Security warnings** - Educates users about security
- **No sensitive data** - Only verification codes are sent

### Database Security
- **Row Level Security (RLS)** - Proper access controls
- **Indexed queries** - Fast and secure lookups
- **Audit trail** - Tracks verification attempts

## Troubleshooting

### Common Issues

#### 1. Verification Code Not Received
- Check spam/junk folder
- Verify email address is correct
- Check Resend API configuration
- Ensure email service is working

#### 2. Code Expired
- Codes expire after 10 minutes
- Request a new code using "Resend Code"
- Check system time synchronization

#### 3. Invalid Code Error
- Ensure code is exactly 6 digits
- Check for typos
- Verify code hasn't been used already
- Make sure code hasn't expired

#### 4. Database Errors
- Verify SQL migration was run successfully
- Check Supabase connection
- Ensure proper RLS policies are in place

### Debug Mode

Enable debug logging by checking browser console for:
- Verification code generation
- Email sending status
- Database operation results
- Error messages and stack traces

## Production Considerations

### Security
- Remove console logging of verification codes
- Use HTTPS for all communications
- Implement rate limiting for code requests
- Monitor for suspicious activity

### Performance
- Database indexes are optimized for fast lookups
- Automatic cleanup prevents database bloat
- Email sending is asynchronous

### Monitoring
- Track 2FA enable/disable rates
- Monitor verification success/failure rates
- Alert on unusual patterns

## Support

For technical support or questions about the 2FA system:

1. Check this documentation first
2. Review console logs for errors
3. Verify database schema and configuration
4. Test with a known working email address

## Future Enhancements

Potential improvements for the 2FA system:

- **SMS verification** - Alternative to email
- **Authenticator apps** - TOTP support
- **Backup codes** - Recovery options
- **Remember device** - Skip 2FA for trusted devices
- **Admin controls** - Force 2FA for all users
- **Analytics** - Detailed usage statistics

---

**Note:** This 2FA system is designed to be secure, user-friendly, and easy to maintain. Always test thoroughly in a development environment before deploying to production.
