# Exam System - Backend Services Implementation

## 🔧 Service Architecture Overview

The exam system backend consists of 4 core services that handle different aspects of the examination process. All services are built with TypeScript and integrate with Supabase for data persistence.

## 📁 Service Structure

```
src/services/
├── topicManagementService.ts   # Question topics and categories management
├── examService.ts              # Core exam logic and session management
├── examQuestionGenerator.ts    # AI question generation and HR management
├── examEmailService.ts         # Email invitations and notifications
└── examResultsService.ts       # Results calculation and display
```

## 🎯 1. TopicManagementService (Topic & Category Management)

**File**: `src/services/topicManagementService.ts`

```typescript
// src/services/topicManagementService.ts
import { supabase } from './supabase';

export interface QuestionTopic {
  id: string;
  name: string;
  description?: string;
  parent_topic_id?: string;
  category: 'technical' | 'aptitude';
  level: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: QuestionTopic[];
}

export interface JobQuestionCategory {
  id: string;
  job_description_id: string;
  topic_id: string;
  weight_percentage: number;
  min_questions: number;
  max_questions: number;
  easy_percentage: number;
  medium_percentage: number;
  hard_percentage: number;
  is_required: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  topic?: QuestionTopic;
}

export class TopicManagementService {
  // Topic Management
  async getAllTopics(): Promise<QuestionTopic[]> {
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return this.buildTopicHierarchy(data || []);
  }

  async getTopicsByCategory(category: 'technical' | 'aptitude'): Promise<QuestionTopic[]> {
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return this.buildTopicHierarchy(data || []);
  }

  async createTopic(topic: Omit<QuestionTopic, 'id' | 'created_at' | 'updated_at'>): Promise<QuestionTopic> {
    const { data, error } = await supabase
      .from('question_topics')
      .insert([topic])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTopic(id: string, updates: Partial<QuestionTopic>): Promise<QuestionTopic> {
    const { data, error } = await supabase
      .from('question_topics')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTopic(id: string): Promise<void> {
    const { error } = await supabase
      .from('question_topics')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // Job-Specific Category Management
  async getJobQuestionCategories(jobDescriptionId: string): Promise<JobQuestionCategory[]> {
    const { data, error } = await supabase
      .from('job_question_categories')
      .select(`
        *,
        topic:question_topics(*)
      `)
      .eq('job_description_id', jobDescriptionId)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async setJobQuestionCategories(
    jobDescriptionId: string, 
    categories: Omit<JobQuestionCategory, 'id' | 'job_description_id' | 'created_at' | 'updated_at'>[]
  ): Promise<JobQuestionCategory[]> {
    // Delete existing categories
    await supabase
      .from('job_question_categories')
      .delete()
      .eq('job_description_id', jobDescriptionId);

    // Insert new categories
    const categoriesWithJobId = categories.map(cat => ({
      ...cat,
      job_description_id: jobDescriptionId
    }));

    const { data, error } = await supabase
      .from('job_question_categories')
      .insert(categoriesWithJobId)
      .select(`
        *,
        topic:question_topics(*)
      `);

    if (error) throw error;
    return data || [];
  }

  async getQuestionDistribution(jobDescriptionId: string, totalQuestions: number): Promise<{
    topic_id: string;
    topic_name: string;
    question_count: number;
    difficulty_breakdown: { easy: number; medium: number; hard: number };
  }[]> {
    const categories = await this.getJobQuestionCategories(jobDescriptionId);
    
    return categories.map(cat => {
      const questionCount = Math.round((cat.weight_percentage / 100) * totalQuestions);
      const easyCount = Math.round((cat.easy_percentage / 100) * questionCount);
      const mediumCount = Math.round((cat.medium_percentage / 100) * questionCount);
      const hardCount = questionCount - easyCount - mediumCount;

      return {
        topic_id: cat.topic_id,
        topic_name: cat.topic?.name || 'Unknown Topic',
        question_count: questionCount,
        difficulty_breakdown: {
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount
        }
      };
    });
  }

  // Helper Methods
  private buildTopicHierarchy(topics: QuestionTopic[]): QuestionTopic[] {
    const topicMap = new Map<string, QuestionTopic>();
    const rootTopics: QuestionTopic[] = [];

    // Create map of all topics
    topics.forEach(topic => {
      topicMap.set(topic.id, { ...topic, children: [] });
    });

    // Build hierarchy
    topics.forEach(topic => {
      const topicWithChildren = topicMap.get(topic.id)!;
      
      if (topic.parent_topic_id) {
        const parent = topicMap.get(topic.parent_topic_id);
        if (parent) {
          parent.children!.push(topicWithChildren);
        }
      } else {
        rootTopics.push(topicWithChildren);
      }
    });

    return rootTopics;
  }

  // Predefined Topic Templates
  async createDefaultTopics(): Promise<void> {
    const defaultTopics = [
      // Technical Topics
      { name: 'Programming Languages', category: 'technical' as const, level: 1, sort_order: 1 },
      { name: 'Data Structures & Algorithms', category: 'technical' as const, level: 1, sort_order: 2 },
      { name: 'Database Management', category: 'technical' as const, level: 1, sort_order: 3 },
      { name: 'System Design', category: 'technical' as const, level: 1, sort_order: 4 },
      { name: 'Web Development', category: 'technical' as const, level: 1, sort_order: 5 },
      { name: 'Mobile Development', category: 'technical' as const, level: 1, sort_order: 6 },
      { name: 'DevOps & Cloud', category: 'technical' as const, level: 1, sort_order: 7 },
      { name: 'Security', category: 'technical' as const, level: 1, sort_order: 8 },
      
      // Aptitude Topics
      { name: 'Logical Reasoning', category: 'aptitude' as const, level: 1, sort_order: 1 },
      { name: 'Quantitative Aptitude', category: 'aptitude' as const, level: 1, sort_order: 2 },
      { name: 'Verbal Ability', category: 'aptitude' as const, level: 1, sort_order: 3 },
      { name: 'Analytical Skills', category: 'aptitude' as const, level: 1, sort_order: 4 },
      { name: 'Problem Solving', category: 'aptitude' as const, level: 1, sort_order: 5 },
      { name: 'Attention to Detail', category: 'aptitude' as const, level: 1, sort_order: 6 }
    ];

    for (const topic of defaultTopics) {
      await this.createTopic(topic);
    }
  }
}
```

## 🎯 2. ExamService (Core Logic)

**File**: `src/services/examService.ts`

### Core Responsibilities
- Session creation and management
- Adaptive question selection and addition
- Answer submission and validation
- Real-time performance tracking
- Concurrent user support

### Key Methods

```typescript
export class ExamService {
  // Session Management
  static async createExamSession(
    candidateId: string, 
    jobDescriptionId: string, 
    config?: ExamConfig
  ): Promise<{ data: ExamSession | null; error?: string }>

  static async getExamByToken(token: string): Promise<{ data: ExamSession | null; error?: string }>

  static async startExam(sessionId: string): Promise<{ success: boolean; error?: string }>

  // Question Management
  static async selectInitialQuestions(
    jobDescriptionId: string, 
    count: number = 15
  ): Promise<{ questions: ExamQuestion[]; error?: string }>

  static async addAdaptiveQuestions(
    sessionId: string, 
    difficulty: 'medium' | 'hard', 
    count: number = 5
  ): Promise<{ success: boolean; questionsAdded: number; error?: string }>

  // Answer Submission
  static async submitAnswer(
    sessionId: string, 
    questionId: string, 
    answer: string
  ): Promise<{ success: boolean; isCorrect?: boolean; error?: string }>

  static async autoSaveAnswer(
    sessionId: string, 
    questionId: string, 
    answer: string
  ): Promise<{ success: boolean; error?: string }>

  // Performance Tracking
  static async evaluatePerformanceAndAdapt(sessionId: string): Promise<{
    shouldAddQuestions: boolean;
    difficulty: 'medium' | 'hard';
    questionsToAdd: number;
  }>

  // Session Completion
  static async completeExam(sessionId: string): Promise<{ 
    success: boolean; 
    resultId?: string; 
    error?: string 
  }>

  // Validation
  static async validateExamAccess(token: string): Promise<{
    valid: boolean;
    session?: ExamSession;
    error?: string;
  }>
}
```

### Adaptive Testing Algorithm

```typescript
// Adaptive question addition logic
static async evaluatePerformanceAndAdapt(sessionId: string) {
  const session = await this.getExamSession(sessionId);
  const responses = await this.getSessionResponses(sessionId);
  
  // Calculate current performance metrics
  const totalAnswered = responses.length;
  const correctAnswers = responses.filter(r => r.is_correct).length;
  const accuracy = correctAnswers / totalAnswered;
  
  // Calculate time efficiency
  const timeElapsed = (Date.now() - new Date(session.started_at).getTime()) / 1000 / 60; // minutes
  const expectedTimePerQuestion = session.duration_minutes / session.initial_question_count;
  const avgTimePerQuestion = timeElapsed / totalAnswered;
  const timeEfficiency = expectedTimePerQuestion / avgTimePerQuestion;
  
  // Adaptive logic
  if (accuracy >= 0.8 && timeEfficiency >= 2.0 && session.adaptive_questions_added < session.max_adaptive_questions) {
    const questionsToAdd = Math.min(5, session.max_adaptive_questions - session.adaptive_questions_added);
    const difficulty = accuracy >= 0.9 ? 'hard' : 'medium';
    
    return {
      shouldAddQuestions: true,
      difficulty,
      questionsToAdd
    };
  }
  
  return { shouldAddQuestions: false, difficulty: 'medium', questionsToAdd: 0 };
}
```

### Question Selection Logic

```typescript
// 30% Aptitude + 70% Technical distribution
static async selectInitialQuestions(jobDescriptionId: string, count: number = 15) {
  const aptitudeCount = Math.floor(count * 0.30); // 30% aptitude
  const technicalCount = count - aptitudeCount;   // 70% technical
  
  // Select aptitude questions
  const { data: aptitudeQuestions } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('job_description_id', jobDescriptionId)
    .eq('question_category', 'aptitude')
    .eq('status', 'approved')
    .eq('is_active', true)
    .order('random()')
    .limit(aptitudeCount);
  
  // Select technical questions
  const { data: technicalQuestions } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('job_description_id', jobDescriptionId)
    .eq('question_category', 'technical')
    .eq('status', 'approved')
    .eq('is_active', true)
    .order('random()')
    .limit(technicalCount);
  
  // Mix questions randomly
  const allQuestions = [...(aptitudeQuestions || []), ...(technicalQuestions || [])];
  const shuffledQuestions = this.shuffleArray(allQuestions);
  
  return { questions: shuffledQuestions, error: null };
}

private static shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

## 🤖 2. ExamQuestionGenerator Service

**File**: `src/services/examQuestionGenerator.ts`

### Core Responsibilities
- AI question generation via n8n workflows
- HR question management (CRUD operations)
- Question approval and categorization
- Bulk question operations

### Key Methods

```typescript
export class ExamQuestionGenerator {
  // Enhanced AI Generation
  static async generateQuestions(
    params: {
      content: string;
      inputMethod: 'existing' | 'upload' | 'manual' | 'topic';
      questionCount?: number;
      distribution?: { technical: number; aptitude: number };
    }
  ): Promise<{ success: boolean; questions: ExamQuestion[]; error?: string }>

  // PDF Text Extraction
  static async extractTextFromPDF(
    file: File
  ): Promise<{ success: boolean; extractedText: string; error?: string }>

  static async generateQuestionsForJob(
    jobDescriptionId: string,
    config: QuestionGenerationConfig
  ): Promise<{ success: boolean; questionsGenerated: number; error?: string }>

  static async triggerAIGeneration(
    jobDescriptionId: string,
    questionCount: number = 30
  ): Promise<{ success: boolean; workflowId?: string; error?: string }>

  // HR Question Management
  static async createManualQuestion(
    questionData: CreateQuestionRequest
  ): Promise<{ success: boolean; questionId?: string; error?: string }>

  static async updateQuestion(
    questionId: string,
    updates: UpdateQuestionRequest
  ): Promise<{ success: boolean; error?: string }>

  static async deleteQuestion(questionId: string): Promise<{ success: boolean; error?: string }>

  static async approveQuestion(questionId: string): Promise<{ success: boolean; error?: string }>

  static async rejectQuestion(questionId: string, reason: string): Promise<{ success: boolean; error?: string }>

  // Bulk Operations
  static async bulkUpdateQuestions(
    questionIds: string[],
    updates: Partial<UpdateQuestionRequest>
  ): Promise<{ success: boolean; updatedCount: number; error?: string }>

  static async bulkApproveQuestions(questionIds: string[]): Promise<{ success: boolean; error?: string }>

  // Question Retrieval
  static async getQuestionsByJob(
    jobDescriptionId: string,
    filters?: QuestionFilters
  ): Promise<{ questions: ExamQuestion[]; error?: string }>

  static async getQuestionById(questionId: string): Promise<{ question: ExamQuestion | null; error?: string }>

  // Statistics
  static async getQuestionStats(jobDescriptionId: string): Promise<{
    total: number;
    byCategory: { technical: number; aptitude: number };
    byStatus: { draft: number; approved: number; rejected: number };
    byDifficulty: { easy: number; medium: number; hard: number };
  }>
}
```

### AI Generation Integration

```typescript
static async triggerAIGeneration(jobDescriptionId: string, questionCount: number = 30) {
  try {
    // Get job description details
    const { data: jobDescription, error: jobError } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', jobDescriptionId)
      .single();

    if (jobError || !jobDescription) {
      return { success: false, error: 'Job description not found' };
    }

    // Calculate question distribution
    const technicalCount = Math.floor(questionCount * 0.70); // 70% technical
    const aptitudeCount = questionCount - technicalCount;     // 30% aptitude

    // Prepare n8n webhook payload
    const payload = {
      jobDescriptionId,
      jobTitle: jobDescription.title,
      jobDescription: jobDescription.description,
      skills: jobDescription.skills,
      requirements: jobDescription.requirements,
      technicalCount,
      aptitudeCount,
      difficultyDistribution: {
        easy: Math.floor(questionCount * 0.3),
        medium: Math.floor(questionCount * 0.5),
        hard: Math.floor(questionCount * 0.2)
      }
    };

    // Call n8n webhook
    const response = await fetch(process.env.REACT_APP_N8N_EXAM_GENERATION_WEBHOOK!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, workflowId: result.executionId };

  } catch (error) {
    console.error('Error triggering AI generation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate questions' 
    };
  }
}
```

### HR Question Management

```typescript
static async createManualQuestion(questionData: CreateQuestionRequest) {
  try {
    const questionRecord = {
      job_description_id: questionData.jobDescriptionId,
      question_text: questionData.questionText,
      question_type: questionData.questionType,
      question_category: questionData.questionCategory,
      difficulty_level: questionData.difficultyLevel,
      mcq_options: questionData.questionType === 'mcq' ? questionData.mcqOptions : null,
      correct_answer: questionData.correctAnswer,
      answer_explanation: questionData.answerExplanation,
      points: questionData.points || 1,
      time_limit_seconds: questionData.timeLimitSeconds || 60,
      tags: questionData.tags || [],
      created_by: 'hr',
      created_by_user_id: questionData.createdByUserId,
      status: 'draft', // HR created questions start as draft
      hr_notes: questionData.hrNotes || null
    };

    const { data, error } = await supabase
      .from('exam_questions')
      .insert(questionRecord)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, questionId: data.id };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create question' 
    };
  }
}
```

## 📧 3. ExamEmailService

**File**: `src/services/examEmailService.ts`

### Core Responsibilities
- Send exam invitations with secure tokens
- Send exam reminders and notifications
- Generate secure exam links
- Handle email templates and formatting

### Key Methods

```typescript
export class ExamEmailService {
  // Exam Invitations
  static async sendExamInvitation(
    candidateId: string,
    examSessionId: string,
    examToken: string
  ): Promise<{ success: boolean; error?: string }>

  static async sendExamReminder(
    candidateId: string,
    examSessionId: string
  ): Promise<{ success: boolean; error?: string }>

  // Notifications
  static async sendExamCompletionNotification(
    candidateId: string,
    examResultId: string
  ): Promise<{ success: boolean; error?: string }>

  // Link Generation
  static generateExamLink(examToken: string): string

  // Bulk Operations
  static async sendBulkExamInvitations(
    candidateIds: string[],
    jobDescriptionId: string
  ): Promise<{ success: boolean; sentCount: number; errors: string[] }>
}
```

### Exam Invitation Email

```typescript
static async sendExamInvitation(candidateId: string, examSessionId: string, examToken: string) {
  try {
    // Get candidate and exam details
    const { data: candidate } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    const { data: examSession } = await supabase
      .from('exam_sessions')
      .select(`
        *,
        job_description:job_descriptions(title, department)
      `)
      .eq('id', examSessionId)
      .single();

    if (!candidate || !examSession) {
      return { success: false, error: 'Candidate or exam session not found' };
    }

    // Generate exam link
    const examLink = this.generateExamLink(examToken);

    // Prepare email data
    const emailData = {
      candidate,
      examSession,
      examLink,
      expiryDate: new Date(examSession.expires_at).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
      })
    };

    // Send email using existing EmailService
    const result = await EmailService.sendExamInvitation(emailData);
    return result;

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send exam invitation' 
    };
  }
}

static generateExamLink(examToken: string): string {
  const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/exam/${examToken}`;
}
```

## 📊 4. ExamResultsService

**File**: `src/services/examResultsService.ts`

### Core Responsibilities
- Calculate exam scores and percentages
- Generate detailed result analytics
- Handle AI evaluation of text answers
- Create result summaries for candidates and admins

### Key Methods

```typescript
export class ExamResultsService {
  // Score Calculation
  static async calculateExamResults(
    examSessionId: string
  ): Promise<{ success: boolean; resultId?: string; error?: string }>

  static async evaluateTextAnswers(
    examSessionId: string
  ): Promise<{ success: boolean; evaluatedCount: number; error?: string }>

  // Results Retrieval
  static async getExamResults(
    examSessionId: string
  ): Promise<{ results: ExamResult | null; error?: string }>

  static async getCandidateResults(
    candidateId: string
  ): Promise<{ results: ExamResult[]; error?: string }>

  // Analytics
  static async getExamAnalytics(
    examSessionId: string
  ): Promise<{
    performance: PerformanceAnalytics;
    categoryBreakdown: CategoryBreakdown;
    timeAnalysis: TimeAnalysis;
  }>

  // Report Generation
  static async generateResultReport(
    examSessionId: string
  ): Promise<{ report: ExamReport; error?: string }>

  // HR Results Management
  static async getAllExamResults(
    filters?: ExamResultFilters
  ): Promise<{ success: boolean; results: ExamResult[]; error?: string }>

  static async getDetailedResponses(
    examSessionId: string
  ): Promise<{ success: boolean; responses: ExamResponse[]; error?: string }>

  static async exportResults(
    results: ExamResult[],
    format: 'csv' | 'pdf'
  ): Promise<{ success: boolean; downloadUrl?: string; error?: string }>

  static async getExamAnalytics(
    filters?: ExamResultFilters
  ): Promise<{
    success: boolean;
    analytics: {
      totalExams: number;
      passRate: number;
      averageScore: number;
      categoryBreakdown: { technical: number; aptitude: number };
      timeAnalysis: { averageTime: number; fastestTime: number; slowestTime: number };
      difficultyAnalysis: { easy: number; medium: number; hard: number };
    };
    error?: string;
  }>
}

// Enhanced AI Generation Implementation
static async generateQuestions(
  params: {
    content: string;
    inputMethod: 'existing' | 'upload' | 'topic';
    questionCount?: number;
    distribution?: { technical: number; aptitude: number };
  }
): Promise<{ success: boolean; questions: ExamQuestion[]; error?: string }> {
  try {
    const { content, inputMethod, questionCount = 20, distribution = { technical: 70, aptitude: 30 } } = params;

    // Prepare AI prompt based on input method
    let aiPrompt = '';
    
    switch (inputMethod) {
      case 'existing':
        aiPrompt = `Generate exam questions based on this job description:\n\n${content}`;
        break;
      case 'upload':
        aiPrompt = `Generate exam questions based on this uploaded job description:\n\n${content}`;
        break;
      case 'topic':
        aiPrompt = `Generate exam questions based on this topic and insights:\n\n${content}`;
        break;
    }

    // Add distribution requirements
    aiPrompt += `\n\nRequirements:
    - Generate ${questionCount} questions total
    - ${distribution.technical}% should be technical questions
    - ${distribution.aptitude}% should be aptitude questions
    - Mix of MCQ and text-based questions
    - Include easy, medium, and hard difficulty levels
    - Provide detailed explanations for answers`;

    // Call n8n workflow for AI generation
    const n8nResult = await this.callN8nWorkflow('exam-question-generation', {
      prompt: aiPrompt,
      inputMethod,
      questionCount,
      distribution
    });

    if (!n8nResult.success) {
      return { success: false, questions: [], error: n8nResult.error };
    }

    // Parse and validate generated questions
    const generatedQuestions = n8nResult.questions.map((q: any, index: number) => ({
      id: `generated_${Date.now()}_${index}`,
      job_description_id: inputMethod === 'existing' ? this.extractJobId(content) : null,
      question_text: q.question_text,
      question_type: q.question_type,
      question_category: q.question_category,
      difficulty_level: q.difficulty_level,
      points: q.points || 1,
      correct_answer: q.correct_answer,
      answer_explanation: q.answer_explanation,
      mcq_options: q.mcq_options || null,
      created_by: 'ai_generator',
      status: 'pending_review',
      created_at: new Date().toISOString()
    }));

    // Save questions to database
    const { data: savedQuestions, error: saveError } = await supabase
      .from('exam_questions')
      .insert(generatedQuestions)
      .select();

    if (saveError) {
      return { success: false, questions: [], error: saveError.message };
    }

    return { success: true, questions: savedQuestions || [] };
  } catch (error) {
    return { 
      success: false, 
      questions: [], 
      error: error instanceof Error ? error.message : 'Question generation failed' 
    };
  }
}

// Helper method to call n8n workflows
private static async callN8nWorkflow(
  workflowName: string,
  data: any
): Promise<{ success: boolean; questions?: any[]; error?: string }> {
  try {
    const response = await fetch(`${process.env.N8N_WEBHOOK_URL}/${workflowName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_KEY}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`n8n workflow failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, questions: result.questions };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'n8n workflow error' 
    };
  }
}

// PDF Text Extraction Implementation
static async extractTextFromPDF(
  file: File
): Promise<{ success: boolean; extractedText: string; error?: string }> {
  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use pdf-parse library for text extraction
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length === 0) {
      return { 
        success: false, 
        extractedText: '', 
        error: 'No text content found in PDF' 
      };
    }

    // Clean and format the extracted text
    const cleanedText = data.text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
      .trim();

    return { 
      success: true, 
      extractedText: cleanedText 
    };
  } catch (error) {
    return { 
      success: false, 
      extractedText: '', 
      error: error instanceof Error ? error.message : 'PDF extraction failed' 
    };
  }
}

// Helper method to extract job ID from content
private static extractJobId(content: string): string | null {
  // This would extract job ID from the content if it's from an existing JD
  // Implementation depends on how the content is structured
  return null;
}
```

### Score Calculation Logic

```typescript
static async calculateExamResults(examSessionId: string) {
  try {
    // Get exam session and responses
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', examSessionId)
      .single();

    const { data: responses } = await supabase
      .from('exam_responses')
      .select(`
        *,
        question:exam_questions(question_category, points, difficulty_level)
      `)
      .eq('exam_session_id', examSessionId);

    if (!session || !responses) {
      return { success: false, error: 'Session or responses not found' };
    }

    // Calculate scores
    const totalScore = responses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
    const maxScore = responses.reduce((sum, r) => sum + (r.question.points || 1), 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // Category-wise scores
    const technicalResponses = responses.filter(r => r.question.question_category === 'technical');
    const aptitudeResponses = responses.filter(r => r.question.question_category === 'aptitude');

    const technicalScore = technicalResponses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
    const technicalMaxScore = technicalResponses.reduce((sum, r) => sum + (r.question.points || 1), 0);

    const aptitudeScore = aptitudeResponses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
    const aptitudeMaxScore = aptitudeResponses.reduce((sum, r) => sum + (r.question.points || 1), 0);

    // Performance metrics
    const timeTaken = session.completed_at ? 
      (new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000 / 60 : 0;
    
    const avgTimePerQuestion = responses.length > 0 ? 
      responses.reduce((sum, r) => sum + (r.time_taken_seconds || 0), 0) / responses.length : 0;

    // Create result record
    const resultData = {
      exam_session_id: examSessionId,
      candidate_id: session.candidate_id,
      total_score: totalScore,
      max_score: maxScore,
      percentage: Math.round(percentage * 100) / 100,
      correct_answers: responses.filter(r => r.is_correct).length,
      wrong_answers: responses.filter(r => r.is_correct === false).length,
      skipped_questions: session.total_questions - responses.length,
      technical_score: technicalScore,
      technical_max_score: technicalMaxScore,
      aptitude_score: aptitudeScore,
      aptitude_max_score: aptitudeMaxScore,
      time_taken_minutes: Math.round(timeTaken),
      avg_time_per_question: Math.round(avgTimePerQuestion * 100) / 100,
      evaluation_status: percentage >= 60 ? 'passed' : 'failed',
      passing_threshold: 60.00
    };

    const { data: result, error } = await supabase
      .from('exam_results')
      .insert(resultData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, resultId: result.id };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to calculate results' 
    };
  }
}

### HR Results Management Implementation

```typescript
// HR Results Management Methods
static async getAllExamResults(filters?: ExamResultFilters): Promise<{
  success: boolean;
  results: ExamResult[];
  error?: string;
}> {
  try {
    let query = supabase
      .from('exam_results')
      .select(`
        *,
        candidate:candidates(name, email),
        exam_session:exam_sessions(job_description_id, started_at, completed_at)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.jobDescriptionId) {
      query = query.eq('exam_session.job_description_id', filters.jobDescriptionId);
    }
    
    if (filters?.candidateId) {
      query = query.eq('candidate_id', filters.candidateId);
    }
    
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    
    if (filters?.minScore !== undefined) {
      query = query.gte('percentage', filters.minScore);
    }
    
    if (filters?.maxScore !== undefined) {
      query = query.lte('percentage', filters.maxScore);
    }
    
    if (filters?.status) {
      if (filters.status === 'passed') {
        query = query.gte('percentage', 60);
      } else if (filters.status === 'failed') {
        query = query.lt('percentage', 60);
      }
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, results: [], error: error.message };
    }

    return { success: true, results: data || [] };
  } catch (error) {
    return { 
      success: false, 
      results: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch exam results' 
    };
  }
}

static async getDetailedResponses(examSessionId: string): Promise<{
  success: boolean;
  responses: ExamResponse[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('exam_responses')
      .select(`
        *,
        question:exam_questions(
          question_text,
          question_type,
          question_category,
          difficulty_level,
          points,
          answer_explanation,
          mcq_options
        )
      `)
      .eq('exam_session_id', examSessionId)
      .order('answered_at', { ascending: true });

    if (error) {
      return { success: false, responses: [], error: error.message };
    }

    return { success: true, responses: data || [] };
  } catch (error) {
    return { 
      success: false, 
      responses: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch detailed responses' 
    };
  }
}

static async exportResults(results: ExamResult[], format: 'csv' | 'pdf'): Promise<{
  success: boolean;
  downloadUrl?: string;
  error?: string;
}> {
  try {
    if (format === 'csv') {
      return await this.exportToCSV(results);
    } else if (format === 'pdf') {
      return await this.exportToPDF(results);
    }
    
    return { success: false, error: 'Unsupported export format' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Export failed' 
    };
  }
}

private static async exportToCSV(results: ExamResult[]): Promise<{
  success: boolean;
  downloadUrl?: string;
  error?: string;
}> {
  try {
    // Create CSV content
    const headers = [
      'Candidate Name',
      'Position',
      'Overall Score (%)',
      'Technical Score (%)',
      'Aptitude Score (%)',
      'Time Taken (minutes)',
      'Status',
      'Date Taken'
    ];

    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        result.candidate?.name || 'Unknown',
        result.exam_session?.job_description?.title || 'Unknown',
        result.percentage,
        result.technical_max_score > 0 ? 
          Math.round((result.technical_score / result.technical_max_score) * 100) : 0,
        result.aptitude_max_score > 0 ? 
          Math.round((result.aptitude_score / result.aptitude_max_score) * 100) : 0,
        result.time_taken_minutes,
        result.evaluation_status,
        new Date(result.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    // Create blob and download URL
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const downloadUrl = URL.createObjectURL(blob);

    return { success: true, downloadUrl };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'CSV export failed' 
    };
  }
}

private static async exportToPDF(results: ExamResult[]): Promise<{
  success: boolean;
  downloadUrl?: string;
  error?: string;
}> {
  try {
    // This would integrate with a PDF generation library like jsPDF or Puppeteer
    // For now, we'll create a simple HTML report that can be printed as PDF
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Exam Results Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Exam Results Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
          <h3>Summary</h3>
          <p>Total Exams: ${results.length}</p>
          <p>Passed: ${results.filter(r => r.percentage >= 60).length}</p>
          <p>Failed: ${results.filter(r => r.percentage < 60).length}</p>
          <p>Average Score: ${results.length > 0 ? 
            Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0}%</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Position</th>
              <th>Score (%)</th>
              <th>Technical (%)</th>
              <th>Aptitude (%)</th>
              <th>Time (min)</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(result => `
              <tr>
                <td>${result.candidate?.name || 'Unknown'}</td>
                <td>${result.exam_session?.job_description?.title || 'Unknown'}</td>
                <td>${result.percentage}</td>
                <td>${result.technical_max_score > 0 ? 
                  Math.round((result.technical_score / result.technical_max_score) * 100) : 0}</td>
                <td>${result.aptitude_max_score > 0 ? 
                  Math.round((result.aptitude_score / result.aptitude_max_score) * 100) : 0}</td>
                <td>${result.time_taken_minutes}</td>
                <td>${result.evaluation_status}</td>
                <td>${new Date(result.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const downloadUrl = URL.createObjectURL(blob);

    return { success: true, downloadUrl };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'PDF export failed' 
    };
  }
}

static async getExamAnalytics(filters?: ExamResultFilters): Promise<{
  success: boolean;
  analytics: {
    totalExams: number;
    passRate: number;
    averageScore: number;
    categoryBreakdown: { technical: number; aptitude: number };
    timeAnalysis: { averageTime: number; fastestTime: number; slowestTime: number };
    difficultyAnalysis: { easy: number; medium: number; hard: number };
  };
  error?: string;
}> {
  try {
    // Get all results with filters applied
    const resultsResponse = await this.getAllExamResults(filters);
    if (!resultsResponse.success) {
      return { 
        success: false, 
        analytics: {} as any, 
        error: resultsResponse.error 
      };
    }

    const results = resultsResponse.results;

    // Calculate analytics
    const totalExams = results.length;
    const passedExams = results.filter(r => r.percentage >= 60).length;
    const passRate = totalExams > 0 ? (passedExams / totalExams) * 100 : 0;
    const averageScore = totalExams > 0 ? 
      results.reduce((sum, r) => sum + r.percentage, 0) / totalExams : 0;

    // Category breakdown
    const technicalScores = results
      .filter(r => r.technical_max_score > 0)
      .map(r => (r.technical_score / r.technical_max_score) * 100);
    
    const aptitudeScores = results
      .filter(r => r.aptitude_max_score > 0)
      .map(r => (r.aptitude_score / r.aptitude_max_score) * 100);

    const categoryBreakdown = {
      technical: technicalScores.length > 0 ? 
        technicalScores.reduce((sum, score) => sum + score, 0) / technicalScores.length : 0,
      aptitude: aptitudeScores.length > 0 ? 
        aptitudeScores.reduce((sum, score) => sum + score, 0) / aptitudeScores.length : 0
    };

    // Time analysis
    const times = results.map(r => r.time_taken_minutes);
    const timeAnalysis = {
      averageTime: times.length > 0 ? 
        times.reduce((sum, time) => sum + time, 0) / times.length : 0,
      fastestTime: times.length > 0 ? Math.min(...times) : 0,
      slowestTime: times.length > 0 ? Math.max(...times) : 0
    };

    // Difficulty analysis (this would require additional data from questions)
    const difficultyAnalysis = {
      easy: 0, // Would need to calculate from question difficulty
      medium: 0,
      hard: 0
    };

    return {
      success: true,
      analytics: {
        totalExams,
        passRate: Math.round(passRate * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        categoryBreakdown: {
          technical: Math.round(categoryBreakdown.technical * 100) / 100,
          aptitude: Math.round(categoryBreakdown.aptitude * 100) / 100
        },
        timeAnalysis: {
          averageTime: Math.round(timeAnalysis.averageTime * 100) / 100,
          fastestTime: timeAnalysis.fastestTime,
          slowestTime: timeAnalysis.slowestTime
        },
        difficultyAnalysis
      }
    };
  } catch (error) {
    return { 
      success: false, 
      analytics: {} as any, 
      error: error instanceof Error ? error.message : 'Failed to calculate analytics' 
    };
  }
}
```

## 📄 PDF Text Extraction Service

```typescript
export class PDFTextExtractionService {
  // Extract text from PDF file
  static async extractText(
    file: File
  ): Promise<{ success: boolean; extractedText: string; error?: string }> {
    try {
      // Validate file type
      if (file.type !== 'application/pdf') {
        return { 
          success: false, 
          extractedText: '', 
          error: 'Only PDF files are supported' 
        };
      }

      // Check file size (limit to 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return { 
          success: false, 
          extractedText: '', 
          error: 'File size too large. Maximum 10MB allowed.' 
        };
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Use pdf-parse library for text extraction
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);

      if (!data.text || data.text.trim().length === 0) {
        return { 
          success: false, 
          extractedText: '', 
          error: 'No text content found in PDF. The PDF might be image-based or corrupted.' 
        };
      }

      // Clean and format the extracted text
      const cleanedText = this.cleanExtractedText(data.text);

      return { 
        success: true, 
        extractedText: cleanedText 
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      return { 
        success: false, 
        extractedText: '', 
        error: error instanceof Error ? error.message : 'PDF extraction failed' 
      };
    }
  }

  // Clean and format extracted text
  private static cleanExtractedText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
      .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable characters
      .trim();
  }

  // Validate extracted text quality
  static validateExtractedText(text: string): {
    isValid: boolean;
    quality: 'high' | 'medium' | 'low';
    issues: string[];
  } {
    const issues: string[] = [];
    let quality: 'high' | 'medium' | 'low' = 'high';

    // Check minimum length
    if (text.length < 100) {
      issues.push('Text is too short (less than 100 characters)');
      quality = 'low';
    }

    // Check for common extraction issues
    if (text.includes('') || text.includes('??')) {
      issues.push('Contains unrecognized characters');
      quality = 'medium';
    }

    // Check for excessive whitespace
    const whitespaceRatio = (text.match(/\s/g) || []).length / text.length;
    if (whitespaceRatio > 0.3) {
      issues.push('Excessive whitespace detected');
      quality = 'medium';
    }

    // Check for job description keywords
    const jobKeywords = ['responsibilities', 'requirements', 'skills', 'experience', 'qualifications'];
    const hasJobKeywords = jobKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );

    if (!hasJobKeywords) {
      issues.push('No job description keywords found');
      quality = 'low';
    }

    return {
      isValid: issues.length === 0,
      quality,
      issues
    };
  }
}
```

## 🔄 Service Integration

### Error Handling Pattern

```typescript
// Standardized error handling across all services
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Usage example
const result = await ExamService.createExamSession(candidateId, jobDescriptionId);
if (!result.success) {
  console.error('Failed to create exam session:', result.error);
  return;
}
const examSession = result.data;
```

### TypeScript Interfaces

```typescript
// Core interfaces for type safety
export interface ExamConfig {
  durationMinutes?: number;
  initialQuestionCount?: number;
  maxAdaptiveQuestions?: number;
  passingThreshold?: number;
}

export interface CreateQuestionRequest {
  jobDescriptionId: string;
  questionText: string;
  questionType: 'mcq' | 'text';
  questionCategory: 'technical' | 'aptitude';
  difficultyLevel: 'easy' | 'medium' | 'hard';
  mcqOptions?: Array<{ option: string; text: string }>;
  correctAnswer: string;
  answerExplanation: string;
  points?: number;
  timeLimitSeconds?: number;
  tags?: string[];
  createdByUserId: string;
  hrNotes?: string;
}

export interface QuestionFilters {
  category?: 'technical' | 'aptitude';
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'draft' | 'approved' | 'rejected';
  createdBy?: 'hr' | 'ai';
}
```

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Example test structure
describe('ExamService', () => {
  describe('createExamSession', () => {
    it('should create exam session with correct initial questions', async () => {
      const result = await ExamService.createExamSession('candidate-1', 'job-1');
      expect(result.success).toBe(true);
      expect(result.data?.initial_question_count).toBe(15);
    });
  });

  describe('adaptive question addition', () => {
    it('should add questions for high performers', async () => {
      // Mock high performance scenario
      const result = await ExamService.evaluatePerformanceAndAdapt('session-1');
      expect(result.shouldAddQuestions).toBe(true);
    });
  });
});
```

### Integration Tests

```typescript
describe('Exam System Integration', () => {
  it('should complete full exam flow', async () => {
    // 1. Create exam session
    const session = await ExamService.createExamSession('candidate-1', 'job-1');
    
    // 2. Submit answers
    await ExamService.submitAnswer(session.data!.id, 'question-1', 'Answer A');
    
    // 3. Complete exam
    const result = await ExamService.completeExam(session.data!.id);
    
    // 4. Verify results
    expect(result.success).toBe(true);
  });
});
```

---

**Next Steps**: Review the frontend components implementation in `EXAM_FRONTEND_COMPONENTS.md`
