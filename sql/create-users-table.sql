-- Create users table for registration and authentication
-- Run this script in the Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'hr_manager', 'recruiter');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'recruiter',
  status user_status NOT NULL DEFAULT 'pending',
  company VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
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
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Allow user registration" ON users;
CREATE POLICY "Allow user registration" ON users FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company);

-- Insert some default admin users (optional)
INSERT INTO users (email, name, password_hash, role, status, company, created_at, updated_at) 
VALUES 
  (
    'admin@test.com',
    'Admin Dashboard',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8KzK', -- Admin@2025
    'admin',
    'active',
    'AI Interviewer',
    NOW(),
    NOW()
  ),
  (
    'awsadmin@test.com',
    'AWS Admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8KzK', -- AWSAdmin@2025
    'admin',
    'active',
    'AI Interviewer',
    NOW(),
    NOW()
  ),
  (
    'chinmay.nayak@autoomstudio.com',
    'Chinmay Nayak',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8KzK', -- Chinmay@2000
    'admin',
    'active',
    'AutoOM Studio',
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  company = EXCLUDED.company,
  updated_at = NOW();

-- Verify the users were created
SELECT 
  id,
  email,
  name,
  role,
  status,
  company,
  created_at
FROM users 
WHERE email IN ('admin@test.com', 'awsadmin@test.com', 'chinmay.nayak@autoomstudio.com');
