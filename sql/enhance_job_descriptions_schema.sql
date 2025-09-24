-- Enhance Job Descriptions Table Schema
-- This script adds new structured fields to support the enhanced JD parser

-- Add new columns to job_descriptions table
ALTER TABLE job_descriptions 
ADD COLUMN IF NOT EXISTS job_description_id VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS jd_summary TEXT,
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20) CHECK (experience_level IN ('entry-level', 'mid-level', 'senior-level')),
ADD COLUMN IF NOT EXISTS work_mode VARCHAR(20) CHECK (work_mode IN ('remote', 'on-site', 'hybrid')),
ADD COLUMN IF NOT EXISTS salary_range TEXT,
ADD COLUMN IF NOT EXISTS salary_min DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS salary_max DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS key_responsibilities TEXT[],
ADD COLUMN IF NOT EXISTS required_skills TEXT[],
ADD COLUMN IF NOT EXISTS preferred_skills TEXT[],
ADD COLUMN IF NOT EXISTS technical_stack TEXT[],
ADD COLUMN IF NOT EXISTS education_requirements TEXT,
ADD COLUMN IF NOT EXISTS company_culture TEXT,
ADD COLUMN IF NOT EXISTS growth_opportunities TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT[],
ADD COLUMN IF NOT EXISTS qualifications_minimum TEXT[],
ADD COLUMN IF NOT EXISTS qualifications_preferred TEXT[],
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS job_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_descriptions_job_description_id ON job_descriptions(job_description_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_employment_type ON job_descriptions(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_experience_level ON job_descriptions(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_work_mode ON job_descriptions(work_mode);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_status ON job_descriptions(status);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_created_by ON job_descriptions(created_by);

-- Update existing records to have default values
UPDATE job_descriptions 
SET 
    employment_type = 'full-time',
    experience_level = 'mid-level',
    work_mode = 'on-site',
    status = 'active',
    currency = 'INR'
WHERE employment_type IS NULL 
   OR experience_level IS NULL 
   OR work_mode IS NULL 
   OR status IS NULL 
   OR currency IS NULL;

-- Function to generate job description ID from title
CREATE OR REPLACE FUNCTION generate_job_description_id(title TEXT)
RETURNS TEXT AS $$
DECLARE
    words TEXT[];
    abbreviation TEXT;
    timestamp_part TEXT;
BEGIN
    -- Split title into words
    words := string_to_array(trim(title), ' ');
    
    -- Generate abbreviation
    IF array_length(words, 1) >= 2 THEN
        -- Take first letter of first two words
        abbreviation := upper(substring(words[1], 1, 1) || substring(words[2], 1, 1));
    ELSIF array_length(words, 1) = 1 THEN
        -- Take first 3 letters if only one word
        abbreviation := upper(substring(words[1], 1, 3));
    ELSE
        abbreviation := 'JD';
    END IF;
    
    -- Generate timestamp-based number (last 4 digits)
    timestamp_part := substring(extract(epoch from now())::text, -4);
    
    RETURN 'AS-' || abbreviation || '-' || timestamp_part;
END;
$$ LANGUAGE plpgsql;

-- Update existing records with generated job_description_id
UPDATE job_descriptions 
SET job_description_id = generate_job_description_id(title)
WHERE job_description_id IS NULL;

-- Drop the temporary function
DROP FUNCTION generate_job_description_id(TEXT);

-- Add comments to document the new fields
COMMENT ON COLUMN job_descriptions.job_description_id IS 'Custom job description ID (AS-WDT-7019 format)';
COMMENT ON COLUMN job_descriptions.jd_summary IS 'AI-generated comprehensive summary from n8n workflow';
COMMENT ON COLUMN job_descriptions.employment_type IS 'Type of employment: full-time, part-time, contract, internship';
COMMENT ON COLUMN job_descriptions.experience_level IS 'Required experience level: entry-level, mid-level, senior-level';
COMMENT ON COLUMN job_descriptions.work_mode IS 'Work arrangement: remote, on-site, hybrid';
COMMENT ON COLUMN job_descriptions.salary_range IS 'Salary range as text (e.g., "₹2.5L - ₹4L per annum")';
COMMENT ON COLUMN job_descriptions.key_responsibilities IS 'Main job responsibilities extracted by AI';
COMMENT ON COLUMN job_descriptions.required_skills IS 'Mandatory skills for the position';
COMMENT ON COLUMN job_descriptions.preferred_skills IS 'Nice-to-have skills for the position';
COMMENT ON COLUMN job_descriptions.technical_stack IS 'Technologies and tools used in the role';
COMMENT ON COLUMN job_descriptions.education_requirements IS 'Educational background requirements';
COMMENT ON COLUMN job_descriptions.company_culture IS 'Company culture and values';
COMMENT ON COLUMN job_descriptions.growth_opportunities IS 'Career development and learning opportunities';
COMMENT ON COLUMN job_descriptions.qualifications_minimum IS 'Minimum required qualifications';
COMMENT ON COLUMN job_descriptions.qualifications_preferred IS 'Preferred qualifications';

-- Success message
SELECT 'Job descriptions table enhanced with new structured fields!' as status;
