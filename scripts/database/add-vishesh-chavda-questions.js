// Script to add Vishesh Chavda's MCQ questions to Supabase database
// Difficulty distribution: 50% Hard, 30% Medium, 20% Easy

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Question metadata mapping based on index
// Distribution: 50% Hard (25), 30% Medium (15), 20% Easy (10)
const getQuestionMetadata = (index) => {
  // Python & Pandas (0-9): 2 Easy, 3 Medium, 5 Hard
  if (index < 10) {
    let difficulty;
    if (index < 2) difficulty = 'easy';
    else if (index < 5) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['python', 'pandas', 'data-manipulation', 'dataframe'],
      subtopic: 'Python & Pandas',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // Data Analysis & Statistics (10-17): 2 Easy, 2 Medium, 4 Hard
  if (index < 18) {
    const relIdx = index - 10;
    let difficulty;
    if (relIdx < 2) difficulty = 'easy';
    else if (relIdx < 4) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['data-analysis', 'statistics', 'eda', 'visualization'],
      subtopic: 'Data Analysis & Statistics',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // Machine Learning (18-29): 2 Easy, 4 Medium, 6 Hard
  if (index < 30) {
    const relIdx = index - 18;
    let difficulty;
    if (relIdx < 2) difficulty = 'easy';
    else if (relIdx < 6) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['machine-learning', 'classification', 'model-evaluation', 'scikit-learn'],
      subtopic: 'Machine Learning',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // Deep Learning & CNNs (30-37): 2 Easy, 2 Medium, 4 Hard
  if (index < 38) {
    const relIdx = index - 30;
    let difficulty;
    if (relIdx < 2) difficulty = 'easy';
    else if (relIdx < 4) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['deep-learning', 'cnn', 'tensorflow', 'keras', 'image-classification'],
      subtopic: 'Deep Learning & CNNs',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // NLP & LLMs - RAG focus (38-43): 1 Easy, 2 Medium, 3 Hard
  if (index < 44) {
    const relIdx = index - 38;
    let difficulty;
    if (relIdx < 1) difficulty = 'easy';
    else if (relIdx < 3) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['nlp', 'llm', 'rag', 'embeddings', 'sentence-transformers'],
      subtopic: 'NLP & LLMs (RAG)',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // Computer Vision (44-47): 1 Easy, 1 Medium, 2 Hard
  if (index < 48) {
    const relIdx = index - 44;
    let difficulty;
    if (relIdx < 1) difficulty = 'easy';
    else if (relIdx < 2) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['computer-vision', 'opencv', 'image-processing', 'anpr'],
      subtopic: 'Computer Vision',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // SQL (48-49): 0 Easy, 1 Medium, 1 Hard
  const relIdx = index - 48;
  const difficulty = relIdx === 0 ? 'medium' : 'hard';
  return {
    tags: ['sql', 'databases', 'data-querying', 'aggregation'],
    subtopic: 'SQL & Databases',
    difficulty_level: difficulty,
    points: difficulty === 'medium' ? 2 : 3,
    time_limit_seconds: difficulty === 'medium' ? 60 : 90
  };
};

async function addQuestionsToDatabase() {
  try {
    console.log('🚀 Starting to add Vishesh Chavda questions to database...\n');

    // Read the questions JSON file
    const questionsFilePath = path.join(__dirname, '../../vishesh_chavda_mcq_exam.json');
    
    if (!fs.existsSync(questionsFilePath)) {
      console.error('❌ Questions file not found:', questionsFilePath);
      process.exit(1);
    }

    const questionsData = JSON.parse(fs.readFileSync(questionsFilePath, 'utf8'));
    console.log(`📄 Loaded ${questionsData.length} questions from JSON file\n`);

    // Transform questions for database insertion
    const questionsToInsert = questionsData.map((q, index) => {
      const metadata = getQuestionMetadata(index);
      
      return {
        question_text: q.question_text,
        question_type: 'mcq',
        question_category: 'technical',
        difficulty_level: metadata.difficulty_level,
        mcq_options: q.mcq_options,
        correct_answer: q.correct_answer,
        answer_explanation: q.answer_explanation,
        points: metadata.points,
        time_limit_seconds: metadata.time_limit_seconds,
        tags: metadata.tags,
        subtopic: metadata.subtopic,
        created_by: 'hr',
        status: 'approved',
        hr_notes: 'Generated for candidate: Vishesh Chavda (visheshchawda480@gmail.com) - Data Science/ML Assessment - 50% Hard, 30% Medium, 20% Easy',
        is_active: true
      };
    });

    // Show preview of what will be inserted
    console.log('📊 Question Distribution Preview:');
    const difficultyCount = questionsToInsert.reduce((acc, q) => {
      acc[q.difficulty_level] = (acc[q.difficulty_level] || 0) + 1;
      return acc;
    }, {});
    console.log(`   Easy: ${difficultyCount.easy || 0} (${((difficultyCount.easy || 0) / questionsToInsert.length * 100).toFixed(0)}%)`);
    console.log(`   Medium: ${difficultyCount.medium || 0} (${((difficultyCount.medium || 0) / questionsToInsert.length * 100).toFixed(0)}%)`);
    console.log(`   Hard: ${difficultyCount.hard || 0} (${((difficultyCount.hard || 0) / questionsToInsert.length * 100).toFixed(0)}%)`);
    
    const subtopicCount = questionsToInsert.reduce((acc, q) => {
      acc[q.subtopic] = (acc[q.subtopic] || 0) + 1;
      return acc;
    }, {});
    console.log('\n📂 Questions by Topic:');
    Object.entries(subtopicCount).forEach(([topic, count]) => {
      console.log(`   ${topic}: ${count}`);
    });

    // Insert questions into database
    console.log('\n📝 Inserting questions into Supabase...');
    
    const { data, error } = await supabase
      .from('exam_questions')
      .insert(questionsToInsert)
      .select('id, question_text, difficulty_level, subtopic');

    if (error) {
      console.error('❌ Error inserting questions:', error);
      console.log('\n💡 Troubleshooting tips:');
      console.log('   - Make sure the exam_questions table exists');
      console.log('   - Check that your Supabase credentials are correct');
      console.log('   - Verify RLS policies allow insert operations');
      process.exit(1);
    }

    console.log(`\n✅ Successfully inserted ${data.length} questions!\n`);

    // Show summary
    console.log('📊 Insertion Summary:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Total Questions: ${data.length}`);
    console.log(`   Candidate: Vishesh Chavda`);
    console.log(`   Email: visheshchawda480@gmail.com`);
    console.log(`   Difficulty: 50% Hard, 30% Medium, 20% Easy`);
    console.log(`   Status: All questions approved and active`);
    console.log('═══════════════════════════════════════════════════════════');

    // Show sample inserted questions by difficulty
    console.log('\n📋 Sample Inserted Questions:');
    
    const easyQ = data.find(q => q.difficulty_level === 'easy');
    const mediumQ = data.find(q => q.difficulty_level === 'medium');
    const hardQ = data.find(q => q.difficulty_level === 'hard');
    
    if (easyQ) {
      console.log(`\n   [EASY] ${easyQ.subtopic}`);
      console.log(`      ID: ${easyQ.id}`);
      console.log(`      Q: ${easyQ.question_text.substring(0, 60)}...`);
    }
    if (mediumQ) {
      console.log(`\n   [MEDIUM] ${mediumQ.subtopic}`);
      console.log(`      ID: ${mediumQ.id}`);
      console.log(`      Q: ${mediumQ.question_text.substring(0, 60)}...`);
    }
    if (hardQ) {
      console.log(`\n   [HARD] ${hardQ.subtopic}`);
      console.log(`      ID: ${hardQ.id}`);
      console.log(`      Q: ${hardQ.question_text.substring(0, 60)}...`);
    }

    console.log('\n🎉 All questions added successfully!');
    console.log('💡 You can now assign these questions to a job description or use them in exams.');
    console.log('🔗 View questions in the Question Bank page of the application.\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
addQuestionsToDatabase();
