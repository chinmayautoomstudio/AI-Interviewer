import { supabase } from '../services/supabase';

export const testSupabaseConnectionDirect = async () => {
  console.log('🔍 Testing Supabase connection directly...');
  
  try {
    // Test basic connection by querying system tables
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10);

    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Supabase connection successful!');
    console.log('📋 Available tables:', data?.map(table => table.table_name) || []);

    // Test if we can access the candidates table specifically
    if (data?.some(table => table.table_name === 'candidates')) {
      console.log('🔍 Testing candidates table access...');
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .limit(3);

      if (candidatesError) {
        console.error('❌ Error accessing candidates table:', candidatesError);
      } else {
        console.log('✅ Candidates table accessible');
        console.log('📊 Sample data:', candidates);
      }
    }

    return { 
      success: true, 
      tables: data?.map(table => table.table_name) || [],
      message: 'Connection successful!'
    };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Auto-run the test when this module is imported
testSupabaseConnectionDirect();
