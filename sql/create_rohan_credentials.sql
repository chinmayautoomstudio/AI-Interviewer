-- Create temporary login credentials for Rohan Patel
-- This script will add username and password to the candidates table

-- First, let's check if Rohan Patel exists
SELECT 
    id,
    candidate_id,
    name,
    email,
    phone,
    contact_number,
    username,
    credentials_generated,
    status
FROM candidates 
WHERE name ILIKE '%Rohan%Patel%' 
   OR name ILIKE '%Rohan Patel%'
   OR email ILIKE '%rohan%patel%';

-- If Rohan Patel exists, update with credentials
-- Username: rohan.patel
-- Password: Rohan@2024 (hashed with candidate_salt_2024)
-- Hash: Rohan@2024candidate_salt_2024 -> base64 encoded

UPDATE candidates 
SET 
    username = 'rohan.patel',
    password_hash = 'Um9oYW5AMjAyNGNhbmRpZGF0ZV9zYWx0XzIwMjQ=',  -- Rohan@2024candidate_salt_2024 in base64
    credentials_generated = true,
    credentials_generated_at = NOW(),
    status = 'active'
WHERE name ILIKE '%Rohan%Patel%' 
   OR name ILIKE '%Rohan Patel%'
   OR email ILIKE '%rohan%patel%';

-- Verify the update
SELECT 
    id,
    candidate_id,
    name,
    email,
    phone,
    contact_number,
    username,
    credentials_generated,
    credentials_generated_at,
    status,
    created_at
FROM candidates 
WHERE username = 'rohan.patel';

-- Show all candidates for reference
SELECT 
    id,
    candidate_id,
    name,
    email,
    username,
    credentials_generated,
    status
FROM candidates 
ORDER BY created_at DESC
LIMIT 10;

-- Success message
SELECT 'Rohan Patel credentials created successfully!' as status;
