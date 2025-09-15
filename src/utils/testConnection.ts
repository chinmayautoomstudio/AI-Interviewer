import { supabase } from '../services/supabase';

export const testSupabaseConnectionDirect = async () => {
  console.log('🔍 Testing Supabase connection directly...');
  
  try {
    // Test basic connection by querying a known table instead of system tables
    const { data, error } = await supabase
      .from('candidates')
      .select('id, name, email')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error);
      
      // If candidates table doesn't exist, try other tables
      if (error.message.includes('does not exist')) {
        console.log('🔍 Candidates table not found, testing other tables...');
        
        // Try job_descriptions table
        const { data: jobsData, error: jobsError } = await supabase
          .from('job_descriptions')
          .select('id, title')
          .limit(1);
          
        if (jobsError) {
          console.log('🔍 Job descriptions table not found, testing ai_agents...');
          
          // Try ai_agents table
          const { data: agentsData, error: agentsError } = await supabase
            .from('ai_agents')
            .select('id, name')
            .limit(1);
            
          if (agentsError) {
            return { 
              success: false, 
              error: 'No application tables found. Please run the database setup scripts.',
              message: 'Database connection works but tables are missing'
            };
          } else {
            console.log('✅ AI Agents table accessible');
            return { 
              success: true, 
              message: 'Connection successful! AI Agents table found.',
              tables: ['ai_agents']
            };
          }
        } else {
          console.log('✅ Job descriptions table accessible');
          return { 
            success: true, 
            message: 'Connection successful! Job descriptions table found.',
            tables: ['job_descriptions']
          };
        }
      }
      
      return { success: false, error: error.message };
    }

    console.log('✅ Supabase connection successful!');
    console.log('✅ Candidates table accessible');
    console.log('📊 Sample data:', data);

    return { 
      success: true, 
      tables: ['candidates'],
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

// Auto-run disabled to prevent errors on app startup
// testSupabaseConnectionDirect();
