// scripts/bulk-insert-candidates.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const candidates = [
  { email: 'ayanmondal2439@gmail.com', name: 'AYAN MONDAL', phone: '7682897943' },
  { email: 'pragnyadas499@gmail.com', name: 'PRAGNYA LIPSITA DAS', phone: '8926048209' },
  { email: 'rajeshsahoo200430@gmail.com', name: 'RAJESH SAHOO', phone: '7728881723' },
  { email: 'senapatisubhransu2005@gmail.com', name: 'SUBHRANSU SEKHAR SENAPATI', phone: '9827462608' },
  { email: 'debaranjansahoochiku@gmail.com', name: 'DEBARANJAN SAHOO', phone: '9692243589' },
  { email: 'manishabhakta13@gmail.com', name: 'MANISHA BHAKTA', phone: '9348752195' },
  { email: 'sudhanshumalla06@gmail.com', name: 'SUDHANSHU SEKHAR MALLA', phone: '9861487768' },
  { email: 'sahooamitkumar634@gmail.com', name: 'AMIT KUMAR SAHOO', phone: '8328902044' },
  { email: 'dibyashasamal6@gmail.com', name: 'DIBYASHA SAMAL', phone: '8114337841' },
  { email: 'harekrushnabehera2006@gmail.com', name: 'HAREKRUSHNA BEHERA', phone: '8018104098' },
  { email: 'kulinmohanta@gmail.com', name: 'KULIN KUMAR MOHANTA', phone: '7735678314' },
  { email: 'simranrout204@gmail.com', name: 'M R SIMRAN', phone: '7752064864' },
  { email: 'manojkumarmishra0012@gmail.com', name: 'MANOJ KUMAR MISHRA', phone: '8260516899' },
  { email: 'omm.itm.2026@gmail.com', name: 'OMMSHREE SMRUTIRANJAN SAHOO', phone: '8260510012' },
  { email: 'payalnayak057@gmail.com', name: 'PAYAL NAYAK', phone: '8144903234' },
  { email: 'abhipshasahoo46@gmail.com', name: 'PUJARANI SAHOO', phone: '9178691259' },
  { email: 'rajeshmohantyraja04@gmail.com', name: 'RAJESH MOHANTY', phone: '9692822557' },
  { email: 'ram.itm.2026@gmail.com', name: 'RAMA KRUSHNA JENA', phone: '9692957797' },
  { email: 'samikshyarout22@gmail.com', name: 'SAMIKSHYA ROUT', phone: '9861644031' },
  { email: 'sangramdalei233@gmail.com', name: 'SANGRAM DALEI', phone: '8249222720' },
  { email: 'satyajitbehera1123@gmail.com', name: 'SATYAJIT BEHERA', phone: '6371356464' },
  { email: 'smruti182005@gmail.com', name: 'SMRUTIREKHA SAHOO', phone: '9692500650' },
  { email: 'sonalimallickmm947@gmail.com', name: 'SONALI MALLICK', phone: '7504647085' },
  { email: 'sahoosurajkumar89@gmail.com', name: 'SURAJ KUMAR SAHOO', phone: '9556685480' },
  { email: 'swayanprakashnayak18@gmail.com', name: 'SWAYAN PRAKASH NAYAK', phone: '8249216884' },
  { email: 'mohantytapaswini367@gmail.com', name: 'TAPASWINI MOHANTY', phone: '9348097110' }
];

async function main() {
  let success = 0, failed = 0;
  for (const candidate of candidates) {
    const { error } = await supabase
      .from('candidates')
      .insert({
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        contact_number: candidate.phone,
        status: 'active',
        created_at: new Date().toISOString(),
      });
    if (error) {
      console.error(`❌ Failed: ${candidate.email} -- ${error.message}`);
      failed++;
    } else {
      console.log(`✅ Inserted: ${candidate.email}`);
      success++;
    }
  }
  console.log(`\nBulk insert finished. Success: ${success}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();