-- Test Text Questions for Text Evaluation Testing
-- Insert these questions into the exam_questions table

INSERT INTO exam_questions (
  id,
  job_description_id,
  question_text,
  question_type,
  question_category,
  difficulty_level,
  correct_answer,
  answer_explanation,
  points,
  time_limit_seconds,
  tags,
  is_active,
  created_at
) VALUES 
-- Text Question 1: JavaScript Fundamentals
(
  gen_random_uuid(),
  (SELECT id FROM job_descriptions WHERE title LIKE '%Web Developer%' LIMIT 1),
  'Explain the difference between let, const, and var in JavaScript. Provide examples of when you would use each.',
  'text',
  'technical',
  'medium',
  'scope, hoisting, reassignment, block scope, function scope, temporal dead zone',
  'let and const are block-scoped while var is function-scoped. let allows reassignment, const does not. var is hoisted and can be accessed before declaration.',
  5,
  120,
  ARRAY['javascript', 'variables', 'scope'],
  true,
  NOW()
),

-- Text Question 2: React Concepts
(
  gen_random_uuid(),
  (SELECT id FROM job_descriptions WHERE title LIKE '%Web Developer%' LIMIT 1),
  'What are React hooks and why are they important? Explain useState and useEffect with examples.',
  'text',
  'technical',
  'medium',
  'hooks, functional components, state management, side effects, lifecycle, useState, useEffect',
  'React hooks allow functional components to use state and lifecycle features. useState manages component state, useEffect handles side effects and lifecycle events.',
  5,
  150,
  ARRAY['react', 'hooks', 'state'],
  true,
  NOW()
),

-- Text Question 3: Problem Solving
(
  gen_random_uuid(),
  (SELECT id FROM job_descriptions WHERE title LIKE '%Web Developer%' LIMIT 1),
  'How would you optimize a slow-loading website? List at least 5 different optimization techniques.',
  'text',
  'technical',
  'hard',
  'performance, optimization, caching, compression, minification, lazy loading, CDN, database optimization',
  'Website optimization includes image optimization, code minification, caching strategies, lazy loading, CDN usage, database query optimization, and reducing HTTP requests.',
  5,
  180,
  ARRAY['performance', 'optimization', 'web'],
  true,
  NOW()
),

-- Text Question 4: Database Concepts
(
  gen_random_uuid(),
  (SELECT id FROM job_descriptions WHERE title LIKE '%Web Developer%' LIMIT 1),
  'Explain the difference between SQL INNER JOIN and LEFT JOIN. Provide examples of when you would use each.',
  'text',
  'technical',
  'medium',
  'inner join, left join, matching records, all records, null values, relationships',
  'INNER JOIN returns only matching records from both tables. LEFT JOIN returns all records from the left table and matching records from the right table, with NULL for non-matching records.',
  4,
  120,
  ARRAY['sql', 'database', 'joins'],
  true,
  NOW()
),

-- Text Question 5: CSS and Styling
(
  gen_random_uuid(),
  (SELECT id FROM job_descriptions WHERE title LIKE '%Web Developer%' LIMIT 1),
  'What is the CSS box model and how does it affect layout? Explain margin, border, padding, and content.',
  'text',
  'technical',
  'easy',
  'box model, margin, border, padding, content, layout, spacing',
  'The CSS box model describes how elements are rendered with margin (outer spacing), border (element border), padding (inner spacing), and content (actual content area).',
  3,
  90,
  ARRAY['css', 'layout', 'box-model'],
  true,
  NOW()
);

-- Verify the questions were inserted
SELECT 
  id,
  question_text,
  question_type,
  question_category,
  difficulty_level,
  points,
  tags
FROM exam_questions 
WHERE question_type = 'text' 
ORDER BY created_at DESC 
LIMIT 5;
