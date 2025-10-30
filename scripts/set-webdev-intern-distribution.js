const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const JD_TITLE = 'Web Developer Intern';
const TOPICS = [
  { name: 'JavaScript', weight: 40 },
  { name: 'HTML & CSS', weight: 40 },
  { name: 'PHP', weight: 15 },
  { name: 'C and C++ Programming', weight: 4 },
  { name: 'Video & Photo Editing', weight: 1 }, // will ensure this topic exists
];

async function getJobId() {
  const { data, error } = await supabase
    .from('job_descriptions')
    .select('id, title')
    .ilike('title', `${JD_TITLE}%`)
    .limit(1);
  if (error || !data || !data.length) {
    console.error('❌ Job description not found');
    process.exit(1);
  }
  return data[0].id;
}

async function ensureTopic(name) {
  const { data, error } = await supabase
    .from('question_topics')
    .select('id, name')
    .eq('name', name)
    .maybeSingle();
  if (error) { console.error('❌ Fetch topic error:', error.message); process.exit(1); }
  if (data) return data.id;
  const { data: ins, error: insErr } = await supabase
    .from('question_topics')
    .insert({ name, category: 'technical' })
    .select('id')
    .single();
  if (insErr) { console.error('❌ Create topic error:', insErr.message); process.exit(1); }
  return ins.id;
}

async function upsertCategory(jobId, topicId, weight) {
  // Try select existing
  const { data: exist, error: selErr } = await supabase
    .from('job_question_categories')
    .select('id')
    .eq('job_description_id', jobId)
    .eq('topic_id', topicId)
    .maybeSingle();
  if (selErr) { console.error('❌ Select category error:', selErr.message); process.exit(1); }

  const payload = {
    job_description_id: jobId,
    topic_id: topicId,
    weight_percentage: weight,
    easy_percentage: 40,
    medium_percentage: 40,
    hard_percentage: 20,
    is_required: false,
    priority: 0,
  };

  if (exist) {
    const { error: updErr } = await supabase
      .from('job_question_categories')
      .update(payload)
      .eq('id', exist.id);
    if (updErr) console.error('❌ Update category error:', updErr.message);
    else console.log(`🔁 Updated distribution for topic ${topicId} -> ${weight}%`);
  } else {
    const { error: insErr } = await supabase
      .from('job_question_categories')
      .insert(payload);
    if (insErr) console.error('❌ Insert category error:', insErr.message);
    else console.log(`➕ Inserted distribution for topic ${topicId} -> ${weight}%`);
  }
}

async function main() {
  console.log('⚙️ Configuring Web Developer Intern question distribution...');
  const jobId = await getJobId();

  let total = 0;
  for (const t of TOPICS) total += t.weight;
  if (total !== 100) {
    console.error(`❌ Weights must sum to 100 (got ${total})`);
    process.exit(1);
  }

  for (const t of TOPICS) {
    const topicId = await ensureTopic(t.name);
    await upsertCategory(jobId, topicId, t.weight);
  }

  console.log('✅ Distribution configured successfully.');
  process.exit(0);
}

main().catch(e => { console.error('❌ Fatal error:', e.message); process.exit(1); });
