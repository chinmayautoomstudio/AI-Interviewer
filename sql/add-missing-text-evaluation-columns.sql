-- Add missing columns to exam_results table for text evaluation
-- Run this in your Supabase SQL editor

-- 1. Add text_evaluation_summary column (JSONB)
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS text_evaluation_summary JSONB;

-- 2. Add hiring_recommendations column (JSONB)
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS hiring_recommendations JSONB;

-- 3. Add processing_metadata column (JSONB)
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS processing_metadata JSONB;

-- 4. Add text_evaluation_completed column (BOOLEAN)
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS text_evaluation_completed BOOLEAN DEFAULT FALSE;

-- 5. Add text_evaluation_timestamp column (TIMESTAMP)
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS text_evaluation_timestamp TIMESTAMP WITH TIME ZONE;

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_results_text_evaluation 
ON exam_results USING GIN (text_evaluation_summary);

CREATE INDEX IF NOT EXISTS idx_exam_results_hiring_recommendations 
ON exam_results USING GIN (hiring_recommendations);

CREATE INDEX IF NOT EXISTS idx_exam_results_processing_metadata 
ON exam_results USING GIN (processing_metadata);

-- 7. Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'exam_results'
    AND column_name IN (
        'text_evaluation_summary',
        'hiring_recommendations', 
        'processing_metadata',
        'text_evaluation_completed',
        'text_evaluation_timestamp'
    )
ORDER BY column_name;

-- 8. Check if exam_responses has evaluation_details column
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'exam_responses'
    AND column_name = 'evaluation_details';

-- 9. Add evaluation_details column to exam_responses if missing
ALTER TABLE exam_responses 
ADD COLUMN IF NOT EXISTS evaluation_details JSONB;

-- 10. Add index for evaluation_details
CREATE INDEX IF NOT EXISTS idx_exam_responses_evaluation_details 
ON exam_responses USING GIN (evaluation_details);

-- 11. Final verification - show all relevant columns
SELECT 
    'exam_responses' as table_name,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'exam_responses'
    AND column_name IN ('evaluation_details', 'points_earned', 'is_correct')
UNION ALL
SELECT 
    'exam_results' as table_name,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'exam_results'
    AND column_name IN (
        'text_evaluation_summary',
        'hiring_recommendations', 
        'processing_metadata',
        'text_evaluation_completed',
        'text_evaluation_timestamp'
    )
ORDER BY table_name, column_name;
