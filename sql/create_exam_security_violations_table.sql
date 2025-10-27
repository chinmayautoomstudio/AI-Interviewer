-- Create exam_security_violations table for logging security violations during exams
CREATE TABLE IF NOT EXISTS exam_security_violations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN ('key_press', 'tab_switch', 'window_resize', 'context_menu', 'dev_tools')),
  violation_details TEXT NOT NULL,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_security_violations_session_id ON exam_security_violations(exam_session_id);
CREATE INDEX IF NOT EXISTS idx_exam_security_violations_type ON exam_security_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_exam_security_violations_severity ON exam_security_violations(severity);
CREATE INDEX IF NOT EXISTS idx_exam_security_violations_timestamp ON exam_security_violations(timestamp);

-- Add RLS policies
ALTER TABLE exam_security_violations ENABLE ROW LEVEL SECURITY;

-- Policy for HR/Admin users to view all violations
CREATE POLICY "HR can view all security violations" ON exam_security_violations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'hr_manager', 'recruiter')
    )
  );

-- Policy for candidates to view only their own violations (if needed)
CREATE POLICY "Candidates can view their own violations" ON exam_security_violations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_sessions 
      WHERE exam_sessions.id = exam_security_violations.exam_session_id 
      AND exam_sessions.candidate_id = auth.uid()
    )
  );

-- Policy for inserting violations (system only)
CREATE POLICY "System can insert violations" ON exam_security_violations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE exam_security_violations IS 'Logs security violations during exam sessions for anti-cheating monitoring';
COMMENT ON COLUMN exam_security_violations.violation_type IS 'Type of security violation detected';
COMMENT ON COLUMN exam_security_violations.violation_details IS 'Detailed description of the violation';
COMMENT ON COLUMN exam_security_violations.severity IS 'Severity level of the violation (low, medium, high)';
COMMENT ON COLUMN exam_security_violations.timestamp IS 'When the violation occurred';
