-- Check Current Interviews Table Structure
-- Run this first to see what columns actually exist in your interviews table

-- ==============================================
-- CHECK TABLE EXISTENCE
-- ==============================================

SELECT 
    'Table Existence Check' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'interviews' 
            AND table_schema = 'public'
        ) 
        THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as table_status;

-- ==============================================
-- CHECK CURRENT COLUMNS
-- ==============================================

SELECT 
    'Current Interviews Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'interviews' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==============================================
-- CHECK FOREIGN KEY CONSTRAINTS
-- ==============================================

SELECT
    'Foreign Key Constraints' as info,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'interviews'
ORDER BY tc.constraint_name;

-- ==============================================
-- CHECK DATA SAMPLE
-- ==============================================

-- Show sample data (if any exists)
SELECT 
    'Sample Data' as info,
    COUNT(*) as total_records
FROM interviews;

-- Show first few records (if any exist)
SELECT 
    'Sample Records' as info,
    *
FROM interviews
LIMIT 3;

-- ==============================================
-- CHECK RELATED TABLES
-- ==============================================

-- Check if related tables exist
SELECT 
    'Related Tables Check' as info,
    table_name,
    CASE 
        WHEN table_name = 'candidates' THEN 'Required for interviews.candidate_id'
        WHEN table_name = 'job_descriptions' THEN 'Required for interviews.job_description_id'
        WHEN table_name = 'ai_agents' THEN 'Required for interviews.ai_agent_id'
        ELSE 'Other table'
    END as purpose
FROM information_schema.tables 
WHERE table_name IN ('candidates', 'job_descriptions', 'ai_agents')
    AND table_schema = 'public'
ORDER BY table_name;
