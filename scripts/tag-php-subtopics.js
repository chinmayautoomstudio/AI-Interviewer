const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const TOPIC_NAME = 'PHP';

function detectSubtopicAndTags(q) {
  const s = `${q.question_text} ${(q.answer_explanation || '')} ${(q.mcq_options||[]).map(o => o.text).join(' ')}`.toLowerCase();
  const tags = new Set(['PHP']);
  let subtopic = 'PHP';
  const add = (t) => tags.add(t);

  if (/(pdo|mysqli|prepared statement|sql injection|database|query)/.test(s)) { subtopic = 'Database & PDO'; add('Database'); add('PDO'); }
  if (/(xss|csrf|password_hash|password_verify|htmlspecialchars|strip_tags|filter_input)/.test(s)) { subtopic = 'Security'; add('Security'); }
  if (/(session|cookie|header\(|redirect|\$_server|\$_get|\$_post|\$_session|\$_cookie)/.test(s)) { subtopic = 'HTTP & Sessions'; add('HTTP'); add('Sessions'); }
  if (/(json_encode|json_decode|serialize|unserialize)/.test(s)) { subtopic = 'JSON & Serialization'; add('JSON'); }
  if (/(include|require|require_once|namespace|use |composer|autoload|psr-)/.test(s)) { subtopic = 'Language & Modules'; add('Language'); add('Modules'); }
  if (/(class|object|__construct|__destruct|magic method|interface|trait|abstract)/.test(s)) { subtopic = 'OOP'; add('OOP'); }
  if (/(file_exists|fopen|fgets|fread|fwrite)/.test(s)) { subtopic = 'Filesystem & I/O'; add('Filesystem'); }
  if (/(array|count\(|strlen|strtolower|round\(|date\(|time\()/ .test(s)) { subtopic = 'Core Functions'; add('Core'); }

  return { subtopic, tags: Array.from(tags) };
}

async function getTopicId() {
  const { data, error } = await supabase
    .from('question_topics')
    .select('id')
    .eq('name', TOPIC_NAME)
    .maybeSingle();
  if (error || !data) { console.error('❌ PHP topic not found'); process.exit(1); }
  return data.id;
}

async function main() {
  console.log('🛈 Tagging PHP questions with subtopics/tags...');
  const topicId = await getTopicId();

  let from = 0; const pageSize = 200; let total = 0;
  while (true) {
    const { data: qs, error } = await supabase
      .from('exam_questions')
      .select('id, question_text, answer_explanation, mcq_options')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }
    if (!qs || qs.length === 0) break;

    for (const q of qs) {
      const { subtopic, tags } = detectSubtopicAndTags(q);
      const { error: updErr } = await supabase
        .from('exam_questions')
        .update({ subtopic, tags })
        .eq('id', q.id);
      if (updErr) console.error(`❌ Update failed for ${q.id}:`, updErr.message); else total++;
    }
    from += pageSize;
  }
  console.log(`✅ Updated subtopics/tags for ${total} PHP questions.`);
  process.exit(0);
}

main().catch(e => { console.error('❌ Fatal error:', e.message); process.exit(1); });
