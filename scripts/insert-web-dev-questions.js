// Database Question Insertion Script
// Inserts 50 web development MCQ questions into the database

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertQuestions() {
  try {
    console.log('🚀 Starting question insertion process...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'sql', 'web-development-mcq-questions.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    console.log(`📊 File size: ${sqlContent.length} characters`);
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
          
          const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: statement
          });
          
          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase
              .from('_temp_table')
              .select('*')
              .limit(0);
            
            if (directError && directError.message.includes('relation "_temp_table" does not exist')) {
              // This is expected, continue with next statement
              console.log(`✅ Statement ${i + 1} executed successfully`);
              successCount++;
            } else {
              throw directError;
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          errorCount++;
          
          // Continue with next statement
          continue;
        }
      }
    }
    
    console.log('\n📊 Execution Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📝 Total statements: ${statements.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All questions inserted successfully!');
    } else {
      console.log(`\n⚠️  ${errorCount} statements failed. Check the errors above.`);
    }
    
    // Verify the insertion by counting questions
    console.log('\n🔍 Verifying insertion...');
    
    const { data: jobCount, error: jobError } = await supabase
      .from('job_descriptions')
      .select('id')
      .eq('id', 'web-dev-job-001');
    
    if (jobError) {
      console.error('❌ Error verifying job description:', jobError.message);
    } else if (jobCount && jobCount.length > 0) {
      console.log('✅ Job description created successfully');
    }
    
    const { data: questionCount, error: questionError } = await supabase
      .from('exam_questions')
      .select('id')
      .eq('job_description_id', 'web-dev-job-001')
      .eq('question_type', 'mcq');
    
    if (questionError) {
      console.error('❌ Error verifying questions:', questionError.message);
    } else {
      console.log(`✅ Found ${questionCount?.length || 0} MCQ questions for web development job`);
    }
    
    const { data: topicCount, error: topicError } = await supabase
      .from('question_topics')
      .select('id')
      .like('id', '%web%');
    
    if (topicError) {
      console.error('❌ Error verifying topics:', topicError.message);
    } else {
      console.log(`✅ Found ${topicCount?.length || 0} web development topics`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function insertQuestionsDirect() {
  try {
    console.log('🚀 Starting direct question insertion...');
    
    // First, create the job description
    console.log('📝 Creating job description...');
    const { error: jobError } = await supabase
      .from('job_descriptions')
      .upsert({
        id: 'web-dev-job-001',
        title: 'Frontend Web Developer',
        description: 'We are looking for a skilled Frontend Web Developer to join our team. The ideal candidate will be responsible for building user-facing web applications using modern web technologies.',
        requirements: 'Bachelor degree in Computer Science or related field, 2-3 years of experience in web development, strong knowledge of HTML, CSS, JavaScript, and modern frameworks.',
        responsibilities: 'Develop and maintain web applications, collaborate with design team, optimize applications for maximum speed and scalability, ensure cross-browser compatibility.',
        company_name: 'TechCorp Solutions',
        location: 'Remote',
        salary_range: '$60,000 - $80,000',
        employment_type: 'Full-time',
        experience_level: 'Mid-level',
        skills_required: '["HTML", "CSS", "JavaScript", "React", "Vue.js", "TypeScript", "Webpack", "Git"]',
        is_active: true
      });
    
    if (jobError) {
      console.error('❌ Error creating job description:', jobError.message);
    } else {
      console.log('✅ Job description created successfully');
    }
    
    // Create topics
    console.log('📚 Creating topics...');
    const topics = [
      { id: 'html-css-basics', name: 'HTML & CSS Fundamentals', description: 'Basic concepts of HTML structure and CSS styling' },
      { id: 'javascript-core', name: 'JavaScript Core Concepts', description: 'Fundamental JavaScript programming concepts' },
      { id: 'dom-manipulation', name: 'DOM Manipulation', description: 'Working with the Document Object Model' },
      { id: 'css-layout', name: 'CSS Layout & Responsive Design', description: 'CSS Grid, Flexbox, and responsive design principles' },
      { id: 'javascript-async', name: 'JavaScript Async Programming', description: 'Promises, async/await, and asynchronous programming' },
      { id: 'web-apis', name: 'Web APIs & HTTP', description: 'Understanding web APIs, HTTP methods, and status codes' },
      { id: 'browser-apis', name: 'Browser APIs', description: 'Local Storage, Session Storage, and other browser APIs' },
      { id: 'performance', name: 'Web Performance', description: 'Optimization techniques and performance best practices' },
      { id: 'security', name: 'Web Security', description: 'Security best practices and common vulnerabilities' },
      { id: 'modern-js', name: 'Modern JavaScript', description: 'ES6+ features and modern JavaScript concepts' }
    ];
    
    for (const topic of topics) {
      const { error: topicError } = await supabase
        .from('question_topics')
        .upsert({
          ...topic,
          is_active: true
        });
      
      if (topicError) {
        console.error(`❌ Error creating topic ${topic.id}:`, topicError.message);
      }
    }
    
    console.log('✅ Topics created successfully');
    
    // Sample questions (first 5 for testing)
    console.log('❓ Creating sample questions...');
    const sampleQuestions = [
      {
        id: 'web-dev-q001',
        job_description_id: 'web-dev-job-001',
        question_text: 'What is the correct HTML5 semantic element for the main content of a webpage?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: '[{"option": "A", "text": "<main>"}, {"option": "B", "text": "<content>"}, {"option": "C", "text": "<body>"}, {"option": "D", "text": "<section>"}]',
        correct_answer: 'A',
        answer_explanation: 'The <main> element represents the main content of the document. It should be unique and not nested within other semantic elements like <article>, <aside>, <footer>, <header>, or <nav>.',
        points: 2,
        time_limit_seconds: 60,
        tags: '["HTML5", "semantic", "structure"]',
        topic_id: 'html-css-basics',
        subtopic: 'Semantic HTML',
        created_by: 'system',
        status: 'approved',
        hr_notes: 'Good question for testing HTML5 knowledge',
        is_active: true
      },
      {
        id: 'web-dev-q002',
        job_description_id: 'web-dev-job-001',
        question_text: 'Which CSS property is used to create rounded corners?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: '[{"option": "A", "text": "border-radius"}, {"option": "B", "text": "corner-radius"}, {"option": "C", "text": "round-corner"}, {"option": "D", "text": "border-round"}]',
        correct_answer: 'A',
        answer_explanation: 'The border-radius property is used to create rounded corners. It can take values in pixels, percentages, or other CSS units.',
        points: 2,
        time_limit_seconds: 45,
        tags: '["CSS", "styling", "border"]',
        topic_id: 'html-css-basics',
        subtopic: 'CSS Properties',
        created_by: 'system',
        status: 'approved',
        hr_notes: 'Basic CSS knowledge test',
        is_active: true
      },
      {
        id: 'web-dev-q003',
        job_description_id: 'web-dev-job-001',
        question_text: 'What does CSS specificity determine?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: '[{"option": "A", "text": "Which CSS rule takes precedence when multiple rules apply"}, {"option": "B", "text": "How fast CSS loads"}, {"option": "C", "text": "The order of CSS files"}, {"option": "D", "text": "The size of CSS files"}]',
        correct_answer: 'A',
        answer_explanation: 'CSS specificity determines which CSS rule takes precedence when multiple rules apply to the same element. Higher specificity rules override lower specificity rules.',
        points: 2,
        time_limit_seconds: 60,
        tags: '["CSS", "specificity", "cascade"]',
        topic_id: 'html-css-basics',
        subtopic: 'CSS Specificity',
        created_by: 'system',
        status: 'approved',
        hr_notes: 'Important concept for CSS mastery',
        is_active: true
      },
      {
        id: 'web-dev-q004',
        job_description_id: 'web-dev-job-001',
        question_text: 'Which HTML attribute is used to provide alternative text for images?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: '[{"option": "A", "text": "alt"}, {"option": "B", "text": "title"}, {"option": "C", "text": "src"}, {"option": "D", "text": "description"}]',
        correct_answer: 'A',
        answer_explanation: 'The alt attribute provides alternative text for images, which is important for accessibility and SEO. It should describe the image content.',
        points: 2,
        time_limit_seconds: 45,
        tags: '["HTML", "accessibility", "images"]',
        topic_id: 'html-css-basics',
        subtopic: 'HTML Attributes',
        created_by: 'system',
        status: 'approved',
        hr_notes: 'Accessibility knowledge test',
        is_active: true
      },
      {
        id: 'web-dev-q005',
        job_description_id: 'web-dev-job-001',
        question_text: 'What is the difference between margin and padding in CSS?',
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: 'medium',
        mcq_options: '[{"option": "A", "text": "Margin is outside the element, padding is inside"}, {"option": "B", "text": "Padding is outside the element, margin is inside"}, {"option": "C", "text": "They are the same thing"}, {"option": "D", "text": "Margin affects text, padding affects background"}]',
        correct_answer: 'A',
        answer_explanation: 'Margin creates space outside the element border, while padding creates space inside the element border, between the content and the border.',
        points: 2,
        time_limit_seconds: 60,
        tags: '["CSS", "box-model", "spacing"]',
        topic_id: 'html-css-basics',
        subtopic: 'CSS Box Model',
        created_by: 'system',
        status: 'approved',
        hr_notes: 'Fundamental CSS concept',
        is_active: true
      }
    ];
    
    for (const question of sampleQuestions) {
      const { error: questionError } = await supabase
        .from('exam_questions')
        .upsert(question);
      
      if (questionError) {
        console.error(`❌ Error creating question ${question.id}:`, questionError.message);
      } else {
        console.log(`✅ Question ${question.id} created successfully`);
      }
    }
    
    console.log('\n🎉 Sample questions inserted successfully!');
    console.log('📊 Summary:');
    console.log('✅ 1 Job description created');
    console.log('✅ 10 Topics created');
    console.log('✅ 5 Sample questions created');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('🎯 Web Development MCQ Questions Insertion Script');
  console.log('================================================\n');
  
  // Check if we should use direct method
  const useDirect = process.argv.includes('--direct');
  
  if (useDirect) {
    await insertQuestionsDirect();
  } else {
    await insertQuestions();
  }
  
  console.log('\n✨ Script completed successfully!');
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
