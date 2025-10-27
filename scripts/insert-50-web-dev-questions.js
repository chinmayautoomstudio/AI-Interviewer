// Final Web Development Questions Insertion Script
// Inserts 50 web development MCQ questions with correct constraints

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertWebDevQuestions() {
  try {
    console.log('🚀 Starting web development questions insertion...');
    
    // Get existing job description
    const { data: existingJobs, error: jobError } = await supabase
      .from('job_descriptions')
      .select('id, title')
      .limit(1);
    
    if (jobError) {
      console.error('❌ Error fetching job descriptions:', jobError.message);
      return;
    }
    
    const jobId = existingJobs?.[0]?.id;
    console.log(`✅ Using job description: ${jobId} (${existingJobs?.[0]?.title})`);
    
    // Get existing topic
    const { data: existingTopics, error: topicError } = await supabase
      .from('question_topics')
      .select('id, name')
      .eq('name', 'Web Development')
      .single();
    
    if (topicError) {
      console.error('❌ Error fetching topic:', topicError.message);
      return;
    }
    
    const topicId = existingTopics?.id;
    console.log(`✅ Using topic: ${topicId} (${existingTopics?.name})`);
    
    // Insert 50 web development questions
    console.log('❓ Inserting 50 web development questions...');
    
    const questions = [
      // HTML & CSS Fundamentals (10 questions)
      {
        job_description_id: jobId,
        question_text: 'What is the correct HTML5 semantic element for the main content of a webpage?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: '<main>' },
          { option: 'B', text: '<content>' },
          { option: 'C', text: '<body>' },
          { option: 'D', text: '<section>' }
        ],
        correct_answer: 'A',
        answer_explanation: 'The <main> element represents the main content of the document. It should be unique and not nested within other semantic elements.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['HTML5', 'semantic', 'structure'],
        topic_id: topicId,
        subtopic: 'Semantic HTML',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Good question for testing HTML5 knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'Which CSS property is used to create rounded corners?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'border-radius' },
          { option: 'B', text: 'corner-radius' },
          { option: 'C', text: 'round-corner' },
          { option: 'D', text: 'border-round' }
        ],
        correct_answer: 'A',
        answer_explanation: 'The border-radius property is used to create rounded corners. It can take values in pixels, percentages, or other CSS units.',
        points: 2,
        time_limit_seconds: 45,
        tags: ['CSS', 'styling', 'border'],
        topic_id: topicId,
        subtopic: 'CSS Properties',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Basic CSS knowledge test'
      },
      {
        job_description_id: jobId,
        question_text: 'What does CSS specificity determine?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Which CSS rule takes precedence when multiple rules apply' },
          { option: 'B', text: 'How fast CSS loads' },
          { option: 'C', text: 'The order of CSS files' },
          { option: 'D', text: 'The size of CSS files' }
        ],
        correct_answer: 'A',
        answer_explanation: 'CSS specificity determines which CSS rule takes precedence when multiple rules apply to the same element.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['CSS', 'specificity', 'cascade'],
        topic_id: topicId,
        subtopic: 'CSS Specificity',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Important concept for CSS mastery'
      },
      {
        job_description_id: jobId,
        question_text: 'Which HTML attribute is used to provide alternative text for images?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'alt' },
          { option: 'B', text: 'title' },
          { option: 'C', text: 'src' },
          { option: 'D', text: 'description' }
        ],
        correct_answer: 'A',
        answer_explanation: 'The alt attribute provides alternative text for images, which is important for accessibility and SEO.',
        points: 2,
        time_limit_seconds: 45,
        tags: ['HTML', 'accessibility', 'images'],
        topic_id: topicId,
        subtopic: 'HTML Attributes',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Accessibility knowledge test'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the difference between margin and padding in CSS?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Margin is outside the element, padding is inside' },
          { option: 'B', text: 'Padding is outside the element, margin is inside' },
          { option: 'C', text: 'They are the same thing' },
          { option: 'D', text: 'Margin affects text, padding affects background' }
        ],
        correct_answer: 'A',
        answer_explanation: 'Margin creates space outside the element border, while padding creates space inside the element border.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['CSS', 'box-model', 'spacing'],
        topic_id: topicId,
        subtopic: 'CSS Box Model',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Fundamental CSS concept'
      },
      {
        job_description_id: jobId,
        question_text: 'Which CSS selector has the highest specificity?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Inline styles' },
          { option: 'B', text: 'ID selectors' },
          { option: 'C', text: 'Class selectors' },
          { option: 'D', text: 'Element selectors' }
        ],
        correct_answer: 'A',
        answer_explanation: 'Inline styles have the highest specificity (1000), followed by ID selectors (100), class selectors (10), and element selectors (1).',
        points: 2,
        time_limit_seconds: 60,
        tags: ['CSS', 'specificity', 'selectors'],
        topic_id: topicId,
        subtopic: 'CSS Specificity',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Advanced CSS knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the purpose of the CSS z-index property?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Controls the stacking order of positioned elements' },
          { option: 'B', text: 'Sets the zoom level' },
          { option: 'C', text: 'Controls the z-axis rotation' },
          { option: 'D', text: 'Sets the z-axis position' }
        ],
        correct_answer: 'A',
        answer_explanation: 'The z-index property controls the stacking order of positioned elements. Higher values appear in front of lower values.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['CSS', 'positioning', 'layering'],
        topic_id: topicId,
        subtopic: 'CSS Positioning',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'CSS positioning knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'Which HTML5 input type is used for email addresses?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'type="email"' },
          { option: 'B', text: 'type="mail"' },
          { option: 'C', text: 'type="text"' },
          { option: 'D', text: 'type="address"' }
        ],
        correct_answer: 'A',
        answer_explanation: 'The input type="email" provides built-in validation for email addresses and shows appropriate keyboard on mobile devices.',
        points: 2,
        time_limit_seconds: 45,
        tags: ['HTML5', 'forms', 'validation'],
        topic_id: topicId,
        subtopic: 'HTML5 Forms',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'HTML5 form knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What does the CSS property "display: flex" do?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Creates a flexible container for layout' },
          { option: 'B', text: 'Makes text flexible' },
          { option: 'C', text: 'Creates flexible borders' },
          { option: 'D', text: 'Makes images flexible' }
        ],
        correct_answer: 'A',
        answer_explanation: 'display: flex creates a flex container, allowing flexible layout of child elements using flexbox properties.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['CSS', 'flexbox', 'layout'],
        topic_id: topicId,
        subtopic: 'Flexbox',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Modern CSS layout knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'Which CSS pseudo-class is used to style visited links?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: ':visited' },
          { option: 'B', text: ':link' },
          { option: 'C', text: ':hover' },
          { option: 'D', text: ':active' }
        ],
        correct_answer: 'A',
        answer_explanation: 'The :visited pseudo-class is used to style links that have been visited by the user.',
        points: 2,
        time_limit_seconds: 45,
        tags: ['CSS', 'pseudo-classes', 'links'],
        topic_id: topicId,
        subtopic: 'CSS Pseudo-classes',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'CSS pseudo-class knowledge'
      },
      
      // JavaScript Core Concepts (10 questions)
      {
        job_description_id: jobId,
        question_text: 'What is the difference between "let" and "var" in JavaScript?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'let has block scope, var has function scope' },
          { option: 'B', text: 'var has block scope, let has function scope' },
          { option: 'C', text: 'They are identical' },
          { option: 'D', text: 'let is faster than var' }
        ],
        correct_answer: 'A',
        answer_explanation: 'let has block scope (limited to the block where it is declared), while var has function scope.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'ES6', 'scope', 'variables'],
        topic_id: topicId,
        subtopic: 'Variable Declarations',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'ES6+ knowledge test'
      },
      {
        job_description_id: jobId,
        question_text: 'What will be the output of: console.log(typeof null)?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'object' },
          { option: 'B', text: 'null' },
          { option: 'C', text: 'undefined' },
          { option: 'D', text: 'string' }
        ],
        correct_answer: 'A',
        answer_explanation: 'typeof null returns "object" due to a bug in JavaScript. This is a well-known quirk in the language.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'typeof', 'null', 'quirks'],
        topic_id: topicId,
        subtopic: 'Type Checking',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'JavaScript quirks knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What is a closure in JavaScript?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'A function that has access to variables in its outer scope' },
          { option: 'B', text: 'A way to close a function' },
          { option: 'C', text: 'A type of loop' },
          { option: 'D', text: 'A way to hide variables' }
        ],
        correct_answer: 'A',
        answer_explanation: 'A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function returns.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'closures', 'scope'],
        topic_id: topicId,
        subtopic: 'Closures',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Advanced JavaScript concept'
      },
      {
        job_description_id: jobId,
        question_text: 'What does the "this" keyword refer to in JavaScript?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'The object that the function is a method of' },
          { option: 'B', text: 'The current function' },
          { option: 'C', text: 'The global object' },
          { option: 'D', text: 'The parent function' }
        ],
        correct_answer: 'A',
        answer_explanation: 'The "this" keyword refers to the object that the function is a method of, but its value depends on how the function is called.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'this', 'context'],
        topic_id: topicId,
        subtopic: 'Context and This',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'JavaScript context knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the difference between == and === in JavaScript?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: '== performs type coercion, === does not' },
          { option: 'B', text: '=== performs type coercion, == does not' },
          { option: 'C', text: 'They are identical' },
          { option: 'D', text: '== is faster than ===' }
        ],
        correct_answer: 'A',
        answer_explanation: '== performs type coercion (converts types before comparison), while === performs strict equality without type coercion.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'comparison', 'equality'],
        topic_id: topicId,
        subtopic: 'Comparison Operators',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'JavaScript comparison knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the purpose of the "use strict" directive?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Enables strict mode for better error checking' },
          { option: 'B', text: 'Makes code run faster' },
          { option: 'C', text: 'Enables strict typing' },
          { option: 'D', text: 'Prevents all errors' }
        ],
        correct_answer: 'A',
        answer_explanation: '"use strict" enables strict mode, which catches common coding mistakes and prevents certain actions that could lead to errors.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'strict-mode', 'best-practices'],
        topic_id: topicId,
        subtopic: 'Strict Mode',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'JavaScript best practices'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the difference between null and undefined in JavaScript?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'null is an assigned value, undefined means not assigned' },
          { option: 'B', text: 'undefined is an assigned value, null means not assigned' },
          { option: 'C', text: 'They are identical' },
          { option: 'D', text: 'null is a string, undefined is a number' }
        ],
        correct_answer: 'A',
        answer_explanation: 'null is an assigned value representing "no value", while undefined means a variable has been declared but not assigned a value.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'null', 'undefined', 'values'],
        topic_id: topicId,
        subtopic: 'Data Types',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'JavaScript value types'
      },
      {
        job_description_id: jobId,
        question_text: 'What does the Array.map() method do?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Creates a new array with transformed elements' },
          { option: 'B', text: 'Filters array elements' },
          { option: 'C', text: 'Sorts array elements' },
          { option: 'D', text: 'Reverses array elements' }
        ],
        correct_answer: 'A',
        answer_explanation: 'Array.map() creates a new array by calling a function on every element of the original array and returning the results.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'arrays', 'methods', 'functional-programming'],
        topic_id: topicId,
        subtopic: 'Array Methods',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'JavaScript array methods'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the purpose of the "const" keyword in JavaScript?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Creates a constant that cannot be reassigned' },
          { option: 'B', text: 'Creates a constant that cannot be changed at all' },
          { option: 'C', text: 'Creates a variable that is faster' },
          { option: 'D', text: 'Creates a variable that is private' }
        ],
        correct_answer: 'A',
        answer_explanation: 'const creates a constant that cannot be reassigned, but the contents of objects and arrays can still be modified.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'ES6', 'const', 'constants'],
        topic_id: topicId,
        subtopic: 'Variable Declarations',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'ES6+ variable declarations'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the difference between function declarations and function expressions?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Function declarations are hoisted, expressions are not' },
          { option: 'B', text: 'Function expressions are hoisted, declarations are not' },
          { option: 'C', text: 'They are identical' },
          { option: 'D', text: 'Function declarations are faster' }
        ],
        correct_answer: 'A',
        answer_explanation: 'Function declarations are hoisted (can be called before they are defined), while function expressions are not hoisted.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'functions', 'hoisting'],
        topic_id: topicId,
        subtopic: 'Functions',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'JavaScript function concepts'
      },
      
      // DOM Manipulation (5 questions)
      {
        job_description_id: jobId,
        question_text: 'What method is used to select an element by its ID in JavaScript?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'document.getElementById()' },
          { option: 'B', text: 'document.getElementsByClass()' },
          { option: 'C', text: 'document.querySelector()' },
          { option: 'D', text: 'document.getElement()' }
        ],
        correct_answer: 'A',
        answer_explanation: 'document.getElementById() is the standard method to select an element by its ID attribute.',
        points: 2,
        time_limit_seconds: 45,
        tags: ['JavaScript', 'DOM', 'selectors'],
        topic_id: topicId,
        subtopic: 'Element Selection',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'DOM manipulation basics'
      },
      {
        job_description_id: jobId,
        question_text: 'What does the addEventListener() method do?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Attaches an event handler to an element' },
          { option: 'B', text: 'Adds a new element to the DOM' },
          { option: 'C', text: 'Removes an event handler' },
          { option: 'D', text: 'Creates a new event' }
        ],
        correct_answer: 'A',
        answer_explanation: 'addEventListener() attaches an event handler to an element, allowing you to respond to user interactions.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'DOM', 'events'],
        topic_id: topicId,
        subtopic: 'Event Handling',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'DOM event handling'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the difference between innerHTML and textContent?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'innerHTML includes HTML tags, textContent only includes text' },
          { option: 'B', text: 'textContent includes HTML tags, innerHTML only includes text' },
          { option: 'C', text: 'They are identical' },
          { option: 'D', text: 'innerHTML is faster than textContent' }
        ],
        correct_answer: 'A',
        answer_explanation: 'innerHTML includes HTML markup, while textContent only includes the text content without HTML tags.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'DOM', 'content'],
        topic_id: topicId,
        subtopic: 'Content Manipulation',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'DOM content manipulation'
      },
      {
        job_description_id: jobId,
        question_text: 'What method is used to create a new element in JavaScript?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'document.createElement()' },
          { option: 'B', text: 'document.newElement()' },
          { option: 'C', text: 'document.addElement()' },
          { option: 'D', text: 'document.buildElement()' }
        ],
        correct_answer: 'A',
        answer_explanation: 'document.createElement() creates a new HTML element that can then be added to the DOM.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'DOM', 'creation'],
        topic_id: topicId,
        subtopic: 'Element Creation',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'DOM element creation'
      },
      {
        job_description_id: jobId,
        question_text: 'What does the preventDefault() method do?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Prevents the default action of an event' },
          { option: 'B', text: 'Prevents all events' },
          { option: 'C', text: 'Prevents event bubbling' },
          { option: 'D', text: 'Prevents event capturing' }
        ],
        correct_answer: 'A',
        answer_explanation: 'preventDefault() prevents the default action of an event from occurring (like following a link or submitting a form).',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'DOM', 'events', 'prevention'],
        topic_id: topicId,
        subtopic: 'Event Prevention',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Event handling knowledge'
      },
      
      // CSS Layout & Responsive Design (5 questions)
      {
        job_description_id: jobId,
        question_text: 'What is the difference between CSS Grid and Flexbox?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Grid is for 2D layouts, Flexbox is for 1D layouts' },
          { option: 'B', text: 'Flexbox is for 2D layouts, Grid is for 1D layouts' },
          { option: 'C', text: 'They are identical' },
          { option: 'D', text: 'Grid is older than Flexbox' }
        ],
        correct_answer: 'A',
        answer_explanation: 'CSS Grid is designed for 2D layouts (rows and columns), while Flexbox is designed for 1D layouts (either row or column).',
        points: 2,
        time_limit_seconds: 60,
        tags: ['CSS', 'grid', 'flexbox', 'layout'],
        topic_id: topicId,
        subtopic: 'Layout Systems',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Modern CSS layout knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What does the CSS property "position: sticky" do?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Positions element relative until it reaches a threshold, then fixed' },
          { option: 'B', text: 'Makes element sticky to touch' },
          { option: 'C', text: 'Makes element always visible' },
          { option: 'D', text: 'Makes element transparent' }
        ],
        correct_answer: 'A',
        answer_explanation: 'position: sticky positions an element relative until it reaches a specified threshold, then it becomes fixed.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['CSS', 'positioning', 'sticky'],
        topic_id: topicId,
        subtopic: 'CSS Positioning',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Advanced CSS positioning'
      },
      {
        job_description_id: jobId,
        question_text: 'What is a CSS media query used for?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Apply styles based on device characteristics' },
          { option: 'B', text: 'Query media files' },
          { option: 'C', text: 'Apply styles to media elements' },
          { option: 'D', text: 'Query CSS properties' }
        ],
        correct_answer: 'A',
        answer_explanation: 'CSS media queries apply styles based on device characteristics like screen size, resolution, or orientation.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['CSS', 'media-queries', 'responsive'],
        topic_id: topicId,
        subtopic: 'Responsive Design',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Responsive design knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What does "vw" unit represent in CSS?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: '1% of viewport width' },
          { option: 'B', text: '1% of viewport height' },
          { option: 'C', text: '1% of parent width' },
          { option: 'D', text: '1% of parent height' }
        ],
        correct_answer: 'A',
        answer_explanation: 'vw (viewport width) represents 1% of the viewport width, making it useful for responsive design.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['CSS', 'units', 'viewport', 'responsive'],
        topic_id: topicId,
        subtopic: 'CSS Units',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'CSS units knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the CSS "box-sizing: border-box" property used for?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Include padding and border in element width' },
          { option: 'B', text: 'Exclude padding and border from element width' },
          { option: 'C', text: 'Add extra padding' },
          { option: 'D', text: 'Remove borders' }
        ],
        correct_answer: 'A',
        answer_explanation: 'box-sizing: border-box includes padding and border in the element width, making layout calculations more predictable.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['CSS', 'box-model', 'box-sizing'],
        topic_id: topicId,
        subtopic: 'Box Model',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'CSS box model knowledge'
      },
      
      // JavaScript Async Programming (5 questions)
      {
        job_description_id: jobId,
        question_text: 'What is a Promise in JavaScript?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'An object representing eventual completion of an async operation' },
          { option: 'B', text: 'A function that always returns a value' },
          { option: 'C', text: 'A type of loop' },
          { option: 'D', text: 'A way to store data' }
        ],
        correct_answer: 'A',
        answer_explanation: 'A Promise is an object representing the eventual completion or failure of an asynchronous operation.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'promises', 'async'],
        topic_id: topicId,
        subtopic: 'Promises',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Async programming knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What does the async/await syntax do?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Makes asynchronous code look synchronous' },
          { option: 'B', text: 'Makes synchronous code asynchronous' },
          { option: 'C', text: 'Makes code run faster' },
          { option: 'D', text: 'Makes code more secure' }
        ],
        correct_answer: 'A',
        answer_explanation: 'async/await makes asynchronous code look and behave more like synchronous code, improving readability.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'async-await', 'syntax'],
        topic_id: topicId,
        subtopic: 'Async/Await',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Modern async programming'
      },
      {
        job_description_id: jobId,
        question_text: 'What happens when a Promise is rejected?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'The catch block or .catch() method is executed' },
          { option: 'B', text: 'The then block is executed' },
          { option: 'C', text: 'The code stops running' },
          { option: 'D', text: 'An error is thrown immediately' }
        ],
        correct_answer: 'A',
        answer_explanation: 'When a Promise is rejected, the catch block or .catch() method is executed to handle the error.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'promises', 'error-handling'],
        topic_id: topicId,
        subtopic: 'Promise Error Handling',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Promise error handling'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the purpose of Promise.all()?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Wait for all promises to resolve' },
          { option: 'B', text: 'Wait for the first promise to resolve' },
          { option: 'C', text: 'Cancel all promises' },
          { option: 'D', text: 'Create multiple promises' }
        ],
        correct_answer: 'A',
        answer_explanation: 'Promise.all() waits for all promises in an array to resolve, returning an array of resolved values.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'promises', 'concurrency'],
        topic_id: topicId,
        subtopic: 'Promise Methods',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Promise concurrency knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What does the setTimeout() function do?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Executes a function after a specified delay' },
          { option: 'B', text: 'Sets a timer for an element' },
          { option: 'C', text: 'Delays all code execution' },
          { option: 'D', text: 'Creates a timeout error' }
        ],
        correct_answer: 'A',
        answer_explanation: 'setTimeout() executes a function after a specified delay in milliseconds.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'timers', 'async'],
        topic_id: topicId,
        subtopic: 'Timers',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'JavaScript timer functions'
      },
      
      // Web APIs & HTTP (5 questions)
      {
        job_description_id: jobId,
        question_text: 'What does HTTP status code 404 mean?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Not Found' },
          { option: 'B', text: 'Server Error' },
          { option: 'C', text: 'Unauthorized' },
          { option: 'D', text: 'Forbidden' }
        ],
        correct_answer: 'A',
        answer_explanation: 'HTTP 404 means "Not Found" - the requested resource could not be found on the server.',
        points: 2,
        time_limit_seconds: 45,
        tags: ['HTTP', 'status-codes', 'web'],
        topic_id: topicId,
        subtopic: 'HTTP Status Codes',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'HTTP knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the difference between GET and POST HTTP methods?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'GET retrieves data, POST sends data' },
          { option: 'B', text: 'POST retrieves data, GET sends data' },
          { option: 'C', text: 'They are identical' },
          { option: 'D', text: 'GET is faster than POST' }
        ],
        correct_answer: 'A',
        answer_explanation: 'GET is used to retrieve data from a server, while POST is used to send data to a server.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['HTTP', 'methods', 'web'],
        topic_id: topicId,
        subtopic: 'HTTP Methods',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'HTTP methods knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What is CORS in web development?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Cross-Origin Resource Sharing' },
          { option: 'B', text: 'Cross-Origin Request Security' },
          { option: 'C', text: 'Cross-Origin Response Sharing' },
          { option: 'D', text: 'Cross-Origin Resource Security' }
        ],
        correct_answer: 'A',
        answer_explanation: 'CORS (Cross-Origin Resource Sharing) is a security feature that allows web pages to make requests to different domains.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['web', 'CORS', 'security', 'APIs'],
        topic_id: topicId,
        subtopic: 'CORS',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Web security knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What does the fetch() API return?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'A Promise that resolves to a Response object' },
          { option: 'B', text: 'A Response object directly' },
          { option: 'C', text: 'A string with the response' },
          { option: 'D', text: 'An error object' }
        ],
        correct_answer: 'A',
        answer_explanation: 'fetch() returns a Promise that resolves to a Response object representing the response to the request.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'fetch', 'APIs', 'async'],
        topic_id: topicId,
        subtopic: 'Fetch API',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Modern web APIs knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What is JSON in web development?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'JavaScript Object Notation - a data format' },
          { option: 'B', text: 'A JavaScript library' },
          { option: 'C', text: 'A database system' },
          { option: 'D', text: 'A programming language' }
        ],
        correct_answer: 'A',
        answer_explanation: 'JSON (JavaScript Object Notation) is a lightweight data interchange format that is easy to read and write.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JSON', 'data-format', 'web'],
        topic_id: topicId,
        subtopic: 'Data Formats',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Data format knowledge'
      },
      
      // Browser APIs (3 questions)
      {
        job_description_id: jobId,
        question_text: 'What is the difference between localStorage and sessionStorage?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'localStorage persists until cleared, sessionStorage lasts for session' },
          { option: 'B', text: 'sessionStorage persists until cleared, localStorage lasts for session' },
          { option: 'C', text: 'They are identical' },
          { option: 'D', text: 'localStorage is faster than sessionStorage' }
        ],
        correct_answer: 'A',
        answer_explanation: 'localStorage persists until explicitly cleared, while sessionStorage only lasts for the browser session.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'storage', 'browser-apis'],
        topic_id: topicId,
        subtopic: 'Web Storage',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Browser storage knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What does the Geolocation API do?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Provides access to device location' },
          { option: 'B', text: 'Provides access to device camera' },
          { option: 'C', text: 'Provides access to device microphone' },
          { option: 'D', text: 'Provides access to device storage' }
        ],
        correct_answer: 'A',
        answer_explanation: 'The Geolocation API provides access to the device location information with user permission.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'geolocation', 'browser-apis'],
        topic_id: topicId,
        subtopic: 'Geolocation API',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Browser API knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the purpose of the Intersection Observer API?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Observes when elements enter or exit the viewport' },
          { option: 'B', text: 'Observes mouse movements' },
          { option: 'C', text: 'Observes keyboard events' },
          { option: 'D', text: 'Observes network requests' }
        ],
        correct_answer: 'A',
        answer_explanation: 'The Intersection Observer API observes when elements enter or exit the viewport, useful for lazy loading and animations.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'intersection-observer', 'browser-apis'],
        topic_id: topicId,
        subtopic: 'Intersection Observer',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Advanced browser APIs'
      },
      
      // Web Performance (2 questions)
      {
        job_description_id: jobId,
        question_text: 'What is lazy loading in web development?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Loading resources only when needed' },
          { option: 'B', text: 'Loading resources slowly' },
          { option: 'C', text: 'Loading resources in background' },
          { option: 'D', text: 'Loading resources multiple times' }
        ],
        correct_answer: 'A',
        answer_explanation: 'Lazy loading loads resources (like images) only when they are needed, improving page performance.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['performance', 'optimization', 'lazy-loading'],
        topic_id: topicId,
        subtopic: 'Performance Optimization',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Web performance knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the purpose of minification in web development?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Reduce file size by removing unnecessary characters' },
          { option: 'B', text: 'Make code more readable' },
          { option: 'C', text: 'Add comments to code' },
          { option: 'D', text: 'Convert code to different format' }
        ],
        correct_answer: 'A',
        answer_explanation: 'Minification reduces file size by removing unnecessary characters like whitespace and comments.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['performance', 'optimization', 'minification'],
        topic_id: topicId,
        subtopic: 'Code Optimization',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Web optimization techniques'
      },
      
      // Web Security (2 questions)
      {
        job_description_id: jobId,
        question_text: 'What is XSS (Cross-Site Scripting)?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'A security vulnerability where malicious scripts are injected' },
          { option: 'B', text: 'A way to share scripts between sites' },
          { option: 'C', text: 'A JavaScript framework' },
          { option: 'D', text: 'A type of CSS' }
        ],
        correct_answer: 'A',
        answer_explanation: 'XSS is a security vulnerability where malicious scripts are injected into web pages viewed by other users.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['security', 'XSS', 'vulnerabilities'],
        topic_id: topicId,
        subtopic: 'Web Security',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Web security knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What is CSRF (Cross-Site Request Forgery)?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'An attack that tricks users into performing unwanted actions' },
          { option: 'B', text: 'A way to prevent requests' },
          { option: 'C', text: 'A type of authentication' },
          { option: 'D', text: 'A JavaScript library' }
        ],
        correct_answer: 'A',
        answer_explanation: 'CSRF is an attack that tricks users into performing unwanted actions on a web application where they are authenticated.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['security', 'CSRF', 'attacks'],
        topic_id: topicId,
        subtopic: 'Web Security',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Web security vulnerabilities'
      },
      
      // Modern JavaScript (3 questions)
      {
        job_description_id: jobId,
        question_text: 'What is destructuring in JavaScript?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Extracting values from arrays or objects into variables' },
          { option: 'B', text: 'Destroying arrays or objects' },
          { option: 'C', text: 'Creating new arrays or objects' },
          { option: 'D', text: 'Sorting arrays or objects' }
        ],
        correct_answer: 'A',
        answer_explanation: 'Destructuring allows you to extract values from arrays or properties from objects into distinct variables.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'ES6', 'destructuring'],
        topic_id: topicId,
        subtopic: 'ES6+ Features',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Modern JavaScript features'
      },
      {
        job_description_id: jobId,
        question_text: 'What is the spread operator (...) used for in JavaScript?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'Expanding arrays or objects into individual elements' },
          { option: 'B', text: 'Combining arrays or objects' },
          { option: 'C', text: 'Splitting strings' },
          { option: 'D', text: 'Creating loops' }
        ],
        correct_answer: 'A',
        answer_explanation: 'The spread operator (...) expands arrays or objects into individual elements, useful for copying, merging, or passing arguments.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'ES6', 'spread-operator'],
        topic_id: topicId,
        subtopic: 'ES6+ Features',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'ES6+ operator knowledge'
      },
      {
        job_description_id: jobId,
        question_text: 'What is a template literal in JavaScript?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: [
          { option: 'A', text: 'A string that allows embedded expressions' },
          { option: 'B', text: 'A template for creating objects' },
          { option: 'C', text: 'A template for creating functions' },
          { option: 'D', text: 'A template for creating arrays' }
        ],
        correct_answer: 'A',
        answer_explanation: 'Template literals are strings that allow embedded expressions using backticks (`) and ${} syntax.',
        points: 2,
        time_limit_seconds: 60,
        tags: ['JavaScript', 'ES6', 'template-literals'],
        topic_id: topicId,
        subtopic: 'ES6+ Features',
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Modern JavaScript syntax'
      }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    console.log(`📝 Processing ${questions.length} questions...`);
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      try {
        console.log(`📝 Inserting question ${i + 1}/${questions.length}...`);
        
        const { error: questionError } = await supabase
          .from('exam_questions')
          .insert(question);
        
        if (questionError) {
          console.error(`❌ Error creating question ${i + 1}:`, questionError.message);
          errorCount++;
        } else {
          console.log(`✅ Question ${i + 1} created successfully`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating question ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Insertion Summary:');
    console.log(`✅ Successful insertions: ${successCount}`);
    console.log(`❌ Failed insertions: ${errorCount}`);
    console.log(`📝 Total questions: ${questions.length}`);
    
    // Verify the insertion
    console.log('\n🔍 Verifying insertion...');
    const { data: insertedQuestions, error: verifyError } = await supabase
      .from('exam_questions')
      .select('id, question_text')
      .eq('job_description_id', jobId)
      .eq('question_type', 'mcq')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (verifyError) {
      console.error('❌ Error verifying questions:', verifyError.message);
    } else {
      console.log(`✅ Found ${insertedQuestions?.length || 0} MCQ questions in database`);
      insertedQuestions?.forEach((q, index) => {
        console.log(`  ${index + 1}. ${q.question_text.substring(0, 60)}...`);
      });
    }
    
    console.log('\n🎉 Web development questions insertion completed!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
insertWebDevQuestions().then(() => {
  console.log('✨ Script completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
