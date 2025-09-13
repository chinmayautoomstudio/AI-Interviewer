-- Add summary fields to candidates and job_descriptions tables
-- This script adds resume_summary and jd_summary fields for n8n workflow integration

-- Add resume_summary field to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS resume_summary TEXT;

-- Add jd_summary field to job_descriptions table  
ALTER TABLE job_descriptions 
ADD COLUMN IF NOT EXISTS jd_summary TEXT;

-- Add indexes for better performance on summary fields
CREATE INDEX IF NOT EXISTS idx_candidates_resume_summary ON candidates(resume_summary) WHERE resume_summary IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_descriptions_jd_summary ON job_descriptions(jd_summary) WHERE jd_summary IS NOT NULL;

-- Add comments to document the purpose of these fields
COMMENT ON COLUMN candidates.resume_summary IS 'AI-generated summary of the candidate resume, created by n8n workflow';
COMMENT ON COLUMN job_descriptions.jd_summary IS 'AI-generated summary of the job description, created by n8n workflow';

-- Show the updated table structures
SELECT 
    'candidates' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'candidates' 
    AND column_name IN ('resume_summary', 'summary')
ORDER BY column_name;

SELECT 
    'job_descriptions' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'job_descriptions' 
    AND column_name = 'jd_summary'
ORDER BY column_name;

-- Success message
SELECT 'Summary fields added successfully!' as status;
