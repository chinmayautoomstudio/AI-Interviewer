const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const JSON_PATH = path.join(__dirname, '..', 'c_cpp_interview_mcqs.json');
const TOPIC_NAME = 'C and C++ Programming';

function classifyDifficulty(q) {
  const text = `${q.question_text} ${(q.answer_explanation || '')}`.toLowerCase();
  const optionText = (q.mcq_options || []).map(o => (o.text || '').toLowerCase()).join(' ');
  const s = `${text} ${optionText}`;

  const hardKeywords = [
    'sfin ae', 'sfinae', 'noexcept', 'rvalue', 'lvalue', 'xvalue', 'decltype', 'enable_if',
    'perfect forward', 'std::forward', 'std::move', 'move constructor', 'move semantics',
    'virtual inherit', 'diamond', 'vtable', 'runtime polymorphism', 'dynamic_cast',
    'template metaprogramming', 'iterator invalidation', 'shared_ptr cycle', 'weak_ptr',
    'async-signal-safe', 'computed goto', 'gcc extension', 'substitution failure',
  ];
  const mediumKeywords = [
    'function pointer', 'memmove', 'memcpy', 'volatile', 'flexible array member',
    'fopen', 'fseek', 'sscanf', 'enum underlying', 'vla', 'variable length array',
    'virtual', 'override', 'abstract', 'pure virtual', 'stl', 'unordered_map', 'map', 'set', 'vector',
    'templates', 'template', 'exception', 'std::exception', 'shared_ptr', 'unique_ptr', 'weak_ptr',
    'namespace', 'initializer list', 'constexpr', 'const_cast', 'reinterpret_cast', 'static_cast',
  ];
  const easyKeywords = [
    'sizeof', 'printf', 'char', 'malloc', 'calloc', 'realloc', 'null pointer', 'string literal',
    'gets', 'fgets', 'strcmp', 'header', '<stdio.h>', '<stdlib.h>', '<string.h>', 'operators',
    'array', 'row-major', 'comment', 'main()', 'enum', 'struct padding', 'fflush', 'fread',
  ];

  const contains = (arr) => arr.some(k => s.includes(k));
  if (contains(hardKeywords)) return 'hard';
  if (contains(mediumKeywords)) return 'medium';
  if (contains(easyKeywords)) return 'easy';
  // default to medium
  return 'medium';
}

function detectSubtopic(q) {
  const s = `${q.question_text} ${(q.answer_explanation || '')} ${(q.mcq_options||[]).map(o => o.text).join(' ')}`.toLowerCase();
  if (s.includes('std::') || s.includes('virtual') || s.includes('template') || s.includes('stl') || s.includes('exception')) return 'C++';
  return 'C Language';
}

function pointsForDifficulty(d) {
  if (d === 'easy') return 1;
  if (d === 'hard') return 3;
  return 2;
}

function timeForDifficulty(d) {
  if (d === 'easy') return 45;
  if (d === 'hard') return 90;
  return 60;
}

async function ensureTopic(name) {
  const { data, error } = await supabase
    .from('question_topics')
    .select('id, name')
    .eq('name', name)
    .maybeSingle();
  if (error) {
    console.error('❌ Error fetching topic:', error.message);
    process.exit(1);
  }
  if (data) return data.id;
  const { data: ins, error: insErr } = await supabase
    .from('question_topics')
    .insert({ name, category: 'technical' })
    .select('id')
    .single();
  if (insErr) {
    console.error('❌ Error creating topic:', insErr.message);
    process.exit(1);
  }
  return ins.id;
}

async function getJobDescriptionId() {
  const { data, error } = await supabase
    .from('job_descriptions')
    .select('id, title')
    .limit(1);
  if (error || !data || !data.length) {
    console.error('❌ Error fetching job description:', error?.message || 'No job descriptions found');
    process.exit(1);
  }
  return data[0].id;
}

async function main() {
  console.log('🚀 Importing C/C++ questions from JSON...');
  const raw = fs.readFileSync(JSON_PATH, 'utf-8');
  let items = [];
  try {
    items = JSON.parse(raw);
  } catch (e) {
    console.error('❌ Failed to parse JSON file:', e.message);
    process.exit(1);
  }
  if (!Array.isArray(items) || items.length === 0) {
    console.error('❌ No questions found in JSON');
    process.exit(1);
  }

  const jobId = await getJobDescriptionId();
  const topicId = await ensureTopic(TOPIC_NAME);
  console.log(`✅ Using job_description_id=${jobId}`);
  console.log(`✅ Using topic_id=${topicId} (${TOPIC_NAME})`);

  let success = 0, failed = 0;
  for (let i = 0; i < items.length; i++) {
    const q = items[i];
    const difficulty = classifyDifficulty(q);
    const subtopic = detectSubtopic(q);
    const points = pointsForDifficulty(difficulty);
    const time_limit_seconds = timeForDifficulty(difficulty);

    const record = {
      job_description_id: jobId,
      question_text: q.question_text,
      question_type: 'mcq',
      question_category: 'technical',
      difficulty_level: difficulty,
      mcq_options: q.mcq_options,
      correct_answer: q.correct_answer,
      answer_explanation: q.answer_explanation || null,
      points,
      time_limit_seconds,
      tags: subtopic === 'C++' ? ['C++'] : ['C'],
      topic_id: topicId,
      subtopic,
      created_by: 'hr',
      status: 'approved',
      hr_notes: 'Imported from JSON with auto-classified difficulty',
    };

    const { error } = await supabase.from('exam_questions').insert(record);
    if (error) {
      console.error(`❌ [${i+1}/${items.length}] Failed: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ [${i+1}/${items.length}] Inserted (${difficulty}, ${subtopic})`);
      success++;
    }
  }

  console.log(`\n📊 Done. Success: ${success}, Failed: ${failed}, Total: ${items.length}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('❌ Fatal error:', e.message);
  process.exit(1);
});
