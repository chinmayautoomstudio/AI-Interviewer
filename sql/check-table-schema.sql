-- Check the actual schema of exam_responses and exam_results tables
-- Run this in your Supabase SQL editor

-- 1. Check exam_responses table structure
SELECT 
    'exam_responses' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'exam_responses'
ORDER BY ordinal_position;

-- 2. Check exam_results table structure  
SELECT 
    'exam_results' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'exam_results'
ORDER BY ordinal_position;

-- 3. Check if specific columns exist
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('exam_responses', 'exam_results')
    AND column_name IN (
        'evaluation_details',
        'points_earned', 
        'is_correct',
        'text_evaluation_summary',
        'hiring_recommendations',
        'processing_metadata',
        'text_evaluation_completed',
        'text_evaluation_timestamp'
    )
ORDER BY table_name, column_name;

-- 4. Check current data in exam_responses (sample)
SELECT 
    id,
    exam_session_id,
    question_id,
    points_earned,
    is_correct,
    evaluation_details IS NOT NULL as has_evaluation_details
FROM exam_responses 
LIMIT 5;

-- 5. Check current data in exam_results (sample)
SELECT 
    id,
    exam_session_id,
    text_evaluation_summary IS NOT NULL as has_text_evaluation,
    hiring_recommendations IS NOT NULL as has_hiring_recommendations,
    text_evaluation_completed
FROM exam_results 
LIMIT 5;
