-- Create 2FA verification codes table
-- Run this script in the Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create 2FA verification codes table
CREATE TABLE IF NOT EXISTS two_factor_verification (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_two_factor_verification_email ON two_factor_verification(email);
CREATE INDEX IF NOT EXISTS idx_two_factor_verification_code ON two_factor_verification(verification_code);
CREATE INDEX IF NOT EXISTS idx_two_factor_verification_expires ON two_factor_verification(expires_at);

-- Create function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM two_factor_verification 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically clean up expired codes
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_codes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM cleanup_expired_verification_codes();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs cleanup on insert
DROP TRIGGER IF EXISTS cleanup_expired_codes_trigger ON two_factor_verification;
CREATE TRIGGER cleanup_expired_codes_trigger
  AFTER INSERT ON two_factor_verification
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_expired_codes();

-- Enable Row Level Security
ALTER TABLE two_factor_verification ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own verification codes" ON two_factor_verification;
CREATE POLICY "Users can view their own verification codes" ON two_factor_verification 
  FOR SELECT USING (email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Allow verification code creation" ON two_factor_verification;
CREATE POLICY "Allow verification code creation" ON two_factor_verification 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow verification code updates" ON two_factor_verification;
CREATE POLICY "Allow verification code updates" ON two_factor_verification 
  FOR UPDATE USING (email = auth.jwt() ->> 'email');

-- Add 2FA settings to users table (if it exists)
-- Note: This will work with the existing users table from create-users-table.sql
DO $$ 
BEGIN
    -- Check if users table exists and add 2FA columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_setup_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_verification_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added 2FA columns to existing users table';
    ELSE
        RAISE NOTICE 'Users table does not exist. Please run create-users-table.sql first.';
    END IF;
END $$;

-- Create function to generate verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS VARCHAR(6) AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create function to create verification code
CREATE OR REPLACE FUNCTION create_verification_code(
  p_user_id UUID,
  p_email VARCHAR(255)
)
RETURNS VARCHAR(6) AS $$
DECLARE
  v_code VARCHAR(6);
BEGIN
  -- Generate a unique 6-digit code
  v_code := generate_verification_code();
  
  -- Insert the verification code
  INSERT INTO two_factor_verification (user_id, email, verification_code, expires_at)
  VALUES (p_user_id, p_email, v_code, NOW() + INTERVAL '10 minutes');
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to verify code
CREATE OR REPLACE FUNCTION verify_2fa_code(
  p_email VARCHAR(255),
  p_code VARCHAR(6)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Check if code exists and is not expired or used
  SELECT COUNT(*) INTO v_count
  FROM two_factor_verification
  WHERE email = p_email
    AND verification_code = p_code
    AND expires_at > NOW()
    AND is_used = FALSE;
  
  IF v_count > 0 THEN
    -- Mark code as used
    UPDATE two_factor_verification
    SET is_used = TRUE, used_at = NOW()
    WHERE email = p_email
      AND verification_code = p_code
      AND expires_at > NOW()
      AND is_used = FALSE;
    
    -- Update user's last verification time
    UPDATE users
    SET last_verification_at = NOW()
    WHERE email = p_email;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
