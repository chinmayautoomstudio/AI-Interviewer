// Check available questions by difficulty
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkQuestions() {
  try {
    console.log('🔍 Checking available questions for Web Developer Intern...');
    
    // Get all MCQ questions
    const { data: allQuestions, error: allError } = await supabase
      .from('exam_questions')
      .select('id, question_text, difficulty_level, job_description_id, created_at')
      .eq('question_type', 'mcq')
      .eq('status', 'approved')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('Error fetching questions:', allError);
      return;
    }
    
    console.log('\n📊 Total MCQ questions:', allQuestions.length);
    
    // Group by difficulty
    const byDifficulty = {};
    allQuestions.forEach(q => {
      byDifficulty[q.difficulty_level] = (byDifficulty[q.difficulty_level] || 0) + 1;
    });
    
    console.log('\n📈 Questions by difficulty:');
    Object.keys(byDifficulty).forEach(diff => {
      console.log('  ' + diff + ':', byDifficulty[diff]);
    });
    
    // Check recent questions (last 20)
    console.log('\n🕒 Recent 20 questions (ordered by created_at DESC):');
    allQuestions.slice(0, 20).forEach((q, index) => {
      console.log('  ' + (index + 1) + '. [' + q.difficulty_level + '] ' + q.question_text.substring(0, 60) + '...');
    });
    
    // Check if there are any easy questions
    const easyQuestions = allQuestions.filter(q => q.difficulty_level === 'easy');
    console.log('\n✅ Easy questions available:', easyQuestions.length);
    
    if (easyQuestions.length > 0) {
      console.log('\n📝 Sample easy questions:');
      easyQuestions.slice(0, 5).forEach((q, index) => {
        console.log('  ' + (index + 1) + '. ' + q.question_text.substring(0, 80) + '...');
      });
    }
    
    // Check medium questions
    const mediumQuestions = allQuestions.filter(q => q.difficulty_level === 'medium');
    console.log('\n✅ Medium questions available:', mediumQuestions.length);
    
    // Check hard questions
    const hardQuestions = allQuestions.filter(q => q.difficulty_level === 'hard');
    console.log('\n✅ Hard questions available:', hardQuestions.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkQuestions();
