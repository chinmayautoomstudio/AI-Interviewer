-- Fix Current Exam Session
-- This script fixes the exam session that has missing job_description_id

-- Step 1: Find the job description ID for "Web Developer Trainee"
SELECT 
  id as job_description_id, 
  title, 
  description 
FROM job_descriptions 
WHERE title LIKE '%Web Developer%' 
   OR title LIKE '%Trainee%'
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Check current exam session
SELECT 
  id,
  exam_token,
  status,
  job_description_id,
  candidate_id,
  started_at,
  duration_minutes,
  total_questions
FROM exam_sessions 
WHERE exam_token = 'exam_mh5wpcq2_l7cwh2ledy';

-- Step 3: Update the exam session with the correct job_description_id
-- Replace 'YOUR_JOB_DESCRIPTION_ID_HERE' with the actual ID from Step 1
UPDATE exam_sessions 
SET 
  job_description_id = 'YOUR_JOB_DESCRIPTION_ID_HERE',
  status = 'in_progress',
  started_at = COALESCE(started_at, NOW()),
  updated_at = NOW()
WHERE exam_token = 'exam_mh5wpcq2_l7cwh2ledy';

-- Step 4: Verify the fix
SELECT 
  es.id,
  es.exam_token,
  es.status,
  es.job_description_id,
  jd.title as job_title,
  c.name as candidate_name,
  es.started_at,
  es.duration_minutes,
  es.total_questions
FROM exam_sessions es
LEFT JOIN job_descriptions jd ON es.job_description_id = jd.id
LEFT JOIN candidates c ON es.candidate_id = c.id
WHERE es.exam_token = 'exam_mh5wpcq2_l7cwh2ledy';

-- Step 5: Check if questions are available for this job description
-- Replace 'YOUR_JOB_DESCRIPTION_ID_HERE' with the actual ID
SELECT 
  COUNT(*) as total_questions,
  COUNT(CASE WHEN question_type = 'mcq' THEN 1 END) as mcq_questions,
  COUNT(CASE WHEN question_type = 'text' THEN 1 END) as text_questions
FROM exam_questions 
WHERE job_description_id = 'YOUR_JOB_DESCRIPTION_ID_HERE'
  AND status = 'approved' 
  AND is_active = true;

-- Step 6: Show sample questions
-- Replace 'YOUR_JOB_DESCRIPTION_ID_HERE' with the actual ID
SELECT 
  id,
  question_text,
  question_type,
  difficulty_level,
  points,
  status,
  is_active
FROM exam_questions 
WHERE job_description_id = 'YOUR_JOB_DESCRIPTION_ID_HERE'
  AND status = 'approved' 
  AND is_active = true
ORDER BY created_at DESC
LIMIT 10;
