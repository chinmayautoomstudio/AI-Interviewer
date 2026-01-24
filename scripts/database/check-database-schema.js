const { supabase } = require('./src/services/supabase');

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema for Text Evaluation...\n');

  try {
    // 1. Check exam_responses table structure
    console.log('1️⃣ Checking exam_responses table...');
    const { data: responsesColumns, error: responsesError } = await supabase
      .rpc('get_table_columns', { table_name: 'exam_responses' })
      .catch(async () => {
        // Fallback: direct query
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_name', 'exam_responses')
          .order('ordinal_position');
        return { data, error };
      });

    if (responsesError) {
      console.error('❌ Error checking exam_responses:', responsesError);
    } else {
      console.log('✅ exam_responses columns:');
      responsesColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check for required columns
      const requiredColumns = ['evaluation_details', 'points_earned', 'is_correct'];
      const existingColumns = responsesColumns.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('⚠️ Missing columns in exam_responses:', missingColumns);
      } else {
        console.log('✅ All required columns exist in exam_responses');
      }
    }

    // 2. Check exam_results table structure
    console.log('\n2️⃣ Checking exam_results table...');
    const { data: resultsColumns, error: resultsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'exam_results')
      .order('ordinal_position');

    if (resultsError) {
      console.error('❌ Error checking exam_results:', resultsError);
    } else {
      console.log('✅ exam_results columns:');
      resultsColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check for required columns
      const requiredColumns = ['text_evaluation_summary', 'hiring_recommendations', 'processing_metadata', 'text_evaluation_completed', 'text_evaluation_timestamp'];
      const existingColumns = resultsColumns.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('⚠️ Missing columns in exam_results:', missingColumns);
      } else {
        console.log('✅ All required columns exist in exam_results');
      }
    }

    // 3. Test a simple query to verify connection
    console.log('\n3️⃣ Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('exam_sessions')
      .select('id, status')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection test failed:', testError);
    } else {
      console.log('✅ Database connection successful');
    }

    // 4. Check if we have any exam sessions with text questions
    console.log('\n4️⃣ Checking for exam sessions with text questions...');
    const { data: sessionsWithText, error: sessionsError } = await supabase
      .from('exam_responses')
      .select(`
        exam_session_id,
        question:exam_questions(question_type, question_text)
      `)
      .eq('question.question_type', 'text')
      .not('question.question_text', 'is', null)
      .neq('question.question_text', '')
      .limit(5);

    if (sessionsError) {
      console.error('❌ Error checking text questions:', sessionsError);
    } else {
      console.log(`✅ Found ${sessionsWithText.length} text question responses`);
      if (sessionsWithText.length > 0) {
        console.log('📝 Sample session with text questions:', sessionsWithText[0].exam_session_id);
      }
    }

    console.log('\n📋 Summary:');
    console.log('1. Check the column lists above');
    console.log('2. If any columns are missing, run the SQL script: sql/prepare_text_evaluation_tables.sql');
    console.log('3. Verify n8n Supabase node configuration matches the actual table structure');

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkDatabaseSchema().catch(console.error);
