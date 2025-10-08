-- Update Interviews Table Schema
-- This script updates the interviews table to match the frontend code requirements
-- Run this script to add missing columns and fix column name mismatches

-- ==============================================
-- STEP 1: CHECK CURRENT TABLE STRUCTURE
-- ==============================================

-- Display current table structure
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
-- STEP 2: ADD MISSING COLUMNS
-- ==============================================

-- Add ai_agent_id column (references ai_agents table)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interviews' 
        AND column_name = 'ai_agent_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE interviews 
        ADD COLUMN ai_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added ai_agent_id column to interviews table';
    ELSE
        RAISE NOTICE 'ai_agent_id column already exists in interviews table';
    END IF;
END $$;

-- Add interview_type column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interviews' 
        AND column_name = 'interview_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE interviews 
        ADD COLUMN interview_type VARCHAR(50) DEFAULT 'general' 
        CHECK (interview_type IN ('technical', 'behavioral', 'hr', 'domain_specific', 'general'));
        
        RAISE NOTICE 'Added interview_type column to interviews table';
    ELSE
        RAISE NOTICE 'interview_type column already exists in interviews table';
    END IF;
END $$;

-- Add interview_notes column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interviews' 
        AND column_name = 'interview_notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE interviews 
        ADD COLUMN interview_notes TEXT;
        
        RAISE NOTICE 'Added interview_notes column to interviews table';
    ELSE
        RAISE NOTICE 'interview_notes column already exists in interviews table';
    END IF;
END $$;

-- ==============================================
-- STEP 3: HANDLE COLUMN NAME MISMATCH
-- ==============================================

-- The code expects 'interview_duration' but the table has 'duration'
-- We'll add 'interview_duration' as an alias column that references 'duration'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interviews' 
        AND column_name = 'interview_duration'
        AND table_schema = 'public'
    ) THEN
        -- Add interview_duration column that mirrors duration
        ALTER TABLE interviews 
        ADD COLUMN interview_duration INTEGER DEFAULT 60;
        
        -- Copy existing duration values to interview_duration
        UPDATE interviews 
        SET interview_duration = duration 
        WHERE interview_duration IS NULL;
        
        -- Make interview_duration NOT NULL after copying data
        ALTER TABLE interviews 
        ALTER COLUMN interview_duration SET NOT NULL;
        
        RAISE NOTICE 'Added interview_duration column to interviews table';
    ELSE
        RAISE NOTICE 'interview_duration column already exists in interviews table';
    END IF;
END $$;

-- ==============================================
-- STEP 4: CREATE TRIGGER TO KEEP DURATION COLUMNS IN SYNC
-- ==============================================

-- Create function to sync duration and interview_duration columns
CREATE OR REPLACE FUNCTION sync_interview_duration_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- If duration is updated, update interview_duration
    IF TG_OP = 'UPDATE' AND OLD.duration IS DISTINCT FROM NEW.duration THEN
        NEW.interview_duration = NEW.duration;
    END IF;
    
    -- If interview_duration is updated, update duration
    IF TG_OP = 'UPDATE' AND OLD.interview_duration IS DISTINCT FROM NEW.interview_duration THEN
        NEW.duration = NEW.interview_duration;
    END IF;
    
    -- For INSERT operations, ensure both columns have the same value
    IF TG_OP = 'INSERT' THEN
        IF NEW.duration IS NOT NULL AND NEW.interview_duration IS NULL THEN
            NEW.interview_duration = NEW.duration;
        ELSIF NEW.interview_duration IS NOT NULL AND NEW.duration IS NULL THEN
            NEW.duration = NEW.interview_duration;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep columns in sync
DROP TRIGGER IF EXISTS sync_interview_duration_trigger ON interviews;
CREATE TRIGGER sync_interview_duration_trigger
    BEFORE INSERT OR UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION sync_interview_duration_columns();

-- ==============================================
-- STEP 5: CREATE INDEXES FOR NEW COLUMNS
-- ==============================================

-- Create index on ai_agent_id for better query performance
CREATE INDEX IF NOT EXISTS idx_interviews_ai_agent_id ON interviews(ai_agent_id);

-- Create index on interview_type for filtering
CREATE INDEX IF NOT EXISTS idx_interviews_interview_type ON interviews(interview_type);

-- ==============================================
-- STEP 6: UPDATE EXISTING DATA
-- ==============================================

-- Set default interview_type for existing records
UPDATE interviews 
SET interview_type = 'general' 
WHERE interview_type IS NULL;

-- Ensure interview_duration matches duration for existing records
UPDATE interviews 
SET interview_duration = duration 
WHERE interview_duration != duration OR interview_duration IS NULL;

-- ==============================================
-- STEP 7: VERIFICATION
-- ==============================================

-- Verify the updated table structure
SELECT 
    'Updated Interviews Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'interviews' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify foreign key constraints
SELECT
    'Foreign Key Constraints' as info,
    tc.table_name,
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

-- Verify indexes
SELECT
    'Indexes on Interviews Table' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'interviews'
    AND schemaname = 'public'
ORDER BY indexname;

-- ==============================================
-- STEP 8: TEST DATA INTEGRITY
-- ==============================================

-- Test that duration and interview_duration are in sync
SELECT 
    'Duration Sync Test' as test,
    COUNT(*) as total_records,
    COUNT(CASE WHEN duration = interview_duration THEN 1 END) as synced_records,
    COUNT(CASE WHEN duration != interview_duration THEN 1 END) as unsynced_records
FROM interviews;

-- Test foreign key constraint to ai_agents
SELECT 
    'AI Agent FK Test' as test,
    COUNT(*) as total_interviews,
    COUNT(ai_agent_id) as interviews_with_agent,
    COUNT(*) - COUNT(ai_agent_id) as interviews_without_agent
FROM interviews;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Interviews Table Schema Updated Successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Added columns:';
    RAISE NOTICE '- ai_agent_id (references ai_agents.id) ✓';
    RAISE NOTICE '- interview_type (enum: technical, behavioral, hr, domain_specific, general) ✓';
    RAISE NOTICE '- interview_notes (TEXT) ✓';
    RAISE NOTICE '- interview_duration (INTEGER, synced with duration) ✓';
    RAISE NOTICE '';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '- Sync trigger for duration columns ✓';
    RAISE NOTICE '- Indexes for performance ✓';
    RAISE NOTICE '- Foreign key constraints ✓';
    RAISE NOTICE '';
    RAISE NOTICE 'The interviews table now matches the frontend code requirements!';
    RAISE NOTICE '==============================================';
END $$;
