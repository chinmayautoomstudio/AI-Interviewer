#!/usr/bin/env node

/**
 * Check Kajal Voice Engines
 * Find out which engines are supported by Kajal voice
 */

const AWS = require('aws-sdk');
require('dotenv').config();

console.log('🔍 Checking Kajal Voice Engine Support');
console.log('=====================================\n');

// Initialize AWS Polly
const polly = new AWS.Polly({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION
});

// Get detailed voice information
polly.describeVoices({ LanguageCode: 'en-IN' }, (err, data) => {
  if (err) {
    console.log('❌ Error:', err.message);
    return;
  }

  const kajalVoice = data.Voices.find(voice => voice.Name === 'Kajal');
  if (kajalVoice) {
    console.log('🎤 Kajal Voice Details:');
    console.log('• Name:', kajalVoice.Name);
    console.log('• Gender:', kajalVoice.Gender);
    console.log('• Language:', kajalVoice.LanguageCode);
    console.log('• Engine:', kajalVoice.Engine || 'Standard (default)');
    console.log('• Supported Engines:', kajalVoice.SupportedEngines || ['standard']);
    
    // Test different engines
    const enginesToTest = ['standard', 'neural'];
    
    console.log('\n🧪 Testing Different Engines:');
    
    enginesToTest.forEach((engine, index) => {
      setTimeout(() => {
        console.log(`\n🔧 Testing ${engine} engine...`);
        
        const params = {
          Text: 'Hello! This is a test.',
          OutputFormat: 'mp3',
          VoiceId: 'Kajal',
          Engine: engine,
          TextType: 'text',
          LanguageCode: 'en-IN'
        };
        
        polly.synthesizeSpeech(params, (err, data) => {
          if (err) {
            console.log(`❌ ${engine} engine failed:`, err.message);
          } else {
            console.log(`✅ ${engine} engine works!`);
            console.log(`• Audio size: ${data.AudioStream.length} bytes`);
          }
        });
      }, index * 1000);
    });
    
  } else {
    console.log('❌ Kajal voice not found');
  }
});
