const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

function canonical(str) {
  return (str || '').replace(/\s+/g,' ').trim().toLowerCase();
}

async function main() {
  console.log('🔍 Finding duplicate questions (by question_text) ...');
  const BATCH = 3000;
  let offset = 0;
  const all = [];

  while (true) {
    const { data, error } = await supabase
      .from('exam_questions')
      .select('id, question_text, created_at')
      .order('created_at', { ascending: true })
      .range(offset, offset + BATCH - 1);
    if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    all.push(...data);
    offset += BATCH;
    if (data.length < BATCH) break;
  }

  const seen = new Map();
  const dups = [];
  for (const q of all) {
    const ctext = canonical(q.question_text);
    if (!seen.has(ctext)) seen.set(ctext, q);
    else dups.push(q.id);
  }

  console.log(`Found ${dups.length} duplicates by question_text.`);
  if (dups.length === 0) return process.exit(0);

  // delete in batches of 50
  let removed = 0;
  for (let i = 0; i < dups.length; i += 50) {
    const batch = dups.slice(i, i+50);
    const { error } = await supabase.from('exam_questions').delete().in('id', batch);
    if (error) { console.error('❌ Delete error:', error.message); }
    else { console.log(`🗑️ Deleted batch of ${batch.length}`); removed += batch.length; }
  }
  console.log(`✅ Done. Removed ${removed} duplicate questions. Kept only oldest per text.`);
  process.exit(0);
}

main().catch(e => { console.error('❌ Fatal error:', e.message); process.exit(1); });
