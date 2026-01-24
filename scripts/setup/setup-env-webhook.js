// Setup Environment Variable for Text Evaluation Webhook
// This script helps you set up the required environment variable

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Text Evaluation Webhook Environment Variable\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env file exists');
  
  // Read current .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if the webhook URL is already set
  if (envContent.includes('REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK')) {
    console.log('✅ REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK is already configured');
    
    // Extract the current value
    const match = envContent.match(/REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK=(.+)/);
    if (match) {
      console.log('Current value:', match[1]);
    }
  } else {
    console.log('⚠️ REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK is not configured');
    console.log('Adding the webhook URL to .env file...');
    
    // Add the webhook URL to the .env file
    const webhookUrl = 'https://home.ausomemgr.com/webhook-test/evaluate-text-answers';
    const newEnvContent = envContent + `\n# Text Evaluation Webhook\nREACT_APP_N8N_TEXT_EVALUATION_WEBHOOK=${webhookUrl}\n`;
    
    fs.writeFileSync(envPath, newEnvContent);
    console.log('✅ Added REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK to .env file');
  }
} else {
  console.log('❌ .env file does not exist');
  console.log('Creating .env file with required configuration...');
  
  const envContent = `# Supabase Configuration
REACT_APP_SUPABASE_URL=https://kveisbwrvbbpotngpofp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZWlzYndydmJicG90bmdwb2ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgxNTM0NywiZXhwIjoyMDcyMzkxMzQ3fQ.pFWuY4sjNoazOBJ8ZZkKxOfGxZhPzSa2p4Q-OOI6R4s

# n8n Workflow Integration
REACT_APP_N8N_BASE_URL=https://home.ausomemgr.com
REACT_APP_N8N_API_KEY=your-n8n-api-key
REACT_APP_N8N_RESUME_WEBHOOK=https://home.ausomemgr.com/webhook-test/62b8d0b5-601c-41f0-aa13-68eb9bfd9fd8
REACT_APP_N8N_JD_PARSER_WEBHOOK=https://home.ausomemgr.com/webhook-test/parse-job-description
REACT_APP_N8N_RESUME_PARSER_WEBHOOK=https://home.ausomemgr.com/webhook-test/parse-resume

# AI Interview System Webhooks
REACT_APP_N8N_INTERVIEW_WEBHOOK=https://home.ausomemgr.com/webhook-test/start-interview
REACT_APP_N8N_CHAT_WEBHOOK=https://home.ausomemgr.com/webhook-test/chat-message
REACT_APP_N8N_REPORT_WEBHOOK=https://home.ausomemgr.com/webhook-test/generate-report
REACT_APP_N8N_VOICE_WEBHOOK=https://home.ausomemgr.com/webhook-test/voice-interview

# AI Exam System Webhooks
REACT_APP_N8N_QUESTION_GENERATOR=https://home.ausomemgr.com/webhook-test/generate-questions
REACT_APP_N8N_ANSWER_EVALUATOR=https://home.ausomemgr.com/webhook-test/evaluate-answer
REACT_APP_N8N_QUALITY_ASSESSOR=https://home.ausomemgr.com/webhook-test/assess-quality
REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK=https://home.ausomemgr.com/webhook-test/evaluate-text-answers

# Development Configuration
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=debug
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with all required configuration');
}

console.log('\n🎯 Next Steps:');
console.log('1. Restart your development server (npm start)');
console.log('2. Check the browser console for debug information');
console.log('3. Try triggering text evaluation again');
console.log('\n📋 Webhook URL configured: https://home.ausomemgr.com/webhook-test/evaluate-text-answers');
console.log('🔍 Make sure this webhook exists in your n8n workflow!');
