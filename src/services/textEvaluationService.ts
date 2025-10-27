// Text Evaluation Service
// Handles AI-powered evaluation of text answers through n8n workflows

import { supabase } from './supabase';
import { ExamSession, Candidate, JobDescription } from '../types';

export interface TextEvaluationRequest {
  session_id: string;
  evaluation_request: {
    timestamp: string;
    exam_session: {
      id: string;
      duration_minutes: number;
      total_questions: number;
      started_at: string;
      completed_at: string;
    };
    candidate: {
      id: string;
      name: string;
      email: string;
      experience_years?: number;
      skills?: string[];
      current_role?: string;
    };
    job_description: {
      id: string;
      title: string;
      company?: string;
      required_skills?: string[];
      experience_required?: string;
      job_description_text?: string;
    };
    text_questions: Array<{
      question_id: string;
      question_text: string;
      question_category: string;
      difficulty_level: string;
      points: number;
      expected_keywords?: string[];
      candidate_answer: string;
      time_taken_seconds?: number;
      answered_at: string;
    }>;
    mcq_summary: {
      total_mcq_questions: number;
      correct_answers: number;
      mcq_score: number;
      mcq_percentage: number;
    };
    evaluation_criteria: {
      technical_accuracy_weight: number;
      completeness_weight: number;
      clarity_weight: number;
      relevance_weight: number;
      minimum_score_threshold: number;
    };
  };
}

export interface TextEvaluationResponse {
  success: boolean;
  action: string;
  session_id: string;
  status: string;
  evaluated_count?: number;
  overall_score?: number;
  average_confidence?: number;
  processing_time?: number;
  message: string;
  error?: string;
}

export interface TextEvaluationResult {
  question_id: string;
  score: number;
  max_score: number;
  percentage: number;
  is_passing: boolean;
  detailed_scores: {
    technical_accuracy: number;
    completeness: number;
    clarity: number;
    relevance: number;
  };
  feedback: {
    overall: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  keyword_analysis: {
    expected_keywords_found: string[];
    missing_keywords: string[];
    keyword_coverage_percentage: number;
  };
  ai_confidence: number;
  evaluation_method: string;
  reasoning: string;
  evaluated_at: string;
}

export class TextEvaluationService {
  private static readonly N8N_WEBHOOK_URL = process.env.REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK;

  // Debug logging for webhook URL - called when class is first used
  private static logDebugInfo(): void {
    console.log('🔧 TextEvaluationService Debug Info:');
    console.log('Environment variable REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK:', process.env.REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK);
    console.log('N8N_WEBHOOK_URL:', TextEvaluationService.N8N_WEBHOOK_URL);
  }

  /**
   * Trigger text evaluation for a completed exam session
   */
  static async evaluateTextAnswers(sessionId: string): Promise<TextEvaluationResponse> {
    try {
      // Log debug information
      this.logDebugInfo();
      
      console.log('🤖 Starting text evaluation for session:', sessionId);

      // Check if webhook URL is configured
      if (!this.N8N_WEBHOOK_URL) {
        const errorMsg = 'Text evaluation webhook URL is not configured. Please set REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK environment variable.';
        console.error('❌', errorMsg);
        return {
          success: false,
          action: 'text_evaluation_failed',
          session_id: sessionId,
          status: 'error',
          error: errorMsg,
          message: 'Text evaluation webhook not configured'
        };
      }

      // Get exam session data
      const sessionData = await this.getSessionData(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or invalid');
      }

      // Get text questions and responses
      const textQuestions = await this.getTextQuestions(sessionId);
      if (textQuestions.length === 0) {
        console.log('📝 No text questions found for evaluation');
        return {
          success: true,
          action: 'text_evaluation_complete',
          session_id: sessionId,
          status: 'success',
          evaluated_count: 0,
          message: 'No text questions to evaluate'
        };
      }

      // Get MCQ summary for context
      const mcqSummary = await this.getMCQSummary(sessionId);

      // Prepare evaluation request
      const evaluationRequest: TextEvaluationRequest = {
        session_id: sessionId,
        evaluation_request: {
          timestamp: new Date().toISOString(),
          exam_session: {
            id: sessionData.session.id,
            duration_minutes: sessionData.session.duration_minutes,
            total_questions: sessionData.session.total_questions,
            started_at: sessionData.session.started_at || '',
            completed_at: sessionData.session.completed_at || ''
          },
          candidate: {
            id: sessionData.candidate.id,
            name: sessionData.candidate.name,
            email: sessionData.candidate.email,
            experience_years: 0, // Default value since not available in Candidate interface
            skills: Array.isArray(sessionData.candidate.skills) ? sessionData.candidate.skills : [],
            current_role: 'Not specified' // Default value since not available in Candidate interface
          },
          job_description: {
            id: sessionData.jobDescription.id,
            title: sessionData.jobDescription.title,
            company: sessionData.jobDescription.department, // Using department as company
            required_skills: sessionData.jobDescription.required_skills || sessionData.jobDescription.skills || [],
            experience_required: sessionData.jobDescription.experienceLevel || 'Not specified',
            job_description_text: sessionData.jobDescription.description
          },
          text_questions: textQuestions,
          mcq_summary: mcqSummary,
          evaluation_criteria: {
            technical_accuracy_weight: 0.4,
            completeness_weight: 0.3,
            clarity_weight: 0.2,
            relevance_weight: 0.1,
            minimum_score_threshold: 60
          }
        }
      };

      console.log('📤 Sending text evaluation request to n8n:', {
        sessionId,
        textQuestionsCount: textQuestions.length,
        candidateName: sessionData.candidate.name
      });

      // Call n8n webhook
      const response = await fetch(this.N8N_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ n8n webhook failed:', response.status, errorText);
        throw new Error(`n8n webhook failed: ${response.status} ${errorText}`);
      }

      // Debug: Check response content before parsing
      const responseText = await response.text();
      console.log('🔍 Raw n8n response:', responseText);
      
      if (!responseText || responseText.trim() === '') {
        console.error('❌ Empty response from n8n');
        throw new Error('Empty response from n8n workflow');
      }

      let result: TextEvaluationResponse;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('❌ Response text that failed to parse:', responseText);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        throw new Error(`Failed to parse n8n response: ${errorMessage}`);
      }
      
      console.log('✅ Text evaluation completed:', {
        success: result.success,
        evaluatedCount: result.evaluated_count,
        overallScore: result.overall_score,
        processingTime: result.processing_time
      });

      return result;

    } catch (error) {
      console.error('❌ Error in text evaluation:', error);
      return {
        success: false,
        action: 'text_evaluation_failed',
        session_id: sessionId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Text evaluation failed'
      };
    }
  }

  /**
   * Get session data with candidate and job description
   */
  private static async getSessionData(sessionId: string): Promise<{
    session: ExamSession;
    candidate: Candidate;
    jobDescription: JobDescription;
  } | null> {
    try {
      const { data: session, error } = await supabase
        .from('exam_sessions')
        .select(`
          *,
          candidate:candidates(*),
          job_description:job_descriptions(*)
        `)
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        console.error('Error fetching session:', error);
        return null;
      }

      return {
        session: session as ExamSession,
        candidate: Array.isArray(session.candidate) ? session.candidate[0] : session.candidate,
        jobDescription: Array.isArray(session.job_description) ? session.job_description[0] : session.job_description
      };
    } catch (error) {
      console.error('Error in getSessionData:', error);
      return null;
    }
  }

  /**
   * Get text questions and responses for evaluation
   */
  private static async getTextQuestions(sessionId: string): Promise<Array<{
    question_id: string;
    question_text: string;
    question_category: string;
    difficulty_level: string;
    points: number;
    expected_keywords?: string[];
    candidate_answer: string;
    time_taken_seconds?: number;
    answered_at: string;
  }>> {
    try {
      const { data: responses, error } = await supabase
        .from('exam_responses')
        .select(`
          *,
          question:exam_questions(*)
        `)
        .eq('exam_session_id', sessionId)
        .eq('question.question_type', 'text');

      if (error) {
        console.error('Error fetching text responses:', error);
        return [];
      }

      // Filter out questions with empty question_text (these are likely misclassified MCQ questions)
      const validTextQuestions = (responses || []).filter(response => {
        const hasQuestionText = response.question?.question_text && response.question.question_text.trim() !== '';
        if (!hasQuestionText) {
          console.log('⚠️ Skipping text question with empty question_text:', {
            questionId: response.question_id,
            questionType: response.question?.question_type,
            hasQuestionText: !!response.question?.question_text,
            candidateAnswer: response.answer_text
          });
        }
        return hasQuestionText;
      });

      console.log('📝 Text questions filtering:', {
        totalTextResponses: (responses || []).length,
        validTextQuestions: validTextQuestions.length,
        filteredOut: (responses || []).length - validTextQuestions.length
      });

      return validTextQuestions.map(response => ({
        question_id: response.question_id,
        question_text: response.question?.question_text || '',
        question_category: response.question?.question_category || 'technical',
        difficulty_level: response.question?.difficulty_level || 'medium',
        points: response.question?.points || 1,
        expected_keywords: response.question?.correct_answer?.split(',').map((k: string) => k.trim()),
        candidate_answer: response.answer_text,
        time_taken_seconds: response.time_taken_seconds,
        answered_at: response.answered_at
      }));
    } catch (error) {
      console.error('Error in getTextQuestions:', error);
      return [];
    }
  }

  /**
   * Get MCQ summary for context
   */
  private static async getMCQSummary(sessionId: string): Promise<{
    total_mcq_questions: number;
    correct_answers: number;
    mcq_score: number;
    mcq_percentage: number;
  }> {
    try {
      const { data: responses, error } = await supabase
        .from('exam_responses')
        .select(`
          *,
          question:exam_questions(*)
        `)
        .eq('exam_session_id', sessionId)
        .eq('question.question_type', 'mcq');

      if (error) {
        console.error('Error fetching MCQ responses:', error);
        return {
          total_mcq_questions: 0,
          correct_answers: 0,
          mcq_score: 0,
          mcq_percentage: 0
        };
      }

      const mcqResponses = responses || [];
      const totalMCQQuestions = mcqResponses.length;
      const correctAnswers = mcqResponses.filter(r => r.is_correct).length;
      const mcqScore = mcqResponses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
      const mcqPercentage = totalMCQQuestions > 0 ? (correctAnswers / totalMCQQuestions) * 100 : 0;

      return {
        total_mcq_questions: totalMCQQuestions,
        correct_answers: correctAnswers,
        mcq_score: mcqScore,
        mcq_percentage: Math.round(mcqPercentage * 100) / 100
      };
    } catch (error) {
      console.error('Error in getMCQSummary:', error);
      return {
        total_mcq_questions: 0,
        correct_answers: 0,
        mcq_score: 0,
        mcq_percentage: 0
      };
    }
  }

  /**
   * Check if text evaluation is needed for a session
   */
  static async needsTextEvaluation(sessionId: string): Promise<boolean> {
    try {
      const { data: responses, error } = await supabase
        .from('exam_responses')
        .select(`
          *,
          question:exam_questions(*)
        `)
        .eq('exam_session_id', sessionId)
        .eq('question.question_type', 'text');

      if (error) {
        console.error('Error checking text evaluation need:', error);
        return false;
      }

      // Check if there are text questions that haven't been AI evaluated
      const textResponses = responses || [];
      const needsEvaluation = textResponses.some(response => 
        !response.evaluation_details || 
        !response.evaluation_details.autoEvaluated
      );

      console.log('📝 Text evaluation check:', {
        sessionId,
        textQuestionsCount: textResponses.length,
        needsEvaluation
      });

      return needsEvaluation;
    } catch (error) {
      console.error('Error in needsTextEvaluation:', error);
      return false;
    }
  }

  /**
   * Get text evaluation results for a session
   */
  static async getTextEvaluationResults(sessionId: string): Promise<TextEvaluationResult[]> {
    try {
      const { data: responses, error } = await supabase
        .from('exam_responses')
        .select(`
          *,
          question:exam_questions(*)
        `)
        .eq('exam_session_id', sessionId)
        .eq('question.question_type', 'text')
        .not('evaluation_details', 'is', null);

      if (error) {
        console.error('Error fetching text evaluation results:', error);
        return [];
      }

      return (responses || [])
        .filter(response => response.evaluation_details?.autoEvaluated)
        .map(response => ({
          question_id: response.question_id,
          score: response.points_earned,
          max_score: response.question?.points || 1,
          percentage: response.question?.points ? (response.points_earned / response.question.points) * 100 : 0,
          is_passing: response.is_correct || false,
          detailed_scores: response.evaluation_details?.detailedScores || {},
          feedback: response.evaluation_details?.feedback || {},
          keyword_analysis: response.evaluation_details?.keywordAnalysis || {},
          ai_confidence: response.evaluation_details?.confidence || 0,
          evaluation_method: response.evaluation_details?.evaluationMethod || 'ai_analysis',
          reasoning: response.evaluation_details?.reasoning || '',
          evaluated_at: response.evaluation_details?.evaluatedAt || response.answered_at
        }));
    } catch (error) {
      console.error('Error in getTextEvaluationResults:', error);
      return [];
    }
  }
}
