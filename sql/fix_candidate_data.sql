-- Fix existing candidates with missing candidate_id or contact_number
-- This script updates existing candidates to have proper candidate_id and contact_number

-- Update candidates with missing candidate_id
-- Generate candidate ID in format AS-{NAME_ABBREVIATION}-{LAST4_CONTACT}-{TIMESTAMP}
-- AS = Autoom Studio, Name abbreviation, Last 4 digits of contact, Timestamp
UPDATE candidates 
SET candidate_id = CASE 
  WHEN array_length(string_to_array(name, ' '), 1) >= 2 THEN
    'AS-' || UPPER(SUBSTRING(SPLIT_PART(name, ' ', 1), 1, 1) || SUBSTRING(SPLIT_PART(name, ' ', 2), 1, 1)) || '-' || 
    COALESCE(RIGHT(REGEXP_REPLACE(COALESCE(phone, contact_number, ''), '[^0-9]', '', 'g'), 4), '0000') || '-' ||
    RIGHT(EXTRACT(EPOCH FROM created_at)::text, 4)
  WHEN array_length(string_to_array(name, ' '), 1) = 1 THEN
    'AS-' || UPPER(SUBSTRING(name, 1, 3)) || '-' || 
    COALESCE(RIGHT(REGEXP_REPLACE(COALESCE(phone, contact_number, ''), '[^0-9]', '', 'g'), 4), '0000') || '-' ||
    RIGHT(EXTRACT(EPOCH FROM created_at)::text, 4)
  ELSE
    'AS-CAN-' || 
    COALESCE(RIGHT(REGEXP_REPLACE(COALESCE(phone, contact_number, ''), '[^0-9]', '', 'g'), 4), '0000') || '-' ||
    RIGHT(EXTRACT(EPOCH FROM created_at)::text, 4)
END
WHERE candidate_id IS NULL OR candidate_id = '';

-- Update candidates with missing contact_number (copy from phone if available)
UPDATE candidates 
SET contact_number = phone
WHERE (contact_number IS NULL OR contact_number = '') 
AND phone IS NOT NULL AND phone != '';

-- Show the results
SELECT 
    id,
    candidate_id,
    name,
    email,
    phone,
    contact_number,
    status,
    created_at
FROM candidates
ORDER BY created_at DESC
LIMIT 10;

-- Success message
SELECT 'Candidates updated with missing candidate_id and contact_number!' as status;
