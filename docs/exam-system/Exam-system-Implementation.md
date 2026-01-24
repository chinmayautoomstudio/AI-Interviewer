# Online Examination System Implementation Plan

## Overview

Add a complete examination feature allowing 50-60 candidates to take tests simultaneously with AI-generated questions (MCQs & text answers) stored in the database, accessed via email links with authentication, and reports integrated with existing interview evaluations.

## Database Schema Changes

### 1. Create New Tables (`sql/create_exam_tables.sql`)

```sql
-- Question bank table
CREATE TABLE exam_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_description_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL, -- 'mcq' or 'text'
  difficulty_level VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  mcq_options JSONB, -- [{option: "A", text: "..."}, ...]
  correct_answer TEXT, -- For MCQ: "A", For text: expected keywords/pattern
  points INTEGER DEFAULT 1,
  time_limit_seconds INTEGER DEFAULT 60,
  category VARCHAR(100), -- 'technical', 'aptitude', 'domain'
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam sessions table
CREATE TABLE exam_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_description_id UUID REFERENCES job_descriptions(id),
  exam_token TEXT UNIQUE NOT NULL, -- Secure access token
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'expired'
  total_questions INTEGER NOT NULL,
  duration_minutes INTEGER DEFAULT 30, -- Fixed 30-minute duration
  initial_question_count INTEGER DEFAULT 15, -- Start with 15 questions
  adaptive_questions_added INTEGER DEFAULT 0, -- Track dynamically added questions
  max_adaptive_questions INTEGER DEFAULT 20, -- Max 20 additional questions allowed
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  performance_metadata JSONB, -- Track accuracy, speed for adaptive logic
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam responses table
CREATE TABLE exam_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id),
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  time_taken_seconds INTEGER,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam results table
CREATE TABLE exam_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id),
  total_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  skipped_questions INTEGER DEFAULT 0,
  technical_score INTEGER,
  aptitude_score INTEGER,
  time_taken_minutes INTEGER,
  evaluation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'passed', 'failed'
  ai_evaluation JSONB, -- Detailed AI analysis for text answers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exam_questions_job ON exam_questions(job_description_id);
CREATE INDEX idx_exam_sessions_candidate ON exam_sessions(candidate_id);
CREATE INDEX idx_exam_sessions_token ON exam_sessions(exam_token);
CREATE INDEX idx_exam_responses_session ON exam_responses(exam_session_id);
CREATE INDEX idx_exam_results_session ON exam_results(exam_session_id);
```

### 2. Add RLS Policies

Enable Row Level Security for all exam tables with appropriate access controls.

## Backend Services

### 3. Create Exam Service (`src/services/examService.ts`)

Core service handling:

- Generate exam sessions with secure tokens
- Random question selection from pool (initial 25 questions)
- **Adaptive question generation**: Add questions if candidate answers quickly
- **Dynamic difficulty adjustment**: Increase difficulty based on performance
- Answer submission and validation
- Automatic scoring (MCQs) and AI evaluation (text answers)
- Session timeout management
- Concurrent candidate support
- Real-time performance tracking

Key methods:

- `createExamSession(candidateId, jobDescriptionId, config)`
- `getExamByToken(token)` - Validate and retrieve exam
- `submitAnswer(sessionId, questionId, answer)` - Triggers adaptive logic
- `evaluatePerformanceAndAdapt(sessionId)` - Check if more questions needed
- `addAdaptiveQuestions(sessionId, difficulty, count)` - Inject new questions
- `completeExam(sessionId)` - Calculate final scores
- `getExamResults(sessionId)`

**Adaptive Testing Algorithm:**

```typescript
// After each answer submission:
1. Calculate current accuracy rate (correct/total answered)
2. Calculate time efficiency (avg time per question vs expected)
3. If accuracy >= 80% AND avg_time < 50% of allocated time:
   - Add 5 more questions from next difficulty level
   - Continue until exam duration exhausted
4. Update max_possible_score dynamically
5. Track adaptive_questions_added in session metadata
```

### 4. AI Question Generation Service (`src/services/examQuestionGenerator.ts`)

Uses n8n workflow to generate questions:

- Parse job description and extract technical requirements
- Generate diverse question types (MCQs + text)
- Assign difficulty levels and categories
- Store questions in database
- Batch generation (20-30 questions per job)

### 5. Exam Email Service (extend `src/services/emailService.ts`)

Add methods:

- `sendExamInvitation()` - Send secure exam link with instructions
- `sendExamReminder()` - Reminder before expiry
- `sendExamCompletionNotification()` - Confirmation after submission

Email template includes:

- Exam link with token: `${baseUrl}/exam/${examToken}`
- Login credentials reminder
- Duration, question count, instructions
- Expiry date/time

## Frontend Components

### 6. Admin Exam Management Page (`src/pages/ExamManagementPage.tsx`)

Features:

- View/generate questions for each job description
- Create exam invitations for candidates
- Configure exam settings (duration, question count, difficulty mix)
- Monitor active exam sessions
- View exam statistics dashboard

### 7. Candidate Exam Page (`src/pages/CandidateExamPage.tsx`)

Exam interface:

- Token validation and candidate authentication
- Instructions and exam rules display
- Timer countdown (global + per question)
- Question navigation (prev/next, jump to question)
- MCQ: Radio buttons with option selection
- Text: Multi-line text area with character limit
- Auto-save answers (every 30 seconds)
- Submit confirmation modal
- Auto-submit on timeout

### 8. Exam Link Landing Page (`src/pages/ExamLinkPage.tsx`)

Entry point for exam links:

- Extract token from URL (`/exam/:token`)
- Validate token and check expiry
- Show exam details preview
- Redirect to candidate login with token in state
- After login, load exam interface

### 9. Unified Reports Page (update `src/pages/ReportsPage.tsx`)

Enhance existing reports to show:

- Interview results (existing)
- Exam results (new)
- Combined evaluation score
- Side-by-side comparison
- Overall candidate suitability rating
- Filter by report type (interview/exam/both)

## TypeScript Types

### 10. Update Types (`src/types/index.ts`)

Add interfaces:

```typescript
export interface ExamQuestion {
  id: string;
  jobDescriptionId: string;
  questionText: string;
  questionType: 'mcq' | 'text';
  difficultyLevel: 'easy' | 'medium' | 'hard';
  mcqOptions?: Array<{option: string; text: string}>;
  correctAnswer?: string;
  points: number;
  timeLimitSeconds: number;
  category: string;
  tags: string[];
}

export interface ExamSession {
  id: string;
  candidateId: string;
  jobDescriptionId: string;
  examToken: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  totalQuestions: number;
  durationMinutes: number;
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
}

export interface ExamResult {
  id: string;
  examSessionId: string;
  candidateId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeTakenMinutes: number;
  evaluationStatus: 'pending' | 'passed' | 'failed';
  aiEvaluation?: any;
}
```

## n8n Workflow Integration

### 11. Create Question Generation Workflow (`n8n/exam_question_generator_workflow.json`)

Workflow steps:

1. Webhook trigger (receives job description)
2. OpenAI/Claude node - Generate 25-30 questions
3. Parse and structure questions
4. Validate question format
5. Insert into `exam_questions` table
6. Return success response

Prompt engineering:

- Generate mix of MCQs (70%) and text (30%)
- Cover technical skills from JD
- Include aptitude/problem-solving questions
- Diverse difficulty levels

### 12. Create Text Answer Evaluation Workflow (`n8n/exam_text_evaluation_workflow.json`)

Workflow for AI evaluation of text answers:

1. Receive question + candidate answer
2. AI evaluation (relevance, accuracy, completeness)
3. Assign points based on quality
4. Return evaluation with score

## UI Components

### 13. Exam Components (`src/components/exam/`)

Create reusable components:

- `ExamTimer.tsx` - Countdown timer with warnings
- `MCQQuestion.tsx` - Multiple choice question display
- `TextQuestion.tsx` - Text answer input with char count
- `QuestionNavigator.tsx` - Question grid for jumping
- `ExamInstructions.tsx` - Rules and guidelines modal
- `ExamProgressBar.tsx` - Progress indicator

## Integration & Features

### 14. Candidate Dashboard Integration

Update `src/pages/CandidateDashboardPage.tsx`:

- Show pending exams section
- Display exam invitations
- Quick access to active exams
- View past exam results

### 15. Admin Dashboard Enhancements

Update `src/pages/DashboardPage.tsx`:

- Add exam statistics cards
- Active exam sessions count
- Recent exam completions
- Question bank status per job

### 16. Notification System

Extend notification service:

- Real-time exam status updates
- Exam invitation notifications
- Completion alerts for admins

## Concurrent User Management & Scalability

### 17. Multi-Candidate Simultaneous Testing Strategy

**Session Isolation Architecture:**

- Each candidate receives a unique `exam_token` (UUID-based) ensuring zero collision
- Independent exam sessions with separate timers (started on their begin time, not creation time)
- Isolated question sets randomly selected from shared pool per candidate
- No shared state between candidates - fully parallelized exam taking

**Database Concurrency Handling:**

```sql
-- Optimistic concurrency - no locks needed
-- Each answer submission is atomic and session-specific
INSERT INTO exam_responses (exam_session_id, question_id, answer_text)
VALUES ($1, $2, $3)
ON CONFLICT (exam_session_id, question_id) 
DO UPDATE SET answer_text = EXCLUDED.answer_text, answered_at = NOW();

-- Composite unique constraint prevents duplicate answers
ALTER TABLE exam_responses ADD CONSTRAINT unique_session_question 
UNIQUE (exam_session_id, question_id);
```

**Question Pool Strategy:**

- Questions generated ONCE per job description (shared pool of 80-100 questions)
- Each exam session randomly selects 25 questions from pool
- 50 candidates = 50 different random combinations from same pool
- Read-only access during exams (no write contention)
- Example: Pool of 100 questions → Candidate 1 gets [Q3, Q7, Q12...], Candidate 2 gets [Q1, Q9, Q14...]

**Auto-Save Concurrency:**

- Client-side debounced saves (every 30 seconds per candidate)
- Upsert pattern prevents duplicate submissions
- 50 candidates × 2 saves/min = 100 writes/min = 1.67 writes/second (negligible load)
- PostgreSQL connection pooling via Supabase handles 1000+ concurrent connections

**Race Condition Prevention:**

```typescript
// Prevent double submission with atomic status update
const { data } = await supabase
  .from('exam_sessions')
  .update({ status: 'completed', completed_at: NOW() })
  .eq('id', sessionId)
  .eq('status', 'in_progress') // Only update if still in progress
  .single();

if (!data) {
  throw new Error('Exam already submitted');
}
```

**Load Distribution Analysis:**

```
50 concurrent candidates taking 60-minute exams:
- Total responses: 50 × 25 = 1,250 answers
- Auto-saves: 50 candidates × 120 saves = 6,000 operations over 60 min
- Average load: 1.67 database writes/second
- Supabase capacity: 10,000+ requests/second
- Headroom: 99.98% capacity remaining
```

**Scalability Tiers:**

- **Current design:** 50-60 concurrent candidates (comfortable)
- **Tier 1 (100 candidates):** No changes needed, same architecture
- **Tier 2 (500 candidates):** Add Redis caching for question pools
- **Tier 3 (1000+ candidates):** Implement read replicas, async AI evaluation queue

**Row Level Security (RLS) Isolation:**

```sql
-- Candidates only see their own exam data
CREATE POLICY "Candidates access own exams only"
ON exam_sessions FOR ALL
USING (candidate_id = auth.uid());

CREATE POLICY "Candidates access own responses only"
ON exam_responses FOR ALL
USING (
  exam_session_id IN (
    SELECT id FROM exam_sessions WHERE candidate_id = auth.uid()
  )
);
```

**Performance Monitoring:**

- Track concurrent active sessions in real-time
- Monitor average response submission latency
- Alert if auto-save queue exceeds 5 seconds
- Database query performance tracking via indexes

## Security & Performance

### 18. Security Features

- Unique, non-guessable exam tokens (UUID + hash)
- Token expiry validation (server-side timestamp check)
- IP address tracking (optional browser fingerprinting)
- Prevent tab switching detection (visibility API)
- Session hijacking prevention (token tied to candidate ID)
- Rate limiting on answer submissions (max 1 request/second per session)
- CSRF protection on all exam endpoints
- Secure token transmission (HTTPS only)

### 19. Performance Optimizations

- Database indexes for fast concurrent query retrieval
- Question pre-loading (all 25 questions loaded at session start)
- Optimistic UI updates for answer saves (immediate feedback)
- Debounced auto-save to reduce DB writes (30-second interval)
- Connection pooling for concurrent users (Supabase PgBouncer)
- Lazy loading for exam history (pagination for past results)
- Compressed question data transfer (gzip)
- Client-side answer caching (localStorage backup during network issues)

## Environment Configuration

### 19. Update `.env` variables

Add new environment variables:

```env
REACT_APP_N8N_EXAM_GENERATION_WEBHOOK=your_exam_webhook
REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK=your_evaluation_webhook
REACT_APP_EXAM_TOKEN_EXPIRY_HOURS=48
REACT_APP_EXAM_DEFAULT_DURATION=60
REACT_APP_EXAM_QUESTIONS_PER_TEST=25
```

## Documentation

### 20. Create Documentation Files

- `EXAM_SYSTEM_GUIDE.md` - Admin guide for exam management
- `EXAM_CANDIDATE_GUIDE.md` - Instructions for candidates
- Update `README.md` with exam feature overview