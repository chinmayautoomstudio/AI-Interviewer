// Check Database Schema Script
// Check what valid values are allowed for created_by field

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

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check existing questions to see what created_by values are used
    const { data: existingQuestions, error: questionError } = await supabase
      .from('exam_questions')
      .select('created_by')
      .limit(10);
    
    if (questionError) {
      console.error('❌ Error fetching questions:', questionError.message);
      return;
    }
    
    console.log('📋 Existing created_by values:');
    const uniqueCreatedBy = [...new Set(existingQuestions?.map(q => q.created_by))];
    uniqueCreatedBy.forEach(value => {
      console.log(`  - "${value}"`);
    });
    
    // Try to get more info about the constraint
    console.log('\n🔍 Checking question structure...');
    const { data: sampleQuestion, error: sampleError } = await supabase
      .from('exam_questions')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleError) {
      console.error('❌ Error fetching sample question:', sampleError.message);
    } else {
      console.log('📝 Sample question structure:');
      Object.keys(sampleQuestion).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleQuestion[key]}`);
      });
    }
    
    // Try different created_by values
    console.log('\n🧪 Testing different created_by values...');
    const testValues = ['admin', 'system', 'user', 'hr', 'interviewer'];
    
    for (const testValue of testValues) {
      try {
        const { error: testError } = await supabase
          .from('exam_questions')
          .insert({
            job_description_id: existingQuestions?.[0]?.job_description_id || 'a16ed2c5-8f81-4692-bd34-994b88f32bdb',
            question_text: 'Test question',
            question_type: 'mcq',
            question_category: 'technical',
            difficulty_level: 'easy',
            mcq_options: [{ option: 'A', text: 'Test' }],
            correct_answer: 'A',
            answer_explanation: 'Test explanation',
            points: 1,
            time_limit_seconds: 30,
            tags: ['test'],
            topic_id: '06134d4e-a926-4a18-bd6f-53e4c2453a44',
            subtopic: 'Test',
            created_by: testValue,
            status: 'approved',
            hr_notes: 'Test question'
          });
        
        if (testError) {
          console.log(`❌ "${testValue}" - ${testError.message}`);
        } else {
          console.log(`✅ "${testValue}" - Success!`);
          // Delete the test question
          await supabase
            .from('exam_questions')
            .delete()
            .eq('question_text', 'Test question');
          break;
        }
      } catch (error) {
        console.log(`❌ "${testValue}" - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

// Run the script
checkSchema().then(() => {
  console.log('✨ Schema check completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
