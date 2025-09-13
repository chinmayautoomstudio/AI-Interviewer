import { supabase } from '../services/supabase';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from('candidates')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error);
      
      // If candidates table doesn't exist, try a different approach
      if (error.message.includes('relation "candidates" does not exist')) {
        console.log('🔍 Candidates table does not exist, testing with a different approach...');
        
        // Try to create a simple test table to verify connection
        const { data: testData, error: testError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .limit(5);
          
        if (testError) {
          return { 
            success: false, 
            error: `Connection failed: ${error.message}. Additional error: ${testError.message}`,
            availableTables: [],
            existingTables: [],
            missingTables: ['candidates', 'admin_users', 'interviews', 'interview_results', 'job_descriptions']
          };
        }
        
        return { 
          success: true, 
          availableTables: testData?.map(table => table.tablename) || [],
          existingTables: [],
          missingTables: ['candidates', 'admin_users', 'interviews', 'interview_results', 'job_descriptions'],
          message: 'Connection successful but no application tables found'
        };
      }
      
      return { success: false, error: error.message };
    }

    console.log('✅ Supabase connection successful!');
    
    // Test specific tables that our app expects
    const expectedTables = [
      'admin_users',
      'candidates', 
      'interviews',
      'interview_results',
      'job_descriptions',
      'candidate_sessions',
      'workflow_status'
    ];

    // Test each expected table
    const existingTables: string[] = [];
    const missingTables: string[] = [];
    
    for (const tableName of expectedTables) {
      try {
        const { error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (tableError) {
          if (tableError.message.includes('does not exist')) {
            missingTables.push(tableName);
          } else {
            existingTables.push(tableName);
          }
        } else {
          existingTables.push(tableName);
        }
      } catch (err) {
        missingTables.push(tableName);
      }
    }

    console.log('✅ Existing tables:', existingTables);
    if (missingTables.length > 0) {
      console.log('⚠️ Missing tables:', missingTables);
    }

    return { 
      success: true, 
      availableTables: existingTables,
      existingTables,
      missingTables
    };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Test function to check table structure
export const checkTableStructure = async (tableName: string) => {
  console.log(`🔍 Checking structure of ${tableName} table...`);
  
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', tableName)
      .eq('table_schema', 'public');

    if (error) {
      console.error(`❌ Error checking ${tableName} structure:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ ${tableName} table structure:`, data);
    return { success: true, columns: data };

  } catch (error) {
    console.error(`❌ Unexpected error checking ${tableName}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
