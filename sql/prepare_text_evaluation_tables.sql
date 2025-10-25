-- Prepare database tables for text evaluation results
-- This script ensures all required columns exist for storing AI evaluation data

-- 1. Ensure exam_responses table has evaluation_details column
ALTER TABLE exam_responses 
ADD COLUMN IF NOT EXISTS evaluation_details JSONB;

-- 2. Ensure exam_results table has text evaluation columns
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS text_evaluation_summary JSONB,
ADD COLUMN IF NOT EXISTS hiring_recommendations JSONB,
ADD COLUMN IF NOT EXISTS processing_metadata JSONB,
ADD COLUMN IF NOT EXISTS text_evaluation_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS text_evaluation_timestamp TIMESTAMP WITH TIME ZONE;

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_responses_evaluation_details 
ON exam_responses USING GIN (evaluation_details);

CREATE INDEX IF NOT EXISTS idx_exam_results_text_evaluation 
ON exam_results USING GIN (text_evaluation_summary);

CREATE INDEX IF NOT EXISTS idx_exam_results_hiring_recommendations 
ON exam_results USING GIN (hiring_recommendations);

-- 4. Verify the schema
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('exam_responses', 'exam_results')
    AND column_name IN (
        'evaluation_details', 
        'text_evaluation_summary', 
        'hiring_recommendations', 
        'processing_metadata',
        'text_evaluation_completed',
        'text_evaluation_timestamp'
    )
ORDER BY table_name, column_name;
