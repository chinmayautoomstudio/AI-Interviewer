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

const JSON_PATH = path.join(__dirname, '..', 'php_interview_mcqs_real.json');
const TOPIC_NAME = 'PHP';
const JD_TITLE = 'Web Developer Intern';

function classifyDifficulty(q) {
  const text = `${q.question_text} ${(q.answer_explanation || '')}`.toLowerCase();
  const options = (q.mcq_options || []).map(o => (o.text || '').toLowerCase()).join(' ');
  const s = `${text} ${options}`;

  const hard = [
    'pdo', 'prepared statement', 'xss', 'csrf', 'sql injection', 'opcache', 'composer',
    'namespaces', 'dependency injection', 'trait', 'late static binding', 'reflection',
    'psr-', 'spl', 'yield', 'generator', 'autoload', 'psr-4', 'psr-7', 'error handling', 'exception hierarchy'
  ];
  const medium = [
    'session', 'cookie', 'password_hash', 'password_verify', 'mysqli', 'pdo', 'header(',
    'json_encode', 'json_decode', 'filter_input', 'csrf token', 'file upload', 'mime', 'regex',
    'namespace', 'traits', 'interface', 'abstract class', 'magic method', '__construct', '__destruct',
  ];
  const easy = [
    'echo', 'print', 'strlen', 'count', 'array', 'foreach', 'for', 'while', 'include', 'require',
    'require_once', 'isset', 'empty', 'gettype', 'strtolower', 'strtoupper', 'date(', 'time(', 'operators',
    'concatenation', 'phpversion', 'superglobal', '$_server', '$_get', '$_post', '$_session', '$_cookie'
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
  console.log('🚀 Importing PHP questions from JSON...');
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

  const topicId = await ensureTopic(TOPIC_NAME);
  const jobId = await getWebDevInternJobId();
  console.log(`✅ topic_id=${topicId}, job_description_id=${jobId}`);

  let success = 0, failed = 0;
  for (let i = 0; i < items.length; i++) {
    const q = items[i];
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
      tags: ['PHP'],
      topic_id: topicId,
      subtopic: 'PHP',
      created_by: 'hr',
      status: 'approved',
      hr_notes: 'Imported from PHP JSON with auto-classified difficulty',
    };

    const { error } = await supabase.from('exam_questions').insert(record);
    if (error) {
      console.error(`❌ [${i+1}/${items.length}] Failed: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ [${i+1}/${items.length}] Inserted (${difficulty})`);
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
