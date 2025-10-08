-- Test Interviews Table Migration
-- This script tests the updated interviews table schema
-- Run this after applying update_interviews_table_schema.sql

-- ==============================================
-- STEP 1: VERIFY TABLE STRUCTURE
-- ==============================================

-- Check if all required columns exist
SELECT 
    'Column Verification' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'ai_agent_id') 
        THEN 'PASS' ELSE 'FAIL' 
    END as ai_agent_id_exists,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'interview_type') 
        THEN 'PASS' ELSE 'FAIL' 
    END as interview_type_exists,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'interview_notes') 
        THEN 'PASS' ELSE 'FAIL' 
    END as interview_notes_exists,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'interview_duration') 
        THEN 'PASS' ELSE 'FAIL' 
    END as interview_duration_exists;

-- ==============================================
-- STEP 2: TEST INSERT OPERATION
-- ==============================================

-- Test inserting a new interview with all new fields
DO $$
DECLARE
    test_candidate_id UUID;
    test_job_id UUID;
    test_agent_id UUID;
    test_interview_id UUID;
BEGIN
    -- Get a candidate ID (use first available)
    SELECT id INTO test_candidate_id FROM candidates LIMIT 1;
    
    -- Get a job description ID (use first available)
    SELECT id INTO test_job_id FROM job_descriptions LIMIT 1;
    
    -- Get an AI agent ID (use first available)
    SELECT id INTO test_agent_id FROM ai_agents LIMIT 1;
    
    -- Only proceed if we have all required data
    IF test_candidate_id IS NOT NULL AND test_job_id IS NOT NULL THEN
        -- Insert test interview
        INSERT INTO interviews (
            candidate_id,
            job_description_id,
            ai_agent_id,
            interview_type,
            interview_duration,
            interview_notes,
            scheduled_at,
            status
        ) VALUES (
            test_candidate_id,
            test_job_id,
            test_agent_id,
            'technical',
            45,
            'Test interview for migration verification',
            NOW() + INTERVAL '1 day',
            'scheduled'
        ) RETURNING id INTO test_interview_id;
        
        RAISE NOTICE 'Test interview inserted successfully with ID: %', test_interview_id;
        
        -- Verify the insert worked correctly
        PERFORM 1 FROM interviews 
        WHERE id = test_interview_id 
        AND interview_type = 'technical'
        AND interview_duration = 45
        AND interview_notes = 'Test interview for migration verification';
        
        IF FOUND THEN
            RAISE NOTICE 'Insert verification: PASS';
        ELSE
            RAISE NOTICE 'Insert verification: FAIL';
        END IF;
        
        -- Clean up test data
        DELETE FROM interviews WHERE id = test_interview_id;
        RAISE NOTICE 'Test data cleaned up';
        
    ELSE
        RAISE NOTICE 'Cannot run insert test - missing required data (candidates, job_descriptions, or ai_agents)';
    END IF;
END $$;

-- ==============================================
-- STEP 3: TEST UPDATE OPERATION
-- ==============================================

-- Test updating interview_duration and verify duration sync
DO $$
DECLARE
    test_interview_id UUID;
    original_duration INTEGER;
    original_interview_duration INTEGER;
BEGIN
    -- Get an existing interview
    SELECT id, duration, interview_duration 
    INTO test_interview_id, original_duration, original_interview_duration
    FROM interviews 
    LIMIT 1;
    
    IF test_interview_id IS NOT NULL THEN
        -- Update interview_duration
        UPDATE interviews 
        SET interview_duration = 90 
        WHERE id = test_interview_id;
        
        -- Check if duration was also updated (should be synced by trigger)
        SELECT duration, interview_duration 
        INTO original_duration, original_interview_duration
        FROM interviews 
        WHERE id = test_interview_id;
        
        IF original_duration = 90 AND original_interview_duration = 90 THEN
            RAISE NOTICE 'Duration sync test: PASS (both columns updated to 90)';
        ELSE
            RAISE NOTICE 'Duration sync test: FAIL (duration: %, interview_duration: %)', original_duration, original_interview_duration;
        END IF;
        
        -- Restore original values
        UPDATE interviews 
        SET duration = original_duration, interview_duration = original_interview_duration
        WHERE id = test_interview_id;
        
    ELSE
        RAISE NOTICE 'Cannot run update test - no existing interviews found';
    END IF;
END $$;

-- ==============================================
-- STEP 4: TEST FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Test that ai_agent_id foreign key works
DO $$
DECLARE
    test_candidate_id UUID;
    test_job_id UUID;
    invalid_agent_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Get test data
    SELECT id INTO test_candidate_id FROM candidates LIMIT 1;
    SELECT id INTO test_job_id FROM job_descriptions LIMIT 1;
    
    IF test_candidate_id IS NOT NULL AND test_job_id IS NOT NULL THEN
        -- Try to insert with invalid ai_agent_id (should fail)
        BEGIN
            INSERT INTO interviews (
                candidate_id,
                job_description_id,
                ai_agent_id,
                interview_type,
                interview_duration,
                scheduled_at,
                status
            ) VALUES (
                test_candidate_id,
                test_job_id,
                invalid_agent_id,
                'technical',
                30,
                NOW() + INTERVAL '1 day',
                'scheduled'
            );
            
            RAISE NOTICE 'Foreign key constraint test: FAIL (should have failed)';
            
        EXCEPTION WHEN foreign_key_violation THEN
            RAISE NOTICE 'Foreign key constraint test: PASS (correctly rejected invalid ai_agent_id)';
        END;
    ELSE
        RAISE NOTICE 'Cannot run foreign key test - missing required data';
    END IF;
END $$;

-- ==============================================
-- STEP 5: PERFORMANCE TEST
-- ==============================================

-- Test query performance with new indexes
EXPLAIN (ANALYZE, BUFFERS) 
SELECT i.*, c.name as candidate_name, jd.title as job_title, aa.name as agent_name
FROM interviews i
LEFT JOIN candidates c ON i.candidate_id = c.id
LEFT JOIN job_descriptions jd ON i.job_description_id = jd.id
LEFT JOIN ai_agents aa ON i.ai_agent_id = aa.id
WHERE i.interview_type = 'technical'
ORDER BY i.scheduled_at DESC
LIMIT 10;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Interviews Table Migration Tests Completed!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tests performed:';
    RAISE NOTICE '- Column existence verification ✓';
    RAISE NOTICE '- Insert operation test ✓';
    RAISE NOTICE '- Update operation test ✓';
    RAISE NOTICE '- Foreign key constraint test ✓';
    RAISE NOTICE '- Query performance test ✓';
    RAISE NOTICE '';
    RAISE NOTICE 'Check the results above for any FAIL messages.';
    RAISE NOTICE 'All tests should show PASS for successful migration.';
    RAISE NOTICE '==============================================';
END $$;
