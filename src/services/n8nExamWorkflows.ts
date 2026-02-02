// N8N Workflow Configuration
const N8N_BASE_URL = process.env.REACT_APP_N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.REACT_APP_N8N_API_KEY || '';
const N8N_QUESTION_GENERATOR_WEBHOOK = process.env.REACT_APP_N8N_QUESTION_GENERATOR || `${N8N_BASE_URL}/webhook/generate-questions`;
const N8N_CV_QUESTION_GENERATOR_WEBHOOK = process.env.REACT_APP_N8N_CV_QUESTION_GENERATOR || `${N8N_BASE_URL}/webhook/generate-cv-questions`;
const N8N_ANSWER_EVALUATOR_WEBHOOK = process.env.REACT_APP_N8N_ANSWER_EVALUATOR || `${N8N_BASE_URL}/webhook/evaluate-answer`;
const N8N_QUALITY_ASSESSOR_WEBHOOK = process.env.REACT_APP_N8N_QUALITY_ASSESSOR || `${N8N_BASE_URL}/webhook/assess-quality`;

// Types for N8N Workflow Communication
export interface QuestionGenerationRequest {
  // For existing_jd, only send the ID and let n8n fetch from database
  job_description_id?: string;
  // For other methods, send the full job description data
  job_description?: {
    title: string;
    description: string;
    required_skills: string[];
    preferred_skills: string[];
    experience_level: string;
    employment_type: string;
    technical_stack: string[];
    key_responsibilities: string[];
    education_requirements: string;
  };
  generation_config: {
    total_questions: number;
    technical_percentage: number;
    aptitude_percentage: number;
    difficulty_distribution: {
      easy: number;
      medium: number;
      hard: number;
    };
    question_types: {
      mcq: number;
      text: number;
    };
    topics: Array<{
      name: string;
      weight: number;
      min_questions: number;
      max_questions: number;
    }>;
  };
  input_method: 'existing_jd' | 'upload_pdf' | 'manual_input' | 'custom_topic' | 'cv_based';
  source_info: {
    job_description_id?: string;
    extracted_text?: string;
    manual_description?: string;
    custom_topic?: string;
    topic_insights?: string;
  };
}

// CV-Based Question Generation Types
export interface CVQuestionGenerationRequest {
  candidate_info: {
    name: string;
    skills: string[];
    experience: any[];
    education: any[];
    projects: any[];
    resume_summary?: string;
    resume_text?: string;
  };
  generation_config: {
    total_questions: number;
    technical_percentage: number;
    aptitude_percentage: number;
    difficulty_distribution: {
      easy: number;
      medium: number;
      hard: number;
    };
    question_types: {
      mcq: number;
      text: number;
    };
    focus_areas?: string[];
  };
  input_method: 'cv_based';
}

export interface CVQuestionGenerationResponse {
  generated_questions: GeneratedQuestion[];
  generation_metadata: {
    total_generated: number;
    technical_count: number;
    aptitude_count: number;
    mcq_count: number;
    text_count: number;
    difficulty_breakdown: {
      easy: number;
      medium: number;
      hard: number;
    };
    skills_covered: string[];
    generation_time: string;
    ai_model_used: string;
    confidence_score: number;
  };
}

export interface GeneratedQuestion {
  question_text: string;
  question_type: 'mcq' | 'text';
  question_category: 'technical' | 'aptitude';
  difficulty_level: 'easy' | 'medium' | 'hard';
  topic: string;
  subtopic?: string;
  points: number;
  time_limit_seconds: number;
  mcq_options?: Array<{
    option: string;
    text: string;
  }>;
  correct_answer: string;
  answer_explanation: string;
  tags: string[];
}

export interface QuestionGenerationResponse {
  generated_questions: GeneratedQuestion[];
  generation_metadata: {
    total_generated: number;
    technical_count: number;
    aptitude_count: number;
    mcq_count: number;
    text_count: number;
    difficulty_breakdown: {
      easy: number;
      medium: number;
      hard: number;
    };
    topic_distribution: Record<string, number>;
    generation_time: string;
    ai_model_used: string;
    confidence_score: number;
  };
}

export interface AnswerEvaluationRequest {
  question_id: string;
  question_text: string;
  correct_answer: string;
  candidate_answer: string;
  question_type: 'mcq' | 'text';
  difficulty_level: 'easy' | 'medium' | 'hard';
  points: number;
  evaluation_criteria: {
    accuracy_weight: number;
    completeness_weight: number;
    clarity_weight: number;
    example_weight: number;
  };
}

export interface AnswerEvaluationResponse {
  is_correct: boolean;
  score: number;
  max_score: number;
  percentage: number;
  detailed_scores: {
    accuracy: number;
    completeness: number;
    clarity: number;
    example: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    overall_feedback: string;
  };
  keywords_found: string[];
  keywords_missing: string[];
  evaluation_confidence: number;
}

export interface QualityAssessmentRequest {
  question_text: string;
  question_type: 'mcq' | 'text';
  difficulty_level: 'easy' | 'medium' | 'hard';
  topic: string;
  mcq_options?: Array<{
    option: string;
    text: string;
  }>;
  correct_answer: string;
}

export interface QualityAssessmentResponse {
  overall_quality: 'excellent' | 'good' | 'fair' | 'poor';
  quality_score: number;
  issues: string[];
  suggestions: string[];
  difficulty_validation: {
    assessed_difficulty: 'easy' | 'medium' | 'hard';
    matches_intended: boolean;
    confidence: number;
  };
  bias_check: {
    has_bias: boolean;
    bias_types: string[];
    inclusivity_score: number;
  };
}

// N8N Workflow Service
export class N8NExamWorkflows {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = N8N_BASE_URL;
    this.apiKey = N8N_API_KEY;
  }

  /**
   * Generate questions using N8N workflow
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
    try {
      console.log('🚀 Calling N8N question generation webhook:', N8N_QUESTION_GENERATOR_WEBHOOK);
      console.log('📋 Request payload:', JSON.stringify(request, null, 2));
      
      const response = await fetch(N8N_QUESTION_GENERATOR_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ N8N workflow failed:', errorText);
        throw new Error(`N8N workflow failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📥 Raw N8N response:', result);

      // Handle different response formats
      let generatedQuestions: GeneratedQuestion[] = [];
      let generationMetadata: any = {};

      if (Array.isArray(result)) {
        // Direct array response (current n8n format)
        console.log('📋 Processing direct array response with', result.length, 'questions');
        generatedQuestions = result;
        
        // Generate metadata from the questions
        generationMetadata = {
          total_generated: result.length,
          technical_count: result.filter(q => q.question_category === 'technical').length,
          aptitude_count: result.filter(q => q.question_category === 'aptitude').length,
          mcq_count: result.filter(q => q.question_type === 'mcq').length,
          text_count: result.filter(q => q.question_type === 'text').length,
          difficulty_breakdown: {
            easy: result.filter(q => q.difficulty_level === 'easy').length,
            medium: result.filter(q => q.difficulty_level === 'medium').length,
            hard: result.filter(q => q.difficulty_level === 'hard').length,
          },
          topic_distribution: {},
          generation_time: new Date().toISOString(),
          ai_model_used: 'Multi-Agent System',
          confidence_score: 0.9
        };

        // Calculate topic distribution
        result.forEach(question => {
          const topic = question.topic || 'Unknown';
          generationMetadata.topic_distribution[topic] = (generationMetadata.topic_distribution[topic] || 0) + 1;
        });

      } else if (result.generated_questions && Array.isArray(result.generated_questions)) {
        // Expected format with generated_questions array
        console.log('📋 Processing structured response with', result.generated_questions.length, 'questions');
        generatedQuestions = result.generated_questions;
        generationMetadata = result.generation_metadata || {};
      } else {
        console.error('❌ Unexpected response format:', result);
        throw new Error('Unexpected response format from N8N workflow');
      }

      console.log('✅ Processed questions:', {
        total: generatedQuestions.length,
        technical: generationMetadata.technical_count,
        aptitude: generationMetadata.aptitude_count,
        mcq: generationMetadata.mcq_count,
        text: generationMetadata.text_count
      });

      return {
        generated_questions: generatedQuestions,
        generation_metadata: generationMetadata
      };
    } catch (error) {
      console.error('❌ Error calling N8N question generation workflow:', error);
      throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate questions based on candidate's CV/Resume
   */
  async generateQuestionsFromCV(request: CVQuestionGenerationRequest): Promise<CVQuestionGenerationResponse> {
    try {
      console.log('🚀 Calling N8N CV question generation webhook:', N8N_CV_QUESTION_GENERATOR_WEBHOOK);
      console.log('📋 CV Request payload:', JSON.stringify(request, null, 2));
      
      const response = await fetch(N8N_CV_QUESTION_GENERATOR_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ N8N CV workflow failed:', errorText);
        throw new Error(`N8N CV workflow failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📥 Raw N8N CV response:', result);

      // Handle different response formats
      let generatedQuestions: GeneratedQuestion[] = [];
      let generationMetadata: any = {};

      if (Array.isArray(result)) {
        // Direct array response
        console.log('📋 Processing direct array response with', result.length, 'CV-based questions');
        generatedQuestions = result;
        
        // Extract skills covered from questions
        const skillsCovered = new Set<string>();
        result.forEach(q => {
          if (q.tags) {
            q.tags.forEach((tag: string) => skillsCovered.add(tag));
          }
          if (q.topic) {
            skillsCovered.add(q.topic);
          }
        });

        // Generate metadata from the questions
        generationMetadata = {
          total_generated: result.length,
          technical_count: result.filter(q => q.question_category === 'technical').length,
          aptitude_count: result.filter(q => q.question_category === 'aptitude').length,
          mcq_count: result.filter(q => q.question_type === 'mcq').length,
          text_count: result.filter(q => q.question_type === 'text').length,
          difficulty_breakdown: {
            easy: result.filter(q => q.difficulty_level === 'easy').length,
            medium: result.filter(q => q.difficulty_level === 'medium').length,
            hard: result.filter(q => q.difficulty_level === 'hard').length,
          },
          skills_covered: Array.from(skillsCovered),
          generation_time: new Date().toISOString(),
          ai_model_used: 'Multi-Agent System',
          confidence_score: 0.9
        };

      } else if (result.generated_questions && Array.isArray(result.generated_questions)) {
        // Expected format with generated_questions array
        console.log('📋 Processing structured CV response with', result.generated_questions.length, 'questions');
        generatedQuestions = result.generated_questions;
        generationMetadata = result.generation_metadata || {};
      } else {
        console.error('❌ Unexpected CV response format:', result);
        throw new Error('Unexpected response format from N8N CV workflow');
      }

      console.log('✅ Processed CV-based questions:', {
        total: generatedQuestions.length,
        technical: generationMetadata.technical_count,
        aptitude: generationMetadata.aptitude_count,
        mcq: generationMetadata.mcq_count,
        text: generationMetadata.text_count,
        skills_covered: generationMetadata.skills_covered
      });

      return {
        generated_questions: generatedQuestions,
        generation_metadata: generationMetadata
      };
    } catch (error) {
      console.error('❌ Error calling N8N CV question generation workflow:', error);
      throw new Error(`Failed to generate CV-based questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Evaluate text answers using N8N workflow
   */
  async evaluateAnswer(request: AnswerEvaluationRequest): Promise<AnswerEvaluationResponse> {
    try {
      const response = await fetch(N8N_ANSWER_EVALUATOR_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`N8N workflow failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error calling N8N answer evaluation workflow:', error);
      throw new Error(`Failed to evaluate answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assess question quality using N8N workflow
   */
  async assessQuality(request: QualityAssessmentRequest): Promise<QualityAssessmentResponse> {
    try {
      const response = await fetch(N8N_QUALITY_ASSESSOR_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`N8N workflow failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error calling N8N quality assessment workflow:', error);
      throw new Error(`Failed to assess quality: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test N8N workflow connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/webhook/health-check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('N8N workflow connection test failed:', error);
      return false;
    }
  }

  /**
   * Get workflow status and metrics
   */
  async getWorkflowStatus(): Promise<{
    status: 'active' | 'inactive' | 'error';
    last_run: string;
    success_rate: number;
    average_response_time: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/webhook/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflow status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting workflow status:', error);
      return {
        status: 'error',
        last_run: new Date().toISOString(),
        success_rate: 0,
        average_response_time: 0,
      };
    }
  }
}

// Export singleton instance
export const n8nExamWorkflows = new N8NExamWorkflows();

// Helper functions for building requests
export const buildQuestionGenerationRequest = (
  jobDescription: any,
  config: any,
  inputMethod: string,
  sourceInfo: any
): QuestionGenerationRequest => {
  const baseRequest: QuestionGenerationRequest = {
    generation_config: {
      total_questions: config.total_questions || 15,
      technical_percentage: config.technical_percentage || 70,
      aptitude_percentage: config.aptitude_percentage || 30,
      difficulty_distribution: {
        easy: config.difficulty_distribution?.easy || 20,
        medium: config.difficulty_distribution?.medium || 50,
        hard: config.difficulty_distribution?.hard || 30,
      },
      question_types: {
        mcq: config.question_types?.mcq || 60,
        text: config.question_types?.text || 40,
      },
      topics: config.topics || [],
    },
    input_method: inputMethod as any,
    source_info: sourceInfo,
  };

  // For existing_jd, only send the job description ID
  if (inputMethod === 'existing_jd' && sourceInfo.job_description_id) {
    return {
      ...baseRequest,
      job_description_id: sourceInfo.job_description_id,
    };
  }

  // For other methods, send the full job description data
  return {
    ...baseRequest,
    job_description: {
      title: jobDescription.title || '',
      description: jobDescription.description || '',
      required_skills: jobDescription.required_skills || [],
      preferred_skills: jobDescription.preferred_skills || [],
      experience_level: jobDescription.experience_level || 'mid-level',
      employment_type: jobDescription.employment_type || 'full-time',
      technical_stack: jobDescription.technical_stack || [],
      key_responsibilities: jobDescription.key_responsibilities || [],
      education_requirements: jobDescription.education_requirements || '',
    },
  };
};

export const buildAnswerEvaluationRequest = (
  question: any,
  candidateAnswer: string
): AnswerEvaluationRequest => {
  return {
    question_id: question.id,
    question_text: question.question_text,
    correct_answer: question.correct_answer,
    candidate_answer: candidateAnswer,
    question_type: question.question_type,
    difficulty_level: question.difficulty_level,
    points: question.points,
    evaluation_criteria: {
      accuracy_weight: 0.4,
      completeness_weight: 0.3,
      clarity_weight: 0.2,
      example_weight: 0.1,
    },
  };
};

export const buildQualityAssessmentRequest = (
  question: any
): QualityAssessmentRequest => {
  return {
    question_text: question.question_text,
    question_type: question.question_type,
    difficulty_level: question.difficulty_level,
    topic: question.topic || '',
    mcq_options: question.mcq_options,
    correct_answer: question.correct_answer,
  };
};

/**
 * Build CV-based question generation request from candidate data
 */
export const buildCvQuestionGenerationRequest = (
  candidate: {
    name: string;
    skills?: any;
    experience?: any[];
    education?: any[];
    projects?: any;
    resume_summary?: string;
    resume_text?: string;
  },
  config: {
    total_questions?: number;
    technical_percentage?: number;
    aptitude_percentage?: number;
    difficulty_distribution?: {
      easy?: number;
      medium?: number;
      hard?: number;
    };
    question_types?: {
      mcq?: number;
      text?: number;
    };
    focus_areas?: string[];
  }
): CVQuestionGenerationRequest => {
  // Normalize skills to array format
  let skillsArray: string[] = [];
  if (candidate.skills) {
    if (Array.isArray(candidate.skills)) {
      skillsArray = candidate.skills.map(s => typeof s === 'string' ? s : s.name || String(s));
    } else if (typeof candidate.skills === 'object') {
      // Handle object format like { technical: [...], soft: [...] }
      Object.values(candidate.skills).forEach((group: any) => {
        if (Array.isArray(group)) {
          skillsArray.push(...group.map(s => typeof s === 'string' ? s : String(s)));
        }
      });
    }
  }

  // Normalize projects to array format
  let projectsArray: any[] = [];
  if (candidate.projects) {
    if (Array.isArray(candidate.projects)) {
      projectsArray = candidate.projects;
    } else if (typeof candidate.projects === 'object') {
      projectsArray = [candidate.projects];
    }
  }

  return {
    candidate_info: {
      name: candidate.name || 'Unknown',
      skills: skillsArray,
      experience: candidate.experience || [],
      education: candidate.education || [],
      projects: projectsArray,
      resume_summary: candidate.resume_summary || '',
      resume_text: candidate.resume_text || '',
    },
    generation_config: {
      total_questions: config.total_questions || 15,
      technical_percentage: config.technical_percentage || 70,
      aptitude_percentage: config.aptitude_percentage || 30,
      difficulty_distribution: {
        easy: config.difficulty_distribution?.easy || 20,
        medium: config.difficulty_distribution?.medium || 50,
        hard: config.difficulty_distribution?.hard || 30,
      },
      question_types: {
        mcq: config.question_types?.mcq || 100, // Default to 100% MCQ for CV-based exams
        text: config.question_types?.text || 0,
      },
      focus_areas: config.focus_areas || [],
    },
    input_method: 'cv_based',
  };
};
