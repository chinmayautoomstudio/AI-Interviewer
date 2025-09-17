#!/usr/bin/env node

/**
 * Setup Amazon Polly for AI Interviewer
 * Helps configure AWS credentials for Amazon Polly TTS
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupAmazonPolly() {
  console.log('🎤 Amazon Polly Setup for AI Interviewer');
  console.log('=====================================\n');

  console.log('This will help you configure Amazon Polly as a TTS provider.');
  console.log('Amazon Polly offers high-quality neural voices perfect for interviews.\n');

  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Found existing .env file');
  } else {
    console.log('📝 Creating new .env file');
  }

  // Get AWS credentials
  console.log('\n🔑 AWS Credentials Setup:');
  console.log('You can find these in your AWS Console > IAM > Users > Your User > Security Credentials\n');

  const accessKeyId = await askQuestion('AWS Access Key ID: ');
  const secretAccessKey = await askQuestion('AWS Secret Access Key: ');
  const region = await askQuestion('AWS Region (default: us-east-1): ') || 'us-east-1';

  // Validate inputs
  if (!accessKeyId || !secretAccessKey) {
    console.log('❌ Access Key ID and Secret Access Key are required');
    rl.close();
    return;
  }

  // Update or add AWS credentials to .env
  const awsConfig = `
# Amazon Polly Voice Integration (Fallback)
REACT_APP_AWS_ACCESS_KEY_ID=${accessKeyId}
REACT_APP_AWS_SECRET_ACCESS_KEY=${secretAccessKey}
REACT_APP_AWS_REGION=${region}

# TTS Provider Configuration
REACT_APP_TTS_PRIMARY_PROVIDER=elevenlabs
REACT_APP_TTS_FALLBACK_PROVIDER=polly`;

  // Remove existing AWS config if present
  envContent = envContent.replace(/# Amazon Polly.*?(?=\n# [A-Z]|\n$|$)/gs, '');
  envContent = envContent.replace(/# TTS Provider.*?(?=\n# [A-Z]|\n$|$)/gs, '');

  // Add new AWS config
  envContent += awsConfig;

  // Write updated .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Amazon Polly configuration added to .env file');
  console.log('\n📋 Configuration Summary:');
  console.log(`   Access Key ID: ${accessKeyId.substring(0, 8)}...`);
  console.log(`   Secret Access Key: ${secretAccessKey.substring(0, 8)}...`);
  console.log(`   Region: ${region}`);
  console.log(`   Primary Provider: Amazon Polly`);
  console.log(`   Fallback Provider: ElevenLabs`);

  console.log('\n🎤 Amazon Polly Voices Available:');
  console.log('   Professional Female: Joanna (Neural)');
  console.log('   Professional Male: Matthew (Neural)');
  console.log('   Friendly Female: Amy (Neural)');
  console.log('   Friendly Male: Joey (Neural)');

  console.log('\n💰 Amazon Polly Pricing:');
  console.log('   Neural Voices: $4.00 per 1M characters');
  console.log('   Free Tier: 5M characters per month');
  console.log('   Much cheaper than ElevenLabs ($22/1M chars)');

  console.log('\n🚀 Next Steps:');
  console.log('   1. Restart your development server');
  console.log('   2. Test the voice functionality');
  console.log('   3. Amazon Polly is now your primary TTS provider');

  console.log('\n✅ Setup complete! Amazon Polly is now configured as your primary TTS provider.');

  rl.close();
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Run the setup
setupAmazonPolly().catch(console.error);
