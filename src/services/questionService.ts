// Question Service
// Service for managing exam questions, AI generation, and approval workflow

import { supabase } from './supabase';
import { 
  ExamQuestion, 
  CreateQuestionRequest, 
  UpdateQuestionRequest,
  QuestionFilter,
  QuestionGenerationRequest,
  QuestionGenerationResponse
} from '../types';

export interface QuestionServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class QuestionService {
  // ===== QUESTION CRUD OPERATIONS =====

  /**
   * Get all questions with filtering and pagination
   */
  async getQuestions(filter: QuestionFilter = {}): Promise<QuestionServiceResponse<ExamQuestion[]>> {
    try {
      let query = supabase
        .from('exam_questions')
        .select(`
          *,
          topic:question_topics(*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter.category) {
        query = query.eq('question_category', filter.category);
      }
      if (filter.difficulty) {
        query = query.eq('difficulty_level', filter.difficulty);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.job_description_id) {
        query = query.eq('job_description_id', filter.job_description_id);
      }
      if (filter.search) {
        query = query.ilike('question_text', `%${filter.search}%`);
      }
      if (filter.topic_id) {
        query = query.eq('topic_id', filter.topic_id);
      }

      // Pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching questions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getQuestions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch questions' 
      };
    }
  }

  /**
   * Get question by ID
   */
  async getQuestionById(id: string): Promise<QuestionServiceResponse<ExamQuestion>> {
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .select(`
          *,
          topic:question_topics(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Question not found' };
        }
        console.error('Error fetching question:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getQuestionById:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch question' 
      };
    }
  }

  /**
   * Create a new question
   */
  async createQuestion(request: CreateQuestionRequest): Promise<QuestionServiceResponse<ExamQuestion>> {
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .insert([{
          job_description_id: request.job_description_id,
          question_text: request.question_text,
          question_type: request.question_type,
          question_category: request.question_category,
          difficulty_level: request.difficulty_level,
          mcq_options: request.mcq_options,
          correct_answer: request.correct_answer,
          answer_explanation: request.answer_explanation,
          points: request.points || 1,
          time_limit_seconds: request.time_limit_seconds || 60,
          tags: request.tags || [],
          topic_id: request.topic_id,
          subtopic: request.subtopic,
          created_by: request.created_by || 'hr',
          status: request.status || 'draft',
          hr_notes: request.hr_notes
        }])
        .select(`
          *,
          topic:question_topics(*)
        `)
        .single();

      if (error) {
        console.error('Error creating question:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createQuestion:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create question' 
      };
    }
  }

  /**
   * Update an existing question
   */
  async updateQuestion(id: string, request: UpdateQuestionRequest): Promise<QuestionServiceResponse<ExamQuestion>> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only update provided fields
      if (request.question_text !== undefined) updateData.question_text = request.question_text;
      if (request.question_type !== undefined) updateData.question_type = request.question_type;
      if (request.question_category !== undefined) updateData.question_category = request.question_category;
      if (request.difficulty_level !== undefined) updateData.difficulty_level = request.difficulty_level;
      if (request.mcq_options !== undefined) updateData.mcq_options = request.mcq_options;
      if (request.correct_answer !== undefined) updateData.correct_answer = request.correct_answer;
      if (request.answer_explanation !== undefined) updateData.answer_explanation = request.answer_explanation;
      if (request.points !== undefined) updateData.points = request.points;
      if (request.time_limit_seconds !== undefined) updateData.time_limit_seconds = request.time_limit_seconds;
      if (request.tags !== undefined) updateData.tags = request.tags;
      if (request.topic_id !== undefined) updateData.topic_id = request.topic_id;
      if (request.subtopic !== undefined) updateData.subtopic = request.subtopic;
      if (request.status !== undefined) updateData.status = request.status;
      if (request.hr_notes !== undefined) updateData.hr_notes = request.hr_notes;
      if (request.is_active !== undefined) updateData.is_active = request.is_active;

      const { data, error } = await supabase
        .from('exam_questions')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          topic:question_topics(*)
        `)
        .single();

      if (error) {
        console.error('Error updating question:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateQuestion:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update question' 
      };
    }
  }

  /**
   * Delete a question
   */
  async deleteQuestion(id: string): Promise<QuestionServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('exam_questions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting question:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Error in deleteQuestion:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete question' 
      };
    }
  }

  // ===== BULK OPERATIONS =====

  /**
   * Bulk update question status
   */
  async bulkUpdateStatus(questionIds: string[], status: string): Promise<QuestionServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('exam_questions')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', questionIds);

      if (error) {
        console.error('Error bulk updating status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Error in bulkUpdateStatus:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to bulk update status' 
      };
    }
  }

  /**
   * Bulk delete questions
   */
  async bulkDelete(questionIds: string[]): Promise<QuestionServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('exam_questions')
        .delete()
        .in('id', questionIds);

      if (error) {
        console.error('Error bulk deleting questions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Error in bulkDelete:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to bulk delete questions' 
      };
    }
  }

  // ===== AI QUESTION GENERATION =====

  /**
   * Generate questions using AI
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<QuestionServiceResponse<QuestionGenerationResponse>> {
    try {
      console.log('🚀 Generating questions with AI:', request);

      // Call the n8n question generation webhook
      const response = await fetch(process.env.REACT_APP_N8N_QUESTION_GENERATOR || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI generation failed:', errorText);
        return { 
          success: false, 
          error: `AI generation failed: ${response.status} ${response.statusText}` 
        };
      }

      const result = await response.json();
      console.log('✅ AI generation successful:', result);

      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error in generateQuestions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate questions' 
      };
    }
  }

  /**
   * Save AI-generated questions to database
   */
  async saveGeneratedQuestions(
    questions: any[], 
    jobDescriptionId: string,
    metadata: any = {}
  ): Promise<QuestionServiceResponse<ExamQuestion[]>> {
    try {
      const questionsToInsert = questions.map(q => ({
        job_description_id: jobDescriptionId,
        question_text: q.question_text,
        question_type: q.question_type,
        question_category: q.question_category,
        difficulty_level: q.difficulty_level,
        mcq_options: q.mcq_options,
        correct_answer: q.correct_answer,
        answer_explanation: q.answer_explanation,
        points: q.points || 1,
        time_limit_seconds: q.time_limit_seconds || 60,
        tags: q.tags || [],
        topic_id: q.topic_id,
        subtopic: q.subtopic,
        created_by: 'ai',
        status: 'pending', // AI-generated questions need HR approval
        hr_notes: `AI Generated - ${metadata.ai_model_used || 'Unknown Model'}`
      }));

      const { data, error } = await supabase
        .from('exam_questions')
        .insert(questionsToInsert)
        .select(`
          *,
          topic:question_topics(*)
        `);

      if (error) {
        console.error('Error saving generated questions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in saveGeneratedQuestions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save generated questions' 
      };
    }
  }

  // ===== STATISTICS =====

  /**
   * Get question statistics
   */
  async getQuestionStats(jobDescriptionId?: string): Promise<QuestionServiceResponse<any>> {
    try {
      let query = supabase
        .from('exam_questions')
        .select('question_category, difficulty_level, status, created_by');

      if (jobDescriptionId) {
        query = query.eq('job_description_id', jobDescriptionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching question stats:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        total: data?.length || 0,
        by_category: {
          technical: data?.filter(q => q.question_category === 'technical').length || 0,
          aptitude: data?.filter(q => q.question_category === 'aptitude').length || 0
        },
        by_difficulty: {
          easy: data?.filter(q => q.difficulty_level === 'easy').length || 0,
          medium: data?.filter(q => q.difficulty_level === 'medium').length || 0,
          hard: data?.filter(q => q.difficulty_level === 'hard').length || 0
        },
        by_status: {
          draft: data?.filter(q => q.status === 'draft').length || 0,
          pending: data?.filter(q => q.status === 'pending').length || 0,
          approved: data?.filter(q => q.status === 'approved').length || 0,
          rejected: data?.filter(q => q.status === 'rejected').length || 0
        },
        by_creator: {
          hr: data?.filter(q => q.created_by === 'hr').length || 0,
          ai: data?.filter(q => q.created_by === 'ai').length || 0
        }
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error in getQuestionStats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch question statistics' 
      };
    }
  }
}

export const questionService = new QuestionService();