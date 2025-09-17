#!/usr/bin/env node

/**
 * AWS Credentials Helper
 * Interactive guide to get AWS credentials for Amazon Transcribe
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('🎤 AWS Credentials Helper for Amazon Transcribe');
  console.log('================================================');
  console.log('');

  console.log('📋 What you need:');
  console.log('1. AWS Account (free tier available)');
  console.log('2. IAM User with Transcribe permissions');
  console.log('3. Access Key ID and Secret Access Key');
  console.log('');

  const hasAccount = await askQuestion('Do you have an AWS account? (y/n): ');
  
  if (hasAccount.toLowerCase() !== 'y') {
    console.log('');
    console.log('🚀 Let\'s create an AWS account:');
    console.log('1. Go to: https://aws.amazon.com/');
    console.log('2. Click "Create an AWS Account"');
    console.log('3. Follow the signup process');
    console.log('4. Add payment info (required even for free tier)');
    console.log('5. Verify your phone number');
    console.log('');
    console.log('⏳ Come back when you have an account and run this script again!');
    rl.close();
    return;
  }

  console.log('');
  console.log('✅ Great! Let\'s get your credentials:');
  console.log('');

  console.log('📝 Step 1: Go to AWS Console');
  console.log('1. Open: https://console.aws.amazon.com/');
  console.log('2. Sign in with your AWS account');
  console.log('');

  const ready = await askQuestion('Are you signed in to AWS Console? (y/n): ');
  
  if (ready.toLowerCase() !== 'y') {
    console.log('');
    console.log('⏳ Please sign in to AWS Console first, then run this script again!');
    rl.close();
    return;
  }

  console.log('');
  console.log('📝 Step 2: Create IAM User');
  console.log('1. In AWS Console, search "IAM" in the top search bar');
  console.log('2. Click on "IAM" service');
  console.log('3. Click "Users" in the left sidebar');
  console.log('4. Click "Create user"');
  console.log('');

  console.log('📝 Step 3: Configure User');
  console.log('1. User name: ai-interviewer-transcribe');
  console.log('2. Access type: ✅ Programmatic access');
  console.log('3. Click "Next: Permissions"');
  console.log('4. Click "Attach existing policies directly"');
  console.log('5. Search for "Transcribe"');
  console.log('6. ✅ Check "AmazonTranscribeFullAccess"');
  console.log('7. Click "Next: Tags" (optional)');
  console.log('8. Click "Next: Review"');
  console.log('9. Click "Create user"');
  console.log('');

  console.log('📝 Step 4: Get Credentials');
  console.log('1. After user creation, you\'ll see credentials');
  console.log('2. ⚠️ IMPORTANT: Copy these now (secret key only shows once!)');
  console.log('3. Access Key ID: AKIA...');
  console.log('4. Secret Access Key: ...');
  console.log('5. Click "Download .csv" (recommended)');
  console.log('');

  const hasCredentials = await askQuestion('Do you have your Access Key ID and Secret Access Key? (y/n): ');
  
  if (hasCredentials.toLowerCase() !== 'y') {
    console.log('');
    console.log('⏳ Please get your credentials first, then run this script again!');
    rl.close();
    return;
  }

  console.log('');
  console.log('🎉 Perfect! Now let\'s configure your project:');
  console.log('');
  console.log('📝 Step 5: Run Setup Script');
  console.log('Run: node setup-amazon-transcribe.js');
  console.log('Enter your credentials when prompted');
  console.log('');

  console.log('📝 Step 6: Test It');
  console.log('1. Restart your dev server: npm run dev');
  console.log('2. Test voice input in your AI Interviewer');
  console.log('3. Should now use Amazon Transcribe!');
  console.log('');

  console.log('💰 Cost Information:');
  console.log('- Free: 60 minutes/month for first year');
  console.log('- After free tier: ~$2/hour');
  console.log('- Perfect for testing and small projects');
  console.log('');

  console.log('🔒 Security Reminders:');
  console.log('- Never commit .env file to Git');
  console.log('- Add .env to .gitignore');
  console.log('- Rotate keys every 90 days');
  console.log('');

  console.log('❓ Need Help?');
  console.log('- Check browser console for errors');
  console.log('- Verify microphone permissions');
  console.log('- Test with text input first');
  console.log('- See full guide: docs/AWS_CREDENTIALS_SETUP.md');
  console.log('');

  console.log('🚀 You\'re all set! Happy coding!');
  
  rl.close();
}

main().catch(console.error);
