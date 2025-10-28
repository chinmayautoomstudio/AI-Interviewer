// Debug script to check exam results
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function debugExamResults() {
  try {
    console.log('🔍 Debugging exam results...');
    
    // Get recent exam sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('exam_sessions')
      .select('id, exam_token, status, total_questions, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return;
    }
    
    console.log('📊 Recent exam sessions:', sessions);
    
    // Check each session for responses and results
    for (const session of sessions) {
      console.log(`\n🔍 Checking session ${session.id}:`);
      
      // Get responses
      const { data: responses, error: responsesError } = await supabase
        .from('exam_responses')
        .select('*')
        .eq('exam_session_id', session.id);
      
      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
        continue;
      }
      
      console.log(`  📝 Responses: ${responses?.length || 0}`);
      if (responses && responses.length > 0) {
        console.log('  📊 Response details:', responses.map(r => ({
          question_id: r.question_id,
          answer_text: r.answer_text?.substring(0, 30) + '...',
          is_correct: r.is_correct,
          points_earned: r.points_earned
        })));
      }
      
      // Get exam results
      const { data: results, error: resultsError } = await supabase
        .from('exam_results')
        .select('*')
        .eq('exam_session_id', session.id);
      
      if (resultsError) {
        console.error('Error fetching results:', resultsError);
        continue;
      }
      
      console.log(`  🎯 Results: ${results?.length || 0}`);
      if (results && results.length > 0) {
        const result = results[0];
        console.log('  📊 Result details:', {
          total_score: result.total_score,
          max_score: result.max_score,
          percentage: result.percentage,
          correct_answers: result.correct_answers,
          wrong_answers: result.wrong_answers,
          skipped_questions: result.skipped_questions,
          time_taken_minutes: result.time_taken_minutes
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugExamResults();
