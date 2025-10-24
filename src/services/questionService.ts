import { supabase } from './supabase';
import { QuestionTopic } from '../types';

export interface QuestionFormData {
  question_text: string;
  question_type: 'mcq' | 'text';
  question_category: 'technical' | 'aptitude';
  difficulty_level: 'easy' | 'medium' | 'hard';
  topic_id: string;
  subtopic: string;
  points: number;
  time_limit_seconds: number;
  mcq_options: Array<{
    option: string;
    text: string;
  }>;
  correct_answer: string;
  answer_explanation: string;
  tags: string[];
}

export interface Question {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'text';
  question_category: 'technical' | 'aptitude';
  difficulty_level: 'easy' | 'medium' | 'hard';
  topic_id: string;
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
  created_by: 'hr' | 'ai';
  created_by_user_id?: string;
  status: 'draft' | 'approved' | 'rejected';
  hr_notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  topic?: QuestionTopic;
}

// Using QuestionTopic from types instead of local Topic interface

export class QuestionService {
  /**
   * Create a new question
   */
  async createQuestion(questionData: QuestionFormData, userId?: string): Promise<Question> {
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .insert({
          question_text: questionData.question_text,
          question_type: questionData.question_type,
          question_category: questionData.question_category,
          difficulty_level: questionData.difficulty_level,
          topic_id: questionData.topic_id,
          subtopic: questionData.subtopic || null,
          points: questionData.points,
          time_limit_seconds: questionData.time_limit_seconds,
          mcq_options: questionData.question_type === 'mcq' ? questionData.mcq_options : null,
          correct_answer: questionData.correct_answer,
          answer_explanation: questionData.answer_explanation,
          tags: questionData.tags,
          created_by: 'hr',
          created_by_user_id: userId,
          status: 'draft',
          is_active: true
        })
        .select(`
          *,
          topic:question_topics(id, name, category)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create question: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  /**
   * Get all questions with filters
   */
  async getQuestions(filters?: {
    category?: 'technical' | 'aptitude';
    difficulty?: 'easy' | 'medium' | 'hard';
    type?: 'mcq' | 'text';
    status?: 'draft' | 'approved' | 'rejected';
    topic_id?: string;
    search?: string;
  }): Promise<Question[]> {
    try {
      let query = supabase
        .from('exam_questions')
        .select(`
          *,
          topic:question_topics(id, name, category)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('question_category', filters.category);
      }

      if (filters?.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty);
      }

      if (filters?.type) {
        query = query.eq('question_type', filters.type);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.topic_id) {
        query = query.eq('topic_id', filters.topic_id);
      }

      if (filters?.search) {
        query = query.ilike('question_text', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch questions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  /**
   * Get a single question by ID
   */
  async getQuestionById(id: string): Promise<Question | null> {
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .select(`
          *,
          topic:question_topics(id, name, category)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Question not found
        }
        throw new Error(`Failed to fetch question: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw error;
    }
  }

  /**
   * Update a question
   */
  async updateQuestion(id: string, updates: Partial<QuestionFormData>, userId?: string): Promise<Question> {
    try {
      const updateData: any = {
        ...updates,
        last_modified_by: userId,
        last_modified_at: new Date().toISOString()
      };

      // Handle MCQ options
      if (updates.question_type === 'mcq' && updates.mcq_options) {
        updateData.mcq_options = updates.mcq_options;
      } else if (updates.question_type === 'text') {
        updateData.mcq_options = null;
      }

      const { data, error } = await supabase
        .from('exam_questions')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          topic:question_topics(id, name, category)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update question: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  }

  /**
   * Delete a question (soft delete)
   */
  async deleteQuestion(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('exam_questions')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete question: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  }

  /**
   * Update question status
   */
  async updateQuestionStatus(id: string, status: 'draft' | 'approved' | 'rejected', notes?: string): Promise<Question> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.hr_notes = notes;
      }

      const { data, error } = await supabase
        .from('exam_questions')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          topic:question_topics(id, name, category)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update question status: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating question status:', error);
      throw error;
    }
  }

  /**
   * Get all topics
   */
  async getTopics(): Promise<QuestionTopic[]> {
    try {
      const { data, error } = await supabase
        .from('question_topics')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch topics: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  }

  /**
   * Get question statistics
   */
  async getQuestionStats(): Promise<{
    total: number;
    by_category: { technical: number; aptitude: number };
    by_type: { mcq: number; text: number };
    by_difficulty: { easy: number; medium: number; hard: number };
    by_status: { draft: number; approved: number; rejected: number };
  }> {
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .select('question_category, question_type, difficulty_level, status')
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to fetch question stats: ${error.message}`);
      }

      const stats = {
        total: data.length,
        by_category: { technical: 0, aptitude: 0 },
        by_type: { mcq: 0, text: 0 },
        by_difficulty: { easy: 0, medium: 0, hard: 0 },
        by_status: { draft: 0, approved: 0, rejected: 0 }
      };

      data.forEach(question => {
        // Category stats
        if (question.question_category === 'technical') {
          stats.by_category.technical++;
        } else if (question.question_category === 'aptitude') {
          stats.by_category.aptitude++;
        }

        // Type stats
        if (question.question_type === 'mcq') {
          stats.by_type.mcq++;
        } else if (question.question_type === 'text') {
          stats.by_type.text++;
        }

        // Difficulty stats
        if (question.difficulty_level === 'easy') {
          stats.by_difficulty.easy++;
        } else if (question.difficulty_level === 'medium') {
          stats.by_difficulty.medium++;
        } else if (question.difficulty_level === 'hard') {
          stats.by_difficulty.hard++;
        }

        // Status stats
        if (question.status === 'draft') {
          stats.by_status.draft++;
        } else if (question.status === 'approved') {
          stats.by_status.approved++;
        } else if (question.status === 'rejected') {
          stats.by_status.rejected++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching question stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const questionService = new QuestionService();
