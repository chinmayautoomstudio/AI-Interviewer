-- Add exam_session_questions table
-- This table stores the specific questions assigned to each exam session
-- This allows us to show skipped questions in results for completed exams

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exam Session Questions Table
-- Stores which questions were assigned to each exam session and their order
CREATE TABLE IF NOT EXISTS exam_session_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL CHECK (question_order > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_session_id, question_id),
  CONSTRAINT fk_exam_session FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
);

-- Create index for faster lookups by exam_session_id
CREATE INDEX IF NOT EXISTS idx_exam_session_questions_session_id ON exam_session_questions(exam_session_id);

-- Create index for faster lookups by question_id
CREATE INDEX IF NOT EXISTS idx_exam_session_questions_question_id ON exam_session_questions(question_id);

-- Create index for ordering questions by question_order
CREATE INDEX IF NOT EXISTS idx_exam_session_questions_order ON exam_session_questions(exam_session_id, question_order);

-- Add comment to table
COMMENT ON TABLE exam_session_questions IS 'Stores the specific questions assigned to each exam session, preserving question order and allowing skipped questions to be displayed in results';

