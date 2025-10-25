-- Fix exam_responses table to add missing evaluation_details column
-- Run this in Supabase SQL Editor

-- Add the missing evaluation_details column to exam_responses table
ALTER TABLE exam_responses 
ADD COLUMN IF NOT EXISTS evaluation_details JSONB;

-- Add index for better performance on evaluation_details queries
CREATE INDEX IF NOT EXISTS idx_exam_responses_evaluation_details 
ON exam_responses USING GIN (evaluation_details);

-- Add comment to document the column
COMMENT ON COLUMN exam_responses.evaluation_details IS 'JSONB field storing detailed evaluation information including AI feedback, confidence scores, and evaluation criteria';

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'exam_responses' 
ORDER BY ordinal_position;
