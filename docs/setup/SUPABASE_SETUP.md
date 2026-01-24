# Supabase Setup Guide

## 1. Get Your Supabase Credentials

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project (or create a new one)

### Step 2: Get API Credentials
1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon/Public Key**: `eyJ...` (long string)

## 2. Environment Configuration

Create a `.env` file in your project root with:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# n8n Workflow Integration
REACT_APP_N8N_BASE_URL=https://home.ausomemgr.com
REACT_APP_N8N_RESUME_WEBHOOK=https://home.ausomemgr.com/webhook-test/62b8d0b5-601c-41f0-aa13-68eb9bfd9fd8
```

## 3. Database Schema Setup

### Step 1: Access SQL Editor
1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**

### Step 2: Run the Schema Script
Copy and paste the following SQL script:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'hr_manager', 'recruiter')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    resume_url TEXT,
    resume_text TEXT,
    skills TEXT[],
    experience TEXT,
    education TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'reviewed')),
    interview_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_descriptions table
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[],
    skills TEXT[],
    experience VARCHAR(255),
    location VARCHAR(255),
    department VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    job_description_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interview_results table
CREATE TABLE IF NOT EXISTS interview_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    overall_score DECIMAL(3,1) NOT NULL,
    communication_score DECIMAL(3,1) NOT NULL,
    technical_score DECIMAL(3,1) NOT NULL,
    adaptability_score DECIMAL(3,1) NOT NULL,
    transcript TEXT,
    evaluation TEXT,
    recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidate_sessions table
CREATE TABLE IF NOT EXISTS candidate_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_status table
CREATE TABLE IF NOT EXISTS workflow_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    workflow_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    n8n_execution_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interview_results_interview_id ON interview_results(interview_id);
CREATE INDEX IF NOT EXISTS idx_candidate_sessions_token ON candidate_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_workflow_status_interview_id ON workflow_status(interview_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE ON job_descriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_status_updated_at BEFORE UPDATE ON workflow_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Set Up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
CREATE POLICY "Admin users can view all admin users" ON admin_users FOR SELECT USING (true);
CREATE POLICY "Admin users can insert admin users" ON admin_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin users can update admin users" ON admin_users FOR UPDATE USING (true);

-- Create policies for candidates
CREATE POLICY "Admin users can view all candidates" ON candidates FOR SELECT USING (true);
CREATE POLICY "Admin users can insert candidates" ON candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin users can update candidates" ON candidates FOR UPDATE USING (true);

-- Create policies for job_descriptions
CREATE POLICY "Admin users can view all job descriptions" ON job_descriptions FOR SELECT USING (true);
CREATE POLICY "Admin users can insert job descriptions" ON job_descriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin users can update job descriptions" ON job_descriptions FOR UPDATE USING (true);

-- Create policies for interviews
CREATE POLICY "Admin users can view all interviews" ON interviews FOR SELECT USING (true);
CREATE POLICY "Admin users can insert interviews" ON interviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin users can update interviews" ON interviews FOR UPDATE USING (true);

-- Create policies for interview_results
CREATE POLICY "Admin users can view all interview results" ON interview_results FOR SELECT USING (true);
CREATE POLICY "Admin users can insert interview results" ON interview_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin users can update interview results" ON interview_results FOR UPDATE USING (true);

-- Create policies for candidate_sessions
CREATE POLICY "Admin users can view all candidate sessions" ON candidate_sessions FOR SELECT USING (true);
CREATE POLICY "Admin users can insert candidate sessions" ON candidate_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin users can update candidate sessions" ON candidate_sessions FOR UPDATE USING (true);

-- Create policies for workflow_status
CREATE POLICY "Admin users can view all workflow status" ON workflow_status FOR SELECT USING (true);
CREATE POLICY "Admin users can insert workflow status" ON workflow_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin users can update workflow status" ON workflow_status FOR UPDATE USING (true);
```

## 4. Test the Connection

After setting up your credentials and database schema:

1. **Restart your development server**:
   ```bash
   npm start
   ```

2. **Check the browser console** for any Supabase connection errors

3. **Test the application** by:
   - Logging in with admin credentials
   - Adding a candidate
   - Uploading a resume

## 5. Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your Supabase project allows requests from `localhost:3000`
2. **RLS Policies**: Ensure Row Level Security policies are set up correctly
3. **Environment Variables**: Make sure `.env` file is in the correct location and variables are prefixed with `REACT_APP_`
4. **Database Schema**: Verify all tables are created successfully

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables are loaded
3. Test Supabase connection in the browser console:
   ```javascript
   import { supabase } from './src/services/supabase';
   console.log('Supabase client:', supabase);
   ```
