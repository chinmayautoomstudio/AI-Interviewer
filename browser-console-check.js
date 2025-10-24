// Copy and paste this entire script into your browser console
// Make sure you're on the Question Bank page (http://localhost:3000/question-bank)

console.log('🔍 Checking job descriptions in database...');
console.log('📋 Make sure you are on the Question Bank page!');

// Function to check job descriptions
async function checkJobDescriptions() {
  try {
    // First, let's check if we can find the supabase client
    console.log('🔄 Looking for Supabase client...');
    
    // Try to access the supabase client from the global scope
    // This might be available if the app exposes it globally
    let supabase = null;
    
    // Check various possible locations for the supabase client
    if (window.supabase) {
      supabase = window.supabase;
      console.log('✅ Found supabase in window.supabase');
    } else if (window.__SUPABASE__) {
      supabase = window.__SUPABASE__;
      console.log('✅ Found supabase in window.__SUPABASE__');
    } else {
      console.log('❌ Supabase client not found in global scope');
      console.log('💡 Let\'s try to check the React component state instead...');
      checkReactComponentState();
      return;
    }
    
    // Query the database
    console.log('🔄 Querying job_descriptions table...');
    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return;
    }

    console.log('✅ Database query successful!');
    console.log('📊 Total job descriptions found:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('\n📋 Job Descriptions in Database:');
      console.log('=' .repeat(80));
      
      data.forEach((jd, index) => {
        console.log(`\n${index + 1}. Job Description:`);
        console.log(`   ID: ${jd.id}`);
        console.log(`   Job Description ID: ${jd.job_description_id || 'N/A'}`);
        console.log(`   Title: ${jd.title || 'N/A'}`);
        console.log(`   Department: ${jd.department || 'N/A'}`);
        console.log(`   Location: ${jd.location || 'N/A'}`);
        console.log(`   Employment Type: ${jd.employment_type || 'N/A'}`);
        console.log(`   Experience Level: ${jd.experience_level || 'N/A'}`);
        console.log(`   Status: ${jd.status || 'N/A'}`);
        console.log(`   Is Active: ${jd.is_active !== undefined ? jd.is_active : 'N/A'}`);
        console.log(`   Created At: ${jd.created_at || 'N/A'}`);
        
        if (jd.description) {
          console.log(`   Description: ${jd.description.substring(0, 100)}${jd.description.length > 100 ? '...' : ''}`);
        }
        
        console.log('   ' + '-'.repeat(60));
      });
      
      console.log('\n🎯 Summary:');
      console.log(`   Total Job Descriptions: ${data.length}`);
      console.log(`   Active Job Descriptions: ${data.filter(jd => jd.is_active === true).length}`);
      console.log(`   Inactive Job Descriptions: ${data.filter(jd => jd.is_active === false).length}`);
      console.log(`   Job Descriptions with Custom IDs: ${data.filter(jd => jd.job_description_id).length}`);
      
    } else {
      console.log('\n⚠️  No job descriptions found in the database!');
      console.log('💡 This explains why the dropdown is empty.');
      console.log('💡 You may need to:');
      console.log('   1. Add some job descriptions to the database');
      console.log('   2. Check if you\'re connected to the correct database');
      console.log('   3. Verify the table name is "job_descriptions"');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('❌ Error stack:', error.stack);
  }
}

// Function to check React component state
function checkReactComponentState() {
  console.log('🔍 Checking React component state...');
  
  // Look for the select element in the Generate Question modal
  const selectElement = document.querySelector('select');
  if (selectElement) {
    console.log('📋 Found select element:', selectElement);
    const options = Array.from(selectElement.options);
    console.log('📋 Select options:', options.map(opt => ({
      value: opt.value,
      text: opt.textContent,
      disabled: opt.disabled
    })));
    
    if (options.length <= 1) {
      console.log('⚠️  Only default option found - no job descriptions loaded');
    }
  } else {
    console.log('❌ No select element found');
    console.log('💡 Make sure the Generate Question modal is open');
  }
  
  // Look for any error messages in the console
  console.log('🔍 Checking for any error messages in the page...');
  const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
  if (errorElements.length > 0) {
    console.log('⚠️  Found potential error elements:', errorElements);
  }
}

// Function to check network requests
function checkNetworkRequests() {
  console.log('🔍 Checking network requests...');
  
  // This will show any failed network requests
  if (window.performance && window.performance.getEntriesByType) {
    const networkEntries = window.performance.getEntriesByType('resource');
    const failedRequests = networkEntries.filter(entry => 
      entry.name.includes('supabase') || 
      entry.name.includes('job') ||
      entry.name.includes('api')
    );
    
    if (failedRequests.length > 0) {
      console.log('📊 Network requests related to job descriptions:', failedRequests);
    }
  }
}

// Run all checks
console.log('🚀 Starting comprehensive check...');
checkJobDescriptions();
checkReactComponentState();
checkNetworkRequests();

console.log('\n💡 If you see "No job descriptions found", the database is empty.');
console.log('💡 If you see errors, there might be a connection or permission issue.');
console.log('💡 If you see data but the dropdown is empty, there\'s a React state issue.');
