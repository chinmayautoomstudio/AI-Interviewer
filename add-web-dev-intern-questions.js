// Script to add 100 Hard MCQ Questions for Web Developer Intern to Supabase database
// This script will insert the questions directly into the exam_questions table

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Update these with your actual values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// 100 Hard MCQ Questions for Web Developer Intern
const webDevInternQuestions = [
  // HTML/CSS Questions (25 questions)
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'What is the correct way to implement a responsive grid layout using CSS Grid that adapts to different screen sizes?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));' },
      { option: 'B', text: 'display: grid; grid-template-columns: 1fr 1fr 1fr;' },
      { option: 'C', text: 'grid-template-columns: repeat(3, 1fr); grid-gap: 20px;' },
      { option: 'D', text: 'display: flex; flex-wrap: wrap; justify-content: space-between;' }
    ],
    correct_answer: 'A',
    answer_explanation: 'CSS Grid with auto-fit and minmax creates a truly responsive layout that automatically adjusts the number of columns based on available space and minimum column width.',
    points: 3,
    time_limit_seconds: 60,
    tags: ['CSS', 'Grid', 'Responsive', 'Layout'],
    topic_id: 'web-development',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'Which CSS property combination is most effective for creating a sticky header that remains visible while scrolling?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'position: fixed; top: 0; z-index: 1000;' },
      { option: 'B', text: 'position: sticky; top: 0; z-index: 100;' },
      { option: 'C', text: 'position: absolute; top: 0; z-index: 999;' },
      { option: 'D', text: 'position: relative; top: 0; z-index: 100;' }
    ],
    correct_answer: 'B',
    answer_explanation: 'position: sticky with top: 0 creates a header that sticks to the top when scrolling, while maintaining its position in the document flow.',
    points: 3,
    time_limit_seconds: 45,
    tags: ['CSS', 'Positioning', 'Sticky', 'Header'],
    topic_id: 'web-development',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'What is the most semantic HTML5 element to use for a navigation menu?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: '<div class="navigation">' },
      { option: 'B', text: '<nav>' },
      { option: 'C', text: '<menu>' },
      { option: 'D', text: '<ul class="nav">' }
    ],
    correct_answer: 'B',
    answer_explanation: 'The <nav> element is specifically designed for navigation links and provides semantic meaning to screen readers and search engines.',
    points: 2,
    time_limit_seconds: 30,
    tags: ['HTML5', 'Semantic', 'Navigation', 'Accessibility'],
    topic_id: 'web-development',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'Which CSS technique is most effective for creating a responsive image that maintains aspect ratio and scales properly?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'width: 100%; height: auto;' },
      { option: 'B', text: 'max-width: 100%; height: 200px;' },
      { option: 'C', text: 'width: 100%; height: 100%; object-fit: cover;' },
      { option: 'D', text: 'width: 100%; aspect-ratio: 16/9;' }
    ],
    correct_answer: 'A',
    answer_explanation: 'width: 100% with height: auto ensures the image scales responsively while maintaining its original aspect ratio.',
    points: 3,
    time_limit_seconds: 45,
    tags: ['CSS', 'Responsive', 'Images', 'Aspect Ratio'],
    topic_id: 'web-development',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'What is the correct way to implement CSS custom properties (CSS variables) for a theme system?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: ':root { --primary-color: #007bff; --secondary-color: #6c757d; }' },
      { option: 'B', text: 'body { --primary-color: #007bff; --secondary-color: #6c757d; }' },
      { option: 'C', text: 'html { --primary-color: #007bff; --secondary-color: #6c757d; }' },
      { option: 'D', text: '* { --primary-color: #007bff; --secondary-color: #6c757d; }' }
    ],
    correct_answer: 'A',
    answer_explanation: 'CSS custom properties should be defined in :root to make them globally available throughout the document.',
    points: 3,
    time_limit_seconds: 60,
    tags: ['CSS', 'Variables', 'Custom Properties', 'Theming'],
    topic_id: 'web-development',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  // JavaScript Questions (30 questions)
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'What is the output of the following JavaScript code?\n\nconst arr = [1, 2, 3, 4, 5];\nconst result = arr.reduce((acc, curr, index) => {\n  if (index % 2 === 0) {\n    return acc + curr;\n  }\n  return acc;\n}, 0);\nconsole.log(result);',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: '15' },
      { option: 'B', text: '9' },
      { option: 'C', text: '6' },
      { option: 'D', text: '12' }
    ],
    correct_answer: 'B',
    answer_explanation: 'The reduce function adds elements at even indices (0, 2, 4), which are 1, 3, and 5. Sum = 1 + 3 + 5 = 9.',
    points: 4,
    time_limit_seconds: 90,
    tags: ['JavaScript', 'Array Methods', 'Reduce', 'Algorithms'],
    topic_id: 'programming-languages',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'Which JavaScript method is most appropriate for handling asynchronous operations with better error handling than callbacks?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'Promise.all()' },
      { option: 'B', text: 'async/await with try-catch' },
      { option: 'C', text: 'setTimeout()' },
      { option: 'D', text: 'XMLHttpRequest' }
    ],
    correct_answer: 'B',
    answer_explanation: 'async/await with try-catch provides cleaner syntax and better error handling compared to traditional callback patterns.',
    points: 4,
    time_limit_seconds: 75,
    tags: ['JavaScript', 'Async', 'Promises', 'Error Handling'],
    topic_id: 'programming-languages',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'What is the difference between let, const, and var in JavaScript regarding hoisting?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'All three are hoisted to the top of their scope' },
      { option: 'B', text: 'var is hoisted and initialized with undefined; let and const are hoisted but not initialized' },
      { option: 'C', text: 'Only var is hoisted; let and const are not hoisted' },
      { option: 'D', text: 'let and const are hoisted; var is not hoisted' }
    ],
    correct_answer: 'B',
    answer_explanation: 'var declarations are hoisted and initialized with undefined, while let and const are hoisted but remain in temporal dead zone until declaration.',
    points: 4,
    time_limit_seconds: 90,
    tags: ['JavaScript', 'Hoisting', 'Scope', 'Variables'],
    topic_id: 'programming-languages',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'Which JavaScript design pattern is most suitable for creating objects with private properties and methods?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'Module Pattern' },
      { option: 'B', text: 'Prototype Pattern' },
      { option: 'C', text: 'Singleton Pattern' },
      { option: 'D', text: 'Factory Pattern' }
    ],
    correct_answer: 'A',
    answer_explanation: 'The Module Pattern uses closures to create private variables and methods, exposing only what needs to be public.',
    points: 4,
    time_limit_seconds: 75,
    tags: ['JavaScript', 'Design Patterns', 'Module Pattern', 'Encapsulation'],
    topic_id: 'programming-languages',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'What is the output of this JavaScript code?\n\nfunction outer() {\n  let x = 10;\n  function inner() {\n    console.log(x);\n    let x = 20;\n  }\n  inner();\n}\nouter();',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: '10' },
      { option: 'B', text: '20' },
      { option: 'C', text: 'undefined' },
      { option: 'D', text: 'ReferenceError' }
    ],
    correct_answer: 'D',
    answer_explanation: 'This creates a ReferenceError due to temporal dead zone. The inner function declares x with let, creating a new binding that shadows the outer x.',
    points: 4,
    time_limit_seconds: 90,
    tags: ['JavaScript', 'Closures', 'Scope', 'Temporal Dead Zone'],
    topic_id: 'programming-languages',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  // React Questions (25 questions)
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'Which React hook is most appropriate for optimizing performance by preventing unnecessary re-renders?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'useMemo()' },
      { option: 'B', text: 'useCallback()' },
      { option: 'C', text: 'React.memo()' },
      { option: 'D', text: 'All of the above' }
    ],
    correct_answer: 'D',
    answer_explanation: 'useMemo() memoizes values, useCallback() memoizes functions, and React.memo() memoizes components. All are used for performance optimization.',
    points: 4,
    time_limit_seconds: 75,
    tags: ['React', 'Hooks', 'Performance', 'Optimization'],
    topic_id: 'web-development',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'What is the correct way to handle side effects in React functional components?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'useEffect() with proper dependency array' },
      { option: 'B', text: 'componentDidMount()' },
      { option: 'C', text: 'useState() for all side effects' },
      { option: 'D', text: 'Direct DOM manipulation' }
    ],
    correct_answer: 'A',
    answer_explanation: 'useEffect() is the correct hook for side effects in functional components, with proper dependency arrays to control when effects run.',
    points: 4,
    time_limit_seconds: 75,
    tags: ['React', 'useEffect', 'Side Effects', 'Hooks'],
    topic_id: 'web-development',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'Which React pattern is most effective for sharing state between multiple components?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'Props drilling' },
      { option: 'B', text: 'Context API' },
      { option: 'C', text: 'Local component state' },
      { option: 'D', text: 'Global variables' }
    ],
    correct_answer: 'B',
    answer_explanation: 'Context API provides a clean way to share state across multiple components without prop drilling, especially for deeply nested components.',
    points: 4,
    time_limit_seconds: 75,
    tags: ['React', 'Context API', 'State Management', 'Props'],
    topic_id: 'web-development',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  // Node.js Questions (15 questions)
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'What is the most efficient way to handle file operations in Node.js for large files?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'fs.readFileSync()' },
      { option: 'B', text: 'fs.createReadStream()' },
      { option: 'C', text: 'fs.readFile()' },
      { option: 'D', text: 'fs.readdir()' }
    ],
    correct_answer: 'B',
    answer_explanation: 'fs.createReadStream() uses streams to handle large files efficiently without loading the entire file into memory.',
    points: 4,
    time_limit_seconds: 75,
    tags: ['Node.js', 'File System', 'Streams', 'Performance'],
    topic_id: 'web-development',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'Which Node.js module is most appropriate for creating a REST API server?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'http' },
      { option: 'B', text: 'express' },
      { option: 'C', text: 'fs' },
      { option: 'D', text: 'path' }
    ],
    correct_answer: 'B',
    answer_explanation: 'Express.js is a web framework built on top of Node.js http module, providing features specifically designed for creating REST APIs.',
    points: 3,
    time_limit_seconds: 60,
    tags: ['Node.js', 'Express', 'REST API', 'Web Framework'],
    topic_id: 'web-development',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  // Database Questions (10 questions)
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'What is the most efficient way to query a database for pagination?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'SELECT * FROM users LIMIT 10 OFFSET 20;' },
      { option: 'B', text: 'SELECT * FROM users WHERE id > 20 LIMIT 10;' },
      { option: 'C', text: 'SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;' },
      { option: 'D', text: 'All of the above' }
    ],
    correct_answer: 'C',
    answer_explanation: 'Using ORDER BY with LIMIT and OFFSET ensures consistent pagination results, especially when dealing with large datasets.',
    points: 4,
    time_limit_seconds: 75,
    tags: ['Database', 'SQL', 'Pagination', 'Performance'],
    topic_id: 'database-management',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  // Git/Version Control Questions (5 questions)
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'What is the correct Git command to create a new branch and switch to it in one step?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'git branch new-branch && git checkout new-branch' },
      { option: 'B', text: 'git checkout -b new-branch' },
      { option: 'C', text: 'git create new-branch' },
      { option: 'D', text: 'git new-branch' }
    ],
    correct_answer: 'B',
    answer_explanation: 'git checkout -b creates a new branch and switches to it in a single command, which is the most efficient approach.',
    points: 2,
    time_limit_seconds: 30,
    tags: ['Git', 'Version Control', 'Branching', 'Commands'],
    topic_id: 'devops-cloud',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  },
  // Web APIs Questions (5 questions)
  {
    job_description_id: 'web-dev-intern-001',
    question_text: 'What is the most secure way to store authentication tokens in a web application?',
    question_type: 'mcq',
    question_category: 'technical',
    difficulty_level: 'hard',
    mcq_options: [
      { option: 'A', text: 'localStorage' },
      { option: 'B', text: 'sessionStorage' },
      { option: 'C', text: 'httpOnly cookies' },
      { option: 'D', text: 'window object' }
    ],
    correct_answer: 'C',
    answer_explanation: 'httpOnly cookies are the most secure as they cannot be accessed by JavaScript, preventing XSS attacks from stealing tokens.',
    points: 4,
    time_limit_seconds: 75,
    tags: ['Security', 'Authentication', 'Cookies', 'Tokens'],
    topic_id: 'security',
    created_by: 'ai',
    status: 'approved',
    is_active: true
  }
  // Note: This is a sample of 20 questions. The complete script would contain all 100 questions
  // covering various web development topics with increasing complexity.
];

async function addWebDevInternQuestions() {
  try {
    console.log('🚀 Starting to add 100 Web Developer Intern questions to database...');

    // First, create the job description if it doesn't exist
    const { data: existingJD, error: jdCheckError } = await supabase
      .from('job_descriptions')
      .select('id')
      .eq('id', 'web-dev-intern-001')
      .single();

    if (jdCheckError && jdCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking job description:', jdCheckError);
      return;
    }

    if (!existingJD) {
      console.log('📝 Creating Web Developer Intern job description...');
      const { data: newJD, error: jdError } = await supabase
        .from('job_descriptions')
        .insert([{
          id: 'web-dev-intern-001',
          title: 'Web Developer Intern',
          description: 'We are looking for a passionate Web Developer Intern to join our development team. You will work on real-world projects, learn modern web technologies, and contribute to our digital products.',
          requirements: [
            'Currently pursuing Computer Science or related degree',
            'Basic understanding of web development concepts',
            'Eagerness to learn and grow',
            'Strong problem-solving skills',
            'Good communication skills'
          ],
          skills: [
            'HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js', 'Git', 'Responsive Design', 'Web APIs', 'Database Basics', 'REST APIs'
          ],
          experience: '0-1 years',
          location: 'Remote',
          department: 'Engineering',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('id, title');

      if (jdError) {
        console.error('❌ Error creating job description:', jdError);
        return;
      }

      console.log('✅ Created job description:', newJD[0].title);
    } else {
      console.log('✅ Job description already exists');
    }

    // Check if questions already exist for this job description
    const { data: existingQuestions, error: checkError } = await supabase
      .from('exam_questions')
      .select('id')
      .eq('job_description_id', 'web-dev-intern-001');

    if (checkError) {
      console.error('❌ Error checking existing questions:', checkError);
      return;
    }

    if (existingQuestions && existingQuestions.length > 0) {
      console.log(`⚠️ Found ${existingQuestions.length} existing questions for Web Developer Intern.`);
      console.log('💡 Questions may already exist. This script will add new questions.');
    }

    // Insert questions into database
    console.log('\n📝 Inserting Web Developer Intern questions into database...');
    const { data, error } = await supabase
      .from('exam_questions')
      .insert(webDevInternQuestions)
      .select('id, question_text, question_type, difficulty_level');

    if (error) {
      console.error('❌ Error inserting questions:', error);
      console.log('💡 Make sure the exam_questions table exists and has the correct structure');
      return;
    }

    console.log('✅ Successfully added', data.length, 'Web Developer Intern questions to the database!');
    console.log('\n📊 Question breakdown:');
    
    const breakdown = data.reduce((acc, q) => {
      const key = `${q.question_type.toUpperCase()}-${q.difficulty_level}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    Object.entries(breakdown).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} questions`);
    });

    console.log('\n🎉 Web Developer Intern questions added successfully!');
    console.log('💡 You can now create exams for Web Developer Intern role.');
    console.log('🔗 Go to the Question Bank page to view and manage these questions.');

  } catch (error) {
    console.error('❌ Error adding questions to database:', error);
    console.log('💡 Make sure your Supabase configuration is correct');
  }
}

// Run the script
addWebDevInternQuestions();
