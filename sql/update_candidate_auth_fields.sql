-- Update Candidate Authentication Fields (Simplified)
-- This script adds the missing last_login field and ensures existing auth fields are properly configured
-- Run this script in the Supabase SQL Editor

-- ==============================================
-- STEP 1: CHECK CURRENT CANDIDATES TABLE STRUCTURE
-- ==============================================

-- Display current table structure
SELECT 
    'Current Candidates Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'candidates' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==============================================
-- STEP 2: ADD MISSING last_login FIELD
-- ==============================================

-- Add last_login column (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'last_login'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added last_login column to candidates table';
    ELSE
        RAISE NOTICE 'last_login column already exists in candidates table';
    END IF;
END $$;

-- ==============================================
-- STEP 3: ENSURE PROPER CONSTRAINTS ON EXISTING FIELDS
-- ==============================================

-- Make username unique if it isn't already
DO $$
BEGIN
    -- Check if unique constraint exists on username
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'candidates' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%username%'
    ) THEN
        -- Add unique constraint to username
        ALTER TABLE candidates 
        ADD CONSTRAINT candidates_username_unique UNIQUE (username);
        
        RAISE NOTICE 'Added unique constraint to username column';
    ELSE
        RAISE NOTICE 'Username unique constraint already exists';
    END IF;
END $$;

-- ==============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Create index on username for faster lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_candidates_username ON candidates(username);

-- Create index on credentials_generated for filtering (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_candidates_credentials_generated ON candidates(credentials_generated);

-- Create index on last_login for sorting (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_candidates_last_login ON candidates(last_login);

-- ==============================================
-- STEP 5: UPDATE EXISTING CANDIDATES (OPTIONAL)
-- ==============================================

-- Generate usernames for existing candidates who don't have them
UPDATE candidates 
SET username = COALESCE(
    username,
    LOWER(SPLIT_PART(email, '@', 1)) || '_' || SUBSTRING(id::text, 1, 8)
)
WHERE username IS NULL;

-- ==============================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- ==============================================

-- Function to generate temporary credentials for a candidate
CREATE OR REPLACE FUNCTION generate_candidate_credentials(candidate_id UUID)
RETURNS TABLE(username TEXT, password_hash TEXT) AS $$
DECLARE
    candidate_email TEXT;
    generated_username TEXT;
    generated_password TEXT;
    hashed_password TEXT;
BEGIN
    -- Get candidate email
    SELECT email INTO candidate_email
    FROM candidates
    WHERE id = candidate_id;
    
    IF candidate_email IS NULL THEN
        RAISE EXCEPTION 'Candidate not found with ID: %', candidate_id;
    END IF;
    
    -- Generate username (email prefix + random suffix)
    generated_username := LOWER(SPLIT_PART(candidate_email, '@', 1)) || '_' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 4);
    
    -- Generate password (8 random chars + 8 random chars uppercase)
    generated_password := SUBSTRING(MD5(RANDOM()::TEXT), 1, 8) || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    
    -- Hash password (simple hash for development - use bcrypt in production)
    hashed_password := ENCODE(SHA256((generated_password || 'candidate_salt_2024')::BYTEA), 'base64');
    
    -- Update candidate record
    UPDATE candidates
    SET 
        username = generated_username,
        password_hash = hashed_password,
        credentials_generated = TRUE,
        credentials_generated_at = NOW(),
        updated_at = NOW()
    WHERE id = candidate_id;
    
    -- Return the plain credentials (for email sending)
    RETURN QUERY SELECT generated_username, generated_password;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- STEP 7: VERIFY CHANGES
-- ==============================================

-- Display updated table structure
SELECT 
    'Updated Candidates Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'candidates' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample of updated data
SELECT 
    'Sample Updated Candidates' as info,
    id,
    name,
    email,
    username,
    credentials_generated,
    status
FROM candidates
LIMIT 5;

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Candidate authentication fields updated successfully!';
    RAISE NOTICE '📋 Added missing field: last_login';
    RAISE NOTICE '🔍 Ensured proper constraints and indexes';
    RAISE NOTICE '🛠️ Updated helper function: generate_candidate_credentials()';
    RAISE NOTICE '📧 Ready to send interview invitations with login credentials!';
END $$;
