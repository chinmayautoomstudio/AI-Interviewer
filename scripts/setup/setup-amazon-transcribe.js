#!/usr/bin/env node

/**
 * Amazon Transcribe Setup Script
 * Helps configure AWS credentials for Amazon Transcribe STT service
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '.env');

console.log('🎤 Amazon Transcribe Setup');
console.log('========================');
console.log('');
console.log('This script will help you configure Amazon Transcribe for Speech-to-Text.');
console.log('You\'ll need AWS credentials with Transcribe permissions.');
console.log('');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupAmazonTranscribe() {
  try {
    console.log('📋 Required AWS Credentials:');
    console.log('1. AWS Access Key ID');
    console.log('2. AWS Secret Access Key');
    console.log('3. AWS Region (e.g., us-east-1)');
    console.log('');

    const accessKeyId = await askQuestion('Enter your AWS Access Key ID: ');
    const secretAccessKey = await askQuestion('Enter your AWS Secret Access Key: ');
    const region = await askQuestion('Enter your AWS Region (default: us-east-1): ') || 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
      console.log('❌ AWS credentials are required');
      process.exit(1);
    }

    // Read existing .env file
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add AWS credentials
    const lines = envContent.split('\n');
    const newLines = [];
    let awsKeysAdded = false;

    for (const line of lines) {
      if (line.startsWith('REACT_APP_AWS_ACCESS_KEY_ID=') || 
          line.startsWith('REACT_APP_AWS_SECRET_ACCESS_KEY=') || 
          line.startsWith('REACT_APP_AWS_REGION=')) {
        // Skip existing AWS keys
        continue;
      }
      newLines.push(line);
    }

    // Add AWS credentials
    newLines.push('');
    newLines.push('# Amazon Transcribe Configuration');
    newLines.push(`REACT_APP_AWS_ACCESS_KEY_ID=${accessKeyId}`);
    newLines.push(`REACT_APP_AWS_SECRET_ACCESS_KEY=${secretAccessKey}`);
    newLines.push(`REACT_APP_AWS_REGION=${region}`);

    // Write updated .env file
    fs.writeFileSync(envPath, newLines.join('\n'));

    console.log('');
    console.log('✅ Amazon Transcribe configured successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Make sure your AWS credentials have Transcribe permissions');
    console.log('2. Restart your development server: npm run dev');
    console.log('3. Test the voice input functionality');
    console.log('');
    console.log('💰 Pricing: $0.0336/minute for streaming transcription');
    console.log('🆓 Free Tier: 60 minutes/month for first 12 months');
    console.log('');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
setupAmazonTranscribe();
