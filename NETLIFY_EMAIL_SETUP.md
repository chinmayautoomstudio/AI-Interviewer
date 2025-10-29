# Netlify Email Function Setup Guide

## Issue: Email Function Returning 404

The Netlify function `/netlify/functions/send-email` is returning 404 because:

1. **Environment Variables Not Set**: The function needs `RESEND_API_KEY` in Netlify's environment variables
2. **Function Location**: Functions must be in the correct location for Netlify deployment

## Solution Steps:

### Step 1: Set Netlify Environment Variables

1. Go to your Netlify dashboard
2. Navigate to: **Site settings** > **Environment variables**
3. Add the following environment variable:
   - **Key**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (starts with `re_...`)
   - **Scopes**: Select "All scopes" (Production, Deploy previews, Branch deploys)

### Step 2: Deploy or Redeploy

After adding the environment variable:
1. Go to **Deploys** tab
2. Click **Trigger deploy** > **Deploy site**
3. This will rebuild with the function and environment variables

### Step 3: Verify Function Deployment

After deployment, check:
- Functions should be listed in **Site settings** > **Functions**
- The function path should be: `/.netlify/functions/send-email`
- Check Netlify function logs for any errors

### Step 4: Create Database Table

The `exam_email_logs` table needs to be created in Supabase:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the SQL script from `sql/exam-email-logs-schema.sql`

Or run this SQL directly:

```sql
CREATE TABLE IF NOT EXISTS exam_email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    exam_token VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL DEFAULT 'exam_invitation',
    email_content TEXT,
    text_content TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered', 'bounced', 'stored_in_db')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exam_email_logs_exam_token ON exam_email_logs(exam_token);
CREATE INDEX IF NOT EXISTS idx_exam_email_logs_candidate_email ON exam_email_logs(candidate_email);
CREATE INDEX IF NOT EXISTS idx_exam_email_logs_sent_at ON exam_email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_exam_email_logs_status ON exam_email_logs(status);

-- Enable RLS
ALTER TABLE exam_email_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all email logs
CREATE POLICY "Admins can view all exam email logs" ON exam_email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Policy for admins to insert email logs
CREATE POLICY "Admins can insert exam email logs" ON exam_email_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Policy for admins to update email logs
CREATE POLICY "Admins can update exam email logs" ON exam_email_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.is_active = true
        )
    );
```

### Step 5: Verify Function File Location

Ensure the function is in the correct location:
- Source: `netlify/functions/send-email.js`
- Built: `build/netlify/functions/send-email.js` (after build)

The `netlify.toml` should have:
```toml
[functions]
  directory = "netlify/functions"
```

## Troubleshooting

### Function Still Returns 404

1. **Check Netlify Functions Tab**: 
   - Go to **Site settings** > **Functions**
   - Verify `send-email` function is listed

2. **Check Build Logs**:
   - Look for "Functions copied successfully!" message
   - Verify function is in build output

3. **Verify Function Path**:
   - The function should be accessible at: `/.netlify/functions/send-email`
   - Not: `/netlify/functions/send-email` (no leading dot)

### Environment Variables Not Working

1. **Use Correct Variable Name**: 
   - In Netlify: `RESEND_API_KEY` (not `REACT_APP_RESEND_API_KEY`)
   - The function checks both but prefers `RESEND_API_KEY`

2. **Redeploy After Adding Variables**:
   - Environment variables only take effect after redeploy

3. **Check Function Logs**:
   - Go to **Functions** tab > Click on `send-email` > View logs
   - Look for "Resend API key not found" errors

### Database Table Errors

1. **Check RLS Policies**:
   - If you're not using `admin_users` table, modify the policies
   - Or temporarily disable RLS: `ALTER TABLE exam_email_logs DISABLE ROW LEVEL SECURITY;`

2. **Verify Table Creation**:
   - Run: `SELECT * FROM exam_email_logs LIMIT 1;` in Supabase SQL Editor
   - Should return empty result (not an error)

## Alternative: Use Database Fallback

If Netlify function continues to fail, the system will:
1. Store email content in `exam_email_logs` table
2. You can manually send emails later or use a different email service

Make sure the `exam_email_logs` table exists for this fallback to work.

