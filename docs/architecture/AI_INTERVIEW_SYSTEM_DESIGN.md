# AI Interview System - Technical Design Document

## 1. System Overview

The AI Interview System is a chat-based interview platform that uses n8n workflows to conduct intelligent, personalized interviews with candidates. The system analyzes job descriptions and candidate profiles to generate relevant questions and provide comprehensive evaluation reports.

## 2. Workflow Architecture

### 2.1 Interview Flow
```
Candidate Login → Start Interview → Chat Interface → n8n Processing → Report Generation → Email Notification
```

### 2.2 n8n Workflow Integration
- **Interview Workflow**: Handles chat-based interview with AI
- **Report Generation Workflow**: Generates and sends interview reports
- **Webhook Communication**: Real-time communication between platform and n8n

## 3. Database Schema Updates

### 3.1 New Tables Required

#### 3.1.1 Interview Sessions
```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(50) UNIQUE NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_description_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
  ai_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.1.2 Interview Messages
```sql
CREATE TABLE interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(50) REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
  message_type VARCHAR(20) CHECK (message_type IN ('question', 'answer', 'system', 'error')),
  content TEXT NOT NULL,
  sender VARCHAR(20) CHECK (sender IN ('ai', 'candidate', 'system')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);
```

#### 3.1.3 Interview Reports
```sql
CREATE TABLE interview_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(50) REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2),
  suitability_status VARCHAR(20) CHECK (suitability_status IN ('suitable', 'not_suitable', 'conditional')),
  technical_score DECIMAL(5,2),
  communication_score DECIMAL(5,2),
  problem_solving_score DECIMAL(5,2),
  cultural_fit_score DECIMAL(5,2),
  strengths TEXT[],
  weaknesses TEXT[],
  recommendations TEXT,
  detailed_feedback TEXT,
  report_data JSONB,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. Frontend Components

### 4.1 Interview Chat Interface
- Real-time chat interface for candidate-AI interaction
- Message history display
- Typing indicators
- Session status tracking
- Interview progress indicators

### 4.2 Session Management
- Unique session ID generation
- Session state management
- Interview status tracking
- Error handling and recovery

### 4.3 Report Viewing
- Interview report display
- Score visualization
- Feedback presentation
- Download/export functionality

## 5. n8n Workflow Integration

### 5.1 Interview Workflow Webhook
```
POST /webhook/start-interview
{
  "session_id": "string",
  "candidate_data": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "skills": "array",
    "experience": "string",
    "education": "string"
  },
  "job_data": {
    "id": "uuid",
    "title": "string",
    "requirements": "array",
    "skills": "array",
    "description": "string"
  },
  "ai_agent": {
    "id": "uuid",
    "name": "string",
    "webhook_url": "string"
  }
}
```

### 5.2 Chat Message Webhook
```
POST /webhook/chat-message
{
  "session_id": "string",
  "message": "string",
  "sender": "candidate",
  "timestamp": "ISO8601"
}
```

### 5.3 Interview Completion Webhook
```
POST /webhook/interview-complete
{
  "session_id": "string",
  "report_data": {
    "overall_score": "number",
    "suitability_status": "string",
    "scores": {
      "technical": "number",
      "communication": "number",
      "problem_solving": "number",
      "cultural_fit": "number"
    },
    "feedback": "string",
    "recommendations": "string"
  }
}
```

## 6. Implementation Plan

### Phase 1: Database Schema & Backend
1. Create new database tables
2. Update TypeScript interfaces
3. Create API services for interview management
4. Implement session management

### Phase 2: Chat Interface
1. Create chat component
2. Implement real-time messaging
3. Add session state management
4. Create interview flow UI

### Phase 3: n8n Integration
1. Create webhook endpoints
2. Implement n8n communication
3. Add error handling
4. Test workflow integration

### Phase 4: Report System
1. Create report generation workflow
2. Implement email notifications
3. Create report viewing interface
4. Add export functionality

## 7. Security Considerations

- Session ID encryption and validation
- Webhook signature verification
- Rate limiting for chat messages
- Data privacy for interview content
- Secure report storage and transmission

## 8. Performance Requirements

- Real-time chat with <500ms latency
- Support for 50+ concurrent interviews
- Efficient message storage and retrieval
- Fast report generation and delivery
- Scalable webhook processing

## 9. Monitoring & Analytics

- Interview completion rates
- Average interview duration
- AI response times
- Error rates and failure points
- Candidate satisfaction metrics
