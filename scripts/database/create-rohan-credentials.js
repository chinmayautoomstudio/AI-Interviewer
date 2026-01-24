// Script to create temporary login credentials for Rohan Patel
// This script will add username and password to the candidates table

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple password hashing (same as in candidateAuth.ts)
function hashPassword(password) {
  return Buffer.from(password + 'candidate_salt_2024').toString('base64');
}

async function createRohanCredentials() {
  try {
    console.log('🔍 Looking for Rohan Patel in candidates table...');
    
    // First, find Rohan Patel
    const { data: candidates, error: searchError } = await supabase
      .from('candidates')
      .select('*')
      .ilike('name', '%Rohan%Patel%');

    if (searchError) {
      console.error('❌ Error searching for candidates:', searchError);
      return;
    }

    if (!candidates || candidates.length === 0) {
      console.log('❌ Rohan Patel not found in candidates table');
      console.log('📝 Available candidates:');
      
      // Show all candidates
      const { data: allCandidates } = await supabase
        .from('candidates')
        .select('id, name, email, candidate_id')
        .limit(10);
      
      if (allCandidates) {
        allCandidates.forEach(candidate => {
          console.log(`  - ${candidate.name} (${candidate.email}) - ID: ${candidate.candidate_id || candidate.id}`);
        });
      }
      return;
    }

    const rohan = candidates[0];
    console.log(`✅ Found Rohan Patel: ${rohan.name} (${rohan.email})`);
    console.log(`   Current username: ${rohan.username || 'Not set'}`);
    console.log(`   Current status: ${rohan.status}`);
    console.log(`   Credentials generated: ${rohan.credentials_generated || false}`);

    // Generate credentials
    const username = 'rohan.patel';
    const password = 'Rohan@2024';
    const hashedPassword = hashPassword(password);

    console.log('\n🔐 Generated credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);

    // Update Rohan's record with credentials
    const { data: updatedCandidate, error: updateError } = await supabase
      .from('candidates')
      .update({
        username: username,
        password_hash: hashedPassword,
        credentials_generated: true,
        credentials_generated_at: new Date().toISOString(),
        status: 'active'
      })
      .eq('id', rohan.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating credentials:', updateError);
      return;
    }

    console.log('\n✅ Successfully created credentials for Rohan Patel!');
    console.log('\n📋 Login Information:');
    console.log('   Name: Rohan Patel');
    console.log('   Email: ' + rohan.email);
    console.log('   Contact Number: ' + (rohan.contact_number || rohan.phone || 'Not set'));
    console.log('   Username: ' + username);
    console.log('   Password: ' + password);
    console.log('\n🌐 Login URL: http://localhost:3000/candidate');
    
    console.log('\n📝 Test the login with these details:');
    console.log('   1. Go to: http://localhost:3000/candidate');
    console.log('   2. Fill in the form with the above information');
    console.log('   3. Select the job description assigned to Rohan');
    console.log('   4. Use the username and password provided');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createRohanCredentials();
