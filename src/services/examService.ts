// Exam Service
// Core service for exam session management, question selection, and adaptive testing

import { supabase } from './supabase';
import { 
  ExamSession, 
  ExamQuestion, 
  ExamResponse, 
  ExamResult,
  CreateExamSessionRequest,
  SubmitAnswerRequest,
  ExamPerformanceMetrics
} from '../types';
import { topicManagementService } from './topicManagementService';

export class ExamService {
  /**
   * Get available questions for a job description
   */
  async getAvailableQuestions(jobDescriptionId: string): Promise<{ count: number; questions: ExamQuestion[] }> {
    try {
      const { data: questions, error } = await supabase
        .from('exam_questions')
        .select(`
          *,
          topic:question_topics(*)
        `)
        .eq('job_description_id', jobDescriptionId)
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching available questions:', error);
        throw new Error(`Failed to fetch questions: ${error.message}`);
      }

      return {
        count: questions?.length || 0,
        questions: questions || []
      };
    } catch (error) {
      console.error('Error in getAvailableQuestions:', error);
      throw error;
    }
  }

  /**
   * Create a new exam session for a candidate
   */
  async createExamSession(request: CreateExamSessionRequest): Promise<ExamSession> {
    const {
      candidate_id,
      job_description_id,
      duration_minutes = 30,
      total_questions = 15,
      expires_in_hours = 48
    } = request;

    // Generate secure exam token
    const exam_token = this.generateExamToken();
    
    // Calculate expiry time
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + expires_in_hours);

    // Check if we have enough questions for this job description
    const { data: availableQuestions, error: questionsError } = await supabase
      .from('exam_questions')
      .select('id')
      .eq('job_description_id', job_description_id)
      .eq('status', 'approved')
      .eq('is_active', true);

    if (questionsError) {
      console.error('Error checking available questions:', questionsError);
      throw new Error(`Failed to check available questions: ${questionsError.message}`);
    }

    const availableCount = availableQuestions?.length || 0;
    console.log(`📊 Available questions for job description ${job_description_id}: ${availableCount}`);

    if (availableCount < total_questions) {
      console.warn(`⚠️ Not enough questions available. Requested: ${total_questions}, Available: ${availableCount}`);
      // Adjust total questions to available count
      const adjustedTotal = Math.min(total_questions, availableCount);
      if (adjustedTotal === 0) {
        throw new Error('No approved questions available for this job description. Please add questions first.');
      }
      console.log(`🔄 Adjusted total questions to: ${adjustedTotal}`);
    }

    // Create exam session
    const { data, error } = await supabase
      .from('exam_sessions')
      .insert([{
        candidate_id,
        job_description_id,
        exam_token,
        total_questions: Math.min(total_questions, availableCount),
        duration_minutes,
        initial_question_count: Math.min(total_questions, availableCount),
        expires_at: expires_at.toISOString(),
        performance_metadata: {}
      }])
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*)
      `)
      .single();

    if (error) {
      console.error('Error creating exam session:', error);
      throw new Error(`Failed to create exam session: ${error.message}`);
    }

    return data;
  }

  /**
   * Get exam session by token
   */
  async getExamByToken(token: string): Promise<ExamSession | null> {
    const { data, error } = await supabase
      .from('exam_sessions')
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*)
      `)
      .eq('exam_token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Session not found
      }
      console.error('Error fetching exam session:', error);
      throw new Error(`Failed to fetch exam session: ${error.message}`);
    }

    // Check if session is expired
    if (new Date(data.expires_at) < new Date()) {
      await this.updateSessionStatus(data.id, 'expired');
      data.status = 'expired';
    }

    return data;
  }

  /**
   * Start an exam session
   */
  async startExamSession(sessionId: string, ipAddress?: string, userAgent?: string): Promise<ExamSession> {
    const { data, error } = await supabase
      .from('exam_sessions')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('status', 'pending') // Only allow starting if still pending
      .select(`
        *,
        candidate:candidates(*),
        job_description:job_descriptions(*)
      `)
      .single();

    if (error) {
      console.error('Error starting exam session:', error);
      throw new Error(`Failed to start exam session: ${error.message}`);
    }

    if (!data) {
      throw new Error('Exam session not found or already started');
    }

    return data;
  }

  /**
   * Update exam session status
   */
  async updateSessionStatus(sessionId: string, status: ExamSession['status']): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('exam_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session status:', error);
      throw new Error(`Failed to update session status: ${error.message}`);
    }
  }

  // ===== QUESTION SELECTION =====

  /**
   * Get questions for an exam session based on job description and topic distribution
   */
  async getExamQuestions(sessionId: string): Promise<ExamQuestion[]> {
    // Get session details
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Exam session not found');
    }

    console.log('🔍 Getting questions for session:', sessionId);
    console.log('📋 Job description ID:', session.job_description_id);
    console.log('📊 Total questions needed:', session.total_questions);

    // Simplified approach: Get questions directly by job description
    const { data: questions, error } = await supabase
      .from('exam_questions')
      .select(`
        *,
        topic:question_topics(*)
      `)
      .eq('job_description_id', session.job_description_id)
      .eq('status', 'approved')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(session.total_questions);

    if (error) {
      console.error('Error fetching questions:', error);
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    console.log('✅ Found', questions?.length || 0, 'questions');
    
    if (questions && questions.length > 0) {
      questions.forEach((q, index) => {
        console.log(`  ${index + 1}. [${q.question_type.toUpperCase()}] [${q.difficulty_level}] ${q.question_text?.substring(0, 50)}...`);
      });
    }

    // Shuffle questions to randomize order
    return this.shuffleArray(questions || []);
  }

  /**
   * Select questions for a specific topic with difficulty distribution
   */
  private async selectQuestionsForTopic(
    jobDescriptionId: string,
    topicId: string,
    questionCount: number,
    difficultyBreakdown: { easy: number; medium: number; hard: number }
  ): Promise<ExamQuestion[]> {
    const questions: ExamQuestion[] = [];

    // Get questions for each difficulty level
    for (const [difficulty, count] of Object.entries(difficultyBreakdown)) {
      if (count > 0) {
        const topicQuestions = await this.getQuestionsByTopicAndDifficulty(
          jobDescriptionId,
          topicId,
          difficulty as 'easy' | 'medium' | 'hard',
          count
        );
        questions.push(...topicQuestions);
      }
    }

    return questions;
  }

  /**
   * Get questions by topic and difficulty
   */
  private async getQuestionsByTopicAndDifficulty(
    jobDescriptionId: string,
    topicId: string,
    difficulty: 'easy' | 'medium' | 'hard',
    limit: number
  ): Promise<ExamQuestion[]> {
    const { data, error } = await supabase
      .from('exam_questions')
      .select(`
        *,
        topic:question_topics(*)
      `)
      .eq('job_description_id', jobDescriptionId)
      .eq('topic_id', topicId)
      .eq('difficulty_level', difficulty)
      .eq('status', 'approved')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching questions:', error);
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    return data || [];
  }

  // ===== ANSWER SUBMISSION =====

  /**
   * Submit an answer for a question
   */
  async submitAnswer(request: SubmitAnswerRequest): Promise<ExamResponse> {
    const { exam_session_id, question_id, answer_text, time_taken_seconds } = request;

    console.log('🔄 Submitting answer:', {
      exam_session_id,
      question_id,
      answer_text: answer_text?.substring(0, 50) + '...',
      time_taken_seconds
    });

    try {
      // Get the question to validate the answer
      const question = await this.getQuestionById(question_id);
      if (!question) {
        console.error('❌ Question not found:', question_id);
        throw new Error('Question not found');
      }

      console.log('✅ Question found:', question.question_text?.substring(0, 50) + '...');

      // Calculate if answer is correct and points earned
      const { is_correct, points_earned } = this.evaluateAnswer(question, answer_text);
      
      console.log('📊 Answer evaluation:', {
        is_correct,
        points_earned,
        question_type: question.question_type,
        correct_answer: question.correct_answer
      });

      // Upsert the response
      const { data, error } = await supabase
        .from('exam_responses')
        .upsert([{
          exam_session_id,
          question_id,
          answer_text,
          is_correct,
          points_earned,
          time_taken_seconds,
          answered_at: new Date().toISOString()
        }], {
          onConflict: 'exam_session_id,question_id'
        })
        .select(`
          *,
          question:exam_questions(*)
        `)
        .single();

      if (error) {
        console.error('❌ Error submitting answer:', error);
        throw new Error(`Failed to submit answer: ${error.message}`);
      }

      console.log('✅ Answer submitted successfully:', data.id);

      // Check if we should add adaptive questions
      await this.checkAndAddAdaptiveQuestions(exam_session_id);

      return data;
    } catch (error) {
      console.error('❌ submitAnswer error:', error);
      throw error;
    }
  }

  /**
   * Evaluate an answer and determine correctness and points
   */
  private evaluateAnswer(question: ExamQuestion, answer: string): { is_correct: boolean; points_earned: number } {
    if (question.question_type === 'mcq') {
      const is_correct = answer.trim().toUpperCase() === question.correct_answer?.trim().toUpperCase();
      return {
        is_correct,
        points_earned: is_correct ? question.points : 0
      };
    } else {
      // For text answers, we'll do basic evaluation here
      // More sophisticated AI evaluation will be done later
      const is_correct = this.evaluateTextAnswer(question, answer);
      return {
        is_correct,
        points_earned: is_correct ? question.points : 0
      };
    }
  }

  /**
   * Basic text answer evaluation (will be enhanced with AI)
   */
  private evaluateTextAnswer(question: ExamQuestion, answer: string): boolean {
    if (!question.correct_answer) return false;
    
    const expectedKeywords = question.correct_answer.toLowerCase().split(',').map(k => k.trim());
    const answerText = answer.toLowerCase();
    
    // Check if answer contains at least 50% of expected keywords
    const matchedKeywords = expectedKeywords.filter(keyword => 
      answerText.includes(keyword)
    );
    
    return matchedKeywords.length >= Math.ceil(expectedKeywords.length * 0.5);
  }

  // ===== ADAPTIVE TESTING =====

  /**
   * Check performance and add adaptive questions if needed
   */
  private async checkAndAddAdaptiveQuestions(sessionId: string): Promise<void> {
    const metrics = await this.calculatePerformanceMetrics(sessionId);
    
    if (metrics.should_add_questions) {
      await this.addAdaptiveQuestions(sessionId, metrics.recommended_difficulty, 5);
    }
  }

  /**
   * Calculate performance metrics for adaptive testing
   */
  async calculatePerformanceMetrics(sessionId: string): Promise<ExamPerformanceMetrics> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Get all responses for this session
    const responses = await this.getSessionResponses(sessionId);
    
    const answeredQuestions = responses.length;
    const correctAnswers = responses.filter(r => r.is_correct).length;
    const accuracy_rate = answeredQuestions > 0 ? correctAnswers / answeredQuestions : 0;
    
    // Calculate average time per question
    const totalTime = responses.reduce((sum, r) => sum + (r.time_taken_seconds || 0), 0);
    const average_time_per_question = answeredQuestions > 0 ? totalTime / answeredQuestions : 0;
    
    // Calculate time remaining
    const sessionStart = new Date(session.started_at!);
    const now = new Date();
    const elapsedMinutes = (now.getTime() - sessionStart.getTime()) / (1000 * 60);
    const time_remaining = session.duration_minutes - elapsedMinutes;
    
    // Determine if we should add questions
    const should_add_questions = 
      accuracy_rate >= 0.8 && 
      average_time_per_question < 30 && // Less than 30 seconds per question
      time_remaining > 10 && // More than 10 minutes remaining
      session.adaptive_questions_added < session.max_adaptive_questions;
    
    // Determine recommended difficulty
    let recommended_difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (accuracy_rate >= 0.9) {
      recommended_difficulty = 'hard';
    } else if (accuracy_rate >= 0.8) {
      recommended_difficulty = 'medium';
    } else {
      recommended_difficulty = 'easy';
    }

    return {
      accuracy_rate,
      average_time_per_question,
      questions_answered: answeredQuestions,
      correct_answers: correctAnswers,
      time_remaining,
      should_add_questions,
      recommended_difficulty
    };
  }

  /**
   * Add adaptive questions to an exam session
   */
  async addAdaptiveQuestions(
    sessionId: string, 
    difficulty: 'easy' | 'medium' | 'hard', 
    count: number
  ): Promise<ExamQuestion[]> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Get additional questions
    const additionalQuestions = await this.getQuestionsByDifficulty(
      session.job_description_id,
      difficulty,
      count
    );

    // Update session with new question count
    await supabase
      .from('exam_sessions')
      .update({
        total_questions: session.total_questions + additionalQuestions.length,
        adaptive_questions_added: session.adaptive_questions_added + additionalQuestions.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    return additionalQuestions;
  }

  // ===== EXAM COMPLETION =====

  /**
   * Complete an exam and calculate final results
   */
  async completeExam(sessionId: string): Promise<ExamResult> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Get all responses
    const responses = await this.getSessionResponses(sessionId);
    
    // Calculate scores
    const total_score = responses.reduce((sum, r) => sum + r.points_earned, 0);
    const max_score = responses.reduce((sum, r) => sum + (r.question?.points || 0), 0);
    const percentage = max_score > 0 ? (total_score / max_score) * 100 : 0;
    
    const correct_answers = responses.filter(r => r.is_correct).length;
    const wrong_answers = responses.filter(r => !r.is_correct).length;
    const skipped_questions = session.total_questions - responses.length;
    
    // Calculate time taken
    const startTime = new Date(session.started_at!);
    const endTime = new Date();
    const time_taken_minutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    // Determine evaluation status
    const evaluation_status = percentage >= 60 ? 'passed' : 'failed';
    
    // Calculate category scores
    const { technical_score, aptitude_score } = this.calculateCategoryScores(responses);
    
    // Create exam result
    const { data, error } = await supabase
      .from('exam_results')
      .insert([{
        exam_session_id: sessionId,
        candidate_id: session.candidate_id,
        total_score,
        max_score,
        percentage,
        correct_answers,
        wrong_answers,
        skipped_questions,
        technical_score,
        aptitude_score,
        time_taken_minutes,
        evaluation_status
      }])
      .select(`
        *,
        exam_session:exam_sessions(*),
        candidate:candidates(*)
      `)
      .single();

    if (error) {
      console.error('Error creating exam result:', error);
      throw new Error(`Failed to create exam result: ${error.message}`);
    }

    // Update session status
    await this.updateSessionStatus(sessionId, 'completed');

    return data;
  }

  /**
   * Calculate category-specific scores
   */
  private calculateCategoryScores(responses: ExamResponse[]): { technical_score: number; aptitude_score: number } {
    let technical_score = 0;
    let aptitude_score = 0;
    
    responses.forEach(response => {
      if (response.question?.question_category === 'technical') {
        technical_score += response.points_earned;
      } else if (response.question?.question_category === 'aptitude') {
        aptitude_score += response.points_earned;
      }
    });
    
    return { technical_score, aptitude_score };
  }

  // ===== HELPER METHODS =====

  /**
   * Generate secure exam token
   */
  private generateExamToken(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `exam_${timestamp}_${randomPart}`;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get session by ID
   */
  private async getSessionById(sessionId: string): Promise<ExamSession | null> {
    console.log('🔍 getSessionById called with:', sessionId);
    
    const { data, error } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('❌ Error in getSessionById:', error);
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch session: ${error.message}`);
    }

    console.log('✅ Session found:', data?.id, data?.status);
    return data;
  }

  /**
   * Get question by ID
   */
  private async getQuestionById(questionId: string): Promise<ExamQuestion | null> {
    console.log('🔍 Getting question by ID:', questionId);
    
    const { data, error } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) {
      console.error('❌ Error fetching question:', error);
      if (error.code === 'PGRST116') {
        console.log('⚠️ Question not found (PGRST116)');
        return null;
      }
      throw new Error(`Failed to fetch question: ${error.message}`);
    }

    console.log('✅ Question fetched successfully:', {
      id: data.id,
      question_text: data.question_text?.substring(0, 50) + '...',
      question_type: data.question_type,
      correct_answer: data.correct_answer
    });

    return data;
  }

  /**
   * Get session responses
   */
  private async getSessionResponses(sessionId: string): Promise<ExamResponse[]> {
    const { data, error } = await supabase
      .from('exam_responses')
      .select(`
        *,
        question:exam_questions(*)
      `)
      .eq('exam_session_id', sessionId);

    if (error) {
      throw new Error(`Failed to fetch responses: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get questions by difficulty level
   */
  private async getQuestionsByDifficulty(
    jobDescriptionId: string,
    difficulty: 'easy' | 'medium' | 'hard',
    limit: number
  ): Promise<ExamQuestion[]> {
    const { data, error } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('job_description_id', jobDescriptionId)
      .eq('difficulty_level', difficulty)
      .eq('status', 'approved')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    return data || [];
  }
}

// Export singleton instance
export const examService = new ExamService();
