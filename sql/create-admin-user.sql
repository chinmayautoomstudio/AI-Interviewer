-- Create admin user in Supabase
-- Run this script in the Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'hr_manager', 'recruiter');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON admin_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Admin users can view all data" ON admin_users;
CREATE POLICY "Admin users can view all data" ON admin_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin users can update their own data" ON admin_users;
CREATE POLICY "Admin users can update their own data" ON admin_users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin users can insert data" ON admin_users;
CREATE POLICY "Admin users can insert data" ON admin_users FOR INSERT WITH CHECK (true);

-- Insert the admin user
INSERT INTO admin_users (email, name, role, created_at, updated_at) 
VALUES (
  'admin@test.com',
  'Admin Dashboard',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verify the user was created
SELECT 
  id,
  email,
  name,
  role,
  created_at,
  updated_at
FROM admin_users 
WHERE email = 'admin@test.com';
