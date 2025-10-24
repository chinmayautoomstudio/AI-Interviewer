// Script to add sample questions to Supabase database
// This script will insert the sample questions directly into the exam_questions table

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Update these with your actual values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample questions data
const sampleQuestions = [
  // Technical MCQ Questions
  {
    job_description_id: '1', // This will be updated with actual JD ID
    question_text: 'What is the time complexity of binary search?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'medium',
    mcq_options: [
      { option: 'A', text: 'O(n)' },
      { option: 'B', text: 'O(log n)' },
      { option: 'C', text: 'O(n log n)' },
      { option: 'D', text: 'O(1)' }
    ],
    correct_answer: 'B',
    answer_explanation: 'Binary search has O(log n) time complexity because it eliminates half of the search space in each iteration.',
    points: 2,
    time_limit_seconds: 60,
    tags: ['algorithms', 'time-complexity', 'search'],
    topic_id: 'algorithms',
    subtopic: 'Search Algorithms',
    created_by: 'hr',
    status: 'approved',
    hr_notes: 'Basic algorithm knowledge question'
  },
  {
    job_description_id: '1',
    question_text: 'Which of the following is NOT a valid HTTP method?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'easy',
    mcq_options: [
      { option: 'A', text: 'GET' },
      { option: 'B', text: 'POST' },
      { option: 'C', text: 'DELETE' },
      { option: 'D', text: 'FETCH' }
    ],
    correct_answer: 'D',
    answer_explanation: 'FETCH is not a standard HTTP method. The valid HTTP methods include GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, etc.',
    points: 1,
    time_limit_seconds: 45,
    tags: ['http', 'web-development', 'api'],
    topic_id: 'web-development',
    subtopic: 'HTTP Methods',
    created_by: 'hr',
    status: 'approved',
    hr_notes: 'Web development fundamentals'
  },
  {
    job_description_id: '1',
    question_text: 'What is the purpose of the "use strict" directive in JavaScript?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'medium',
    mcq_options: [
      { option: 'A', text: 'To enable modern JavaScript features' },
      { option: 'B', text: 'To enforce stricter parsing and error handling' },
      { option: 'C', text: 'To improve performance' },
      { option: 'D', text: 'To enable TypeScript features' }
    ],
    correct_answer: 'B',
    answer_explanation: 'The "use strict" directive enables strict mode, which catches common coding mistakes and prevents certain unsafe actions.',
    points: 2,
    time_limit_seconds: 60,
    tags: ['javascript', 'strict-mode', 'error-handling'],
    topic_id: 'javascript',
    subtopic: 'Language Features',
    created_by: 'hr',
    status: 'approved',
    hr_notes: 'JavaScript language knowledge'
  },
  {
    job_description_id: '1',
    question_text: 'Explain the concept of closures in JavaScript and provide a practical example.',
    question_type: 'text',
    question_category: 'technical',
    difficulty_level: 'hard',
    correct_answer: 'A closure is a function that has access to variables in its outer scope even after the outer function has returned.',
    answer_explanation: 'Closures allow functions to access variables from their lexical scope even when executed outside that scope. Example: function outer() { let x = 10; return function inner() { console.log(x); }; }',
    points: 3,
    time_limit_seconds: 120,
    tags: ['javascript', 'closures', 'scope'],
    topic_id: 'javascript',
    subtopic: 'Advanced Concepts',
    created_by: 'hr',
    status: 'approved',
    hr_notes: 'Advanced JavaScript concept'
  },
  {
    job_description_id: '1',
    question_text: 'What is the difference between SQL INNER JOIN and LEFT JOIN?',
    question_type: 'text',
    question_category: 'technical',
    difficulty_level: 'medium',
    correct_answer: 'INNER JOIN returns only matching records from both tables, while LEFT JOIN returns all records from the left table and matching records from the right table.',
    answer_explanation: 'INNER JOIN: Only rows with matching values in both tables. LEFT JOIN: All rows from left table + matching rows from right table (NULL for non-matching).',
    points: 2,
    time_limit_seconds: 90,
    tags: ['sql', 'database', 'joins'],
    topic_id: 'database',
    subtopic: 'SQL Joins',
    created_by: 'hr',
    status: 'approved',
    hr_notes: 'Database query knowledge'
  },
  // Aptitude MCQ Questions
  {
    job_description_id: '1',
    question_text: 'If a train travels 120 km in 2 hours, what is its average speed?',
    question_type: 'mcq',
    question_category: 'aptitude',
    difficulty_level: 'easy',
    mcq_options: [
      { option: 'A', text: '60 km/h' },
      { option: 'B', text: '40 km/h' },
      { option: 'C', text: '80 km/h' },
      { option: 'D', text: '100 km/h' }
    ],
    correct_answer: 'A',
    answer_explanation: 'Average speed = Total distance / Total time = 120 km / 2 hours = 60 km/h',
    points: 1,
    time_limit_seconds: 45,
    tags: ['mathematics', 'speed', 'calculation'],
    topic_id: 'mathematics',
    subtopic: 'Speed and Distance',
    created_by: 'hr',
    status: 'approved',
    hr_notes: 'Basic mathematical calculation'
  },
  {
    job_description_id: '1',
    question_text: 'Complete the series: 2, 6, 12, 20, 30, ?',
    question_type: 'mcq',
    question_category: 'aptitude',
    difficulty_level: 'medium',
    mcq_options: [
      { option: 'A', text: '40' },
      { option: 'B', text: '42' },
      { option: 'C', text: '44' },
      { option: 'D', text: '48' }
    ],
    correct_answer: 'B',
    answer_explanation: 'The pattern is n(n+1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42',
    points: 2,
    time_limit_seconds: 60,
    tags: ['pattern', 'series', 'logical-reasoning'],
    topic_id: 'logical-reasoning',
    subtopic: 'Number Series',
    created_by: 'hr',
    status: 'approved',
    hr_notes: 'Pattern recognition and logical reasoning'
  },
  {
    job_description_id: '1',
    question_text: 'If all roses are flowers and some flowers are red, which of the following must be true?',
    question_type: 'mcq',
    question_category: 'aptitude',
    difficulty_level: 'medium',
    mcq_options: [
      { option: 'A', text: 'All roses are red' },
      { option: 'B', text: 'Some roses are red' },
      { option: 'C', text: 'All flowers are roses' },
      { option: 'D', text: 'None of the above' }
    ],
    correct_answer: 'D',
    answer_explanation: 'From the given statements, we cannot conclude any of the options. The statements only tell us about categories, not about colors.',
    points: 2,
    time_limit_seconds: 75,
    tags: ['logical-reasoning', 'syllogism', 'deduction'],
    topic_id: 'logical-reasoning',
    subtopic: 'Syllogism',
    created_by: 'hr',
    status: 'approved',
    hr_notes: 'Logical reasoning and deduction'
  },
  {
    job_description_id: '1',
    question_text: 'Describe a situation where you had to work under pressure and how you handled it.',
    question_type: 'text',
    question_category: 'aptitude',
    difficulty_level: 'medium',
    correct_answer: 'This is a behavioral question to assess problem-solving and stress management skills.',
    answer_explanation: 'Look for examples that show: 1) Ability to prioritize tasks, 2) Effective time management, 3) Maintaining quality under pressure, 4) Learning from the experience.',
    points: 3,
    time_limit_seconds: 180,
    tags: ['behavioral', 'stress-management', 'problem-solving'],
    topic_id: 'behavioral',
    subtopic: 'Stress Management',
    created_by: 'hr',
    status: 'approved',
    hr_notes: 'Behavioral assessment question'
  },
  {
    job_description_id: '1',
    question_text: 'How would you approach debugging a complex software issue?',
    question_type: 'text',
    question_category: 'technical',
    difficulty_level: 'hard',
    correct_answer: 'This question assesses debugging methodology and problem-solving approach.',
    answer_explanation: 'Good answers should include: 1) Reproducing the issue, 2) Gathering information/logs, 3) Isolating the problem, 4) Testing hypotheses, 5) Implementing fix, 6) Testing solution.',
    points: 4,
    time_limit_seconds: 240,
    tags: ['debugging', 'problem-solving', 'methodology'],
    topic_id: 'software-engineering',
    subtopic: 'Debugging',
    created_by: 'hr',
    status: 'approved',
    hr_notes: 'Advanced problem-solving skills'
  }
];

async function addQuestionsToDatabase() {
  try {
    console.log('🚀 Starting to add questions to database...');

    // First, let's check if we have any job descriptions
    const { data: jobDescriptions, error: jdError } = await supabase
      .from('job_descriptions')
      .select('id, title')
      .limit(5);

    if (jdError) {
      console.error('❌ Error fetching job descriptions:', jdError);
      console.log('💡 Make sure your Supabase URL and key are correct in the .env file');
      return;
    }

    if (!jobDescriptions || jobDescriptions.length === 0) {
      console.log('⚠️ No job descriptions found. Please create some job descriptions first.');
      console.log('💡 You can create job descriptions through the application or directly in Supabase');
      return;
    }

    console.log('📋 Found job descriptions:');
    jobDescriptions.forEach((jd, index) => {
      console.log(`  ${index + 1}. ${jd.title} (ID: ${jd.id})`);
    });

    // Use the first job description ID for all questions
    const jobDescriptionId = jobDescriptions[0].id;
    console.log(`\n🎯 Using job description: ${jobDescriptions[0].title} (ID: ${jobDescriptionId})`);

    // Update all questions with the actual job description ID
    const questionsWithJD = sampleQuestions.map(q => ({
      ...q,
      job_description_id: jobDescriptionId
    }));

    // Check if questions already exist for this job description
    const { data: existingQuestions, error: checkError } = await supabase
      .from('exam_questions')
      .select('id')
      .eq('job_description_id', jobDescriptionId);

    if (checkError) {
      console.error('❌ Error checking existing questions:', checkError);
      return;
    }

    if (existingQuestions && existingQuestions.length > 0) {
      console.log(`⚠️ Found ${existingQuestions.length} existing questions for this job description.`);
      console.log('💡 Questions may already exist. Do you want to add more? (This script will add new questions)');
    }

    // Insert questions into database
    console.log('\n📝 Inserting questions into database...');
    const { data, error } = await supabase
      .from('exam_questions')
      .insert(questionsWithJD)
      .select('id, question_text, question_type, difficulty_level');

    if (error) {
      console.error('❌ Error inserting questions:', error);
      console.log('💡 Make sure the exam_questions table exists and has the correct structure');
      return;
    }

    console.log('✅ Successfully added', data.length, 'questions to the database!');
    console.log('\n📊 Question breakdown:');
    
    const breakdown = data.reduce((acc, q) => {
      const key = `${q.question_type.toUpperCase()}-${q.difficulty_level}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    Object.entries(breakdown).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} questions`);
    });

    console.log('\n🎉 Questions added successfully!');
    console.log('💡 You can now create exams and they will have questions available.');
    console.log('🔗 Go to the Question Bank page to view and manage these questions.');

  } catch (error) {
    console.error('❌ Error adding questions to database:', error);
    console.log('💡 Make sure your Supabase configuration is correct');
  }
}

// Run the script
addQuestionsToDatabase();
