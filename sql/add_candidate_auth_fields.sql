-- Add authentication fields to candidates table
-- This script adds username and password fields for candidate login

-- Add username field (unique)
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Add password field (hashed)
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add interview credentials generated flag
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS credentials_generated BOOLEAN DEFAULT FALSE;

-- Add interview credentials generated date
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS credentials_generated_at TIMESTAMP WITH TIME ZONE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidates_username ON candidates(username);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);

-- Update existing candidates with default username (if not exists)
-- Format: firstname.lastname (lowercase, no spaces)
UPDATE candidates 
SET username = LOWER(REPLACE(SPLIT_PART(name, ' ', 1), ' ', '') || '.' || REPLACE(SPLIT_PART(name, ' ', 2), ' ', ''))
WHERE username IS NULL AND name IS NOT NULL;

-- For single names, use the name itself
UPDATE candidates 
SET username = LOWER(REPLACE(name, ' ', ''))
WHERE username IS NULL AND name IS NOT NULL AND array_length(string_to_array(name, ' '), 1) = 1;

-- Show the results
SELECT 
    id,
    candidate_id,
    name,
    email,
    username,
    credentials_generated,
    credentials_generated_at,
    status
FROM candidates
ORDER BY created_at DESC
LIMIT 10;

-- Success message
SELECT 'Authentication fields added to candidates table!' as status;
