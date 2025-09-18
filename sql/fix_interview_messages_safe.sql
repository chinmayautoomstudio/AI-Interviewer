-- Safe Fix for Interview Messages Foreign Key
-- This version handles type conversion more safely

-- Step 1: Backup current data
CREATE TABLE interview_messages_backup AS 
SELECT * FROM interview_messages;

-- Step 2: Drop existing foreign key
ALTER TABLE interview_messages 
DROP CONSTRAINT IF EXISTS fk_interview_messages_session_id;

-- Step 3: Add a temporary column for the new session_id values
ALTER TABLE interview_messages 
ADD COLUMN temp_session_id VARCHAR(50);

-- Step 4: Update the temporary column with session_id values
UPDATE interview_messages 
SET temp_session_id = (
    SELECT s.session_id 
    FROM interview_sessions s 
    WHERE s.id = interview_messages.interview_session_id::uuid
)
WHERE interview_session_id IS NOT NULL;

-- Step 5: Drop the old column and rename the new one
ALTER TABLE interview_messages 
DROP COLUMN interview_session_id;

ALTER TABLE interview_messages 
RENAME COLUMN temp_session_id TO interview_session_id;

-- Step 6: Make the column NOT NULL
ALTER TABLE interview_messages 
ALTER COLUMN interview_session_id SET NOT NULL;

-- Step 7: Add new foreign key constraint
ALTER TABLE interview_messages 
ADD CONSTRAINT fk_interview_messages_session_id 
FOREIGN KEY (interview_session_id) REFERENCES interview_sessions(session_id) ON DELETE CASCADE;

-- Step 8: Recreate index
DROP INDEX IF EXISTS idx_interview_messages_session_id;
CREATE INDEX idx_interview_messages_session_id ON interview_messages(interview_session_id);

-- Verification
SELECT 
    'Fixed Structure' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'interview_messages' 
    AND column_name = 'interview_session_id';
