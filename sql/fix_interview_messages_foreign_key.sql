-- Fix Interview Messages Foreign Key
-- This script fixes the interview_messages table to use session_id instead of id as foreign key

-- ==============================================
-- STEP 1: BACKUP CURRENT DATA (if any)
-- ==============================================

-- Create a backup table with current data
CREATE TABLE IF NOT EXISTS interview_messages_backup AS 
SELECT * FROM interview_messages;

-- ==============================================
-- STEP 2: DROP EXISTING FOREIGN KEY CONSTRAINT
-- ==============================================

-- Drop the existing foreign key constraint
ALTER TABLE interview_messages 
DROP CONSTRAINT IF EXISTS fk_interview_messages_session_id;

-- ==============================================
-- STEP 3: UPDATE COLUMN TYPE AND DATA
-- ==============================================

-- First, let's see what data we have
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM interview_messages;
    RAISE NOTICE 'Current interview_messages records: %', record_count;
END $$;

-- Update the interview_session_id column to use session_id values
-- This will join with interview_sessions to get the correct session_id
UPDATE interview_messages 
SET interview_session_id = (
    SELECT s.session_id 
    FROM interview_sessions s 
    WHERE s.id = interview_messages.interview_session_id::uuid
)
WHERE interview_session_id IS NOT NULL
AND EXISTS (
    SELECT 1 
    FROM interview_sessions s 
    WHERE s.id = interview_messages.interview_session_id::uuid
);

-- ==============================================
-- STEP 4: ALTER COLUMN TYPE
-- ==============================================

-- Change the column type from UUID to VARCHAR(50)
ALTER TABLE interview_messages 
ALTER COLUMN interview_session_id TYPE VARCHAR(50);

-- ==============================================
-- STEP 5: ADD NEW FOREIGN KEY CONSTRAINT
-- ==============================================

-- Add the correct foreign key constraint to session_id
ALTER TABLE interview_messages 
ADD CONSTRAINT fk_interview_messages_session_id 
FOREIGN KEY (interview_session_id) REFERENCES interview_sessions(session_id) ON DELETE CASCADE;

-- ==============================================
-- STEP 6: UPDATE INDEXES
-- ==============================================

-- Drop the old index
DROP INDEX IF EXISTS idx_interview_messages_session_id;

-- Create new index on the updated column
CREATE INDEX idx_interview_messages_session_id ON interview_messages(interview_session_id);

-- ==============================================
-- STEP 7: VERIFICATION
-- ==============================================

-- Verify the changes
DO $$
DECLARE
    constraint_name TEXT;
    column_type TEXT;
    record_count INTEGER;
BEGIN
    -- Check if foreign key constraint exists
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'interview_messages'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name = 'fk_interview_messages_session_id';
    
    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE '✅ Foreign key constraint exists: %', constraint_name;
    ELSE
        RAISE NOTICE '❌ Foreign key constraint not found';
    END IF;
    
    -- Check column type
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_name = 'interview_messages'
    AND column_name = 'interview_session_id';
    
    RAISE NOTICE '✅ Column type: %', column_type;
    
    -- Check record count
    SELECT COUNT(*) INTO record_count FROM interview_messages;
    RAISE NOTICE '✅ Total records: %', record_count;
    
    -- Check if any records have invalid session_ids
    SELECT COUNT(*) INTO record_count
    FROM interview_messages im
    WHERE NOT EXISTS (
        SELECT 1 FROM interview_sessions s 
        WHERE s.session_id = im.interview_session_id
    );
    
    IF record_count > 0 THEN
        RAISE NOTICE '⚠️ Warning: % records have invalid session_ids', record_count;
    ELSE
        RAISE NOTICE '✅ All records have valid session_ids';
    END IF;
END $$;

-- ==============================================
-- STEP 8: SHOW FINAL STRUCTURE
-- ==============================================

-- Display the final table structure
SELECT 
    'Final Structure' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'interview_messages' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Interview Messages Foreign Key Fixed!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '- Changed interview_session_id from UUID to VARCHAR(50) ✓';
    RAISE NOTICE '- Updated foreign key to reference session_id ✓';
    RAISE NOTICE '- Updated all existing data to use session_id ✓';
    RAISE NOTICE '- Recreated indexes ✓';
    RAISE NOTICE '- Backup created: interview_messages_backup ✓';
    RAISE NOTICE '==============================================';
END $$;
