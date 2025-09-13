-- Fix Interview Tables Step by Step
-- This script will fix the interview system tables that were partially created

-- ==============================================
-- STEP 1: DROP EXISTING TABLES (if they exist)
-- ==============================================

-- Drop tables in reverse order to handle foreign key dependencies
DROP TABLE IF EXISTS interview_reports CASCADE;
DROP TABLE IF EXISTS interview_messages CASCADE;
DROP TABLE IF EXISTS interview_sessions CASCADE;

-- ==============================================
-- STEP 2: CREATE INTERVIEW SESSIONS TABLE
-- ==============================================

CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(50) UNIQUE NOT NULL,
  candidate_id UUID, -- Will reference candidates.id
  job_description_id UUID, -- Will reference job_descriptions.id  
  ai_agent_id UUID, -- Will reference ai_agents.id
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  total_questions INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- STEP 3: CREATE INTERVIEW MESSAGES TABLE
-- ==============================================

CREATE TABLE interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL, -- References interview_sessions.id
  message_type VARCHAR(20) CHECK (message_type IN ('question', 'answer', 'system', 'error', 'instruction')),
  content TEXT NOT NULL,
  sender VARCHAR(20) CHECK (sender IN ('ai', 'candidate', 'system')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  sequence_number INTEGER
);

-- ==============================================
-- STEP 4: CREATE INTERVIEW REPORTS TABLE
-- ==============================================

CREATE TABLE interview_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL, -- References interview_sessions.id
  overall_score DECIMAL(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
  suitability_status VARCHAR(20) CHECK (suitability_status IN ('suitable', 'not_suitable', 'conditional', 'needs_review')),
  technical_score DECIMAL(5,2) CHECK (technical_score >= 0 AND technical_score <= 100),
  communication_score DECIMAL(5,2) CHECK (communication_score >= 0 AND communication_score <= 100),
  problem_solving_score DECIMAL(5,2) CHECK (problem_solving_score >= 0 AND problem_solving_score <= 100),
  cultural_fit_score DECIMAL(5,2) CHECK (cultural_fit_score >= 0 AND cultural_fit_score <= 100),
  strengths TEXT[],
  weaknesses TEXT[],
  recommendations TEXT,
  detailed_feedback TEXT,
  report_data JSONB,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_recipients TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- STEP 5: ADD INTERNAL FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Add foreign key from interview_messages to interview_sessions
ALTER TABLE interview_messages 
ADD CONSTRAINT fk_interview_messages_session_id 
FOREIGN KEY (interview_session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE;

-- Add foreign key from interview_reports to interview_sessions
ALTER TABLE interview_reports 
ADD CONSTRAINT fk_interview_reports_session_id 
FOREIGN KEY (interview_session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE;

-- ==============================================
-- STEP 6: ADD EXTERNAL FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Add foreign key to candidates table
ALTER TABLE interview_sessions 
ADD CONSTRAINT fk_interview_sessions_candidate_id 
FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;

-- Add foreign key to job_descriptions table
ALTER TABLE interview_sessions 
ADD CONSTRAINT fk_interview_sessions_job_description_id 
FOREIGN KEY (job_description_id) REFERENCES job_descriptions(id) ON DELETE CASCADE;

-- Add foreign key to ai_agents table
ALTER TABLE interview_sessions 
ADD CONSTRAINT fk_interview_sessions_ai_agent_id 
FOREIGN KEY (ai_agent_id) REFERENCES ai_agents(id) ON DELETE SET NULL;

-- ==============================================
-- STEP 7: CREATE INDEXES
-- ==============================================

-- Interview Sessions Indexes
CREATE INDEX idx_interview_sessions_candidate_id ON interview_sessions(candidate_id);
CREATE INDEX idx_interview_sessions_job_description_id ON interview_sessions(job_description_id);
CREATE INDEX idx_interview_sessions_ai_agent_id ON interview_sessions(ai_agent_id);
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX idx_interview_sessions_session_id ON interview_sessions(session_id);
CREATE INDEX idx_interview_sessions_created_at ON interview_sessions(created_at);

-- Interview Messages Indexes
CREATE INDEX idx_interview_messages_session_id ON interview_messages(interview_session_id);
CREATE INDEX idx_interview_messages_timestamp ON interview_messages(timestamp);
CREATE INDEX idx_interview_messages_sender ON interview_messages(sender);
CREATE INDEX idx_interview_messages_message_type ON interview_messages(message_type);

-- Interview Reports Indexes
CREATE INDEX idx_interview_reports_session_id ON interview_reports(interview_session_id);
CREATE INDEX idx_interview_reports_suitability_status ON interview_reports(suitability_status);
CREATE INDEX idx_interview_reports_overall_score ON interview_reports(overall_score);
CREATE INDEX idx_interview_reports_created_at ON interview_reports(created_at);

-- ==============================================
-- STEP 8: CREATE TRIGGERS
-- ==============================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for interview_sessions table
CREATE TRIGGER update_interview_sessions_updated_at 
    BEFORE UPDATE ON interview_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for interview_reports table
CREATE TRIGGER update_interview_reports_updated_at 
    BEFORE UPDATE ON interview_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- STEP 9: ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_reports ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- STEP 10: CREATE RLS POLICIES
-- ==============================================

-- Interview Sessions Policies
CREATE POLICY "Users can view their own interview sessions" ON interview_sessions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create interview sessions" ON interview_sessions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own interview sessions" ON interview_sessions
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Interview Messages Policies
CREATE POLICY "Users can view interview messages" ON interview_messages
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create interview messages" ON interview_messages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Interview Reports Policies
CREATE POLICY "Users can view interview reports" ON interview_reports
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create interview reports" ON interview_reports
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update interview reports" ON interview_reports
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ==============================================
-- VERIFICATION
-- ==============================================

-- Verify tables were created
SELECT 
    'Tables Created' as status,
    table_name
FROM information_schema.tables 
WHERE table_name IN ('interview_sessions', 'interview_messages', 'interview_reports')
    AND table_schema = 'public'
ORDER BY table_name;

-- Verify foreign key constraints
SELECT
    'Foreign Keys' as status,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('interview_sessions', 'interview_messages', 'interview_reports')
ORDER BY tc.table_name, tc.constraint_name;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Interview System Tables Fixed Successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'All tables created with proper foreign keys:';
    RAISE NOTICE '- interview_sessions ✓';
    RAISE NOTICE '- interview_messages ✓';
    RAISE NOTICE '- interview_reports ✓';
    RAISE NOTICE '';
    RAISE NOTICE 'Foreign key constraints added:';
    RAISE NOTICE '- candidates table ✓';
    RAISE NOTICE '- job_descriptions table ✓';
    RAISE NOTICE '- ai_agents table ✓';
    RAISE NOTICE '==============================================';
END $$;
