-- Update existing job descriptions with missing job_description_id and created_by
-- This script fixes data integrity issues for existing records

-- Function to generate job description ID from title
CREATE OR REPLACE FUNCTION generate_job_description_id(title TEXT)
RETURNS TEXT AS $$
DECLARE
    words TEXT[];
    abbreviation TEXT;
    timestamp_part TEXT;
BEGIN
    -- Split title into words
    words := string_to_array(trim(title), ' ');
    
    -- Generate abbreviation
    IF array_length(words, 1) >= 2 THEN
        -- Take first letter of first two words
        abbreviation := upper(substring(words[1], 1, 1) || substring(words[2], 1, 1));
    ELSIF array_length(words, 1) = 1 THEN
        -- Take first 3 letters if only one word
        abbreviation := upper(substring(words[1], 1, 3));
    ELSE
        abbreviation := 'JD';
    END IF;
    
    -- Generate timestamp-based number (last 4 digits)
    timestamp_part := substring(extract(epoch from now())::text, -4);
    
    RETURN 'AS-' || abbreviation || '-' || timestamp_part;
END;
$$ LANGUAGE plpgsql;

-- Update job descriptions with null job_description_id
UPDATE job_descriptions 
SET job_description_id = generate_job_description_id(title)
WHERE job_description_id IS NULL;

-- Update job descriptions with null created_by (set to a default user if needed)
-- Note: You may need to replace 'your-user-id' with an actual user ID from auth.users
-- UPDATE job_descriptions 
-- SET created_by = 'your-user-id'
-- WHERE created_by IS NULL;

-- Drop the temporary function
DROP FUNCTION generate_job_description_id(TEXT);

-- Success message
SELECT 'Job descriptions updated with missing data!' as status;
