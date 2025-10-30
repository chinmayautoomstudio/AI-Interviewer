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

const JSON_PATH = path.join(__dirname, '..', 'javascript_interview_mcqs.json');
const TOPIC_NAME = 'JavaScript';
const JD_TITLE = 'Web Developer Intern';

function isDummyQuestion(q) {
  const qt = (q.question_text || '').toLowerCase();
  const isConceptualPlaceholder = qt.includes('conceptual javascript question');
  const isGeneric = qt.includes('core concept explanation');
  const opts = (q.mcq_options || []).map(o => (o.text || '').toLowerCase());
  const allOptionsGeneric = opts.length === 4 && opts.every(t => ['option a','option b','option c','option d'].includes(t));
  return isConceptualPlaceholder || isGeneric || allOptionsGeneric;
}

function classifyDifficulty(q) {
  const text = `${q.question_text} ${(q.answer_explanation || '')}`.toLowerCase();
  const options = (q.mcq_options || []).map(o => (o.text || '').toLowerCase()).join(' ');
  const s = `${text} ${options}`;

  const hard = [
    'event loop', 'microtask', 'macrotask', 'prototype pollution', 'weakmap', 'tail call', 'service worker',
    'optional chaining', 'generator', 'thenable', 'symbol', 'class', 'async function', 'closure', 'memoization',
    'prototype chain', 'hoisting', 'bind(', 'apply(', 'call(', 'promise', 'currying', 'modules', 'es6', 'iterator'
  ];
  const medium = [
    'typeof', 'nan', 'coercion', '==', '===', 'array', 'map', 'reduce', 'filter', 'spread', 'rest', 'parseint', 'number(',
    'json.parse', 'json.stringify', 'localstorage', 'sessionstorage', 'object.create', 'regex', 'tofixed', 'arrow function'
  ];
  const easy = [
    'console.log', 'string', 'boolean', 'null', 'undefined', 'date(', 'math', 'operators', 'length', 'truthy', 'falsy'
  ];

  const has = (arr) => arr.some(k => s.includes(k));
  if (has(hard)) return 'hard';
  if (has(medium)) return 'medium';
  if (has(easy)) return 'easy';
  return 'medium';
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

async function getWebDevInternJobId() {
  const { data, error } = await supabase
    .from('job_descriptions')
    .select('id, title')
    .ilike('title', `${JD_TITLE}%`)
    .limit(1);
  if (error || !data || !data.length) {
    console.error('❌ Web Developer Intern JD not found');
    process.exit(1);
  }
  return data[0].id;
}

async function main() {
  console.log('🚀 Importing JavaScript questions from JSON...');
  let items = [];
  try {
    items = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  } catch (e) {
    console.error('❌ Failed to read/parse JSON:', e.message);
    process.exit(1);
  }
  if (!Array.isArray(items) || items.length === 0) {
    console.error('❌ No questions found in JSON');
    process.exit(1);
  }

  const filtered = items.filter(q => !isDummyQuestion(q));
  const removed = items.length - filtered.length;
  if (removed > 0) console.log(`ℹ️ Filtered out ${removed} dummy questions.`);

  const topicId = await ensureTopic(TOPIC_NAME);
  const jobId = await getWebDevInternJobId();
  console.log(`✅ topic_id=${topicId}, job_description_id=${jobId}`);

  let success = 0, failed = 0;
  for (let i = 0; i < filtered.length; i++) {
    const q = filtered[i];
    const difficulty = classifyDifficulty(q);
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
      tags: ['JavaScript'],
      topic_id: topicId,
      subtopic: 'JavaScript',
      created_by: 'hr',
      status: 'approved',
      hr_notes: 'Imported from JavaScript JSON with auto-classified difficulty',
    };

    const { error } = await supabase.from('exam_questions').insert(record);
    if (error) {
      console.error(`❌ [${i+1}/${filtered.length}] Failed: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ [${i+1}/${filtered.length}] Inserted (${difficulty})`);
      success++;
    }
  }

  console.log(`\n📊 Done. Success: ${success}, Failed: ${failed}, Total inserted: ${filtered.length} (removed ${removed})`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('❌ Fatal error:', e.message);
  process.exit(1);
});
