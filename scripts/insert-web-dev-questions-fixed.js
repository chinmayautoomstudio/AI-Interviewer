// Fixed Database Question Insertion Script
// Inserts web development MCQ questions with correct constraints

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
    
    // Insert questions with proper created_by value
    console.log('❓ Inserting web development questions...');
    
    const questions = [
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
        created_by: 'admin', // Changed from 'system' to 'admin'
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
        created_by: 'admin',
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
        created_by: 'admin',
        status: 'approved',
        hr_notes: 'Important concept for CSS mastery'
      },
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
        created_by: 'admin',
        status: 'approved',
        hr_notes: 'ES6+ knowledge test'
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
        created_by: 'admin',
        status: 'approved',
        hr_notes: 'DOM event handling knowledge'
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
        created_by: 'admin',
        status: 'approved',
        hr_notes: 'Fundamental CSS concept'
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
        created_by: 'admin',
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
        created_by: 'admin',
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
        created_by: 'admin',
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
        created_by: 'admin',
        status: 'approved',
        hr_notes: 'JavaScript comparison knowledge'
      }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
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
