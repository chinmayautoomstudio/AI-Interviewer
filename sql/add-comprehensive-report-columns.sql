-- Add comprehensive report columns to exam_results table
-- This script adds columns to store AI-generated comprehensive reports

-- Add comprehensive report columns to exam_results table
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS comprehensive_report JSONB,
ADD COLUMN IF NOT EXISTS report_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS report_version VARCHAR(20) DEFAULT '1.0';

-- Add index for report queries
CREATE INDEX IF NOT EXISTS idx_exam_results_report_generated 
ON exam_results(report_generated_at);

CREATE INDEX IF NOT EXISTS idx_exam_results_report_version 
ON exam_results(report_version);

-- Add comment to document the new columns
COMMENT ON COLUMN exam_results.comprehensive_report IS 'AI-generated comprehensive exam report with detailed analysis, hiring recommendations, and skill gaps';
COMMENT ON COLUMN exam_results.report_generated_at IS 'Timestamp when the comprehensive report was generated';
COMMENT ON COLUMN exam_results.report_version IS 'Version of the report format used';

-- Update existing records to have default values
UPDATE exam_results 
SET report_version = '1.0' 
WHERE report_version IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'exam_results' 
AND column_name IN ('comprehensive_report', 'report_generated_at', 'report_version')
ORDER BY ordinal_position;
