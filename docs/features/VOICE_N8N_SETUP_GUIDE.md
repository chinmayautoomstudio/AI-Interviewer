# Voice Integration with n8n - Setup Guide

## 🎯 **Overview**
This guide explains how to set up and configure the voice integration between your AI Interviewer frontend and n8n workflows using ElevenLabs voice services.

## 🏗️ **Architecture Flow**

```
Frontend (React) → n8n Workflow → ElevenLabs API → AI Processing → Voice Response → Frontend
```

## 📋 **Prerequisites**

### **1. ElevenLabs Account**
- Sign up at: https://elevenlabs.io/
- Get your API key from: https://elevenlabs.io/app/settings/api-keys
- Ensure you have sufficient credits for voice processing

### **2. n8n Instance**
- Running n8n instance (self-hosted or cloud)
- Access to create and manage workflows
- Webhook endpoints configured

### **3. Frontend Setup**
- React app with voice components
- Environment variables configured
- Audio recording capabilities

## 🔧 **Setup Steps**

### **Step 1: Configure Environment Variables**

Create/update your `.env` file in the `ai-interviewer` directory:

```env
# Eleven Labs Voice Integration
REACT_APP_ELEVEN_LABS_API_KEY=your-eleven-labs-api-key-here
REACT_APP_ELEVEN_LABS_DEFAULT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
REACT_APP_ELEVEN_LABS_DEFAULT_MODEL=eleven_multilingual_v2

# Voice Configuration
REACT_APP_DEFAULT_VOICE_PRESET=professional_female
REACT_APP_AUTO_VOICE_SELECTION=true

# n8n Voice Webhook
REACT_APP_N8N_VOICE_WEBHOOK=https://your-n8n-instance.com/webhook/voice-interview
```

### **Step 2: Import n8n Workflow**

1. **Open n8n**: Access your n8n instance
2. **Import Workflow**: Use the `voice_interview_workflow.json` file
3. **Configure Credentials**: Set up ElevenLabs API credentials
4. **Test Webhook**: Verify the webhook endpoint is accessible

### **Step 3: Configure ElevenLabs Credentials in n8n**

1. **Go to Credentials**: In n8n, navigate to Credentials
2. **Create New Credential**: Select "HTTP Header Auth"
3. **Configure**:
   - **Name**: `elevenLabs`
   - **Header Name**: `xi-api-key`
   - **Header Value**: Your ElevenLabs API key
4. **Save**: Store the credential securely

### **Step 4: Update Database Schema**

Ensure your Supabase database has the required tables:

```sql
-- Interview Sessions Table
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(50) UNIQUE NOT NULL,
  candidate_id UUID REFERENCES candidates(id),
  job_description_id UUID REFERENCES job_descriptions(id),
  ai_agent_id UUID REFERENCES ai_agents(id),
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  total_questions INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Interview Messages Table (with voice support)
CREATE TABLE interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID REFERENCES interview_sessions(id),
  message_type VARCHAR(20) NOT NULL,
  content TEXT,
  sender VARCHAR(20),
  voice_mode BOOLEAN DEFAULT FALSE,
  audio_url TEXT,
  audio_duration INTEGER,
  original_audio_transcript TEXT,
  transcription_confidence DECIMAL(3,2),
  transcription_language VARCHAR(10),
  voice_metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Interview Reports Table
CREATE TABLE interview_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID REFERENCES interview_sessions(id),
  overall_score INTEGER,
  suitability_status VARCHAR(20),
  technical_score INTEGER,
  communication_score INTEGER,
  problem_solving_score INTEGER,
  cultural_fit_score INTEGER,
  strengths TEXT[],
  weaknesses TEXT[],
  recommendations TEXT,
  detailed_feedback TEXT,
  report_data JSONB,
  email_sent BOOLEAN DEFAULT FALSE,
  email_recipients TEXT[],
  generated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎤 **Voice Workflow Configuration**

### **1. Webhook Configuration**
- **Path**: `/voice-interview`
- **Method**: POST
- **Response Mode**: Response Node

### **2. Workflow Actions**
The workflow handles three main actions:

#### **Start Interview**
```json
{
  "action": "start_interview",
  "candidateId": "uuid",
  "jobDescriptionId": "uuid",
  "aiAgentId": "uuid"
}
```

#### **Voice Message**
```json
{
  "action": "voice_message",
  "sessionId": "string",
  "audioData": "base64-encoded-audio",
  "audioDuration": 5000
}
```

#### **End Interview**
```json
{
  "action": "end_interview",
  "sessionId": "string"
}
```

### **3. Voice Processing Flow**

1. **Voice Input**: Frontend sends audio data to n8n
2. **Speech-to-Text**: ElevenLabs converts audio to text
3. **AI Processing**: OpenAI generates interview response
4. **Text-to-Speech**: ElevenLabs converts response to audio
5. **Response**: Audio sent back to frontend

## 🚀 **Testing the Integration**

### **1. Test Voice Settings**
1. Start your React app: `npm start`
2. Go to Voice Settings page
3. Test Sia voice with play button
4. Verify audio playback works

### **2. Test Voice Interview**
1. Create a test candidate
2. Assign a job description
3. Start voice interview
4. Record voice input
5. Verify AI voice response

### **3. Test n8n Workflow**
1. Check webhook endpoint accessibility
2. Test with sample payload
3. Verify ElevenLabs API calls
4. Check database updates

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Voice Not Playing**
- Check ElevenLabs API key
- Verify browser audio permissions
- Check network connectivity

#### **2. n8n Workflow Errors**
- Verify webhook URL configuration
- Check ElevenLabs credentials
- Review workflow execution logs

#### **3. Audio Quality Issues**
- Adjust voice settings (stability, similarity boost)
- Check audio recording quality
- Verify ElevenLabs model selection

### **Debug Steps**

1. **Check Browser Console**: Look for JavaScript errors
2. **Check n8n Logs**: Review workflow execution
3. **Test API Keys**: Verify ElevenLabs connectivity
4. **Check Database**: Ensure data is being saved

## 📊 **Performance Optimization**

### **1. Audio Processing**
- Use appropriate audio compression
- Optimize recording quality
- Implement audio buffering

### **2. Network Optimization**
- Minimize payload sizes
- Use efficient data formats
- Implement retry logic

### **3. Voice Quality**
- Fine-tune voice settings
- Use appropriate voice models
- Monitor processing latency

## 🎯 **Voice Selection Logic**

### **Automatic Voice Selection**
- **Technical Jobs**: Adam (Technical) or Indian Technical
- **Customer Care**: Sia (Friendly Customer Care)
- **Management**: Adam (Professional) or Indian Friendly
- **Creative**: Rachel (Friendly) or Indian Friendly

### **Manual Voice Selection**
- Admin can override automatic selection
- Voice settings persist across sessions
- Real-time voice switching during interviews

## 📈 **Monitoring & Analytics**

### **1. Voice Metrics**
- Processing latency
- Audio quality scores
- Success/failure rates

### **2. Interview Analytics**
- Completion rates
- Average duration
- Voice usage patterns

### **3. Performance Monitoring**
- API response times
- Error rates
- Resource usage

## 🔐 **Security Considerations**

### **1. API Key Security**
- Store credentials securely in n8n
- Use environment variables
- Rotate keys regularly

### **2. Audio Data**
- Transmit audio securely
- Don't store audio permanently
- Implement data retention policies

### **3. Access Control**
- Secure webhook endpoints
- Implement authentication
- Monitor access logs

## 🚀 **Next Steps**

1. **Deploy to Production**: Set up production n8n instance
2. **Scale Voice Processing**: Implement load balancing
3. **Add More Voices**: Integrate additional ElevenLabs voices
4. **Enhance Analytics**: Add detailed voice metrics
5. **Optimize Performance**: Fine-tune for better latency

## 📞 **Support**

For issues or questions:
1. Check the troubleshooting section
2. Review n8n and ElevenLabs documentation
3. Test with sample data
4. Monitor logs for errors

**The voice integration is now ready for production use!** 🎤✨
