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
      const notificationResult = await notificationService.notifyExamStarted({
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
      
      if (!notificationResult.success) {
        console.warn('⚠️ Exam started notification failed:', notificationResult.error);
        console.warn('📝 Exam creation will continue without notification');
      } else {
        console.log('✅ Exam started notification sent successfully');
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to send exam started notification:', notificationError);
      console.warn('📝 Exam creation will continue without notification');
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
   * Get stored questions for an exam session from exam_session_questions table
   * Public method for use in results page
   */
  async getStoredSessionQuestions(sessionId: string): Promise<ExamQuestion[]> {
    try {
      // First, try to get stored question IDs and their order
      const { data: sessionQuestions, error: sessionError } = await supabase
        .from('exam_session_questions')
        .select('question_id, question_order')
        .eq('exam_session_id', sessionId)
        .order('question_order', { ascending: true });

      if (sessionError) {
        console.error('Error fetching stored session question IDs:', sessionError);
        return [];
      }

      if (!sessionQuestions || sessionQuestions.length === 0) {
        console.log('⚠️ No stored questions found in exam_session_questions table');
        return [];
      }

      console.log('📋 Found', sessionQuestions.length, 'stored question IDs');

      // Extract question IDs
      const questionIds = sessionQuestions.map(sq => sq.question_id).filter(Boolean);

      if (questionIds.length === 0) {
        console.warn('⚠️ No valid question IDs found in stored questions');
        return [];
      }

      // Fetch the actual questions using the question IDs
      const { data: questions, error: questionsError } = await supabase
        .from('exam_questions')
        .select(`
          *,
          topic:question_topics(*)
        `)
        .in('id', questionIds);

      if (questionsError) {
        console.error('Error fetching questions by IDs:', questionsError);
        return [];
      }

      if (!questions || questions.length === 0) {
        console.warn('⚠️ No questions found for stored question IDs');
        return [];
      }

      // Create a map of question ID to question for quick lookup
      const questionMap = new Map(questions.map(q => [q.id, q]));

      // Reorder questions according to question_order from session_questions
      const orderedQuestions: ExamQuestion[] = [];
      for (const sq of sessionQuestions) {
        const question = questionMap.get(sq.question_id);
        if (question) {
          orderedQuestions.push(question);
        } else {
          console.warn('⚠️ Question not found for ID:', sq.question_id);
        }
      }

      console.log('✅ Retrieved', orderedQuestions.length, 'stored questions in correct order');
      return orderedQuestions;
    } catch (error) {
      console.error('Error in getStoredSessionQuestions:', error);
      return [];
    }
  }

  /**
   * Store questions for an exam session in exam_session_questions table
   */
  private async storeSessionQuestions(sessionId: string, questions: ExamQuestion[]): Promise<void> {
    try {
      // Check if questions are already stored
      const existing = await this.getStoredSessionQuestions(sessionId);
      if (existing.length > 0) {
        console.log('⚠️ Questions already stored for this session, skipping storage');
        return;
      }

      // Prepare data for insertion
      const sessionQuestions = questions.map((question, index) => ({
        exam_session_id: sessionId,
        question_id: question.id,
        question_order: index + 1
      }));

      const { error } = await supabase
        .from('exam_session_questions')
        .insert(sessionQuestions);

      if (error) {
        console.error('Error storing session questions:', error);
        throw new Error(`Failed to store session questions: ${error.message}`);
      }

      console.log('✅ Stored', questions.length, 'questions for session:', sessionId);
    } catch (error) {
      console.error('Error in storeSessionQuestions:', error);
      // Don't throw error - allow exam to continue even if storage fails
      // This ensures backward compatibility
    }
  }

  /**
   * Get questions for an exam session based on job description and difficulty distribution
   * First checks if questions are already stored, if not generates and stores them
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

    // Check if questions are already stored for this session
    const storedQuestions = await this.getStoredSessionQuestions(sessionId);
    if (storedQuestions.length > 0) {
      console.log('✅ Using stored questions for session:', sessionId);
      // Verify we have the correct number of questions
      if (storedQuestions.length === session.total_questions) {
        return storedQuestions;
      } else {
        console.warn('⚠️ Stored questions count mismatch:', {
          stored: storedQuestions.length,
          expected: session.total_questions
        });
        // If count doesn't match, regenerate (shouldn't happen, but handle it)
      }
    }

    // No stored questions found, generate new ones
    console.log('🔄 No stored questions found, generating new questions...');

    // Check if job_description_id is valid
    if (!session.job_description_id) {
      console.error('❌ No job description ID found for session:', sessionId);
      throw new Error('Exam session has no associated job description');
    }

    const totalQuestions = session.total_questions;

    // Check if topic-based distribution is configured for this job
    let topicDistribution: Array<{
      topic_id: string;
      topic_name: string;
      question_count: number;
      difficulty_breakdown: { easy: number; medium: number; hard: number };
    }> = [];

    try {
      topicDistribution = await topicManagementService.getQuestionDistribution(
        session.job_description_id,
        totalQuestions
      );
      console.log('📋 Topic distribution found:', topicDistribution.length, 'topics');
    } catch (error) {
      console.warn('⚠️ Failed to get topic distribution, will use difficulty-only selection:', error);
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

    // Input validation
    if (totalQuestions <= 0) {
      throw new Error(`Invalid totalQuestions: ${totalQuestions}`);
    }

    // Helper function to shuffle array and select random questions
    const shuffleAndSelect = (questions: ExamQuestion[], count: number): ExamQuestion[] => {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, shuffled.length));
    };

    // Helper function to distribute proportionally using Largest Remainder Method
    const distributeProportionally = (percentages: number[], total: number): number[] => {
      if (total <= 0 || percentages.length === 0) {
        return percentages.map(() => 0);
      }

      const allocations = percentages.map((percentage, index) => {
        const exactValue = (percentage / 100) * total;
        const floorValue = Math.floor(exactValue);
        const remainder = exactValue - floorValue;
        return { index, floorValue, remainder };
      });

      let distributed = allocations.reduce((sum, alloc) => sum + alloc.floorValue, 0);
      const remaining = total - distributed;

      // Sort by remainder (largest first) and distribute remaining
      const indicesByRemainder = allocations
        .map((_, index) => index)
        .sort((a, b) => allocations[b].remainder - allocations[a].remainder);

      for (let i = 0; i < remaining && i < indicesByRemainder.length; i++) {
        const index = indicesByRemainder[i];
        allocations[index].floorValue += 1;
        distributed += 1;
      }

      return allocations.map(alloc => alloc.floorValue);
    };

    let selectedQuestions: ExamQuestion[] = [];

    // Use topic-based selection if distribution is configured
    if (topicDistribution.length > 0) {
      console.log('🎯 Using topic-based question selection');
      
      // Validate topic distribution sum
      const topicDistributionSum = topicDistribution.reduce((sum, td) => sum + td.question_count, 0);
      console.log(`📊 Topic distribution validation: sum=${topicDistributionSum}, expected=${totalQuestions}`);
      
      if (topicDistributionSum !== totalQuestions) {
        console.warn(`⚠️ Topic distribution sum mismatch: ${topicDistributionSum} vs ${totalQuestions}`);
      }
      
      // Select questions for each topic with difficulty distribution
      for (const topicDist of topicDistribution) {
        // Check remaining slots before processing topic
        const remainingSlots = totalQuestions - selectedQuestions.length;
        if (remainingSlots <= 0) {
          console.warn(`⚠️ Reached totalQuestions limit (${totalQuestions}), skipping remaining topics`);
          break;
        }

        if (topicDist.question_count === 0) {
          console.log(`⏭️ Skipping topic "${topicDist.topic_name}" (0 questions)`);
          continue;
        }

        // Get questions for this topic
        const topicQuestions = allQuestions.filter(q => q.topic_id === topicDist.topic_id);
        
        if (topicQuestions.length === 0) {
          console.warn(`⚠️ No questions found for topic "${topicDist.topic_name}" (topic_id: ${topicDist.topic_id})`);
          continue;
        }

        console.log(`📚 Topic "${topicDist.topic_name}":`, {
          available: topicQuestions.length,
          needed: topicDist.question_count,
          breakdown: topicDist.difficulty_breakdown,
          remainingSlots
        });

        // Group topic questions by difficulty
        const topicQuestionsByDifficulty = {
          easy: topicQuestions.filter(q => q.difficulty_level === 'easy'),
          medium: topicQuestions.filter(q => q.difficulty_level === 'medium'),
          hard: topicQuestions.filter(q => q.difficulty_level === 'hard')
        };

        // Use the difficulty breakdown from distribution (already calculated using Largest Remainder Method)
        const { easy: topicEasyCount, medium: topicMediumCount, hard: topicHardCount } = topicDist.difficulty_breakdown;

        // Validate difficulty breakdown sum
        const difficultySum = topicEasyCount + topicMediumCount + topicHardCount;
        if (difficultySum !== topicDist.question_count) {
          console.warn(`⚠️ Difficulty breakdown mismatch for topic "${topicDist.topic_name}": sum=${difficultySum}, expected=${topicDist.question_count}`);
        }

        const topicSelected: ExamQuestion[] = [];
        const maxForTopic = Math.min(topicDist.question_count, remainingSlots);

        // Select easy questions for this topic
        if (topicQuestionsByDifficulty.easy.length > 0 && topicEasyCount > 0) {
          const maxEasy = Math.min(topicEasyCount, maxForTopic - topicSelected.length);
          if (maxEasy > 0) {
            const selected = shuffleAndSelect(topicQuestionsByDifficulty.easy, maxEasy);
            topicSelected.push(...selected);
            console.log(`  ✅ Selected ${selected.length} easy questions (requested: ${topicEasyCount})`);
          }
        }

        // Select medium questions for this topic
        if (topicQuestionsByDifficulty.medium.length > 0 && topicMediumCount > 0) {
          const maxMedium = Math.min(topicMediumCount, maxForTopic - topicSelected.length);
          if (maxMedium > 0) {
            const selected = shuffleAndSelect(topicQuestionsByDifficulty.medium, maxMedium);
            topicSelected.push(...selected);
            console.log(`  ✅ Selected ${selected.length} medium questions (requested: ${topicMediumCount})`);
          }
        }

        // Select hard questions for this topic
        if (topicQuestionsByDifficulty.hard.length > 0 && topicHardCount > 0) {
          const maxHard = Math.min(topicHardCount, maxForTopic - topicSelected.length);
          if (maxHard > 0) {
            const selected = shuffleAndSelect(topicQuestionsByDifficulty.hard, maxHard);
            topicSelected.push(...selected);
            console.log(`  ✅ Selected ${selected.length} hard questions (requested: ${topicHardCount})`);
          }
        }

        // If we don't have enough questions for this topic, fill with available questions from topic
        const currentTopicCount = topicSelected.length;
        const targetTopicCount = Math.min(topicDist.question_count, remainingSlots);
        if (currentTopicCount < targetTopicCount) {
          const remainingNeeded = targetTopicCount - currentTopicCount;
          const remainingTopicQuestions = topicQuestions.filter(q => 
            !topicSelected.some(selected => selected.id === q.id)
          );
          const additional = shuffleAndSelect(remainingTopicQuestions, remainingNeeded);
          topicSelected.push(...additional);
          console.log(`  📝 Added ${additional.length} additional questions to reach target (${topicSelected.length}/${targetTopicCount})`);
        }

        // Defensive limit: ensure we don't exceed totalQuestions
        const beforeAdd = selectedQuestions.length;
        const canAdd = Math.min(topicSelected.length, totalQuestions - beforeAdd);
        if (canAdd > 0) {
          selectedQuestions.push(...topicSelected.slice(0, canAdd));
        }
        
        console.log(`✅ Topic "${topicDist.topic_name}": Selected ${canAdd}/${topicDist.question_count} questions (total so far: ${selectedQuestions.length}/${totalQuestions})`);
        
        // Validation after adding topic questions
        if (selectedQuestions.length > totalQuestions) {
          console.error(`❌ CRITICAL: Exceeded totalQuestions after topic "${topicDist.topic_name}": ${selectedQuestions.length} > ${totalQuestions}`);
          selectedQuestions = selectedQuestions.slice(0, totalQuestions);
        }
      }

      // If we don't have enough questions overall, fill with remaining questions
      const currentTotal = selectedQuestions.length;
      if (currentTotal < totalQuestions) {
        const remainingNeeded = totalQuestions - currentTotal;
        const remainingQuestions = allQuestions.filter(q => 
          !selectedQuestions.some(selected => selected.id === q.id)
        );
        const additional = shuffleAndSelect(remainingQuestions, remainingNeeded);
        selectedQuestions.push(...additional);
        console.log(`📝 Added ${additional.length} additional questions to reach total target (${selectedQuestions.length}/${totalQuestions})`);
      } else if (currentTotal > totalQuestions) {
        console.warn(`⚠️ Selected ${currentTotal} questions, limiting to ${totalQuestions}`);
        selectedQuestions = selectedQuestions.slice(0, totalQuestions);
      }
    } else {
      // Fallback: Use difficulty-only selection (existing logic)
      console.log('📊 Using difficulty-only question selection (no topic distribution configured)');

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

      // Calculate difficulty distribution using Largest Remainder Method: 50% easy, 30% medium, 20% hard
      const difficultyCounts = distributeProportionally([50, 30, 20], totalQuestions);
      const easyCount = difficultyCounts[0];
      const mediumCount = difficultyCounts[1];
      const hardCount = difficultyCounts[2];

      // Validate distribution sum
      const distributionSum = easyCount + mediumCount + hardCount;
      if (distributionSum !== totalQuestions) {
        console.warn(`⚠️ Difficulty distribution sum mismatch: ${distributionSum} vs ${totalQuestions}`);
      }

      console.log('🎯 Target distribution:', {
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount,
        total: distributionSum,
        validated: distributionSum === totalQuestions
      });

      // Add easy questions with defensive limit
      if (questionsByDifficulty.easy.length > 0 && easyCount > 0) {
        const maxEasy = Math.min(easyCount, totalQuestions - selectedQuestions.length);
        if (maxEasy > 0) {
          const selectedEasy = shuffleAndSelect(questionsByDifficulty.easy, maxEasy);
          selectedQuestions.push(...selectedEasy);
          console.log(`✅ Selected ${selectedEasy.length} easy questions (requested: ${easyCount}, added: ${selectedEasy.length})`);
        }
      }

      // Add medium questions with defensive limit
      if (questionsByDifficulty.medium.length > 0 && mediumCount > 0) {
        const maxMedium = Math.min(mediumCount, totalQuestions - selectedQuestions.length);
        if (maxMedium > 0) {
          const selectedMedium = shuffleAndSelect(questionsByDifficulty.medium, maxMedium);
          selectedQuestions.push(...selectedMedium);
          console.log(`✅ Selected ${selectedMedium.length} medium questions (requested: ${mediumCount}, added: ${selectedMedium.length})`);
        }
      }

      // Add hard questions with defensive limit
      if (questionsByDifficulty.hard.length > 0 && hardCount > 0) {
        const maxHard = Math.min(hardCount, totalQuestions - selectedQuestions.length);
        if (maxHard > 0) {
          const selectedHard = shuffleAndSelect(questionsByDifficulty.hard, maxHard);
          selectedQuestions.push(...selectedHard);
          console.log(`✅ Selected ${selectedHard.length} hard questions (requested: ${hardCount}, added: ${selectedHard.length})`);
        }
      }

      // Validation after difficulty selection
      if (selectedQuestions.length > totalQuestions) {
        console.error(`❌ CRITICAL: Exceeded totalQuestions after difficulty selection: ${selectedQuestions.length} > ${totalQuestions}`);
        selectedQuestions = selectedQuestions.slice(0, totalQuestions);
      }

      // If we don't have enough questions with the ideal distribution, fill with available questions
      const currentTotal = selectedQuestions.length;
      if (currentTotal < totalQuestions) {
        const remainingNeeded = totalQuestions - currentTotal;
        const allRemainingQuestions = allQuestions.filter(q => 
          !selectedQuestions.some(selected => selected.id === q.id)
        );
        
        const additionalQuestions = shuffleAndSelect(allRemainingQuestions, remainingNeeded);
        selectedQuestions.push(...additionalQuestions);
        console.log(`📝 Added ${additionalQuestions.length} additional questions (${selectedQuestions.length}/${totalQuestions})`);
      } else if (currentTotal > totalQuestions) {
        console.warn(`⚠️ Selected ${currentTotal} questions, limiting to ${totalQuestions}`);
        selectedQuestions = selectedQuestions.slice(0, totalQuestions);
      }
    }

    // Final validation before shuffling
    if (selectedQuestions.length > totalQuestions) {
      console.error(`❌ CRITICAL: Before shuffling, selectedQuestions.length (${selectedQuestions.length}) > totalQuestions (${totalQuestions})`);
      selectedQuestions = selectedQuestions.slice(0, totalQuestions);
    }

    console.log(`📊 Pre-shuffle validation: ${selectedQuestions.length}/${totalQuestions} questions`);

    // Shuffle the final selection to randomize order
    const shuffledQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
    
    // Strictly limit to totalQuestions to ensure we never return more than configured
    const finalQuestions = shuffledQuestions.slice(0, totalQuestions);

    // Final validation before storage
    if (finalQuestions.length !== totalQuestions) {
      console.warn(`⚠️ Final question count mismatch: ${finalQuestions.length} vs ${totalQuestions}`);
    }

    // Log final composition by topic and difficulty
    const topicComposition = new Map<string, number>();
    finalQuestions.forEach(q => {
      const topicName = q.topic?.name || 'Unknown';
      topicComposition.set(topicName, (topicComposition.get(topicName) || 0) + 1);
    });

    const difficultyBreakdown = {
      easy: finalQuestions.filter(q => q.difficulty_level === 'easy').length,
      medium: finalQuestions.filter(q => q.difficulty_level === 'medium').length,
      hard: finalQuestions.filter(q => q.difficulty_level === 'hard').length
    };

    console.log('🎉 Final question selection:', {
      requested: totalQuestions,
      selected: shuffledQuestions.length,
      returned: finalQuestions.length,
      validated: finalQuestions.length === totalQuestions,
      byDifficulty: difficultyBreakdown,
      difficultySum: difficultyBreakdown.easy + difficultyBreakdown.medium + difficultyBreakdown.hard,
      byTopic: Object.fromEntries(topicComposition)
    });

    // Store the generated questions for future use
    await this.storeSessionQuestions(sessionId, finalQuestions);

    // Post-storage validation: verify stored count matches expected
    const storedQuestionsAfterSave = await this.getStoredSessionQuestions(sessionId);
    if (storedQuestionsAfterSave.length !== finalQuestions.length) {
      console.error(`❌ Post-storage validation failed: stored ${storedQuestionsAfterSave.length}, expected ${finalQuestions.length}`);
    } else {
      console.log(`✅ Post-storage validation passed: ${storedQuestionsAfterSave.length} questions stored`);
    }

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

      // Get session to get total_questions
      const session = await this.getSessionById(sessionId);
      if (!session) {
        console.error('❌ Session not found:', sessionId);
        return;
      }

      // Get all responses for this session
      const responses = await this.getSessionResponses(sessionId);
      
      // Calculate totals based on actual answered questions
      // Note: Since questions are fetched dynamically, we can't rely on total_questions from session
      const answeredQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.is_correct).length;
      const wrongAnswers = responses.filter(r => !r.is_correct).length;
      const skippedQuestions = 0; // Set to 0 since we don't have a definitive "total questions" reference
      
      // Calculate points - only from answered questions
      const totalPoints = responses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
      const maxPointsFromAnswered = responses.reduce((sum, r) => sum + (r.question?.points || 1), 0);
      
      // For percentage calculation, we need max_points from ALL questions
      // Get all questions assigned to this session's job description
      // For now, calculate percentage based on answered questions only
      // This will be updated when we have question assignment tracking
      const maxPoints = maxPointsFromAnswered;
      const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
      
      // Determine evaluation status based on percentage (assuming 60% is passing)
      const evaluationStatus = percentage >= 60 ? 'passed' : 'failed';

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
            wrong_answers: wrongAnswers,
            skipped_questions: skippedQuestions,
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
            wrong_answers: wrongAnswers,
            skipped_questions: skippedQuestions,
            evaluation_status: evaluationStatus
          }]);
        error = insertError;
      }

      if (error) {
        console.error('❌ Error updating exam results:', error);
      } else {
        console.log('✅ Exam results recalculated:', {
          answeredQuestions,
          correctAnswers,
          wrongAnswers,
          skippedQuestions,
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

    // Transform snake_case to camelCase to match ExamResult interface
    const transformedResult: ExamResult = {
      id: data.id,
      examSessionId: data.exam_session_id,
      candidateId: data.candidate_id,
      totalScore: data.total_score,
      maxScore: data.max_score,
      percentage: data.percentage,
      correctAnswers: data.correct_answers,
      wrongAnswers: data.wrong_answers,
      skippedQuestions: data.skipped_questions,
      technicalScore: data.technical_score,
      aptitudeScore: data.aptitude_score,
      timeTakenMinutes: data.time_taken_minutes,
      evaluationStatus: data.evaluation_status,
      aiEvaluation: data.ai_evaluation,
      createdAt: data.created_at,
      textEvaluationSummary: data.text_evaluation_summary,
      hiringRecommendations: data.hiring_recommendations,
      processingMetadata: data.processing_metadata,
      textEvaluationCompleted: data.text_evaluation_completed,
      // Include joined data
      examSession: data.exam_session,
      candidate: data.candidate
    };

    console.log('🔄 Transformed exam result:', {
      original: {
        correct_answers: data.correct_answers,
        wrong_answers: data.wrong_answers,
        skipped_questions: data.skipped_questions,
        total_score: data.total_score,
        percentage: data.percentage
      },
      transformed: {
        correctAnswers: transformedResult.correctAnswers,
        wrongAnswers: transformedResult.wrongAnswers,
        skippedQuestions: transformedResult.skippedQuestions,
        totalScore: transformedResult.totalScore,
        percentage: transformedResult.percentage
      }
    });

    return transformedResult;
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
    
    // Get distinct question IDs that were answered (filter out null/undefined)
    const distinctAnsweredQuestionIds = new Set(
      responses
        .map(r => r.question_id)
        .filter((id): id is string => !!id) // Filter out null/undefined
    );
    const distinctAnsweredCount = distinctAnsweredQuestionIds.size;
    
    console.log('📊 Response analysis:', {
      totalResponses: responses.length,
      distinctAnsweredQuestionIds: Array.from(distinctAnsweredQuestionIds),
      distinctAnsweredCount
    });
    
    // Get actual questions that were shown to the candidate
    // Try stored questions first, fallback to session.total_questions if not available
    let actualQuestionsShown: ExamQuestion[] = [];
    let actualQuestionsCount = session.total_questions; // Default to configured total
    
    try {
      const storedQuestions = await this.getStoredSessionQuestions(sessionId);
      if (storedQuestions.length > 0) {
        actualQuestionsShown = storedQuestions;
        actualQuestionsCount = storedQuestions.length;
        console.log('✅ Using stored questions for completion calculation:', actualQuestionsCount);
      } else {
        // No stored questions found - use session.total_questions as the source of truth
        // This handles backward compatibility for exams completed before question storage was implemented
        actualQuestionsCount = session.total_questions;
        console.log('⚠️ No stored questions found, using session.total_questions:', actualQuestionsCount);
      }
    } catch (error) {
      console.warn('⚠️ Error fetching stored questions, using session total_questions:', error);
      // Use session.total_questions as fallback
      actualQuestionsCount = session.total_questions;
    }
    
    // Ensure actualQuestionsCount matches session.total_questions (safety check)
    if (actualQuestionsCount !== session.total_questions && actualQuestionsShown.length > 0) {
      console.warn('⚠️ Question count mismatch:', {
        storedCount: actualQuestionsShown.length,
        sessionTotal: session.total_questions,
        using: 'session.total_questions'
      });
      actualQuestionsCount = session.total_questions;
    }
    
    // Calculate scores based on actual answered questions
    const correct_answers = responses.filter(r => r.is_correct).length;
    const wrong_answers = responses.filter(r => !r.is_correct).length;
    
    // Calculate skipped questions: actual questions shown - distinct answered questions
    // Ensure we don't have negative skipped (shouldn't happen, but safety check)
    const skipped_questions = Math.max(0, actualQuestionsCount - distinctAnsweredCount);
    
    // Calculate points from answered questions
    const total_score = responses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
    
    // Calculate max_score from ALL questions shown (including skipped ones)
    const max_score = actualQuestionsShown.reduce((sum, q) => sum + (q.points || 1), 0);
    const percentage = max_score > 0 ? Math.round((total_score / max_score) * 100) : 0;
    
    console.log('📊 Exam completion calculation:', {
      sessionTotalQuestions: session.total_questions,
      actualQuestionsCount,
      storedQuestionsCount: actualQuestionsShown.length,
      distinctAnsweredCount,
      totalResponses: responses.length,
      correct_answers,
      wrong_answers,
      skipped_questions,
      calculation: `${actualQuestionsCount} - ${distinctAnsweredCount} = ${skipped_questions}`,
      total_score,
      max_score,
      percentage
    });
    
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

  /**
   * Delete an exam session and all related records
   * Due to CASCADE DELETE constraints, this will automatically delete:
   * - exam_responses
   * - exam_results
   * - exam_session_questions
   * - exam_security_violations
   */
  async deleteExamSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Deleting exam session:', sessionId);

      // Verify session exists and is not in progress
      const session = await this.getSessionById(sessionId);
      if (!session) {
        return { success: false, error: 'Exam session not found' };
      }

      // Prevent deletion of active sessions
      if (session.status === 'in_progress') {
        return { success: false, error: 'Cannot delete an exam session that is currently in progress' };
      }

      // Delete the exam session (CASCADE will handle related records)
      const { error } = await supabase
        .from('exam_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('❌ Error deleting exam session:', error);
        return { success: false, error: `Failed to delete exam session: ${error.message}` };
      }

      console.log('✅ Exam session deleted successfully:', sessionId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error in deleteExamSession:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred while deleting exam session' 
      };
    }
  }

  /**
   * Bulk delete exam sessions based on filter criteria
   * Due to CASCADE DELETE constraints, related records will be automatically deleted
   */
  async bulkDeleteExamSessions(criteria: {
    sessionIds?: string[];
    status?: 'completed' | 'expired' | 'terminated';
    olderThanDays?: number;
    dateRange?: { start: string; end: string };
  }): Promise<{ 
    success: boolean; 
    deletedCount: number; 
    failedCount: number;
    errors: string[];
  }> {
    try {
      console.log('🗑️ Bulk deleting exam sessions with criteria:', criteria);

      let query = supabase
        .from('exam_sessions')
        .select('id, status, created_at');

      // Apply filters
      if (criteria.sessionIds && criteria.sessionIds.length > 0) {
        query = query.in('id', criteria.sessionIds);
      }

      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }

      if (criteria.olderThanDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - criteria.olderThanDays);
        query = query.lt('created_at', cutoffDate.toISOString());
      }

      if (criteria.dateRange) {
        query = query
          .gte('created_at', criteria.dateRange.start)
          .lte('created_at', criteria.dateRange.end);
      }

      // Only allow deletion of completed/expired/terminated sessions
      query = query.in('status', ['completed', 'expired', 'terminated']);

      // Get sessions to delete
      const { data: sessionsToDelete, error: fetchError } = await query;

      if (fetchError) {
        console.error('❌ Error fetching sessions for bulk delete:', fetchError);
        return {
          success: false,
          deletedCount: 0,
          failedCount: 0,
          errors: [`Failed to fetch sessions: ${fetchError.message}`]
        };
      }

      if (!sessionsToDelete || sessionsToDelete.length === 0) {
        console.log('ℹ️ No sessions found matching criteria');
        return {
          success: true,
          deletedCount: 0,
          failedCount: 0,
          errors: []
        };
      }

      // Verify no in_progress sessions are included
      const inProgressSessions = sessionsToDelete.filter(s => s.status === 'in_progress');
      if (inProgressSessions.length > 0) {
        return {
          success: false,
          deletedCount: 0,
          failedCount: 0,
          errors: ['Cannot delete sessions that are in progress']
        };
      }

      const sessionIds = sessionsToDelete.map(s => s.id);
      console.log(`🗑️ Deleting ${sessionIds.length} exam sessions`);

      // Delete sessions in batches to avoid overwhelming the database
      const batchSize = 50;
      let deletedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < sessionIds.length; i += batchSize) {
        const batch = sessionIds.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('exam_sessions')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.error(`❌ Error deleting batch ${i / batchSize + 1}:`, deleteError);
          failedCount += batch.length;
          errors.push(`Batch ${i / batchSize + 1}: ${deleteError.message}`);
        } else {
          deletedCount += batch.length;
          console.log(`✅ Deleted batch ${i / batchSize + 1}: ${batch.length} sessions`);
        }
      }

      console.log(`✅ Bulk delete completed: ${deletedCount} deleted, ${failedCount} failed`);

      return {
        success: failedCount === 0,
        deletedCount,
        failedCount,
        errors
      };
    } catch (error) {
      console.error('❌ Error in bulkDeleteExamSessions:', error);
      return {
        success: false,
        deletedCount: 0,
        failedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }
}

// Export singleton instance
export const examService = new ExamService();

