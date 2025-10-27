-- Notifications Table Schema
-- Real-time notification system for admin dashboard

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'exam_started',
        'exam_completed', 
        'exam_expired',
        'exam_terminated',
        'candidate_registered',
        'system_alert',
        'general'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- null means all admins
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_read ON notifications(user_id, type, is_read);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    exam_started BOOLEAN DEFAULT TRUE,
    exam_completed BOOLEAN DEFAULT TRUE,
    exam_expired BOOLEAN DEFAULT TRUE,
    exam_terminated BOOLEAN DEFAULT TRUE,
    candidate_registered BOOLEAN DEFAULT TRUE,
    system_alerts BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
-- Users can read their own notifications and global notifications
CREATE POLICY "Users can read their own notifications and global notifications" ON notifications
    FOR SELECT USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Only authenticated users can insert notifications (for system notifications)
CREATE POLICY "Authenticated users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for notification preferences
-- Users can read their own preferences
CREATE POLICY "Users can read their own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION create_notification_preferences_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_notification_preferences_for_new_user();

-- Create function to clean up old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Create a scheduled job to clean up old notifications (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');

-- Insert sample notification preferences for existing admin users
INSERT INTO notification_preferences (user_id, exam_started, exam_completed, exam_expired, exam_terminated, candidate_registered, system_alerts, email_notifications, push_notifications)
SELECT 
    id,
    TRUE,
    TRUE, 
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    TRUE
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM notification_preferences);

-- Create view for notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE is_read = FALSE) as unread_notifications,
    COUNT(*) FILTER (WHERE type = 'exam_started') as exam_started_count,
    COUNT(*) FILTER (WHERE type = 'exam_completed') as exam_completed_count,
    COUNT(*) FILTER (WHERE type = 'exam_expired') as exam_expired_count,
    COUNT(*) FILTER (WHERE type = 'exam_terminated') as exam_terminated_count,
    COUNT(*) FILTER (WHERE type = 'candidate_registered') as candidate_registered_count,
    COUNT(*) FILTER (WHERE type = 'system_alert') as system_alert_count,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as recent_notifications
FROM notifications
WHERE user_id IS NULL OR user_id = auth.uid();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;
GRANT SELECT ON notification_stats TO authenticated;

-- Create a function to send notifications to all admins
CREATE OR REPLACE FUNCTION notify_all_admins(
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (type, title, message, data, user_id)
    VALUES (p_type, p_title, p_message, p_data, NULL)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION notify_all_admins TO authenticated;
