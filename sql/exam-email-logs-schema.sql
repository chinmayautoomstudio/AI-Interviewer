-- Exam Email Logs Table
-- Table to track exam invitation emails sent to candidates

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_email_logs_exam_token ON exam_email_logs(exam_token);
CREATE INDEX IF NOT EXISTS idx_exam_email_logs_candidate_email ON exam_email_logs(candidate_email);
CREATE INDEX IF NOT EXISTS idx_exam_email_logs_sent_at ON exam_email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_exam_email_logs_status ON exam_email_logs(status);

-- Add RLS policies
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
