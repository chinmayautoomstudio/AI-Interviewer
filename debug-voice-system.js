#!/usr/bin/env node

/**
 * Debug Voice System
 * Checks why the system is using local voices instead of Kajal
 */

const AWS = require('aws-sdk');
require('dotenv').config();

console.log('🔍 Debugging Voice System');
console.log('=========================\n');

// Check environment variables
const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
const region = process.env.REACT_APP_AWS_REGION;
const ttsPrimaryProvider = process.env.REACT_APP_TTS_PRIMARY_PROVIDER;

console.log('🔍 Environment Variables:');
console.log('• REACT_APP_AWS_ACCESS_KEY_ID:', accessKeyId ? '✅ Set' : '❌ Missing');
console.log('• REACT_APP_AWS_SECRET_ACCESS_KEY:', secretAccessKey ? '✅ Set' : '❌ Missing');
console.log('• REACT_APP_AWS_REGION:', region || '❌ Missing');
console.log('• REACT_APP_TTS_PRIMARY_PROVIDER:', ttsPrimaryProvider || '❌ Missing');

if (!accessKeyId || !secretAccessKey || !region) {
  console.log('\n❌ AWS credentials not properly configured');
  console.log('🔧 This will cause Amazon Polly to fall back to browser TTS');
  process.exit(1);
}

if (ttsPrimaryProvider !== 'polly') {
  console.log('\n⚠️ TTS primary provider is not set to "polly"');
  console.log('🔧 This will cause the system to use ElevenLabs instead of Amazon Polly');
}

// Initialize AWS Polly
const polly = new AWS.Polly({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: region
});

console.log('\n🔧 Testing Amazon Polly Connection...');

// Test Polly connection
polly.describeVoices({ LanguageCode: 'en-IN' }, (err, data) => {
  if (err) {
    console.log('❌ Error connecting to Amazon Polly:', err.message);
    console.log('\n🔧 This will cause the system to fall back to browser TTS');
    console.log('💡 Check your AWS credentials and region');
  } else {
    console.log('✅ Successfully connected to Amazon Polly!');
    
    const kajalVoice = data.Voices.find(voice => voice.Name === 'Kajal');
    if (kajalVoice) {
      console.log('✅ Kajal voice is available!');
      console.log('• Name:', kajalVoice.Name);
      console.log('• Gender:', kajalVoice.Gender);
      console.log('• Language:', kajalVoice.LanguageCode);
      console.log('• Engine:', kajalVoice.Engine || 'Standard');
    } else {
      console.log('❌ Kajal voice not found!');
      console.log('🔧 Available Indian English voices:');
      data.Voices.forEach(voice => {
        console.log(`• ${voice.Name} (${voice.Gender})`);
      });
    }
    
    console.log('\n🧪 Testing Kajal Voice TTS...');
    
    // Test TTS generation
    const params = {
      Text: 'Hello! This is a test of Kajal voice.',
      OutputFormat: 'mp3',
      VoiceId: 'Kajal',
      Engine: 'neural', // Use neural engine (generative)
      TextType: 'text',
      LanguageCode: 'en-IN'
    };
    
    polly.synthesizeSpeech(params, (err, data) => {
      if (err) {
        console.log('❌ Error generating speech with Kajal:', err.message);
        console.log('\n🔧 This will cause the system to fall back to browser TTS');
      } else {
        console.log('✅ Successfully generated speech with Kajal!');
        console.log('• Audio size:', data.AudioStream.length, 'bytes');
        console.log('• Voice: Kajal (Indian English Female)');
        console.log('• Engine: Standard');
        
        console.log('\n🎉 Amazon Polly with Kajal is working correctly!');
        console.log('🔍 If you\'re still hearing local voices, check:');
        console.log('1. Browser console for error messages');
        console.log('2. Network tab for failed API calls');
        console.log('3. Make sure the app is using ttsManager.textToSpeech()');
        console.log('4. Check if there are any CORS issues');
      }
    });
  }
});

console.log('\n🔍 Common Issues:');
console.log('1. AWS credentials not loaded in browser');
console.log('2. CORS issues with AWS Polly');
console.log('3. TTS Manager not using Amazon Polly');
console.log('4. Browser TTS fallback being triggered');
console.log('5. Environment variables not loaded in React app');
