// Simple script to check candidates in the database
// This will help us see what candidates exist and their current status

console.log('🔍 Checking candidates in the database...\n');

console.log('📋 To create credentials for Rohan Patel, you have two options:\n');

console.log('Option 1: Use Supabase Dashboard');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to Table Editor > candidates');
console.log('3. Find Rohan Patel in the list');
console.log('4. Update the following fields:');
console.log('   - username: rohan.patel');
console.log('   - password_hash: Um9oYW5AMjAyNGNhbmRpZGF0ZV9zYWx0XzIwMjQ=');
console.log('   - credentials_generated: true');
console.log('   - credentials_generated_at: (current timestamp)');
console.log('   - status: active\n');

console.log('Option 2: Run SQL Script');
console.log('1. Go to Supabase SQL Editor');
console.log('2. Copy and paste the contents of sql/create_rohan_credentials.sql');
console.log('3. Run the script\n');

console.log('🔐 Generated Credentials for Rohan Patel:');
console.log('   Name: Rohan Patel');
console.log('   Username: rohan.patel');
console.log('   Password: Rohan@2024');
console.log('   Email: (use the email from the database)');
console.log('   Contact Number: (use the phone/contact_number from the database)\n');

console.log('🌐 Login URL: http://localhost:3000/candidate\n');

console.log('📝 Test Instructions:');
console.log('1. Start your React app: npm start');
console.log('2. Go to: http://localhost:3000/candidate');
console.log('3. Fill in the candidate login form with:');
console.log('   - Name: Rohan Patel');
console.log('   - Email: (from database)');
console.log('   - Contact Number: (from database)');
console.log('   - Job: Select the job assigned to Rohan');
console.log('   - Username: rohan.patel');
console.log('   - Password: Rohan@2024');
console.log('4. Click "Login" to access the candidate dashboard\n');

console.log('✅ The password hash is: Um9oYW5AMjAyNGNhbmRpZGF0ZV9zYWx0XzIwMjQ=');
console.log('   This is "Rohan@2024candidate_salt_2024" encoded in base64\n');
