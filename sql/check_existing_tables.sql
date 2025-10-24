-- Check existing tables in Supabase database
-- Run this to see what tables currently exist

-- Check all tables in public schema
SELECT 
    'Existing Tables' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if exam-related tables already exist
SELECT 
    'Exam Tables Check' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_topics' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as question_topics,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_question_categories' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as job_question_categories,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_questions' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as exam_questions,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_sessions' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as exam_sessions,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_responses' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as exam_responses,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_results' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as exam_results;

-- Check existing table structures
SELECT 
    'Table Structures' as info,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'candidates', 'job_descriptions')
ORDER BY table_name, ordinal_position;
