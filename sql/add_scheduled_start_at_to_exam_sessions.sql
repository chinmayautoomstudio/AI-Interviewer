-- Migration: Add scheduled_start_at field to exam_sessions table
-- This allows exams to be scheduled for specific dates and times
-- Exam access will be controlled based on this scheduled time

-- Add scheduled_start_at column to exam_sessions table
ALTER TABLE exam_sessions 
ADD COLUMN IF NOT EXISTS scheduled_start_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance on scheduled exams
CREATE INDEX IF NOT EXISTS idx_exam_sessions_scheduled_start 
ON exam_sessions(scheduled_start_at) 
WHERE scheduled_start_at IS NOT NULL;

-- Add comment to document the field
COMMENT ON COLUMN exam_sessions.scheduled_start_at IS 
'When the exam is scheduled to start. Candidates can access the exam 30 minutes before this time. If NULL, exam can be accessed immediately.';

