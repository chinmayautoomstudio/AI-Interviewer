-- Quick Verification of Interviews Table Migration
-- Run this to check if the migration was successful

-- ==============================================
-- CHECK CURRENT TABLE STRUCTURE
-- ==============================================

SELECT 
    'Current Interviews Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'interviews' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==============================================
-- VERIFY REQUIRED COLUMNS EXIST
-- ==============================================

SELECT 
    'Column Verification Results' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'ai_agent_id') 
        THEN '✅ PASS' ELSE '❌ FAIL' 
    END as ai_agent_id,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'interview_type') 
        THEN '✅ PASS' ELSE '❌ FAIL' 
    END as interview_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'interview_notes') 
        THEN '✅ PASS' ELSE '❌ FAIL' 
    END as interview_notes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'interview_duration') 
        THEN '✅ PASS' ELSE '❌ FAIL' 
    END as interview_duration,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'duration') 
        THEN '✅ PASS' ELSE '❌ FAIL' 
    END as duration;

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
-- CHECK INDEXES
-- ==============================================

SELECT
    'Indexes on Interviews Table' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'interviews'
    AND schemaname = 'public'
ORDER BY indexname;

-- ==============================================
-- CHECK TRIGGERS
-- ==============================================

SELECT
    'Triggers on Interviews Table' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'interviews'
    AND event_object_schema = 'public'
ORDER BY trigger_name;

-- ==============================================
-- SAMPLE DATA CHECK
-- ==============================================

SELECT 
    'Sample Data Check' as info,
    COUNT(*) as total_interviews,
    COUNT(ai_agent_id) as interviews_with_agent,
    COUNT(interview_type) as interviews_with_type,
    COUNT(interview_duration) as interviews_with_duration
FROM interviews;

-- ==============================================
-- MIGRATION STATUS SUMMARY
-- ==============================================

DO $$
DECLARE
    ai_agent_exists BOOLEAN;
    interview_type_exists BOOLEAN;
    interview_notes_exists BOOLEAN;
    interview_duration_exists BOOLEAN;
    duration_exists BOOLEAN;
    total_columns INTEGER;
BEGIN
    -- Check column existence
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'ai_agent_id') INTO ai_agent_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'interview_type') INTO interview_type_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'interview_notes') INTO interview_notes_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'interview_duration') INTO interview_duration_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'duration') INTO duration_exists;
    
    -- Count total columns
    SELECT COUNT(*) INTO total_columns FROM information_schema.columns WHERE table_name = 'interviews' AND table_schema = 'public';
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'INTERVIEWS TABLE MIGRATION STATUS';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Total columns in interviews table: %', total_columns;
    RAISE NOTICE '';
    RAISE NOTICE 'Required columns status:';
    RAISE NOTICE '- ai_agent_id: %', CASE WHEN ai_agent_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '- interview_type: %', CASE WHEN interview_type_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '- interview_notes: %', CASE WHEN interview_notes_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '- interview_duration: %', CASE WHEN interview_duration_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '- duration: %', CASE WHEN duration_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '';
    
    IF ai_agent_exists AND interview_type_exists AND interview_notes_exists AND interview_duration_exists THEN
        RAISE NOTICE '🎉 MIGRATION STATUS: SUCCESS!';
        RAISE NOTICE 'All required columns have been added successfully.';
        RAISE NOTICE 'The interviews table is ready for the frontend code.';
    ELSE
        RAISE NOTICE '⚠️  MIGRATION STATUS: INCOMPLETE';
        RAISE NOTICE 'Some required columns are missing.';
        RAISE NOTICE 'Please run the migration script again.';
    END IF;
    
    RAISE NOTICE '==============================================';
END $$;
