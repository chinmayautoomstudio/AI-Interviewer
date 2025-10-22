// Core types for the AI HR Saathi Platform

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'hr_manager' | 'recruiter';
  createdAt: string;
  lastLogin?: string;
}

export interface CandidateUser {
  id: string;
  candidate_id?: string;
  email: string;
  name: string;
  phone?: string;
  contact_number?: string;
  username?: string;
  primaryJobDescriptionId?: string;
  interviewId?: string;
  interview_id?: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  lastLogin?: string;
}

export interface CandidateLoginRequest {
  name: string;
  email: string;
  contact_number: string;
  job_description_id: string;
  username: string;
  password: string;
}

export interface CandidateAuthResponse {
  candidate: CandidateUser | null;
  error: string | null;
}

export interface Candidate {
  id: string; // Supabase UUID (internal)
  candidate_id?: string; // Custom candidate ID
  email: string;
  name: string;
  phone?: string;
  contact_number?: string;
  resume?: string;
  resumeUrl?: string;
  resume_url?: string;
  resumeText?: string;
  resume_text?: string;
  summary?: string;
  resume_summary?: string; // AI-generated summary from n8n workflow
  skills?: any; // Can be object or array
  experience?: any[]; // Array of experience objects
  education?: any[]; // Array of education objects
  projects?: any;
  status: 'active' | 'inactive' | 'archived';
  interviewId?: string;
  interview_id?: string;
  primaryJobDescriptionId?: string; // Primary job this candidate is associated with
  // Authentication fields
  username?: string;
  password_hash?: string;
  credentials_generated?: boolean;
  credentials_generated_at?: string;
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
  // Statistics fields (added for enhanced table view)
  appliedJobs?: string[]; // Job titles this candidate has applied for
  interviewCount?: number; // Number of interviews taken
  averageScore?: number | null; // Average interview score
  lastInterviewDate?: string | null; // Date of last interview
  applicationCount?: number; // Total number of applications
  hasInterviews?: boolean; // Whether candidate has taken any interviews
  latestApplicationStatus?: string | null; // Latest application status
}

export interface CreateJobDescriptionRequest {
  title: string;
  department: string;
  location: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  qualifications: string[];
  status?: 'draft' | 'active' | 'paused' | 'closed';
  companyName?: string;
  workMode?: 'on-site' | 'remote' | 'hybrid';
  jobCategory?: string;
  contactEmail?: string;
  applicationDeadline?: string;
}

export interface JobDescription {
  id: string;
  job_description_id?: string; // Custom job description ID (AS-WDT-7019 format)
  title: string;
  department: string;
  location: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  salary_range?: string; // AI-parsed salary range as text
  description: string;
  jd_summary?: string; // AI-generated comprehensive summary from n8n workflow
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  qualifications: string[];
  status: 'draft' | 'active' | 'paused' | 'closed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  // Enhanced structured fields from AI parser
  key_responsibilities?: string[]; // AI-extracted main responsibilities
  required_skills?: string[]; // AI-extracted mandatory skills
  preferred_skills?: string[]; // AI-extracted nice-to-have skills
  technical_stack?: string[]; // AI-extracted technologies and tools
  education_requirements?: string; // AI-extracted education requirements
  company_culture?: string; // AI-extracted company culture
  growth_opportunities?: string; // AI-extracted growth opportunities
  qualifications_minimum?: string[]; // AI-extracted minimum qualifications
  qualifications_preferred?: string[]; // AI-extracted preferred qualifications
  // Additional fields
  companyName?: string;
  workMode?: 'on-site' | 'remote' | 'hybrid';
  jobCategory?: string;
  contactEmail?: string;
  applicationDeadline?: string;
}

export interface AIAgent {
  id: string;
  name: string;
  description?: string;
  agentType: 'technical' | 'behavioral' | 'hr' | 'domain_specific' | 'general';
  jobCategories: string[];
  capabilities?: string[];
  specializations?: string[];
  n8nWebhookUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  jobDescriptionId: string;
  aiAgentId?: string;
  interviewType: 'technical' | 'behavioral' | 'hr' | 'domain_specific' | 'general';
  duration: number; // in minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  interviewNotes?: string;
  results?: InterviewResults;
  createdAt: string;
  updatedAt: string;
  // Joined data
  candidate?: Candidate;
  jobDescription?: JobDescription;
  aiAgent?: AIAgent;
}

export interface InterviewResults {
  id: string;
  interviewId: string;
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  adaptabilityScore: number;
  transcript: string;
  evaluation: string;
  recommendations: string[];
  createdAt: string;
}


export interface AudioSettings {
  microphoneEnabled: boolean;
  speakerEnabled: boolean;
  volume: number;
  deviceId?: string;
}

// Old InterviewSession interface removed - replaced with new one below

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface CandidateForm {
  name: string;
  email: string;
  phone?: string;
  resume?: File;
  skills?: string[];
  experience?: string;
  education?: string;
}

export interface ResumeUploadResponse {
  success: boolean;
  candidateId?: string;
  resumeText?: string;
  extractedData?: {
    name: string;
    email: string;
    phone: string;
    skills: string[];
    experience: string | Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: string | Array<{
      degree: string;
      institution: string;
      graduation_year: string | null;
    }>;
    projects?: Array<{
      title: string;
      description: string;
      technologies_used: string[];
    }>;
    summary: string;
  };
  error?: string;
}

export interface AddCandidateRequest {
  name: string;
  email: string;
  phone?: string;
  resumeFile?: File;
  resume_url?: string; // URL to the resume file
  skills?: string[];
  experience?: string;
  education?: string;
  resume_description?: string; // AI-generated resume description for interview preparation
  primaryJobDescriptionId?: string; // Job description to assign the candidate to
}

export interface CandidateJobApplication {
  id: string;
  candidateId: string;
  jobDescriptionId: string;
  applicationStatus: 'applied' | 'under_review' | 'shortlisted' | 'interview_scheduled' | 'interviewed' | 'selected' | 'rejected' | 'withdrawn';
  appliedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  candidate?: Candidate;
  jobDescription?: JobDescription;
}

export interface InterviewForm {
  candidateId: string;
  jobDescriptionId: string;
  aiAgentId: string;
  interviewType: 'technical' | 'behavioral' | 'hr' | 'domain_specific' | 'general';
  duration: number;
  scheduledAt: string;
  interviewNotes?: string;
}

// Component props types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

// AI Interview System Types
export interface InterviewSession {
  id: string;
  sessionId: string;
  candidateId: string;
  jobDescriptionId: string;
  aiAgentId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  totalQuestions: number;
  questionsAnswered: number;
  createdAt: string;
  updatedAt: string;
  aiResponse?: any; // AI response from n8n workflow
}

export interface InterviewMessage {
  id: string;
  interviewSessionId: string; // Changed from sessionId to interviewSessionId (UUID)
  messageType: 'question' | 'answer' | 'system' | 'error' | 'instruction' | 'voice_input' | 'voice_response';
  content: string;
  sender: 'ai' | 'candidate' | 'system';
  timestamp: string;
  metadata?: Record<string, any>;
  sequenceNumber?: number;
  // Voice support fields
  voiceMode?: boolean;
  audioUrl?: string;
  audioDuration?: number;
  originalAudioTranscript?: string;
  transcriptionConfidence?: number;
  transcriptionLanguage?: string;
  voiceMetadata?: Record<string, any>;
}

export interface InterviewReport {
  id: string;
  interviewSessionId: string; // Changed from sessionId to interviewSessionId (UUID)
  overallScore: number;
  suitabilityStatus: 'suitable' | 'not_suitable' | 'conditional' | 'needs_review';
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  culturalFitScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
  detailedFeedback: string;
  reportData?: Record<string, any>;
  emailSent: boolean;
  emailSentAt?: string;
  emailRecipients: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StartInterviewRequest {
  candidateId: string;
  jobDescriptionId: string;
  aiAgentId?: string;
}

export interface ChatMessageRequest {
  sessionId: string;
  message: string;
  sender: 'candidate' | 'ai' | 'system';
}

export interface InterviewCompletionData {
  sessionId: string;
  reportData: {
    overallScore: number;
    suitabilityStatus: 'suitable' | 'not_suitable' | 'conditional' | 'needs_review';
    scores: {
      technical: number;
      communication: number;
      problemSolving: number;
      culturalFit: number;
    };
    feedback: string;
    recommendations: string;
    strengths: string[];
    weaknesses: string[];
  };
}

// ===== EXAM SYSTEM TYPES =====

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

export interface ExamQuestion {
  id: string;
  job_description_id?: string;
  question_text: string;
  question_type: 'mcq' | 'text';
  question_category: 'technical' | 'aptitude';
  difficulty_level: 'easy' | 'medium' | 'hard';
  mcq_options?: Array<{option: string; text: string}>;
  correct_answer?: string;
  answer_explanation?: string;
  points: number;
  time_limit_seconds: number;
  tags: string[];
  topic_id?: string;
  subtopic?: string;
  created_by: 'hr' | 'ai';
  created_by_user_id?: string;
  status: 'draft' | 'approved' | 'rejected';
  hr_notes?: string;
  last_modified_by?: string;
  last_modified_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  topic?: QuestionTopic;
}

export interface ExamSession {
  id: string;
  candidate_id: string;
  job_description_id: string;
  exam_token: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired' | 'terminated';
  total_questions: number;
  duration_minutes: number;
  initial_question_count: number;
  adaptive_questions_added: number;
  max_adaptive_questions: number;
  started_at?: string;
  completed_at?: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  performance_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined data
  candidate?: Candidate;
  job_description?: JobDescription;
}

export interface ExamResponse {
  id: string;
  exam_session_id: string;
  question_id: string;
  answer_text: string;
  is_correct?: boolean;
  points_earned: number;
  time_taken_seconds?: number;
  answered_at: string;
  // Joined data
  question?: ExamQuestion;
}

export interface ExamResult {
  id: string;
  exam_session_id: string;
  candidate_id: string;
  total_score: number;
  max_score: number;
  percentage: number;
  correct_answers: number;
  wrong_answers: number;
  skipped_questions: number;
  technical_score?: number;
  aptitude_score?: number;
  time_taken_minutes?: number;
  evaluation_status: 'pending' | 'passed' | 'failed';
  ai_evaluation?: Record<string, any>;
  created_at: string;
  // Joined data
  exam_session?: ExamSession;
  candidate?: Candidate;
}

// Exam Creation and Management Types
export interface CreateExamSessionRequest {
  candidate_id: string;
  job_description_id: string;
  duration_minutes?: number;
  total_questions?: number;
  expires_in_hours?: number;
}

export interface ExamInvitationRequest {
  candidate_id: string;
  job_description_id: string;
  exam_duration_minutes?: number;
  expires_in_hours?: number;
  send_email?: boolean;
}

export interface SubmitAnswerRequest {
  exam_session_id: string;
  question_id: string;
  answer_text: string;
  time_taken_seconds?: number;
}

export interface ExamPerformanceMetrics {
  accuracy_rate: number;
  average_time_per_question: number;
  questions_answered: number;
  correct_answers: number;
  time_remaining: number;
  should_add_questions: boolean;
  recommended_difficulty: 'easy' | 'medium' | 'hard';
}

// Question Generation Types
export interface QuestionGenerationRequest {
  job_description_id?: string;
  job_description_text?: string;
  topic_id?: string;
  question_count?: number;
  difficulty_distribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  question_types?: {
    mcq: number;
    text: number;
  };
  input_method: 'existing_jd' | 'upload_pdf' | 'manual_input' | 'custom_topic';
  custom_topic?: string;
  custom_insights?: string;
}

export interface GeneratedQuestion {
  question_text: string;
  question_type: 'mcq' | 'text';
  difficulty_level: 'easy' | 'medium' | 'hard';
  category: 'technical' | 'aptitude';
  mcq_options?: Array<{option: string; text: string}>;
  correct_answer?: string;
  answer_explanation?: string;
  points: number;
  time_limit_seconds: number;
  tags: string[];
  topic_id?: string;
  subtopic?: string;
}

// PDF Text Extraction Types
export interface PDFExtractionRequest {
  file: File;
  max_size_mb?: number;
}

export interface PDFExtractionResponse {
  success: boolean;
  extracted_text?: string;
  error?: string;
  file_info?: {
    name: string;
    size: number;
    pages?: number;
  };
}

// Exam UI Component Types
export interface ExamTimerProps {
  duration_minutes: number;
  onTimeUp: () => void;
  onWarning?: (timeRemaining: number) => void;
  isActive: boolean;
}

export interface MCQQuestionProps {
  question: ExamQuestion;
  selectedAnswer?: string;
  onAnswerSelect: (answer: string) => void;
  disabled?: boolean;
}

export interface TextQuestionProps {
  question: ExamQuestion;
  answer?: string;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

export interface QuestionNavigatorProps {
  questions: ExamQuestion[];
  currentQuestionIndex: number;
  answeredQuestions: Set<number>;
  onQuestionSelect: (index: number) => void;
  disabled?: boolean;
}

export interface ExamProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
  timeRemaining: number;
}

// Exam Results and Analytics Types
export interface ExamAnalytics {
  total_exams: number;
  completed_exams: number;
  average_score: number;
  pass_rate: number;
  average_time_taken: number;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  category_performance: {
    technical: number;
    aptitude: number;
  };
  top_performing_candidates: Array<{
    candidate_id: string;
    candidate_name: string;
    score: number;
    percentage: number;
  }>;
}

export interface ExamReportData {
  exam_result: ExamResult;
  detailed_responses: ExamResponse[];
  performance_breakdown: {
    by_category: Record<string, number>;
    by_difficulty: Record<string, number>;
    by_topic: Record<string, number>;
  };
  time_analysis: {
    total_time: number;
    average_per_question: number;
    time_distribution: Record<string, number>;
  };
  recommendations: string[];
}

// Combined Evaluation Types (Interview + Exam)
export interface CombinedEvaluation {
  candidate_id: string;
  candidate_name: string;
  job_description_id: string;
  job_title: string;
  interview_result?: InterviewReport;
  exam_result?: ExamResult;
  combined_score: number;
  overall_status: 'suitable' | 'not_suitable' | 'conditional' | 'needs_review';
  evaluation_summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  created_at: string;
  updated_at: string;
}