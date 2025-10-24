-- Clean Exam System Database Schema
-- This script will drop existing exam tables and create them fresh
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- STEP 1: DROP EXISTING EXAM TABLES (if they exist)
-- ==============================================

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS exam_results CASCADE;
DROP TABLE IF EXISTS exam_responses CASCADE;
DROP TABLE IF EXISTS exam_sessions CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS job_question_categories CASCADE;
DROP TABLE IF EXISTS question_topics CASCADE;

-- ==============================================
-- STEP 2: CREATE EXAM TABLES
-- ==============================================

-- 1. Question Topics Table (Hierarchical topic management)
CREATE TABLE question_topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_topic_id UUID REFERENCES question_topics(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('technical', 'aptitude')),
  level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, category) -- Add unique constraint for ON CONFLICT
);

-- 2. Job Question Categories Table (Job-specific question distribution)
CREATE TABLE job_question_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_description_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES question_topics(id) ON DELETE CASCADE,
  weight_percentage INTEGER DEFAULT 0 CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
  min_questions INTEGER DEFAULT 0 CHECK (min_questions >= 0),
  max_questions INTEGER DEFAULT 0 CHECK (max_questions >= 0),
  easy_percentage INTEGER DEFAULT 33 CHECK (easy_percentage >= 0 AND easy_percentage <= 100),
  medium_percentage INTEGER DEFAULT 34 CHECK (medium_percentage >= 0 AND medium_percentage <= 100),
  hard_percentage INTEGER DEFAULT 33 CHECK (hard_percentage >= 0 AND hard_percentage <= 100),
  is_required BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_description_id, topic_id),
  CHECK (easy_percentage + medium_percentage + hard_percentage = 100)
);

-- 3. Exam Questions Table (Question bank)
CREATE TABLE exam_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_description_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq', 'text')),
  question_category VARCHAR(20) NOT NULL CHECK (question_category IN ('technical', 'aptitude')),
  difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  mcq_options JSONB, -- Format: [{"option": "A", "text": "Option A text"}, ...]
  correct_answer TEXT, -- For MCQ: "A", "B", "C", "D" | For text: expected keywords/pattern
  answer_explanation TEXT,
  points INTEGER DEFAULT 1 CHECK (points > 0),
  time_limit_seconds INTEGER DEFAULT 60 CHECK (time_limit_seconds > 0),
  tags TEXT[] DEFAULT '{}',
  topic_id UUID REFERENCES question_topics(id),
  subtopic VARCHAR(100),
  created_by VARCHAR(50) DEFAULT 'ai' CHECK (created_by IN ('hr', 'ai')),
  created_by_user_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('draft', 'approved', 'rejected')),
  hr_notes TEXT,
  last_modified_by UUID REFERENCES users(id),
  last_modified_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Exam Sessions Table (Individual exam instances)
CREATE TABLE exam_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_description_id UUID NOT NULL REFERENCES job_descriptions(id),
  exam_token TEXT UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired', 'terminated')),
  total_questions INTEGER NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  initial_question_count INTEGER DEFAULT 15,
  adaptive_questions_added INTEGER DEFAULT 0,
  max_adaptive_questions INTEGER DEFAULT 20,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  performance_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Exam Responses Table (Individual answers)
CREATE TABLE exam_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id),
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  time_taken_seconds INTEGER,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_session_id, question_id)
);

-- 6. Exam Results Table (Final scores and evaluation)
CREATE TABLE exam_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  total_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  skipped_questions INTEGER DEFAULT 0,
  technical_score INTEGER,
  aptitude_score INTEGER,
  time_taken_minutes INTEGER,
  evaluation_status VARCHAR(20) DEFAULT 'pending' CHECK (evaluation_status IN ('pending', 'passed', 'failed')),
  ai_evaluation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Question Topics indexes
CREATE INDEX idx_question_topics_parent ON question_topics(parent_topic_id);
CREATE INDEX idx_question_topics_category ON question_topics(category);
CREATE INDEX idx_question_topics_active ON question_topics(is_active);

-- Job Question Categories indexes
CREATE INDEX idx_job_question_categories_job ON job_question_categories(job_description_id);
CREATE INDEX idx_job_question_categories_topic ON job_question_categories(topic_id);
CREATE INDEX idx_job_question_categories_priority ON job_question_categories(priority DESC);

-- Exam Questions indexes
CREATE INDEX idx_exam_questions_job ON exam_questions(job_description_id);
CREATE INDEX idx_exam_questions_category ON exam_questions(question_category);
CREATE INDEX idx_exam_questions_difficulty ON exam_questions(difficulty_level);
CREATE INDEX idx_exam_questions_topic ON exam_questions(topic_id);
CREATE INDEX idx_exam_questions_status ON exam_questions(status);
CREATE INDEX idx_exam_questions_active ON exam_questions(is_active);

-- Exam Sessions indexes
CREATE INDEX idx_exam_sessions_candidate ON exam_sessions(candidate_id);
CREATE INDEX idx_exam_sessions_token ON exam_sessions(exam_token);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX idx_exam_sessions_expires ON exam_sessions(expires_at);

-- Exam Responses indexes
CREATE INDEX idx_exam_responses_session ON exam_responses(exam_session_id);
CREATE INDEX idx_exam_responses_question ON exam_responses(question_id);
CREATE INDEX idx_exam_responses_answered_at ON exam_responses(answered_at);

-- Exam Results indexes
CREATE INDEX idx_exam_results_session ON exam_results(exam_session_id);
CREATE INDEX idx_exam_results_candidate ON exam_results(candidate_id);
CREATE INDEX idx_exam_results_percentage ON exam_results(percentage);
CREATE INDEX idx_exam_results_status ON exam_results(evaluation_status);

-- ==============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE question_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- STEP 5: CREATE RLS POLICIES
-- ==============================================

-- Admin access policies (users with admin role can manage all exam data)
CREATE POLICY "Admin users can manage question topics" ON question_topics FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'hr_manager')
  )
);

CREATE POLICY "Admin users can manage job question categories" ON job_question_categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'hr_manager')
  )
);

CREATE POLICY "Admin users can manage exam questions" ON exam_questions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'hr_manager')
  )
);

CREATE POLICY "Admin users can manage exam sessions" ON exam_sessions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'hr_manager')
  )
);

CREATE POLICY "Admin users can manage exam responses" ON exam_responses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'hr_manager')
  )
);

CREATE POLICY "Admin users can manage exam results" ON exam_results FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'hr_manager')
  )
);

-- Candidate access policies (candidates can only access their own exam data)
CREATE POLICY "Candidates can view their own exam sessions" ON exam_sessions FOR SELECT USING (
  candidate_id = auth.uid()
);

CREATE POLICY "Candidates can view their own exam responses" ON exam_responses FOR SELECT USING (
  exam_session_id IN (
    SELECT id FROM exam_sessions WHERE candidate_id = auth.uid()
  )
);

CREATE POLICY "Candidates can view their own exam results" ON exam_results FOR SELECT USING (
  candidate_id = auth.uid()
);

-- Candidates can update their own exam sessions (for status changes)
CREATE POLICY "Candidates can update their own exam sessions" ON exam_sessions FOR UPDATE USING (
  candidate_id = auth.uid()
);

-- Candidates can insert their own exam responses
CREATE POLICY "Candidates can insert their own exam responses" ON exam_responses FOR INSERT WITH CHECK (
  exam_session_id IN (
    SELECT id FROM exam_sessions WHERE candidate_id = auth.uid()
  )
);

-- Candidates can update their own exam responses
CREATE POLICY "Candidates can update their own exam responses" ON exam_responses FOR UPDATE USING (
  exam_session_id IN (
    SELECT id FROM exam_sessions WHERE candidate_id = auth.uid()
  )
);

-- ==============================================
-- STEP 6: CREATE TRIGGERS
-- ==============================================

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_question_topics_updated_at 
  BEFORE UPDATE ON question_topics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_question_categories_updated_at 
  BEFORE UPDATE ON job_question_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_questions_updated_at 
  BEFORE UPDATE ON exam_questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_sessions_updated_at 
  BEFORE UPDATE ON exam_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- STEP 7: INSERT DEFAULT DATA
-- ==============================================

-- Insert default question topics
INSERT INTO question_topics (name, description, category, level, sort_order) VALUES
-- Technical Topics
('Programming Languages', 'Questions about programming languages and syntax', 'technical', 1, 1),
('Data Structures & Algorithms', 'Questions about data structures, algorithms, and complexity', 'technical', 1, 2),
('Database Management', 'Questions about databases, SQL, and data management', 'technical', 1, 3),
('System Design', 'Questions about system architecture and design patterns', 'technical', 1, 4),
('Web Development', 'Questions about web technologies, frameworks, and development', 'technical', 1, 5),
('Mobile Development', 'Questions about mobile app development and platforms', 'technical', 1, 6),
('DevOps & Cloud', 'Questions about deployment, cloud services, and infrastructure', 'technical', 1, 7),
('Security', 'Questions about cybersecurity, authentication, and data protection', 'technical', 1, 8),

-- Aptitude Topics
('Logical Reasoning', 'Questions testing logical thinking and problem-solving', 'aptitude', 1, 1),
('Quantitative Aptitude', 'Questions testing mathematical and numerical skills', 'aptitude', 1, 2),
('Verbal Ability', 'Questions testing language and communication skills', 'aptitude', 1, 3),
('Analytical Skills', 'Questions testing analytical thinking and data interpretation', 'aptitude', 1, 4),
('Problem Solving', 'Questions testing general problem-solving abilities', 'aptitude', 1, 5),
('Attention to Detail', 'Questions testing attention to detail and accuracy', 'aptitude', 1, 6)
ON CONFLICT (name, category) DO NOTHING;

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================

SELECT 'Exam system tables created successfully!' as status;
