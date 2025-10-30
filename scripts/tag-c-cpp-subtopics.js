const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const TOPIC_NAME = 'C and C++ Programming';

function detectSubtopicAndTags(q) {
  const s = `${q.question_text} ${(q.answer_explanation || '')} ${(q.mcq_options||[]).map(o => o.text).join(' ')}`.toLowerCase();
  const tags = new Set(['C/C++']);
  let subtopic = 'C/C++';
  const add = (t) => tags.add(t);

  // C-focused
  if (/(pointer|dereference|\*p\+\+|void\*|pointer arithmetic|function pointer)/.test(s)) { subtopic = 'C Pointers & Functions'; add('C'); add('Pointers'); }
  if (/(array|vla|sizeof\(array\)\/sizeof|row-major)/.test(s)) { subtopic = 'C Arrays & Memory'; add('C'); add('Arrays'); }
  if (/(malloc|calloc|realloc|free|double free|memcpy|memmove)/.test(s)) { subtopic = 'C Memory & Libc'; add('C'); add('Memory'); }
  if (/(fopen|fgets|fread|fseek|eof)/.test(s)) { subtopic = 'C File I/O'; add('C'); add('File I/O'); }
  if (/(preprocessor|#define|macro|volatile|enum|struct padding|storage class)/.test(s)) { subtopic = 'C Language Features'; add('C'); add('Language'); }

  // C++-focused
  if (/(class|object|constructor|destructor|virtual|override|abstract|pure virtual|polymorphism|vtable)/.test(s)) { subtopic = 'C++ OOP'; add('C++'); add('OOP'); }
  if (/(template|enable_if|sfinae|decltype|constexpr)/.test(s)) { subtopic = 'C++ Templates & Metaprogramming'; add('C++'); add('Templates'); }
  if (/(std::vector|unordered_map|set|map|iterator invalidation|stl)/.test(s)) { subtopic = 'C++ STL & Containers'; add('C++'); add('STL'); }
  if (/(unique_ptr|shared_ptr|weak_ptr|move constructor|std::move|std::forward)/.test(s)) { subtopic = 'C++ Memory & RAII'; add('C++'); add('RAII'); }
  if (/(exception|noexcept|throw|catch|std::terminate)/.test(s)) { subtopic = 'C++ Exceptions'; add('C++'); add('Exceptions'); }

  return { subtopic, tags: Array.from(tags) };
}

async function getTopicId() {
  const { data, error } = await supabase
    .from('question_topics')
    .select('id')
    .eq('name', TOPIC_NAME)
    .maybeSingle();
  if (error || !data) { console.error('❌ C/C++ topic not found'); process.exit(1); }
  return data.id;
}

async function main() {
  console.log('🛈 Tagging C/C++ questions with subtopics/tags...');
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
  console.log(`✅ Updated subtopics/tags for ${total} C/C++ questions.`);
  process.exit(0);
}

main().catch(e => { console.error('❌ Fatal error:', e.message); process.exit(1); });
