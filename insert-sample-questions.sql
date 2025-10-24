-- SQL Script to Insert Sample Questions
-- Run this in your Supabase SQL Editor or any PostgreSQL client

-- First, check if you have job descriptions
-- If not, create one first:
/*
INSERT INTO job_descriptions (
    id, title, description, department, employment_type, 
    experience_level, location, salary_range, status, 
    created_by, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'Software Developer',
    'We are looking for a skilled software developer to join our team.',
    'Engineering',
    'Full-time',
    'Mid-level',
    'Remote',
    '$60,000 - $80,000',
    'active',
    'hr',
    NOW(),
    NOW()
);
*/

-- Insert sample questions
-- Note: Replace 'your-job-description-id' with actual job description ID from your database

INSERT INTO exam_questions (
    id,
    job_description_id,
    question_text,
    question_type,
    question_category,
    difficulty_level,
    mcq_options,
    correct_answer,
    answer_explanation,
    points,
    time_limit_seconds,
    tags,
    topic_id,
    subtopic,
    created_by,
    status,
    hr_notes,
    is_active,
    created_at,
    updated_at
) VALUES 
-- Technical MCQ Questions
(
    gen_random_uuid(),
    'your-job-description-id', -- Replace with actual JD ID
    'What is the time complexity of binary search?',
    'mcq',
    'technical',
    'medium',
    '[{"option": "A", "text": "O(n)"}, {"option": "B", "text": "O(log n)"}, {"option": "C", "text": "O(n log n)"}, {"option": "D", "text": "O(1)"}]'::jsonb,
    'B',
    'Binary search has O(log n) time complexity because it eliminates half of the search space in each iteration.',
    2,
    60,
    ARRAY['algorithms', 'time-complexity', 'search'],
    'algorithms',
    'Search Algorithms',
    'hr',
    'approved',
    'Basic algorithm knowledge question',
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'your-job-description-id', -- Replace with actual JD ID
    'Which of the following is NOT a valid HTTP method?',
    'mcq',
    'technical',
    'easy',
    '[{"option": "A", "text": "GET"}, {"option": "B", "text": "POST"}, {"option": "C", "text": "DELETE"}, {"option": "D", "text": "FETCH"}]'::jsonb,
    'D',
    'FETCH is not a standard HTTP method. The valid HTTP methods include GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, etc.',
    1,
    45,
    ARRAY['http', 'web-development', 'api'],
    'web-development',
    'HTTP Methods',
    'hr',
    'approved',
    'Web development fundamentals',
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'your-job-description-id', -- Replace with actual JD ID
    'What is the purpose of the "use strict" directive in JavaScript?',
    'mcq',
    'technical',
    'medium',
    '[{"option": "A", "text": "To enable modern JavaScript features"}, {"option": "B", "text": "To enforce stricter parsing and error handling"}, {"option": "C", "text": "To improve performance"}, {"option": "D", "text": "To enable TypeScript features"}]'::jsonb,
    'B',
    'The "use strict" directive enables strict mode, which catches common coding mistakes and prevents certain unsafe actions.',
    2,
    60,
    ARRAY['javascript', 'strict-mode', 'error-handling'],
    'javascript',
    'Language Features',
    'hr',
    'approved',
    'JavaScript language knowledge',
    true,
    NOW(),
    NOW()
),
-- Technical Text Questions
(
    gen_random_uuid(),
    'your-job-description-id', -- Replace with actual JD ID
    'Explain the concept of closures in JavaScript and provide a practical example.',
    'text',
    'technical',
    'hard',
    NULL,
    'A closure is a function that has access to variables in its outer scope even after the outer function has returned.',
    'Closures allow functions to access variables from their lexical scope even when executed outside that scope. Example: function outer() { let x = 10; return function inner() { console.log(x); }; }',
    3,
    120,
    ARRAY['javascript', 'closures', 'scope'],
    'javascript',
    'Advanced Concepts',
    'hr',
    'approved',
    'Advanced JavaScript concept',
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'your-job-description-id', -- Replace with actual JD ID
    'What is the difference between SQL INNER JOIN and LEFT JOIN?',
    'text',
    'technical',
    'medium',
    NULL,
    'INNER JOIN returns only matching records from both tables, while LEFT JOIN returns all records from the left table and matching records from the right table.',
    'INNER JOIN: Only rows with matching values in both tables. LEFT JOIN: All rows from left table + matching rows from right table (NULL for non-matching).',
    2,
    90,
    ARRAY['sql', 'database', 'joins'],
    'database',
    'SQL Joins',
    'hr',
    'approved',
    'Database query knowledge',
    true,
    NOW(),
    NOW()
),
-- Aptitude MCQ Questions
(
    gen_random_uuid(),
    'your-job-description-id', -- Replace with actual JD ID
    'If a train travels 120 km in 2 hours, what is its average speed?',
    'mcq',
    'aptitude',
    'easy',
    '[{"option": "A", "text": "60 km/h"}, {"option": "B", "text": "40 km/h"}, {"option": "C", "text": "80 km/h"}, {"option": "D", "text": "100 km/h"}]'::jsonb,
    'A',
    'Average speed = Total distance / Total time = 120 km / 2 hours = 60 km/h',
    1,
    45,
    ARRAY['mathematics', 'speed', 'calculation'],
    'mathematics',
    'Speed and Distance',
    'hr',
    'approved',
    'Basic mathematical calculation',
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'your-job-description-id', -- Replace with actual JD ID
    'Complete the series: 2, 6, 12, 20, 30, ?',
    'mcq',
    'aptitude',
    'medium',
    '[{"option": "A", "text": "40"}, {"option": "B", "text": "42"}, {"option": "C", "text": "44"}, {"option": "D", "text": "48"}]'::jsonb,
    'B',
    'The pattern is n(n+1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42',
    2,
    60,
    ARRAY['pattern', 'series', 'logical-reasoning'],
    'logical-reasoning',
    'Number Series',
    'hr',
    'approved',
    'Pattern recognition and logical reasoning',
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'your-job-description-id', -- Replace with actual JD ID
    'If all roses are flowers and some flowers are red, which of the following must be true?',
    'mcq',
    'aptitude',
    'medium',
    '[{"option": "A", "text": "All roses are red"}, {"option": "B", "text": "Some roses are red"}, {"option": "C", "text": "All flowers are roses"}, {"option": "D", "text": "None of the above"}]'::jsonb,
    'D',
    'From the given statements, we cannot conclude any of the options. The statements only tell us about categories, not about colors.',
    2,
    75,
    ARRAY['logical-reasoning', 'syllogism', 'deduction'],
    'logical-reasoning',
    'Syllogism',
    'hr',
    'approved',
    'Logical reasoning and deduction',
    true,
    NOW(),
    NOW()
),
-- Aptitude Text Questions
(
    gen_random_uuid(),
    'your-job-description-id', -- Replace with actual JD ID
    'Describe a situation where you had to work under pressure and how you handled it.',
    'text',
    'aptitude',
    'medium',
    NULL,
    'This is a behavioral question to assess problem-solving and stress management skills.',
    'Look for examples that show: 1) Ability to prioritize tasks, 2) Effective time management, 3) Maintaining quality under pressure, 4) Learning from the experience.',
    3,
    180,
    ARRAY['behavioral', 'stress-management', 'problem-solving'],
    'behavioral',
    'Stress Management',
    'hr',
    'approved',
    'Behavioral assessment question',
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'your-job-description-id', -- Replace with actual JD ID
    'How would you approach debugging a complex software issue?',
    'text',
    'technical',
    'hard',
    NULL,
    'This question assesses debugging methodology and problem-solving approach.',
    'Good answers should include: 1) Reproducing the issue, 2) Gathering information/logs, 3) Isolating the problem, 4) Testing hypotheses, 5) Implementing fix, 6) Testing solution.',
    4,
    240,
    ARRAY['debugging', 'problem-solving', 'methodology'],
    'software-engineering',
    'Debugging',
    'hr',
    'approved',
    'Advanced problem-solving skills',
    true,
    NOW(),
    NOW()
);

-- Verify the inserted questions
SELECT 
    question_text,
    question_type,
    question_category,
    difficulty_level,
    points,
    status
FROM exam_questions 
WHERE job_description_id = 'your-job-description-id'
ORDER BY created_at DESC;
