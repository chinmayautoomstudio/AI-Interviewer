#!/usr/bin/env node

/**
 * AWS Polly Credentials Guide
 * Step-by-step instructions to get AWS access keys for Amazon Polly
 */

console.log('🔑 How to Get AWS Access Keys for Amazon Polly');
console.log('==============================================\n');

console.log('📋 Step-by-Step Guide:\n');

console.log('1️⃣ CREATE AWS ACCOUNT');
console.log('   • Go to: https://aws.amazon.com/');
console.log('   • Click "Create an AWS Account"');
console.log('   • Follow the registration process');
console.log('   • Verify your email and phone number\n');

console.log('2️⃣ SIGN IN TO AWS CONSOLE');
console.log('   • Go to: https://console.aws.amazon.com/');
console.log('   • Sign in with your AWS account credentials\n');

console.log('3️⃣ CREATE IAM USER (Recommended)');
console.log('   • Go to: https://console.aws.amazon.com/iam/');
console.log('   • Click "Users" in the left sidebar');
console.log('   • Click "Create user"');
console.log('   • Enter username: "ai-interviewer-polly"');
console.log('   • Select "Programmatic access"');
console.log('   • Click "Next: Permissions"\n');

console.log('4️⃣ ATTACH POLICY');
console.log('   • Click "Attach existing policies directly"');
console.log('   • Search for "Polly"');
console.log('   • Check "AmazonPollyFullAccess"');
console.log('   • Click "Next: Tags" (optional)');
console.log('   • Click "Next: Review"');
console.log('   • Click "Create user"\n');

console.log('5️⃣ GET ACCESS KEYS');
console.log('   • You\'ll see "Success" page');
console.log('   • Click "Download .csv" to save credentials');
console.log('   • OR copy the credentials manually:');
console.log('     - Access Key ID: AKIA...');
console.log('     - Secret Access Key: wJalr...');
console.log('   ⚠️  IMPORTANT: Save these securely!\n');

console.log('6️⃣ CONFIGURE IN YOUR PROJECT');
console.log('   • Run: node setup-amazon-polly.js');
console.log('   • Enter your Access Key ID and Secret Access Key');
console.log('   • Choose your preferred AWS region (e.g., us-east-1)\n');

console.log('🌍 AWS REGIONS FOR POLLY:');
console.log('   • us-east-1 (N. Virginia) - Recommended');
console.log('   • us-west-2 (Oregon)');
console.log('   • eu-west-1 (Ireland)');
console.log('   • ap-southeast-1 (Singapore)');
console.log('   • ap-northeast-1 (Tokyo)\n');

console.log('💰 AMAZON POLLY PRICING:');
console.log('   • Neural Voices: $4.00 per 1M characters');
console.log('   • Standard Voices: $4.00 per 1M characters');
console.log('   • Free Tier: 5M characters per month');
console.log('   • Much cheaper than ElevenLabs ($22/1M chars)\n');

console.log('🔒 SECURITY BEST PRACTICES:');
console.log('   • Never share your access keys');
console.log('   • Use IAM users instead of root account');
console.log('   • Rotate keys regularly');
console.log('   • Use least privilege principle');
console.log('   • Monitor usage in AWS CloudTrail\n');

console.log('🧪 TEST YOUR SETUP:');
console.log('   • Run: node test-amazon-polly.js');
console.log('   • This will verify your credentials work\n');

console.log('❓ TROUBLESHOOTING:');
console.log('   • "Access Denied": Check IAM permissions');
console.log('   • "Invalid credentials": Verify key format');
console.log('   • "Region not supported": Use us-east-1');
console.log('   • "Quota exceeded": Check AWS service limits\n');

console.log('📞 NEED HELP?');
console.log('   • AWS Documentation: https://docs.aws.amazon.com/polly/');
console.log('   • AWS Support: https://console.aws.amazon.com/support/');
console.log('   • AWS Free Tier: https://aws.amazon.com/free/\n');

console.log('✅ Ready to get started?');
console.log('   1. Create AWS account');
console.log('   2. Create IAM user with Polly permissions');
console.log('   3. Get access keys');
console.log('   4. Run: node setup-amazon-polly.js');
console.log('   5. Test: node test-amazon-polly.js\n');

console.log('🎤 Your AI Interviewer will have high-quality, cost-effective voice synthesis!');
