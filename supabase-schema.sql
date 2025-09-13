-- AI Interviewer Platform Database Schema
-- This file contains the complete database schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'hr_manager', 'recruiter');
CREATE TYPE candidate_status AS ENUM ('pending', 'scheduled', 'in_progress', 'completed', 'reviewed');
CREATE TYPE interview_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Admin users table
CREATE TABLE admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'recruiter',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job descriptions table
CREATE TABLE job_descriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] NOT NULL DEFAULT '{}',
    skills TEXT[] NOT NULL DEFAULT '{}',
    experience VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    department VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidates table
CREATE TABLE candidates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    resume_url TEXT,
    status candidate_status NOT NULL DEFAULT 'pending',
    interview_id UUID REFERENCES interviews(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interviews table
CREATE TABLE interviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_description_id UUID NOT NULL REFERENCES job_descriptions(id),
    duration INTEGER NOT NULL DEFAULT 60, -- in minutes
    status interview_status NOT NULL DEFAULT 'scheduled',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview results table
CREATE TABLE interview_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    communication_score INTEGER NOT NULL CHECK (communication_score >= 0 AND communication_score <= 100),
    technical_score INTEGER NOT NULL CHECK (technical_score >= 0 AND technical_score <= 100),
    adaptability_score INTEGER NOT NULL CHECK (adaptability_score >= 0 AND adaptability_score <= 100),
    transcript TEXT NOT NULL,
    evaluation TEXT NOT NULL,
    recommendations TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidate sessions table (for temporary access tokens)
CREATE TABLE candidate_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow status table (for tracking n8n workflow execution)
CREATE TABLE workflow_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    workflow_type VARCHAR(50) NOT NULL, -- 'question_generation', 'live_interview', 'evaluation'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    n8n_execution_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX idx_interview_results_interview_id ON interview_results(interview_id);
CREATE INDEX idx_candidate_sessions_token ON candidate_sessions(session_token);
CREATE INDEX idx_candidate_sessions_expires ON candidate_sessions(expires_at);
CREATE INDEX idx_workflow_status_interview_id ON workflow_status(interview_id);
CREATE INDEX idx_workflow_status_type ON workflow_status(workflow_type);

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
CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE ON job_descriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_status_updated_at BEFORE UPDATE ON workflow_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false);

-- Set up Row Level Security (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin users
CREATE POLICY "Admin users can view all data" ON admin_users FOR SELECT USING (true);
CREATE POLICY "Admin users can update their own data" ON admin_users FOR UPDATE USING (auth.uid()::text = id::text);

-- Create RLS policies for candidates
CREATE POLICY "Admin users can manage candidates" ON candidates FOR ALL USING (true);
CREATE POLICY "Candidates can view their own data" ON candidates FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM candidate_sessions 
        WHERE candidate_sessions.candidate_id = candidates.id 
        AND candidate_sessions.session_token = current_setting('request.jwt.claims', true)::json->>'sub'
        AND candidate_sessions.expires_at > NOW()
    )
);

-- Create RLS policies for interviews
CREATE POLICY "Admin users can manage interviews" ON interviews FOR ALL USING (true);
CREATE POLICY "Candidates can view their own interviews" ON interviews FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM candidate_sessions 
        WHERE candidate_sessions.candidate_id = interviews.candidate_id 
        AND candidate_sessions.session_token = current_setting('request.jwt.claims', true)::json->>'sub'
        AND candidate_sessions.expires_at > NOW()
    )
);

-- Create RLS policies for interview results
CREATE POLICY "Admin users can manage interview results" ON interview_results FOR ALL USING (true);
CREATE POLICY "Candidates can view their own interview results" ON interview_results FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM interviews 
        JOIN candidate_sessions ON candidate_sessions.candidate_id = interviews.candidate_id
        WHERE interviews.id = interview_results.interview_id 
        AND candidate_sessions.session_token = current_setting('request.jwt.claims', true)::json->>'sub'
        AND candidate_sessions.expires_at > NOW()
    )
);

-- Create RLS policies for job descriptions
CREATE POLICY "Admin users can manage job descriptions" ON job_descriptions FOR ALL USING (true);
CREATE POLICY "Job descriptions are publicly readable" ON job_descriptions FOR SELECT USING (true);

-- Create RLS policies for candidate sessions
CREATE POLICY "Admin users can manage candidate sessions" ON candidate_sessions FOR ALL USING (true);

-- Create RLS policies for workflow status
CREATE POLICY "Admin users can manage workflow status" ON workflow_status FOR ALL USING (true);

-- Create storage policies
CREATE POLICY "Resumes are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
CREATE POLICY "Admin users can upload resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "Admin users can update resumes" ON storage.objects FOR UPDATE USING (bucket_id = 'resumes');
CREATE POLICY "Admin users can delete resumes" ON storage.objects FOR DELETE USING (bucket_id = 'resumes');

CREATE POLICY "Recordings are private" ON storage.objects FOR SELECT USING (bucket_id = 'recordings' AND auth.role() = 'authenticated');
CREATE POLICY "Admin users can manage recordings" ON storage.objects FOR ALL USING (bucket_id = 'recordings');

-- Insert sample data
INSERT INTO admin_users (email, name, role) VALUES 
('admin@company.com', 'System Administrator', 'admin'),
('hr@company.com', 'HR Manager', 'hr_manager'),
('recruiter@company.com', 'Senior Recruiter', 'recruiter');

INSERT INTO job_descriptions (title, description, requirements, skills, experience, department) VALUES 
('Senior Software Engineer', 'We are looking for a senior software engineer to join our development team.', 
 ARRAY['5+ years of software development experience', 'Strong problem-solving skills', 'Experience with modern frameworks'],
 ARRAY['JavaScript', 'React', 'Node.js', 'TypeScript', 'PostgreSQL'],
 '5+ years', 'Engineering'),
('Product Manager', 'Lead product development and strategy for our core platform.',
 ARRAY['3+ years of product management experience', 'Strong analytical skills', 'Experience with agile methodologies'],
 ARRAY['Product Strategy', 'Data Analysis', 'Agile', 'User Research', 'Project Management'],
 '3+ years', 'Product');

-- Create real-time subscriptions
-- These will be set up in the Supabase dashboard or via the API
