// Simple Database Question Insertion Script
// Inserts web development MCQ questions using existing schema

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
    
    // First, let's check what job descriptions exist
    console.log('🔍 Checking existing job descriptions...');
    const { data: existingJobs, error: jobError } = await supabase
      .from('job_descriptions')
      .select('id, title')
      .limit(5);
    
    if (jobError) {
      console.error('❌ Error fetching job descriptions:', jobError.message);
      return;
    }
    
    console.log('📋 Existing job descriptions:');
    existingJobs?.forEach(job => {
      console.log(`  - ${job.id}: ${job.title}`);
    });
    
    // Use the first available job description or create a simple one
    let jobId = existingJobs?.[0]?.id;
    
    if (!jobId) {
      console.log('📝 Creating a new job description...');
      const { data: newJob, error: newJobError } = await supabase
        .from('job_descriptions')
        .insert({
          title: 'Web Developer',
          description: 'Frontend web developer position',
          requirements: 'HTML, CSS, JavaScript knowledge',
          responsibilities: 'Develop web applications',
          company_name: 'TechCorp',
          location: 'Remote',
          salary_range: '$50,000 - $70,000',
          employment_type: 'Full-time',
          experience_level: 'Mid-level',
          skills_required: '["HTML", "CSS", "JavaScript"]'
        })
        .select('id')
        .single();
      
      if (newJobError) {
        console.error('❌ Error creating job description:', newJobError.message);
        return;
      }
      
      jobId = newJob.id;
      console.log(`✅ Created job description with ID: ${jobId}`);
    } else {
      console.log(`✅ Using existing job description: ${jobId}`);
    }
    
    // Check existing topics
    console.log('🔍 Checking existing topics...');
    const { data: existingTopics, error: topicError } = await supabase
      .from('question_topics')
      .select('id, name')
      .limit(10);
    
    if (topicError) {
      console.error('❌ Error fetching topics:', topicError.message);
    } else {
      console.log('📚 Existing topics:');
      existingTopics?.forEach(topic => {
        console.log(`  - ${topic.id}: ${topic.name}`);
      });
    }
    
    // Use existing topic or create a simple one
    let topicId = existingTopics?.[0]?.id;
    
    if (!topicId) {
      console.log('📝 Creating a new topic...');
      const { data: newTopic, error: newTopicError } = await supabase
        .from('question_topics')
        .insert({
          name: 'Web Development',
          description: 'General web development concepts'
        })
        .select('id')
        .single();
      
      if (newTopicError) {
        console.error('❌ Error creating topic:', newTopicError.message);
        return;
      }
      
      topicId = newTopic.id;
      console.log(`✅ Created topic with ID: ${topicId}`);
    } else {
      console.log(`✅ Using existing topic: ${topicId}`);
    }
    
    // Insert sample questions
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
        created_by: 'system',
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
        created_by: 'system',
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
        created_by: 'system',
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
        created_by: 'system',
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
        created_by: 'system',
        status: 'approved',
        hr_notes: 'DOM event handling knowledge'
      }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const question of questions) {
      try {
        const { error: questionError } = await supabase
          .from('exam_questions')
          .insert(question);
        
        if (questionError) {
          console.error(`❌ Error creating question:`, questionError.message);
          errorCount++;
        } else {
          console.log(`✅ Question created successfully`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating question:`, error.message);
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
      .eq('question_type', 'mcq');
    
    if (verifyError) {
      console.error('❌ Error verifying questions:', verifyError.message);
    } else {
      console.log(`✅ Found ${insertedQuestions?.length || 0} MCQ questions in database`);
      insertedQuestions?.forEach((q, index) => {
        console.log(`  ${index + 1}. ${q.question_text.substring(0, 50)}...`);
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
