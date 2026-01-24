#!/usr/bin/env node

/**
 * ElevenLabs API Key Setup Script
 * This script helps you configure your ElevenLabs API key for the AI Interviewer
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎤 ElevenLabs API Key Setup for AI Interviewer');
console.log('===============================================\n');

console.log('To get your ElevenLabs API key:');
console.log('1. Go to https://elevenlabs.io/');
console.log('2. Sign up or log in to your account');
console.log('3. Go to your Profile/Settings');
console.log('4. Find your API key in the API section');
console.log('5. Copy the API key\n');

rl.question('Enter your ElevenLabs API key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ No API key provided. Exiting...');
    rl.close();
    return;
  }

  // Validate API key format (basic check)
  if (apiKey.length < 20) {
    console.log('⚠️  Warning: API key seems too short. Please verify it\'s correct.');
  }

  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');

  try {
    let envContent = '';
    
    // Check if .env file exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    } else if (fs.existsSync(envExamplePath)) {
      // Copy from env.example if .env doesn't exist
      envContent = fs.readFileSync(envExamplePath, 'utf8');
      console.log('📄 Created .env file from env.example');
    } else {
      console.log('❌ No env.example file found. Please create a .env file manually.');
      rl.close();
      return;
    }

    // Update or add the ElevenLabs API key
    const lines = envContent.split('\n');
    let updated = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('REACT_APP_ELEVEN_LABS_API_KEY=')) {
        lines[i] = `REACT_APP_ELEVEN_LABS_API_KEY=${apiKey.trim()}`;
        updated = true;
        break;
      }
    }
    
    if (!updated) {
      // Add the API key if it doesn't exist
      lines.push(`REACT_APP_ELEVEN_LABS_API_KEY=${apiKey.trim()}`);
    }

    // Write the updated content
    fs.writeFileSync(envPath, lines.join('\n'));
    
    console.log('✅ ElevenLabs API key configured successfully!');
    console.log('📁 Updated .env file');
    console.log('\n🔄 Please restart your development server for changes to take effect:');
    console.log('   npm start');
    console.log('\n🎯 You can now test the voice features in the Interview Setup page!');
    
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
  }
  
  rl.close();
});

rl.on('close', () => {
  console.log('\n👋 Setup complete!');
});
