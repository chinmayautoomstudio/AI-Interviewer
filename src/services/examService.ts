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
import { SecurityViolation } from './examSecurityService';
import { MCQEvaluationService, MCQEvaluationResult } from './mcqEvaluationService';
import { TextEvaluationService } from './textEvaluationService';
import { notificationService } from './notificationService';

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
        .eq('question_type', 'mcq') // Only MCQ questions for now
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

    // Check if we have enough MCQ questions for this job description
    const { data: availableQuestions, error: questionsError } = await supabase
      .from('exam_questions')
      .select('id')
      .eq('job_description_id', job_description_id)
      .eq('status', 'approved')
      .eq('is_active', true)
      .eq('question_type', 'mcq'); // Only MCQ questions for now

    if (questionsError) {
      console.error('Error checking available questions:', questionsError);
      throw new Error(`Failed to check available questions: ${questionsError.message}`);
    }

    const availableCount = availableQuestions?.length || 0;
    console.log(`📊 Available questions for job description ${job_description_id}: ${availableCount}`);

    if (availableCount < total_questions) {
      console.warn(`⚠️ Not enough MCQ questions available. Requested: ${total_questions}, Available: ${availableCount}`);
      // Don't adjust automatically - let the frontend handle this
      throw new Error(`Cannot create MCQ exam with ${total_questions} questions. Only ${availableCount} MCQ questions are available for this job description.`);
    }

    // Create exam session
    const { data, error } = await supabase
      .from('exam_sessions')
      .insert([{
        candidate_id,
        job_description_id,
        exam_token,
        total_questions: total_questions,
        duration_minutes,
        initial_question_count: total_questions,
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

    // Send notification to admins about exam session creation
    try {
      await notificationService.notifyExamStarted({
        examSessionId: data.id,
        candidateId: data.candidate_id,
        candidateName: data.candidate?.name || 'Unknown Candidate',
        candidateEmail: data.candidate?.email || 'unknown@example.com',
        jobDescriptionId: data.job_description_id,
        jobTitle: data.job_description?.title || 'Unknown Job',
        examToken: data.exam_token,
        durationMinutes: data.duration_minutes,
        totalQuestions: data.total_questions,
        startedAt: data.created_at
      });
    } catch (notificationError) {
      console.warn('Failed to send exam started notification:', notificationError);
      // Don't fail the exam creation if notification fails
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

    // Send notifications for status changes
    try {
      const session = await this.getSessionById(sessionId);
      if (session) {
        if (status === 'expired') {
          await notificationService.notifyExamExpired({
            examSessionId: sessionId,
            candidateId: session.candidate_id,
            candidateName: session.candidate?.name || 'Unknown Candidate',
            candidateEmail: session.candidate?.email || 'unknown@example.com',
            jobDescriptionId: session.job_description_id,
            jobTitle: session.job_description?.title || 'Unknown Job',
            examToken: session.exam_token,
            durationMinutes: session.duration_minutes,
            totalQuestions: session.total_questions,
            startedAt: session.started_at,
            completedAt: new Date().toISOString()
          });
        } else if (status === 'terminated') {
          await notificationService.notifyExamTerminated({
            examSessionId: sessionId,
            candidateId: session.candidate_id,
            candidateName: session.candidate?.name || 'Unknown Candidate',
            candidateEmail: session.candidate?.email || 'unknown@example.com',
            jobDescriptionId: session.job_description_id,
            jobTitle: session.job_description?.title || 'Unknown Job',
            examToken: session.exam_token,
            durationMinutes: session.duration_minutes,
            totalQuestions: session.total_questions,
            startedAt: session.started_at,
            completedAt: new Date().toISOString()
          });
        }
      }
    } catch (notificationError) {
      console.warn('Failed to send status change notification:', notificationError);
      // Don't fail the status update if notification fails
    }
  }

  /**
   * Log security violation for an exam session
   */
  async logSecurityViolation(sessionId: string, violation: SecurityViolation): Promise<void> {
    try {
      const { error } = await supabase
        .from('exam_security_violations')
        .insert({
          exam_session_id: sessionId,
          violation_type: violation.type,
          violation_details: violation.details,
          severity: violation.severity,
          timestamp: violation.timestamp,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging security violation:', error);
        // Don't throw error to avoid disrupting exam flow
      } else {
        console.log('🔒 Security violation logged:', violation.type);
      }
    } catch (error) {
      console.error('Failed to log security violation:', error);
      // Don't throw error to avoid disrupting exam flow
    }
  }

  // ===== QUESTION SELECTION =====

  /**
   * Get questions for an exam session based on job description and difficulty distribution
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

    // Check if job_description_id is valid
    if (!session.job_description_id) {
      console.error('❌ No job description ID found for session:', sessionId);
      throw new Error('Exam session has no associated job description');
    }

    // Get all available MCQ questions for this job description
    const { data: allQuestions, error } = await supabase
      .from('exam_questions')
      .select(`
        *,
        topic:question_topics(*)
      `)
      .eq('job_description_id', session.job_description_id)
      .eq('status', 'approved')
      .eq('is_active', true)
      .eq('question_type', 'mcq') // Only MCQ questions for now
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    if (!allQuestions || allQuestions.length === 0) {
      throw new Error('No questions available for this job description');
    }

    console.log('📊 Total available questions:', allQuestions.length);

    // Group questions by difficulty level
    const questionsByDifficulty = {
      easy: allQuestions.filter(q => q.difficulty_level === 'easy'),
      medium: allQuestions.filter(q => q.difficulty_level === 'medium'),
      hard: allQuestions.filter(q => q.difficulty_level === 'hard')
    };

    console.log('📈 Questions by difficulty:', {
      easy: questionsByDifficulty.easy.length,
      medium: questionsByDifficulty.medium.length,
      hard: questionsByDifficulty.hard.length
    });

    // Calculate difficulty distribution for Web Developer Intern position
    // For intern level: 50% easy, 30% medium, 20% hard
    const totalQuestions = session.total_questions;
    const easyCount = Math.ceil(totalQuestions * 0.5); // 50% easy
    const mediumCount = Math.ceil(totalQuestions * 0.3); // 30% medium
    const hardCount = totalQuestions - easyCount - mediumCount; // Remaining for hard

    console.log('🎯 Target distribution:', {
      easy: easyCount,
      medium: mediumCount,
      hard: hardCount,
      total: easyCount + mediumCount + hardCount
    });

    // Select questions with proper distribution
    const selectedQuestions: ExamQuestion[] = [];

    // Helper function to shuffle array and select random questions
    const shuffleAndSelect = (questions: ExamQuestion[], count: number): ExamQuestion[] => {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, shuffled.length));
    };

    // Add easy questions
    if (questionsByDifficulty.easy.length > 0 && easyCount > 0) {
      const selectedEasy = shuffleAndSelect(questionsByDifficulty.easy, easyCount);
      selectedQuestions.push(...selectedEasy);
      console.log('✅ Selected easy questions:', selectedEasy.length);
    }

    // Add medium questions
    if (questionsByDifficulty.medium.length > 0 && mediumCount > 0) {
      const selectedMedium = shuffleAndSelect(questionsByDifficulty.medium, mediumCount);
      selectedQuestions.push(...selectedMedium);
      console.log('✅ Selected medium questions:', selectedMedium.length);
    }

    // Add hard questions
    if (questionsByDifficulty.hard.length > 0 && hardCount > 0) {
      const selectedHard = shuffleAndSelect(questionsByDifficulty.hard, hardCount);
      selectedQuestions.push(...selectedHard);
      console.log('✅ Selected hard questions:', selectedHard.length);
    }

    // If we don't have enough questions with the ideal distribution, fill with available questions
    if (selectedQuestions.length < totalQuestions) {
      const remainingNeeded = totalQuestions - selectedQuestions.length;
      const allRemainingQuestions = allQuestions.filter(q => 
        !selectedQuestions.some(selected => selected.id === q.id)
      );
      
      const additionalQuestions = shuffleAndSelect(allRemainingQuestions, remainingNeeded);
      selectedQuestions.push(...additionalQuestions);
      console.log('📝 Added additional questions:', additionalQuestions.length);
    }

    // Shuffle the final selection to randomize order
    const finalQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

    console.log('🎉 Final question selection:', {
      total: finalQuestions.length,
      easy: finalQuestions.filter(q => q.difficulty_level === 'easy').length,
      medium: finalQuestions.filter(q => q.difficulty_level === 'medium').length,
      hard: finalQuestions.filter(q => q.difficulty_level === 'hard').length
    });

    return finalQuestions;
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
      // Validate input parameters
      if (!exam_session_id || !question_id || !answer_text) {
        throw new Error('Missing required parameters: exam_session_id, question_id, and answer_text are required');
      }

      // Get the question to validate the answer
      const question = await this.getQuestionById(question_id);
      if (!question) {
        console.error('❌ Question not found:', question_id);
        throw new Error('Question not found');
      }

      console.log('✅ Question found:', question.question_text?.substring(0, 50) + '...');

      // Calculate if answer is correct and points earned
      const evaluation = this.evaluateAnswer(question, answer_text);
      const { is_correct, points_earned, evaluation_details } = evaluation;
      
      console.log('📊 Answer evaluation:', {
        is_correct,
        points_earned,
        question_type: question.question_type,
        correct_answer: question.correct_answer,
        evaluation_details: evaluation_details ? 'Present' : 'None'
      });

      // Prepare the response data
      const responseData = {
        exam_session_id,
        question_id,
        answer_text,
        is_correct,
        points_earned,
        time_taken_seconds,
        answered_at: new Date().toISOString(),
        evaluation_details: evaluation_details || null
      };

      console.log('💾 Saving response data:', {
        exam_session_id,
        question_id,
        answer_length: answer_text.length,
        is_correct,
        points_earned
      });

      // Upsert the response with retry mechanism
      let data: ExamResponse | null = null;
      let error: any = null;
      const maxRetries = 3;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const result = await supabase
          .from('exam_responses')
          .upsert([responseData], {
            onConflict: 'exam_session_id,question_id'
          })
          .select(`
            *,
            question:exam_questions(*)
          `)
          .single();

        data = result.data;
        error = result.error;

        if (!error) {
          break; // Success, exit retry loop
        }

        console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying...`, error);

        if (attempt < maxRetries - 1) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }

      if (error || !data) {
        console.error('❌ Error submitting answer after all retries:', error);
        throw new Error(`Failed to submit answer after ${maxRetries} attempts: ${error?.message || 'No data returned'}`);
      }

      console.log('✅ Answer submitted successfully:', data.id);

      // Verify the response was saved correctly
      const { data: verification, error: verifyError } = await supabase
        .from('exam_responses')
        .select('id, answer_text, is_correct, points_earned')
        .eq('id', data.id)
        .single();

      if (verifyError || !verification) {
        console.error('❌ Verification failed - response may not have been saved:', verifyError);
        throw new Error('Response verification failed - data may not have been saved correctly');
      }

      console.log('✅ Response verification successful:', {
        id: verification.id,
        answer_saved: verification.answer_text === answer_text,
        points_saved: verification.points_earned === points_earned
      });

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
  private evaluateAnswer(question: ExamQuestion, answer: string): { is_correct: boolean; points_earned: number; evaluation_details?: any } {
    if (question.question_type === 'mcq') {
      // Use enhanced MCQ evaluation service
      const evaluationResult = MCQEvaluationService.evaluateAnswer(question, answer, {
        caseSensitive: false,
        allowPartialCredit: false,
        enableFuzzyMatching: true,
        fuzzyThreshold: 0.9
      });

      console.log('🎯 Enhanced MCQ evaluation result:', {
        questionId: question.id,
        isCorrect: evaluationResult.isCorrect,
        pointsEarned: evaluationResult.pointsEarned,
        confidence: evaluationResult.confidence,
        method: evaluationResult.evaluationDetails
      });

      return {
        is_correct: evaluationResult.isCorrect,
        points_earned: evaluationResult.pointsEarned,
        evaluation_details: {
          confidence: evaluationResult.confidence,
          explanation: evaluationResult.explanation,
          selectedOption: evaluationResult.selectedOption,
          correctOption: evaluationResult.correctOption,
          evaluationDetails: evaluationResult.evaluationDetails
        }
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

  // ===== TEXT EVALUATION =====

  /**
   * Manually trigger text evaluation for a session
   */
  async triggerTextEvaluation(sessionId: string): Promise<{ 
    success: boolean; 
    message: string;
    evaluatedCount?: number;
    overallScore?: number;
  }> {
    try {
      console.log('📝 Manually triggering text evaluation for session:', sessionId);

      // Check if text evaluation is needed
      const needsEvaluation = await TextEvaluationService.needsTextEvaluation(sessionId);
      if (!needsEvaluation) {
        return {
          success: true,
          message: 'No text questions need evaluation or already evaluated'
        };
      }

      // Trigger text evaluation
      const result = await TextEvaluationService.evaluateTextAnswers(sessionId);
      
      if (result.success) {
        // Recalculate exam results after text evaluation
        await this.recalculateExamResults(sessionId);
        
        return {
          success: true,
          message: 'Text evaluation completed successfully',
          evaluatedCount: result.evaluated_count,
          overallScore: result.overall_score
        };
      } else {
        return {
          success: false,
          message: result.error || 'Text evaluation failed'
        };
      }
    } catch (error) {
      console.error('❌ Error triggering text evaluation:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to trigger text evaluation'
      };
    }
  }

  /**
   * Get text evaluation results for a session
   */
  async getTextEvaluationResults(sessionId: string): Promise<any[]> {
    try {
      return await TextEvaluationService.getTextEvaluationResults(sessionId);
    } catch (error) {
      console.error('❌ Error getting text evaluation results:', error);
      return [];
    }
  }

  // ===== MCQ AUTO-EVALUATION =====

  /**
   * Auto-evaluate all MCQ answers for a completed exam session
   */
  async autoEvaluateMCQAnswers(sessionId: string): Promise<{ 
    success: boolean; 
    evaluatedCount: number; 
    totalMCQCount: number;
    results: MCQEvaluationResult[];
  }> {
    try {
      console.log('🤖 Starting auto-evaluation for session:', sessionId);

      // Get the exam session
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Exam session not found');
      }

      // Get all responses for this session
      const responses = await this.getSessionResponses(sessionId);
      
      // Filter MCQ responses that haven't been auto-evaluated yet
      const mcqResponses = responses.filter(response => 
        response.question?.question_type === 'mcq' && 
        !response.evaluation_details // Not yet auto-evaluated
      );

      console.log(`📊 Found ${mcqResponses.length} MCQ responses to evaluate`);

      if (mcqResponses.length === 0) {
        return {
          success: true,
          evaluatedCount: 0,
          totalMCQCount: responses.filter(r => r.question?.question_type === 'mcq').length,
          results: []
        };
      }

      // Evaluate each MCQ response
      const evaluationResults: MCQEvaluationResult[] = [];
      let evaluatedCount = 0;

      for (const response of mcqResponses) {
        if (response.question && response.answer_text) {
          try {
            const evaluationResult = MCQEvaluationService.evaluateAnswer(
              response.question, 
              response.answer_text,
              {
                caseSensitive: false,
                allowPartialCredit: false,
                enableFuzzyMatching: true,
                fuzzyThreshold: 0.9
              }
            );

            // Update the response with evaluation details
            const { error: updateError } = await supabase
              .from('exam_responses')
              .update({
                is_correct: evaluationResult.isCorrect,
                points_earned: evaluationResult.pointsEarned,
                evaluation_details: {
                  confidence: evaluationResult.confidence,
                  explanation: evaluationResult.explanation,
                  selectedOption: evaluationResult.selectedOption,
                  correctOption: evaluationResult.correctOption,
                  evaluationDetails: evaluationResult.evaluationDetails,
                  autoEvaluated: true,
                  evaluatedAt: new Date().toISOString()
                }
              })
              .eq('id', response.id);

            if (updateError) {
              console.error(`❌ Error updating response ${response.id}:`, updateError);
            } else {
              evaluatedCount++;
              evaluationResults.push(evaluationResult);
              console.log(`✅ Auto-evaluated MCQ response ${response.id}:`, {
                isCorrect: evaluationResult.isCorrect,
                pointsEarned: evaluationResult.pointsEarned,
                confidence: evaluationResult.confidence
              });
            }
          } catch (error) {
            console.error(`❌ Error evaluating response ${response.id}:`, error);
          }
        }
      }

      // Recalculate exam results if any evaluations were updated
      if (evaluatedCount > 0) {
        await this.recalculateExamResults(sessionId);
      }

      console.log(`🎯 Auto-evaluation completed: ${evaluatedCount}/${mcqResponses.length} MCQ responses evaluated`);

      return {
        success: true,
        evaluatedCount,
        totalMCQCount: responses.filter(r => r.question?.question_type === 'mcq').length,
        results: evaluationResults
      };

    } catch (error) {
      console.error('❌ Error in auto-evaluation:', error);
      return {
        success: false,
        evaluatedCount: 0,
        totalMCQCount: 0,
        results: []
      };
    }
  }

  /**
   * Recalculate exam results after auto-evaluation
   */
  private async recalculateExamResults(sessionId: string): Promise<void> {
    try {
      console.log('🔄 Recalculating exam results for session:', sessionId);

      // Get all responses for this session
      const responses = await this.getSessionResponses(sessionId);
      
      // Calculate totals
      const totalQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.is_correct).length;
      const totalPoints = responses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
      const maxPoints = responses.reduce((sum, r) => sum + (r.question?.points || 1), 0);
      const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
      
      // Determine evaluation status based on percentage (assuming 60% is passing)
      const evaluationStatus = percentage >= 60 ? 'passed' : 'failed';

      // Get the session to get candidate_id
      const session = await this.getSessionById(sessionId);
      
      // Check if exam result already exists
      const { data: existingResult } = await supabase
        .from('exam_results')
        .select('id')
        .eq('exam_session_id', sessionId)
        .single();

      let error;
      if (existingResult) {
        // Update existing result
        const { error: updateError } = await supabase
          .from('exam_results')
          .update({
            candidate_id: session?.candidate_id,
            total_score: totalPoints,
            max_score: maxPoints,
            percentage: percentage,
            correct_answers: correctAnswers,
            wrong_answers: totalQuestions - correctAnswers,
            skipped_questions: 0,
            evaluation_status: evaluationStatus
          })
          .eq('exam_session_id', sessionId);
        error = updateError;
      } else {
        // Insert new result
        const { error: insertError } = await supabase
          .from('exam_results')
          .insert([{
            exam_session_id: sessionId,
            candidate_id: session?.candidate_id,
            total_score: totalPoints,
            max_score: maxPoints,
            percentage: percentage,
            correct_answers: correctAnswers,
            wrong_answers: totalQuestions - correctAnswers,
            skipped_questions: 0,
            evaluation_status: evaluationStatus
          }]);
        error = insertError;
      }

      if (error) {
        console.error('❌ Error updating exam results:', error);
      } else {
        console.log('✅ Exam results recalculated:', {
          totalQuestions,
          correctAnswers,
          totalPoints,
          maxPoints,
          percentage
        });
      }

    } catch (error) {
      console.error('❌ Error recalculating exam results:', error);
    }
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

  /**
   * Get exam result by session ID
   */
  async getExamResult(sessionId: string): Promise<ExamResult> {
    const { data, error } = await supabase
      .from('exam_results')
      .select(`
        *,
        exam_session:exam_sessions(*),
        candidate:candidates(*)
      `)
      .eq('exam_session_id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching exam result:', error);
      throw new Error(`Failed to fetch exam result: ${error.message}`);
    }

    return data;
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

    // Trigger auto-evaluation of MCQ answers (MCQ-only for now)
    try {
      console.log('🤖 Triggering auto-evaluation for completed MCQ exam...');
      const autoEvalResult = await this.autoEvaluateMCQAnswers(sessionId);
      console.log('✅ Auto-evaluation completed:', {
        success: autoEvalResult.success,
        evaluatedCount: autoEvalResult.evaluatedCount,
        totalMCQCount: autoEvalResult.totalMCQCount
      });
    } catch (error) {
      console.error('❌ Auto-evaluation failed (non-critical):', error);
      // Don't throw error as this is not critical for exam completion
    }

    // Note: Text evaluation is disabled for now - will be implemented later
    // Text-based exams will be added in future updates

    // Send notification to admins about exam completion
    try {
      await notificationService.notifyExamCompleted({
        examSessionId: sessionId,
        candidateId: session.candidate_id,
        candidateName: session.candidate?.name || 'Unknown Candidate',
        candidateEmail: session.candidate?.email || 'unknown@example.com',
        jobDescriptionId: session.job_description_id,
        jobTitle: session.job_description?.title || 'Unknown Job',
        examToken: session.exam_token,
        durationMinutes: session.duration_minutes,
        totalQuestions: session.total_questions,
        startedAt: session.started_at,
        completedAt: new Date().toISOString(),
        score: total_score,
        percentage: percentage
      });
    } catch (notificationError) {
      console.warn('Failed to send exam completed notification:', notificationError);
      // Don't fail the exam completion if notification fails
    }

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
  async getSessionResponses(sessionId: string): Promise<ExamResponse[]> {
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
