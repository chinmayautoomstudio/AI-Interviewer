-- Add admin users: Dillip Sahoo, Aditya Sahoo, and Udit Sahoo
-- Run this script in the Supabase SQL Editor
--
-- IMPORTANT: This script adds users to the 'users' table with admin role.
-- You MUST create these users in Supabase Auth FIRST (Authentication > Users > Add User)
-- with the same email addresses and passwords:
-- 1. dillip.sahoo@autoomstudio.com / Dillip@ut00m
-- 2. aditya.sahoo@autoomstudio.com / Aditya@ut00m
-- 3. udit.sahoo@autoomstudio.com / Udit@ut00m
--
-- After creating users in Supabase Auth, run this script to add them to the users table.
-- The user IDs will be automatically linked by email when they log in.
--
-- STEP 1: First check the actual table structure if this script fails
-- Run this query first to see what columns exist:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- STEP 2: Insert admin users into users table
-- This version uses minimal required columns based on actual table structure
-- If this fails, check the table structure first using the query above

-- Insert admin users with columns that actually exist based on code usage
-- The code only uses: id, email, name, role, created_at, last_login
-- Based on admin_users table structure, the users table likely has:
-- id, email, name, role, created_at, updated_at, last_login
INSERT INTO users (email, name, role, created_at, updated_at) 
VALUES 
  (
    'dillip.sahoo@autoomstudio.com',
    'Dillip Sahoo',
    'admin',
    NOW(),
    NOW()
  ),
  (
    'aditya.sahoo@autoomstudio.com',
    'Aditya Sahoo',
    'admin',
    NOW(),
    NOW()
  ),
  (
    'udit.sahoo@autoomstudio.com',
    'Udit Sahoo',
    'admin',
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verify the users were created
SELECT 
  id,
  email,
  name,
  role,
  created_at,
  updated_at
FROM users 
WHERE email IN ('dillip.sahoo@autoomstudio.com', 'aditya.sahoo@autoomstudio.com', 'udit.sahoo@autoomstudio.com');

