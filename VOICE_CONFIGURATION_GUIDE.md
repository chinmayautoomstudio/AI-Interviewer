# 🎤 Voice Configuration Guide

This guide explains how to configure and use different voices for your AI Interviewer system.

## 🎯 Available Voice Options

### 1. **Professional Female (Rachel) - Default**
- **Voice ID**: `21m00Tcm4TlvDq8ikWAM`
- **Characteristics**: Professional, clear, engaging
- **Best for**: General interviews, customer service roles, HR positions
- **Settings**: Stability 0.7, Similarity Boost 0.8

### 2. **Professional Male (Adam)**
- **Voice ID**: `pNInz6obpgDQGcFmaJgB`
- **Characteristics**: Authoritative, professional, clear
- **Best for**: Management roles, leadership positions, technical interviews
- **Settings**: Stability 0.8, Similarity Boost 0.7

### 3. **Friendly Female (Rachel - Friendly)**
- **Voice ID**: `21m00Tcm4TlvDq8ikWAM` (with different settings)
- **Characteristics**: Warm, approachable, casual
- **Best for**: Creative roles, marketing positions, casual interviews
- **Settings**: Stability 0.5, Similarity Boost 0.6

### 4. **Technical Male (Adam - Technical)**
- **Voice ID**: `pNInz6obpgDQGcFmaJgB` (with different settings)
- **Characteristics**: Precise, clear, technical
- **Best for**: Engineering roles, technical positions, coding interviews
- **Settings**: Stability 0.9, Similarity Boost 0.8

## 🔧 How to Set a Particular Voice

### Method 1: Using the Voice Settings Page
1. Navigate to the Voice Settings page in your admin panel
2. Select your preferred voice from the available options
3. Test the voice with custom text
4. Save your configuration

### Method 2: Programmatically in Code
```typescript
import { elevenLabsService } from './services/elevenLabs';
import { VOICE_PRESETS } from './config/voiceConfig';

// Set a specific voice
elevenLabsService.setVoiceConfig(VOICE_PRESETS.professional_male);

// Set voice by ID
elevenLabsService.setVoiceById('pNInz6obpgDQGcFmaJgB');

// Set voice based on job type
elevenLabsService.setVoiceForJobType('Software Engineer');

// Set voice based on department
elevenLabsService.setVoiceForDepartment('Engineering');
```

### Method 3: Environment Variables
Add to your `.env` file:
```env
REACT_APP_ELEVEN_LABS_DEFAULT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
REACT_APP_DEFAULT_VOICE_PRESET=professional_female
```

## 🎭 Voice Selection by Job Type

The system automatically selects voices based on job characteristics:

| Job Type | Selected Voice | Reason |
|----------|----------------|---------|
| Software Engineer | Technical Male | Clear, precise for technical discussions |
| Marketing Manager | Friendly Female | Warm, engaging for creative roles |
| HR Manager | Professional Female | Professional, approachable for people roles |
| CEO/Executive | Professional Male | Authoritative, leadership-focused |
| Designer | Friendly Female | Creative, inspiring for design roles |

## ⚙️ Voice Settings Explained

### Stability (0.0 - 1.0)
- **Higher values (0.8-1.0)**: More consistent, predictable voice
- **Lower values (0.0-0.5)**: More expressive, varied voice
- **Recommended**: 0.7 for interviews (professional consistency)

### Similarity Boost (0.0 - 1.0)
- **Higher values (0.8-1.0)**: Closer to original voice characteristics
- **Lower values (0.0-0.5)**: More variation from original voice
- **Recommended**: 0.8 for interviews (consistent personality)

### Speaker Boost
- **Enabled**: Enhanced clarity and presence
- **Disabled**: Natural voice characteristics
- **Recommended**: Enabled for interviews (better clarity)

## 🎵 Testing Voices

### Before Interviews
1. Use the Voice Settings page to test different voices
2. Try various test texts to hear how each voice sounds
3. Consider the job type and candidate expectations
4. Save your preferred configuration

### During Development
```typescript
// Test a voice programmatically
const testVoice = async () => {
  await elevenLabsService.textToSpeech({
    text: "Hello! This is a test of the selected voice.",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    voiceSettings: {
      stability: 0.7,
      similarityBoost: 0.8,
      useSpeakerBoost: true
    }
  });
};
```

## 🔄 Dynamic Voice Selection

The system can automatically change voices based on:

### Job Description Analysis
```typescript
// Automatically select voice based on job content
const jobType = "Software Engineer";
elevenLabsService.setVoiceForJobType(jobType);
```

### Department-Based Selection
```typescript
// Select voice based on department
const department = "Engineering";
elevenLabsService.setVoiceForDepartment(department);
```

### Manual Override
```typescript
// Override automatic selection
elevenLabsService.setVoiceConfig(VOICE_PRESETS.friendly_female);
```

## 📱 Integration with Interview System

### In Chat Interface
- Voice selection affects all AI responses
- Candidates hear the selected voice for questions
- Voice settings persist throughout the interview

### In Voice Recorder
- Candidate voice input is transcribed
- AI responses use the configured voice
- Both text and audio are stored in database

## 🎯 Best Practices

### For Technical Interviews
- Use **Technical Male** voice
- Higher stability (0.9) for precision
- Clear, authoritative tone

### For Creative Interviews
- Use **Friendly Female** voice
- Lower stability (0.5) for expressiveness
- Warm, engaging tone

### For Management Interviews
- Use **Professional Male** voice
- Balanced settings (0.7-0.8)
- Authoritative but approachable

### For General Interviews
- Use **Professional Female** voice (default)
- Standard settings (0.7, 0.8)
- Professional and clear

## 🔧 Troubleshooting

### Voice Not Working
1. Check Eleven Labs API key in `.env` file
2. Verify voice ID is correct
3. Test with simple text first
4. Check browser audio permissions

### Voice Quality Issues
1. Adjust stability settings
2. Try different voice IDs
3. Check internet connection
4. Verify API quota limits

### Voice Selection Not Saving
1. Check localStorage permissions
2. Verify save function is called
3. Check for JavaScript errors
4. Restart the application

## 🚀 Advanced Configuration

### Custom Voice Settings
```typescript
const customVoiceConfig = {
  voiceId: 'your-custom-voice-id',
  name: 'Custom Voice',
  description: 'Your custom voice description',
  accent: 'American',
  gender: 'female' as const,
  age: 'young' as const,
  useCase: 'Custom interviews',
  settings: {
    stability: 0.75,
    similarityBoost: 0.85,
    useSpeakerBoost: true,
  },
};

elevenLabsService.setVoiceConfig(customVoiceConfig);
```

### Multiple Voice Support
```typescript
// Switch voices during interview based on context
if (isTechnicalQuestion) {
  elevenLabsService.setVoiceConfig(VOICE_PRESETS.technical_male);
} else if (isBehavioralQuestion) {
  elevenLabsService.setVoiceConfig(VOICE_PRESETS.friendly_female);
}
```

This comprehensive voice configuration system gives you full control over the AI interviewer's voice, ensuring the best experience for both interviewers and candidates! 🎤✨
