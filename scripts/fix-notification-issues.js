// Fix notification and email logs issues
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function fixNotificationIssues() {
  try {
    console.log('🔧 Fixing notification and email logs issues...');
    
    // 1. Check if notifications table exists and has correct constraint
    console.log('\n📋 Checking notifications table...');
    const { data: notificationsCheck, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (notificationsError) {
      console.log('❌ Notifications table issue:', notificationsError.message);
      
      // Try to create the notifications table
      console.log('🔨 Attempting to create notifications table...');
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
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
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.error('❌ Failed to create notifications table:', createError);
      } else {
        console.log('✅ Notifications table created successfully');
      }
    } else {
      console.log('✅ Notifications table exists');
    }
    
    // 2. Check if exam_email_logs table exists
    console.log('\n📧 Checking exam_email_logs table...');
    const { data: emailLogsCheck, error: emailLogsError } = await supabase
      .from('exam_email_logs')
      .select('*')
      .limit(1);
    
    if (emailLogsError) {
      console.log('❌ Exam email logs table issue:', emailLogsError.message);
      
      // Try to create the exam_email_logs table
      console.log('🔨 Attempting to create exam_email_logs table...');
      const { error: createEmailLogsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS exam_email_logs (
              id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
              candidate_email VARCHAR(255) NOT NULL,
              candidate_name VARCHAR(255) NOT NULL,
              job_title VARCHAR(255) NOT NULL,
              exam_token VARCHAR(255) NOT NULL,
              email_type VARCHAR(50) NOT NULL DEFAULT 'exam_invitation',
              sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              message_id VARCHAR(255),
              status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered', 'bounced')),
              error_message TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createEmailLogsError) {
        console.error('❌ Failed to create exam_email_logs table:', createEmailLogsError);
      } else {
        console.log('✅ Exam email logs table created successfully');
      }
    } else {
      console.log('✅ Exam email logs table exists');
    }
    
    // 3. Test notification creation
    console.log('\n🧪 Testing notification creation...');
    const testNotification = await supabase
      .from('notifications')
      .insert([{
        type: 'exam_started',
        title: 'Test Notification',
        message: 'This is a test notification',
        data: { test: true },
        is_read: false,
        user_id: null
      }])
      .select();
    
    if (testNotification.error) {
      console.error('❌ Test notification failed:', testNotification.error);
    } else {
      console.log('✅ Test notification created successfully');
      
      // Clean up test notification
      await supabase
        .from('notifications')
        .delete()
        .eq('id', testNotification.data[0].id);
      console.log('🧹 Test notification cleaned up');
    }
    
    console.log('\n🎉 Fix process completed!');
    
  } catch (error) {
    console.error('❌ Error fixing issues:', error);
  }
}

fixNotificationIssues();
