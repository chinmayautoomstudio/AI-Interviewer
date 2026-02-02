// Script to add Ayush Kumar's MCQ questions to Supabase database
// This script reads the generated questions and inserts them into the exam_questions table

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
const getQuestionMetadata = (index) => {
  // ML Fundamentals (0-9): 3 Easy, 5 Medium, 2 Hard
  if (index < 10) {
    const difficulty = index < 3 ? 'easy' : index < 8 ? 'medium' : 'hard';
    return {
      tags: ['machine-learning', 'ml-fundamentals', 'model-evaluation'],
      subtopic: 'Machine Learning Fundamentals',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // Deep Learning (10-19): 2 Easy, 5 Medium, 3 Hard
  if (index < 20) {
    const relIdx = index - 10;
    const difficulty = relIdx < 2 ? 'easy' : relIdx < 7 ? 'medium' : 'hard';
    return {
      tags: ['deep-learning', 'neural-networks', 'rnn', 'lstm', 'gru'],
      subtopic: 'Deep Learning Architectures',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // PyTorch & TensorFlow (20-27): 2 Easy, 4 Medium, 2 Hard
  if (index < 28) {
    const relIdx = index - 20;
    const difficulty = relIdx < 2 ? 'easy' : relIdx < 6 ? 'medium' : 'hard';
    return {
      tags: ['pytorch', 'tensorflow', 'deep-learning-frameworks', 'model-optimization'],
      subtopic: 'Deep Learning Frameworks',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // Python Programming (28-33): 2 Easy, 3 Medium, 1 Hard
  if (index < 34) {
    const relIdx = index - 28;
    const difficulty = relIdx < 2 ? 'easy' : relIdx < 5 ? 'medium' : 'hard';
    return {
      tags: ['python', 'programming', 'numpy', 'pandas'],
      subtopic: 'Python Programming',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // Algorithms & Data Structures (34-39): 1 Easy, 3 Medium, 2 Hard
  if (index < 40) {
    const relIdx = index - 34;
    const difficulty = relIdx < 1 ? 'easy' : relIdx < 4 ? 'medium' : 'hard';
    return {
      tags: ['algorithms', 'data-structures', 'dynamic-programming', 'complexity'],
      subtopic: 'Algorithms and Data Structures',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // NLP & LLMs (40-44): 1 Easy, 3 Medium, 1 Hard
  if (index < 45) {
    const relIdx = index - 40;
    const difficulty = relIdx < 1 ? 'easy' : relIdx < 4 ? 'medium' : 'hard';
    return {
      tags: ['nlp', 'llm', 'transformers', 'natural-language-processing'],
      subtopic: 'NLP and Large Language Models',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // MLOps & Deployment (45-47): 1 Easy, 1 Medium, 1 Hard
  if (index < 48) {
    const relIdx = index - 45;
    const difficulty = relIdx === 0 ? 'easy' : relIdx === 1 ? 'medium' : 'hard';
    return {
      tags: ['mlops', 'deployment', 'model-serving', 'production'],
      subtopic: 'MLOps and Model Deployment',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // SQL & Databases (48-49): 1 Easy, 1 Medium
  const relIdx = index - 48;
  const difficulty = relIdx === 0 ? 'easy' : 'medium';
  return {
    tags: ['sql', 'databases', 'postgresql', 'data-management'],
    subtopic: 'SQL and Databases',
    difficulty_level: difficulty,
    points: difficulty === 'easy' ? 1 : 2,
    time_limit_seconds: difficulty === 'easy' ? 45 : 60
  };
};

async function addQuestionsToDatabase() {
  try {
    console.log('🚀 Starting to add Ayush Kumar questions to database...\n');

    // Read the questions JSON file
    const questionsFilePath = path.join(__dirname, '../../ayush_kumar_mcq_exam.json');
    
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
        // No job_description_id - can be assigned later
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
        hr_notes: 'Generated for candidate: Ayush Kumar (aayush.kumarm.3myself@gmail.com) - ML/AI Assessment',
        is_active: true
      };
    });

    // Show preview of what will be inserted
    console.log('📊 Question Distribution Preview:');
    const difficultyCount = questionsToInsert.reduce((acc, q) => {
      acc[q.difficulty_level] = (acc[q.difficulty_level] || 0) + 1;
      return acc;
    }, {});
    console.log(`   Easy: ${difficultyCount.easy || 0}`);
    console.log(`   Medium: ${difficultyCount.medium || 0}`);
    console.log(`   Hard: ${difficultyCount.hard || 0}`);
    
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
    console.log(`   Candidate: Ayush Kumar`);
    console.log(`   Email: aayush.kumarm.3myself@gmail.com`);
    console.log(`   Status: All questions approved and active`);
    console.log('═══════════════════════════════════════════════════════════');

    // Show first few inserted questions
    console.log('\n📋 Sample Inserted Questions:');
    data.slice(0, 3).forEach((q, i) => {
      console.log(`\n   ${i + 1}. [${q.difficulty_level.toUpperCase()}] ${q.subtopic}`);
      console.log(`      ID: ${q.id}`);
      console.log(`      Q: ${q.question_text.substring(0, 60)}...`);
    });

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
