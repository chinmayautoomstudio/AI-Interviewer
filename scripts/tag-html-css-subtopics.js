const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const TOPIC_NAME = 'HTML & CSS';

function detectSubtopicAndTags(q) {
  const s = `${q.question_text} ${(q.answer_explanation || '')} ${(q.mcq_options||[]).map(o => o.text).join(' ')}`.toLowerCase();
  const tags = new Set(['HTML', 'CSS']);
  let subtopic = 'HTML/CSS';
  const add = (t) => tags.add(t);

  if (/(semantic html|<main>|<nav>|<article>|<section>|<aside>|<figure>|<figcaption>|<address>)/.test(s)) { subtopic = 'Semantics'; add('Semantics'); }
  if (/(aria|accessibility|sr-only|focus-visible|title attribute)/.test(s)) { subtopic = 'Accessibility'; add('A11y'); }
  if (/(flex|flex-wrap|flex-shrink|order|gap)/.test(s)) { subtopic = 'Flexbox'; add('Flexbox'); }
  if (/(grid-template-columns|grid|fr units)/.test(s)) { subtopic = 'Grid'; add('Grid'); }
  if (/(viewport|meta name="viewport"|media queries|srcset|responsive)/.test(s)) { subtopic = 'Responsive'; add('Responsive'); }
  if (/(form|input|required|maxlength|autocomplete|:invalid|method|action|checkbox)/.test(s)) { subtopic = 'Forms'; add('Forms'); }
  if (/(font-family|line-height|letter-spacing|text-overflow|ellipsis|first-line)/.test(s)) { subtopic = 'Typography'; add('Typography'); }
  if (/(animation|transition|will-change|translatez\(0\))/i.test(s)) { subtopic = 'Animations'; add('Animations'); }
  if (/(<video>|<audio>|<source>|object-fit|autoplay)/.test(s)) { subtopic = 'Media'; add('Media'); }
  if (/(box-sizing|inline-block|position|z-index|opacity|overflow|calc\(|linear-gradient|sticky)/.test(s)) { subtopic = 'Layout'; add('Layout'); }
  if (/(robots|noindex|<base href>)/.test(s)) { subtopic = 'SEO'; add('SEO'); }

  return { subtopic, tags: Array.from(tags) };
}

async function getTopicId() {
  const { data, error } = await supabase
    .from('question_topics')
    .select('id')
    .eq('name', TOPIC_NAME)
    .maybeSingle();
  if (error || !data) { console.error('❌ HTML & CSS topic not found'); process.exit(1); }
  return data.id;
}

async function main() {
  console.log('🛈 Tagging HTML & CSS questions with subtopics/tags...');
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
  console.log(`✅ Updated subtopics/tags for ${total} HTML/CSS questions.`);
  process.exit(0);
}

main().catch(e => { console.error('❌ Fatal error:', e.message); process.exit(1); });
