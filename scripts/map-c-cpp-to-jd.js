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
const JD_TITLE = 'Web Developer Intern';

async function getTopicId() {
  const { data, error } = await supabase
    .from('question_topics')
    .select('id, name')
    .eq('name', TOPIC_NAME)
    .maybeSingle();
  if (error || !data) {
    console.error('❌ Topic not found:', error?.message || TOPIC_NAME);
    process.exit(1);
  }
  return data.id;
}

async function getJobId() {
  const { data, error } = await supabase
    .from('job_descriptions')
    .select('id, title')
    .ilike('title', `${JD_TITLE}%`)
    .limit(1);
  if (error || !data || !data.length) {
    console.error('❌ Job description not found:', error?.message || JD_TITLE);
    process.exit(1);
  }
  return data[0].id;
}

async function mapQuestions() {
  console.log('🔗 Mapping C/C++ questions to Web Developer Intern JD...');
  const topicId = await getTopicId();
  const jobId = await getJobId();
  console.log(`✅ topic_id=${topicId}`);
  console.log(`✅ job_description_id=${jobId}`);

  const { data: updated, error } = await supabase
    .from('exam_questions')
    .update({ job_description_id: jobId })
    .eq('topic_id', topicId)
    .select('id');

  if (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }

  console.log(`🎯 Updated ${updated?.length || 0} questions to JD '${JD_TITLE}'`);
}

mapQuestions().then(() => {
  console.log('✨ Mapping completed.');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
