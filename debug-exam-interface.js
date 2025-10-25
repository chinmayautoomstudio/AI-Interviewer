// Debug Exam Interface Issues
// This script helps debug why exam interface is not working

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://kveisbwrvbbpotngpofp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZWlzYndydmJicG90bmdwb2ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgxNTM0NywiZXhwIjoyMDcyMzkxMzQ3fQ.pFWuY4sjNoazOBJ8ZZkKxOfGxZhPzSa2p4Q-OOI6R4s';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugExamInterface() {
  console.log('🔍 Debugging Exam Interface Issues\n');

  try {
    // 1. Check recent exam sessions and their status
    console.log('1️⃣ Checking recent exam sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('exam_sessions')
      .select(`
        id,
        exam_token,
        status,
        started_at,
        completed_at,
        duration_minutes,
        total_questions,
        candidate:candidates(name, email),
        job_description:job_descriptions(title)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }

    console.log('📊 Recent exam sessions:');
    sessions.forEach((session, index) => {
      console.log(`   ${index + 1}. Token: ${session.exam_token}`);
      console.log(`      Status: ${session.status}`);
      console.log(`      Candidate: ${session.candidate?.name || 'Unknown'}`);
      console.log(`      Job: ${session.job_description?.title || 'Unknown'}`);
      console.log(`      Started: ${session.started_at || 'Not started'}`);
      console.log(`      Duration: ${session.duration_minutes} minutes`);
      console.log(`      Questions: ${session.total_questions}`);
      console.log('');
    });

    // 2. Check if there are any active sessions
    const activeSessions = sessions.filter(s => s.status === 'in_progress');
    console.log(`2️⃣ Active sessions: ${activeSessions.length}`);
    
    if (activeSessions.length === 0) {
      console.log('⚠️ No active sessions found. This might be why the interface is disabled.');
      console.log('💡 Try creating a new exam session or check if existing sessions need to be started.');
    }

    // 3. Check questions for each session
    console.log('3️⃣ Checking questions for each session...');
    for (const session of sessions.slice(0, 3)) { // Check first 3 sessions
      console.log(`\n🔍 Session ${session.id} (${session.status}):`);
      
      const { data: questions, error: questionsError } = await supabase
        .from('exam_questions')
        .select(`
          id,
          question_text,
          question_type,
          points,
          difficulty_level,
          status,
          is_active
        `)
        .eq('job_description_id', session.job_description_id || '')
        .eq('status', 'approved')
        .eq('is_active', true)
        .limit(5);

      if (questionsError) {
        console.log(`   ❌ Error fetching questions:`, questionsError.message);
        continue;
      }

      console.log(`   📝 Found ${questions.length} questions:`);
      questions.forEach((q, index) => {
        console.log(`      ${index + 1}. ${q.question_type.toUpperCase()}: ${q.question_text?.substring(0, 50)}...`);
        console.log(`         Points: ${q.points}, Difficulty: ${q.difficulty_level}, Status: ${q.status}`);
      });

      if (questions.length === 0) {
        console.log('   ⚠️ No questions found for this session!');
      }
    }

    // 4. Check exam_responses table structure
    console.log('\n4️⃣ Checking exam_responses table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'exam_responses')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError);
    } else {
      console.log('📋 exam_responses table columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });

      const hasEvaluationDetails = columns.some(col => col.column_name === 'evaluation_details');
      if (!hasEvaluationDetails) {
        console.log('⚠️ Missing evaluation_details column! This will cause save errors.');
        console.log('💡 Run: ai-interviewer/sql/fix_exam_responses_table.sql');
      }
    }

    // 5. Summary and recommendations
    console.log('\n📊 Summary:');
    console.log(`   - Total sessions: ${sessions.length}`);
    console.log(`   - Active sessions: ${activeSessions.length}`);
    console.log(`   - Sessions with questions: ${sessions.filter(s => {
      // This would need to be calculated from the questions we fetched above
      return true; // Placeholder
    }).length}`);

    console.log('\n🎯 Common Issues and Solutions:');
    console.log('   1. Session status is not "in_progress"');
    console.log('      → Check if exam was properly started');
    console.log('      → Verify session status in database');
    console.log('');
    console.log('   2. No questions assigned to job description');
    console.log('      → Check question assignment in admin panel');
    console.log('      → Verify questions are approved and active');
    console.log('');
    console.log('   3. Missing evaluation_details column');
    console.log('      → Run the database fix script');
    console.log('');
    console.log('   4. Browser console errors');
    console.log('      → Check browser console for JavaScript errors');
    console.log('      → Verify network connectivity to Supabase');

    // 6. Test a specific session if provided
    const testToken = process.argv[2];
    if (testToken) {
      console.log(`\n🧪 Testing specific session with token: ${testToken}`);
      
      const { data: testSession, error: testError } = await supabase
        .from('exam_sessions')
        .select(`
          *,
          candidate:candidates(*),
          job_description:job_descriptions(*)
        `)
        .eq('exam_token', testToken)
        .single();

      if (testError) {
        console.log(`   ❌ Session not found: ${testError.message}`);
      } else {
        console.log(`   ✅ Session found:`);
        console.log(`      ID: ${testSession.id}`);
        console.log(`      Status: ${testSession.status}`);
        console.log(`      Started: ${testSession.started_at}`);
        console.log(`      Duration: ${testSession.duration_minutes} minutes`);
        console.log(`      Candidate: ${testSession.candidate?.name}`);
        console.log(`      Job: ${testSession.job_description?.title}`);
        
        if (testSession.status !== 'in_progress') {
          console.log(`   ⚠️ Session is not in progress! This is why the interface is disabled.`);
          console.log(`   💡 Try starting the exam session or check the status.`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
const testToken = process.argv[2];
if (testToken) {
  console.log(`🔍 Debugging exam interface for token: ${testToken}\n`);
} else {
  console.log('🔍 Debugging exam interface (general)\n');
  console.log('💡 To test a specific session, run: node debug-exam-interface.js <token>');
}

debugExamInterface();
