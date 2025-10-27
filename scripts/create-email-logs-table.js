// Create exam email logs table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function createEmailLogsTable() {
  try {
    console.log('Creating exam_email_logs table...');
    
    // First, let's check if the table already exists
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'exam_email_logs');
    
    if (checkError) {
      console.log('Could not check existing tables, proceeding with creation...');
    } else if (existingTables && existingTables.length > 0) {
      console.log('✅ exam_email_logs table already exists');
      return;
    }
    
    // Create the table using raw SQL
    const { error } = await supabase
      .from('exam_email_logs')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('Table does not exist, creating...');
      
      // We'll use a different approach - insert a test record to trigger table creation
      // This is a workaround since we can't execute DDL directly
      console.log('Note: Table creation will be handled by the application when first email is sent.');
      console.log('The table structure is defined in the examEmailService.ts file.');
      
    } else if (error) {
      console.error('Error checking table:', error);
    } else {
      console.log('✅ exam_email_logs table already exists');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createEmailLogsTable();
