import { supabase } from '../services/supabase';

export const testJobDescriptionsTable = async () => {
  console.log('🔍 Testing Job Descriptions table...');
  
  try {
    // First, check if the table exists
    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ job_descriptions table does not exist');
        return {
          success: false,
          tableExists: false,
          error: 'job_descriptions table does not exist',
          sqlScript: getJobDescriptionsTableSQL()
        };
      } else {
        console.error('❌ Error accessing job_descriptions table:', error);
        return {
          success: false,
          tableExists: true,
          error: error.message
        };
      }
    }

    console.log('✅ job_descriptions table exists and is accessible');
    
    // Get table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'job_descriptions')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (columnsError) {
      console.warn('⚠️ Could not fetch table structure:', columnsError.message);
    }

    // Get sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('job_descriptions')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.warn('⚠️ Could not fetch sample data:', sampleError.message);
    }

    // Check for required columns
    const requiredColumns = [
      'id', 'title', 'department', 'location', 'employment_type', 
      'experience_level', 'description', 'requirements', 'responsibilities', 
      'benefits', 'skills', 'qualifications', 'status', 'created_by', 
      'created_at', 'updated_at'
    ];

    const existingColumns = columns?.map(col => col.column_name) || [];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    return {
      success: true,
      tableExists: true,
      columns: columns || [],
      existingColumns,
      missingColumns,
      sampleData: sampleData || [],
      recordCount: sampleData?.length || 0,
      hasData: (sampleData?.length || 0) > 0
    };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return {
      success: false,
      tableExists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getJobDescriptionsTableSQL = () => {
  return `
-- Job Descriptions Table
CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
  salary_range JSONB,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  responsibilities TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  qualifications TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_descriptions_status ON job_descriptions(status);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_department ON job_descriptions(department);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_employment_type ON job_descriptions(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_experience_level ON job_descriptions(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_created_at ON job_descriptions(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_job_descriptions_updated_at ON job_descriptions;
CREATE TRIGGER update_job_descriptions_updated_at
    BEFORE UPDATE ON job_descriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `;
};

export const createJobDescriptionsTable = async () => {
  console.log('🔧 Creating job_descriptions table...');
  
  try {
    // This would need to be run in Supabase SQL editor or through a migration tool
    // For now, we'll just return the SQL script
    const sqlScript = getJobDescriptionsTableSQL();
    
    console.log('📝 SQL Script to create job_descriptions table:');
    console.log(sqlScript);
    
    return {
      success: true,
      message: 'SQL script generated. Please run this in your Supabase SQL editor.',
      sqlScript
    };
    
  } catch (error) {
    console.error('❌ Error generating SQL script:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
