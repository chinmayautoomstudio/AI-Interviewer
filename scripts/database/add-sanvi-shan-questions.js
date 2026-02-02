// Script to add Sanvi Shan's MCQ questions to Supabase database
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
// Distribution: Python(8), ML(10), GenAI(8), RPA(6), Web(6), DSA(6), OOP(4), SQL(2) = 50
const getQuestionMetadata = (index) => {
  // Python Programming (0-7): 2 Easy, 2 Medium, 4 Hard
  if (index < 8) {
    let difficulty;
    if (index < 2) difficulty = 'easy';
    else if (index < 4) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['python', 'programming', 'fundamentals', 'syntax'],
      subtopic: 'Python Programming',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // Machine Learning - Regression (8-17): 2 Easy, 3 Medium, 5 Hard
  if (index < 18) {
    const relIdx = index - 8;
    let difficulty;
    if (relIdx < 2) difficulty = 'easy';
    else if (relIdx < 5) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['machine-learning', 'regression', 'scikit-learn', 'model-evaluation'],
      subtopic: 'Machine Learning (Regression)',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // Gen AI / LLMs (18-25): 1 Easy, 3 Medium, 4 Hard
  if (index < 26) {
    const relIdx = index - 18;
    let difficulty;
    if (relIdx < 1) difficulty = 'easy';
    else if (relIdx < 4) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['generative-ai', 'llm', 'prompt-engineering', 'rag'],
      subtopic: 'Generative AI & LLMs',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // RPA & UiPath (26-31): 2 Easy, 2 Medium, 2 Hard
  if (index < 32) {
    const relIdx = index - 26;
    let difficulty;
    if (relIdx < 2) difficulty = 'easy';
    else if (relIdx < 4) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['rpa', 'uipath', 'automation', 'workflow'],
      subtopic: 'RPA & UiPath',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // Web Development - React/Node.js (32-37): 1 Easy, 2 Medium, 3 Hard
  if (index < 38) {
    const relIdx = index - 32;
    let difficulty;
    if (relIdx < 1) difficulty = 'easy';
    else if (relIdx < 3) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['web-development', 'react', 'nodejs', 'rest-api'],
      subtopic: 'Web Development (React/Node.js)',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // DSA & Algorithms (38-43): 1 Easy, 2 Medium, 3 Hard
  if (index < 44) {
    const relIdx = index - 38;
    let difficulty;
    if (relIdx < 1) difficulty = 'easy';
    else if (relIdx < 3) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['dsa', 'algorithms', 'data-structures', 'complexity'],
      subtopic: 'DSA & Algorithms',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // OOP Concepts (44-47): 1 Easy, 1 Medium, 2 Hard
  if (index < 48) {
    const relIdx = index - 44;
    let difficulty;
    if (relIdx < 1) difficulty = 'easy';
    else if (relIdx < 2) difficulty = 'medium';
    else difficulty = 'hard';
    
    return {
      tags: ['oop', 'object-oriented-programming', 'design-principles', 'solid'],
      subtopic: 'OOP Concepts',
      difficulty_level: difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      time_limit_seconds: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 60 : 90
    };
  }
  
  // SQL (48-49): 0 Easy, 0 Medium, 2 Hard
  return {
    tags: ['sql', 'databases', 'queries', 'aggregation'],
    subtopic: 'SQL & Databases',
    difficulty_level: 'hard',
    points: 3,
    time_limit_seconds: 90
  };
};

async function addQuestionsToDatabase() {
  try {
    console.log('🚀 Starting to add Sanvi Shan questions to database...\n');

    // Read the questions JSON file
    const questionsFilePath = path.join(__dirname, '../../sanvi_shan_mcq_exam.json');
    
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
        hr_notes: 'Generated for candidate: Sanvi Shan (B.Tech CSE AI-ML, KIIT) - AI/ML Assessment - 50% Hard, 30% Medium, 20% Easy',
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
    console.log(`   Candidate: Sanvi Shan`);
    console.log(`   Education: B.Tech CSE (AI-ML), KIIT`);
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
