#!/usr/bin/env node

/**
 * Install AWS SDK for Amazon Polly
 * Simple script to install the required AWS SDK
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Installing AWS SDK for Amazon Polly...');
console.log('==========================================\n');

try {
  // Check if package.json exists
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found. Please run this from the project root directory.');
    process.exit(1);
  }

  // Install AWS SDK
  console.log('📥 Installing aws-sdk...');
  execSync('npm install aws-sdk', { stdio: 'inherit' });
  
  console.log('\n✅ AWS SDK installed successfully!');
  
  console.log('\n📋 Next Steps:');
  console.log('   1. Run: node setup-amazon-polly.js');
  console.log('   2. Enter your AWS credentials');
  console.log('   3. Test: node test-amazon-polly.js');
  console.log('   4. Restart your development server');
  
  console.log('\n🎤 Your AI Interviewer is now ready to use Amazon Polly!');
  
} catch (error) {
  console.error('❌ Failed to install AWS SDK:', error.message);
  console.log('\n💡 Try running manually:');
  console.log('   npm install aws-sdk');
  process.exit(1);
}
