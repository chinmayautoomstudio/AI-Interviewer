const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const TOPIC_NAME = 'JavaScript';

function detectSubtopicAndTags(q) {
  const s = `${q.question_text} ${(q.answer_explanation || '')} ${(q.mcq_options||[]).map(o => o.text).join(' ')}`.toLowerCase();
  const tags = new Set(['JavaScript']);
  let subtopic = 'JavaScript';

  const add = (t) => tags.add(t);

  if (/(==|===|coercion|typeof|truthy|falsy|nan|number\(|parseint|tofixed)/.test(s)) {
    subtopic = 'Types & Coercion'; add('Types'); add('Coercion');
  }
  if (/(promise|async|await|thenable|microtask|macrotask|event loop)/.test(s)) {
    subtopic = 'Async & Event Loop'; add('Async'); add('Event Loop');
  }
  if (/(prototype chain|prototype|__proto__|object\.create)/.test(s)) {
    subtopic = 'Prototypes & Inheritance'; add('Prototype');
  }
  if (/(map\(|filter\(|reduce\(|spread|rest|array|slice|splice)/.test(s)) {
    subtopic = 'Arrays & Iteration'; add('Array');
  }
  if (/(regex|\/.*\/|regexp)/.test(s)) {
    subtopic = 'Regex'; add('Regex');
  }
  if (/(dom|document\.|event|delegation)/.test(s)) {
    subtopic = 'DOM & Events'; add('DOM'); add('Events');
  }
  if (/(localstorage|sessionstorage|service worker)/.test(s)) {
    subtopic = 'Web APIs & Storage'; add('Web API'); add('Storage');
  }
  if (/(module|import|export|es6|class|arrow function|symbol)/.test(s)) {
    subtopic = 'ES6+ Features'; add('ES6+');
  }
  if (/(json\.parse|json\.stringify)/.test(s)) {
    subtopic = 'JSON & Serialization'; add('JSON');
  }
  if (/(bind\(|call\(|apply\(|this|closure|memoization|currying)/.test(s)) {
    subtopic = 'Functions & Scope'; add('Functions'); add('Scope');
  }

  return { subtopic, tags: Array.from(tags) };
}

async function getJsTopicId() {
  const { data, error } = await supabase
    .from('question_topics')
    .select('id')
    .eq('name', TOPIC_NAME)
    .maybeSingle();
  if (error || !data) {
    console.error('❌ JavaScript topic not found');
    process.exit(1);
  }
  return data.id;
}

async function main() {
  console.log('🛈 Tagging JavaScript questions with subtopics/tags...');
  const topicId = await getJsTopicId();

  // Fetch questions in batches
  let from = 0;
  const pageSize = 200;
  let totalUpdated = 0;

  while (true) {
    const { data: questions, error } = await supabase
      .from('exam_questions')
      .select('id, question_text, answer_explanation, mcq_options, subtopic, tags')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('❌ Fetch error:', error.message);
      process.exit(1);
    }
    if (!questions || questions.length === 0) break;

    for (const q of questions) {
      const { subtopic, tags } = detectSubtopicAndTags(q);
      const { error: updErr } = await supabase
        .from('exam_questions')
        .update({ subtopic, tags })
        .eq('id', q.id);
      if (updErr) {
        console.error(`❌ Update failed for ${q.id}:`, updErr.message);
      } else {
        totalUpdated++;
      }
    }

    from += pageSize;
  }

  console.log(`✅ Updated subtopics/tags for ${totalUpdated} JavaScript questions.`);
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Fatal error:', e.message);
  process.exit(1);
});
