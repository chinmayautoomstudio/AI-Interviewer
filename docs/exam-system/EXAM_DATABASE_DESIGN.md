# Exam System - Database Design

## 🗄️ Database Schema Overview

The exam system requires 4 new tables integrated with the existing AI HR Saathi database. All tables use PostgreSQL with Supabase, implementing Row Level Security (RLS) for data isolation.

## 📋 Table Definitions

### 1. exam_questions Table

**Purpose**: Stores the question bank with HR management capabilities

```sql
CREATE TABLE exam_questions (
  -- Primary identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_description_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
  
  -- Question content
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq', 'text')),
  question_category VARCHAR(20) NOT NULL CHECK (question_category IN ('technical', 'aptitude')),
  difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  
  -- MCQ specific fields
  mcq_options JSONB, -- Format: [{"option": "A", "text": "Option A text"}, ...]
  correct_answer TEXT, -- For MCQ: "A", "B", "C", "D" | For text: expected keywords/pattern
  
  -- Answer explanation
  answer_explanation TEXT, -- Detailed explanation for correct answer
  
  -- Scoring and timing
  points INTEGER DEFAULT 1 CHECK (points > 0),
  time_limit_seconds INTEGER DEFAULT 60 CHECK (time_limit_seconds > 0),
  
  -- Categorization
  tags TEXT[] DEFAULT '{}', -- Array of tags for filtering
  topic_id UUID REFERENCES question_topics(id), -- Specific topic/category
  subtopic VARCHAR(100), -- More specific categorization
  
  -- HR Management fields
  created_by VARCHAR(50) DEFAULT 'ai' CHECK (created_by IN ('hr', 'ai')),
  created_by_user_id UUID REFERENCES admin_users(id),
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('draft', 'approved', 'rejected')),
  hr_notes TEXT, -- HR comments/modifications
  last_modified_by UUID REFERENCES admin_users(id),
  last_modified_at TIMESTAMP WITH TIME ZONE,
  
  -- System fields
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- **Dual Creation**: Questions can be created by HR or AI
- **Category System**: Technical vs Aptitude classification
- **HR Control**: Full editing, approval, and modification capabilities
- **MCQ Support**: JSONB storage for multiple choice options
- **Explanation Field**: Detailed answer explanations for candidates

### 2. exam_sessions Table

**Purpose**: Manages individual exam instances with adaptive testing support

```sql
CREATE TABLE exam_sessions (
  -- Primary identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_description_id UUID REFERENCES job_descriptions(id),
  exam_token TEXT UNIQUE NOT NULL, -- Secure access token
  
  -- Session status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),
  
  -- Question management
  initial_question_count INTEGER DEFAULT 15 CHECK (initial_question_count > 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  adaptive_questions_added INTEGER DEFAULT 0 CHECK (adaptive_questions_added >= 0),
  max_adaptive_questions INTEGER DEFAULT 20 CHECK (max_adaptive_questions >= 0),
  questions_list JSONB NOT NULL, -- Array of question IDs: [{"id": "uuid", "category": "technical", "difficulty": "medium"}, ...]
  
  -- Timing and duration
  duration_minutes INTEGER DEFAULT 30 CHECK (duration_minutes > 0),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Session tracking
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,
  performance_metadata JSONB DEFAULT '{}', -- Track accuracy, speed for adaptive logic
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- **Adaptive Testing**: Tracks questions added dynamically
- **Question List**: JSONB storage of assigned questions with metadata
- **Performance Tracking**: Stores accuracy and speed metrics
- **Security**: IP and user agent tracking
- **Token-Based Access**: Unique, non-guessable exam tokens

### 3. exam_responses Table

**Purpose**: Stores candidate answers with timing and scoring information

```sql
CREATE TABLE exam_responses (
  -- Primary identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id),
  
  -- Answer data
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0 CHECK (points_earned >= 0),
  
  -- Timing information
  time_taken_seconds INTEGER CHECK (time_taken_seconds > 0),
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate answers
  CONSTRAINT unique_session_question UNIQUE (exam_session_id, question_id)
);
```

**Key Features**:
- **Duplicate Prevention**: Unique constraint on session + question
- **Timing Tracking**: Records time taken per question
- **Scoring**: Stores points earned and correctness
- **Cascade Delete**: Automatically removes responses when session deleted

### 4. exam_results Table

**Purpose**: Stores final exam results with detailed analytics

```sql
CREATE TABLE exam_results (
  -- Primary identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exam_session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id),
  
  -- Overall scores
  total_score INTEGER NOT NULL CHECK (total_score >= 0),
  max_score INTEGER NOT NULL CHECK (max_score > 0),
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
  wrong_answers INTEGER NOT NULL CHECK (wrong_answers >= 0),
  skipped_questions INTEGER DEFAULT 0 CHECK (skipped_questions >= 0),
  
  -- Category-wise scores
  technical_score INTEGER CHECK (technical_score >= 0),
  technical_max_score INTEGER CHECK (technical_max_score > 0),
  aptitude_score INTEGER CHECK (aptitude_score >= 0),
  aptitude_max_score INTEGER CHECK (aptitude_max_score > 0),
  
  -- Performance metrics
  time_taken_minutes INTEGER CHECK (time_taken_minutes > 0),
  avg_time_per_question DECIMAL(5,2), -- Average seconds per question
  difficulty_progression JSONB, -- Track difficulty changes during exam
  
  -- Evaluation status
  evaluation_status VARCHAR(20) DEFAULT 'pending' CHECK (evaluation_status IN ('pending', 'passed', 'failed')),
  passing_threshold DECIMAL(5,2) DEFAULT 60.00, -- Minimum percentage to pass
  
  -- AI evaluation for text answers
  ai_evaluation JSONB, -- Detailed AI analysis for text answers
  text_answers_evaluated INTEGER DEFAULT 0, -- Count of text answers processed
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- **Comprehensive Scoring**: Overall and category-wise scores
- **Performance Analytics**: Time tracking and difficulty progression
- **AI Integration**: Stores AI evaluation results for text answers
- **Pass/Fail Logic**: Configurable passing thresholds
- **Detailed Metrics**: Average time per question, difficulty tracking

## 🔍 Indexes for Performance

```sql
-- exam_questions indexes
CREATE INDEX idx_exam_questions_job_desc ON exam_questions(job_description_id);
CREATE INDEX idx_exam_questions_category ON exam_questions(question_category);
CREATE INDEX idx_exam_questions_difficulty ON exam_questions(difficulty_level);
CREATE INDEX idx_exam_questions_status ON exam_questions(status);
CREATE INDEX idx_exam_questions_active ON exam_questions(is_active) WHERE is_active = true;
CREATE INDEX idx_exam_questions_created_by ON exam_questions(created_by);

-- exam_sessions indexes
CREATE INDEX idx_exam_sessions_candidate ON exam_sessions(candidate_id);
CREATE INDEX idx_exam_sessions_token ON exam_sessions(exam_token);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX idx_exam_sessions_expires ON exam_sessions(expires_at);
CREATE INDEX idx_exam_sessions_job_desc ON exam_sessions(job_description_id);

-- exam_responses indexes
CREATE INDEX idx_exam_responses_session ON exam_responses(exam_session_id);
CREATE INDEX idx_exam_responses_question ON exam_responses(question_id);
CREATE INDEX idx_exam_responses_answered_at ON exam_responses(answered_at);

-- exam_results indexes
CREATE INDEX idx_exam_results_session ON exam_results(exam_session_id);
CREATE INDEX idx_exam_results_candidate ON exam_results(candidate_id);
CREATE INDEX idx_exam_results_percentage ON exam_results(percentage);
CREATE INDEX idx_exam_results_status ON exam_results(evaluation_status);
```

### 5. question_topics Table

**Purpose**: Manages hierarchical question topics and categories

```sql
CREATE TABLE question_topics (
  -- Primary identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Topic information
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_topic_id UUID REFERENCES question_topics(id) ON DELETE CASCADE,
  
  -- Categorization
  category VARCHAR(20) NOT NULL CHECK (category IN ('technical', 'aptitude')),
  level INTEGER DEFAULT 1, -- Hierarchy level (1 = main topic, 2 = subtopic, etc.)
  
  -- Management
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_question_topics_parent ON question_topics(parent_topic_id);
CREATE INDEX idx_question_topics_category ON question_topics(category);
CREATE INDEX idx_question_topics_active ON question_topics(is_active);
```

### 6. job_question_categories Table

**Purpose**: Defines question distribution for specific job descriptions

```sql
CREATE TABLE job_question_categories (
  -- Primary identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Relationships
  job_description_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES question_topics(id) ON DELETE CASCADE,
  
  -- Distribution settings
  weight_percentage INTEGER DEFAULT 0 CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
  min_questions INTEGER DEFAULT 0 CHECK (min_questions >= 0),
  max_questions INTEGER DEFAULT 0 CHECK (max_questions >= 0),
  
  -- Difficulty distribution
  easy_percentage INTEGER DEFAULT 33 CHECK (easy_percentage >= 0 AND easy_percentage <= 100),
  medium_percentage INTEGER DEFAULT 34 CHECK (medium_percentage >= 0 AND medium_percentage <= 100),
  hard_percentage INTEGER DEFAULT 33 CHECK (hard_percentage >= 0 AND hard_percentage <= 100),
  
  -- Management
  is_required BOOLEAN DEFAULT false, -- Whether this topic is mandatory
  priority INTEGER DEFAULT 0, -- Higher priority topics are selected first
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(job_description_id, topic_id),
  CHECK (easy_percentage + medium_percentage + hard_percentage = 100)
);

-- Indexes for performance
CREATE INDEX idx_job_question_categories_job ON job_question_categories(job_description_id);
CREATE INDEX idx_job_question_categories_topic ON job_question_categories(topic_id);
CREATE INDEX idx_job_question_categories_priority ON job_question_categories(priority DESC);
```

## 🔒 Row Level Security (RLS) Policies

### Admin Access Policies

```sql
-- Enable RLS on all tables
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_question_categories ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all exam data
CREATE POLICY "Admin users can manage exam questions" ON exam_questions FOR ALL USING (true);
CREATE POLICY "Admin users can manage exam sessions" ON exam_sessions FOR ALL USING (true);
CREATE POLICY "Admin users can manage exam responses" ON exam_responses FOR ALL USING (true);
CREATE POLICY "Admin users can manage exam results" ON exam_results FOR ALL USING (true);
CREATE POLICY "Admin users can manage question topics" ON question_topics FOR ALL USING (true);
CREATE POLICY "Admin users can manage job question categories" ON job_question_categories FOR ALL USING (true);
```

### Candidate Access Policies

```sql
-- Candidates can only access their own exam sessions
CREATE POLICY "Candidates can view their own exam sessions" ON exam_sessions FOR SELECT USING (
  candidate_id IN (
    SELECT id FROM candidates 
    WHERE id = auth.uid()::text OR 
    EXISTS (
      SELECT 1 FROM candidate_sessions 
      WHERE candidate_sessions.candidate_id = exam_sessions.candidate_id 
      AND candidate_sessions.session_token = current_setting('request.jwt.claims', true)::json->>'sub'
      AND candidate_sessions.expires_at > NOW()
    )
  )
);

-- Candidates can only view their own responses
CREATE POLICY "Candidates can view their own responses" ON exam_responses FOR SELECT USING (
  exam_session_id IN (
    SELECT id FROM exam_sessions 
    WHERE candidate_id IN (
      SELECT id FROM candidates 
      WHERE id = auth.uid()::text OR 
      EXISTS (
        SELECT 1 FROM candidate_sessions 
        WHERE candidate_sessions.candidate_id = exam_sessions.candidate_id 
        AND candidate_sessions.session_token = current_setting('request.jwt.claims', true)::json->>'sub'
        AND candidate_sessions.expires_at > NOW()
      )
    )
  )
);

-- Candidates can only view their own results
CREATE POLICY "Candidates can view their own results" ON exam_results FOR SELECT USING (
  candidate_id IN (
    SELECT id FROM candidates 
    WHERE id = auth.uid()::text OR 
    EXISTS (
      SELECT 1 FROM candidate_sessions 
      WHERE candidate_sessions.candidate_id = exam_results.candidate_id 
      AND candidate_sessions.session_token = current_setting('request.jwt.claims', true)::json->>'sub'
      AND candidate_sessions.expires_at > NOW()
    )
  )
);
```

## 🔄 Triggers and Functions

### Updated_at Trigger

```sql
-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all exam tables
CREATE TRIGGER update_exam_questions_updated_at 
  BEFORE UPDATE ON exam_questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_sessions_updated_at 
  BEFORE UPDATE ON exam_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_results_updated_at 
  BEFORE UPDATE ON exam_results 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Question Validation Function

```sql
-- Validate MCQ questions have proper options
CREATE OR REPLACE FUNCTION validate_mcq_question()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.question_type = 'mcq' THEN
    -- Check if mcq_options is valid JSON array
    IF NOT (NEW.mcq_options IS NOT NULL AND jsonb_typeof(NEW.mcq_options) = 'array') THEN
      RAISE EXCEPTION 'MCQ questions must have valid options array';
    END IF;
    
    -- Check if correct_answer is valid
    IF NEW.correct_answer IS NULL OR NEW.correct_answer = '' THEN
      RAISE EXCEPTION 'MCQ questions must have a correct answer';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_mcq_question_trigger
  BEFORE INSERT OR UPDATE ON exam_questions
  FOR EACH ROW EXECUTE FUNCTION validate_mcq_question();
```

## 📊 Sample Data Structure

### Question Pool Example

```json
{
  "technical_questions": [
    {
      "id": "uuid-1",
      "question_text": "What is the time complexity of binary search?",
      "question_type": "mcq",
      "question_category": "technical",
      "difficulty_level": "medium",
      "mcq_options": [
        {"option": "A", "text": "O(n)"},
        {"option": "B", "text": "O(log n)"},
        {"option": "C", "text": "O(n²)"},
        {"option": "D", "text": "O(1)"}
      ],
      "correct_answer": "B",
      "answer_explanation": "Binary search eliminates half of the search space in each iteration, resulting in O(log n) time complexity.",
      "points": 2,
      "tags": ["algorithms", "complexity", "search"]
    }
  ],
  "aptitude_questions": [
    {
      "id": "uuid-2",
      "question_text": "If a train travels 120 km in 2 hours, what is its average speed?",
      "question_type": "mcq",
      "question_category": "aptitude",
      "difficulty_level": "easy",
      "mcq_options": [
        {"option": "A", "text": "60 km/h"},
        {"option": "B", "text": "40 km/h"},
        {"option": "C", "text": "80 km/h"},
        {"option": "D", "text": "100 km/h"}
      ],
      "correct_answer": "A",
      "answer_explanation": "Average speed = Total distance / Total time = 120 km / 2 hours = 60 km/h",
      "points": 1,
      "tags": ["mathematics", "speed", "calculation"]
    }
  ]
}
```

### Session Performance Metadata

```json
{
  "performance_metadata": {
    "current_accuracy": 0.85,
    "avg_time_per_question": 45.2,
    "questions_answered": 12,
    "difficulty_progression": ["easy", "easy", "medium", "medium"],
    "last_adaptation": "2025-01-21T10:15:00Z",
    "adaptive_questions_added": 3
  }
}
```

## 🚀 Migration Script

Create `sql/create_exam_tables.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create exam_questions table
CREATE TABLE exam_questions (
  -- [Full table definition as shown above]
);

-- Create exam_sessions table
CREATE TABLE exam_sessions (
  -- [Full table definition as shown above]
);

-- Create exam_responses table
CREATE TABLE exam_responses (
  -- [Full table definition as shown above]
);

-- Create exam_results table
CREATE TABLE exam_results (
  -- [Full table definition as shown above]
);

-- Create all indexes
-- [All index definitions as shown above]

-- Enable RLS and create policies
-- [All RLS policies as shown above]

-- Create triggers
-- [All trigger definitions as shown above]

-- Insert sample data (optional)
-- [Sample questions for testing]
```

---

**Next Steps**: Review the backend services implementation in `EXAM_BACKEND_SERVICES.md`
