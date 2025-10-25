-- Verify text evaluation schema - run this AFTER adding the missing columns
-- This will show you the current state of both tables

-- 1. Check exam_responses table structure
SELECT 
    'exam_responses' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'exam_responses'
    AND column_name IN ('evaluation_details', 'points_earned', 'is_correct', 'exam_session_id', 'question_id')
ORDER BY column_name;

-- 2. Check exam_results table structure  
SELECT 
    'exam_results' as table_name,
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
        'text_evaluation_timestamp',
        'exam_session_id'
    )
ORDER BY column_name;

-- 3. Check if we have any existing data
SELECT 
    'exam_responses' as table_name,
    COUNT(*) as total_rows,
    COUNT(evaluation_details) as rows_with_evaluation_details
FROM exam_responses;

SELECT 
    'exam_results' as table_name,
    COUNT(*) as total_rows,
    COUNT(text_evaluation_summary) as rows_with_text_evaluation
FROM exam_results;

-- 4. Show sample data structure (if any exists)
SELECT 
    'Sample exam_responses' as info,
    id,
    exam_session_id,
    question_id,
    points_earned,
    is_correct,
    evaluation_details IS NOT NULL as has_evaluation_details
FROM exam_responses 
LIMIT 3;

SELECT 
    'Sample exam_results' as info,
    id,
    exam_session_id,
    text_evaluation_summary IS NOT NULL as has_text_evaluation,
    hiring_recommendations IS NOT NULL as has_hiring_recommendations,
    text_evaluation_completed
FROM exam_results 
LIMIT 3;
