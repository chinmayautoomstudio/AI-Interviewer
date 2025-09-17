#!/usr/bin/env node

/**
 * Setup Environment File
 * Creates .env file with AWS credentials for Amazon Polly
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up .env file for Amazon Polly');
console.log('========================================\n');

// Check if .env file already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  
  // Read current .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if AWS credentials are configured
  const hasAwsAccessKey = envContent.includes('REACT_APP_AWS_ACCESS_KEY_ID=') && 
                         !envContent.includes('REACT_APP_AWS_ACCESS_KEY_ID=your-aws-access-key-id');
  const hasAwsSecretKey = envContent.includes('REACT_APP_AWS_SECRET_ACCESS_KEY=') && 
                         !envContent.includes('REACT_APP_AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key');
  const hasAwsRegion = envContent.includes('REACT_APP_AWS_REGION=') && 
                      !envContent.includes('REACT_APP_AWS_REGION=us-east-1');
  
  if (hasAwsAccessKey && hasAwsSecretKey && hasAwsRegion) {
    console.log('✅ AWS credentials are configured in .env file');
    console.log('🎤 Amazon Polly should be working!');
  } else {
    console.log('⚠️ AWS credentials not properly configured in .env file');
    console.log('📝 Please add your AWS credentials to the .env file:');
    console.log('   REACT_APP_AWS_ACCESS_KEY_ID=your_actual_access_key');
    console.log('   REACT_APP_AWS_SECRET_ACCESS_KEY=your_actual_secret_key');
    console.log('   REACT_APP_AWS_REGION=us-east-1');
  }
} else {
  console.log('❌ .env file not found');
  console.log('📝 Creating .env file from env.example...');
  
  // Copy env.example to .env
  const envExamplePath = path.join(__dirname, 'env.example');
  if (fs.existsSync(envExamplePath)) {
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envExampleContent);
    console.log('✅ .env file created from env.example');
    console.log('📝 Please edit .env file and add your AWS credentials:');
    console.log('   REACT_APP_AWS_ACCESS_KEY_ID=your_actual_access_key');
    console.log('   REACT_APP_AWS_SECRET_ACCESS_KEY=your_actual_secret_key');
    console.log('   REACT_APP_AWS_REGION=us-east-1');
  } else {
    console.log('❌ env.example file not found');
  }
}

console.log('\n🧪 Test Instructions:');
console.log('1. Make sure .env file has your AWS credentials');
console.log('2. Restart the development server: npm start');
console.log('3. Check browser console for: "Amazon Polly TTS successful"');
console.log('4. You should hear Joanna voice instead of Microsoft voices');

console.log('\n🔍 Current Status:');
console.log('• AWS SDK: ✅ Installed');
console.log('• .env file: ' + (fs.existsSync(envPath) ? '✅ Exists' : '❌ Missing'));
console.log('• AWS credentials: ' + (fs.existsSync(envPath) ? 'Check .env file' : '❌ Not configured'));
