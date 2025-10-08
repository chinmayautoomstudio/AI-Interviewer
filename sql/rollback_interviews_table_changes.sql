-- Rollback Interviews Table Schema Changes
-- This script removes the columns added by update_interviews_table_schema.sql
-- Use this if you need to revert the changes

-- ==============================================
-- STEP 1: DROP TRIGGER
-- ==============================================

DROP TRIGGER IF EXISTS sync_interview_duration_trigger ON interviews;
DROP FUNCTION IF EXISTS sync_interview_duration_columns();

-- ==============================================
-- STEP 2: DROP INDEXES
-- ==============================================

DROP INDEX IF EXISTS idx_interviews_ai_agent_id;
DROP INDEX IF EXISTS idx_interviews_interview_type;

-- ==============================================
-- STEP 3: DROP COLUMNS
-- ==============================================

-- Drop the added columns
ALTER TABLE interviews DROP COLUMN IF EXISTS ai_agent_id;
ALTER TABLE interviews DROP COLUMN IF EXISTS interview_type;
ALTER TABLE interviews DROP COLUMN IF EXISTS interview_notes;
ALTER TABLE interviews DROP COLUMN IF EXISTS interview_duration;

-- ==============================================
-- VERIFICATION
-- ==============================================

-- Verify the table structure is back to original
SELECT 
    'Rolled Back Interviews Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'interviews' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Interviews Table Changes Rolled Back Successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Removed columns:';
    RAISE NOTICE '- ai_agent_id ✓';
    RAISE NOTICE '- interview_type ✓';
    RAISE NOTICE '- interview_notes ✓';
    RAISE NOTICE '- interview_duration ✓';
    RAISE NOTICE '';
    RAISE NOTICE 'Removed:';
    RAISE NOTICE '- Sync trigger ✓';
    RAISE NOTICE '- Indexes ✓';
    RAISE NOTICE '';
    RAISE NOTICE 'The interviews table is back to its original state!';
    RAISE NOTICE '==============================================';
END $$;
