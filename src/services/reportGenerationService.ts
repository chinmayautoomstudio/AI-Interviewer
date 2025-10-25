import { supabase } from './supabase';
import { ExamSession, ExamResponse, ExamResult, Candidate, JobDescription } from '../types';

export interface ReportData {
  // Basic Information
  sessionId: string;
  candidate: Candidate;
  jobDescription: JobDescription;
  examSession: ExamSession;
  
  // Performance Summary
  overallScore: number;
  maxScore: number;
  percentage: number;
  evaluationStatus: 'passed' | 'failed' | 'pending';
  
  // MCQ Results
  mcqResults: {
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    percentage: number;
    averageTimePerQuestion: number;
  };
  
  // Text Results
  textResults: {
    totalQuestions: number;
    averageScore: number;
    averagePercentage: number;
    averageConfidence: number;
    totalScore: number;
    maxScore: number;
    percentage: number;
  };
  
  // Detailed Analysis
  questionAnalysis: QuestionAnalysis[];
  skillGaps: SkillGap[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  
  // AI Insights
  hiringRecommendation: {
    recommendation: 'hire' | 'interview' | 'reject' | 'provide_foundational_training';
    confidence: number;
    reasoning: string;
  };
  
  // Metadata
  generatedAt: string;
  processingTime: number;
  evaluationVersion: string;
}

export interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  questionType: 'mcq' | 'text';
  category: string;
  difficulty: string;
  points: number;
  candidateAnswer: string;
  correctAnswer?: string;
  pointsEarned: number;
  isCorrect: boolean;
  timeTaken?: number;
  evaluationDetails?: any;
  feedback?: {
    overall: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
}

export interface SkillGap {
  skill: string;
  level: 'critical' | 'important' | 'nice_to_have';
  currentLevel: number; // 0-100
  requiredLevel: number; // 0-100
  gap: number;
  recommendations: string[];
}

export class ReportGenerationService {
  /**
   * Generate comprehensive exam report
   */
  async generateReport(sessionId: string): Promise<ReportData> {
    try {
      console.log('📊 Generating comprehensive report for session:', sessionId);
      
      // Fetch all required data
      const [session, responses, result, candidate, jobDescription] = await Promise.all([
        this.getExamSession(sessionId),
        this.getExamResponses(sessionId),
        this.getExamResult(sessionId),
        this.getCandidate(sessionId),
        this.getJobDescription(sessionId)
      ]);

      if (!session || !responses || !result) {
        throw new Error('Missing required data for report generation');
      }

      // Analyze performance
      const mcqResults = this.analyzeMCQPerformance(responses);
      const textResults = this.analyzeTextPerformance(responses);
      const questionAnalysis = this.analyzeQuestions(responses);
      const skillGaps = this.identifySkillGaps(questionAnalysis, jobDescription);
      const { strengths, weaknesses, recommendations } = this.generateInsights(questionAnalysis, skillGaps);
      
      // Get hiring recommendation from text evaluation
      const hiringRecommendation = this.extractHiringRecommendation(result);

      const reportData: ReportData = {
        sessionId,
        candidate: candidate!,
        jobDescription: jobDescription!,
        examSession: session,
        overallScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        evaluationStatus: result.evaluationStatus as 'passed' | 'failed' | 'pending',
        mcqResults,
        textResults,
        questionAnalysis,
        skillGaps,
        strengths,
        weaknesses,
        recommendations,
        hiringRecommendation,
        generatedAt: new Date().toISOString(),
        processingTime: 0, // Will be calculated
        evaluationVersion: '1.0'
      };

      console.log('✅ Report generated successfully:', {
        sessionId,
        overallScore: reportData.overallScore,
        percentage: reportData.percentage,
        mcqQuestions: mcqResults.totalQuestions,
        textQuestions: textResults.totalQuestions,
        skillGaps: skillGaps.length
      });

      return reportData;

    } catch (error) {
      console.error('❌ Error generating report:', error);
      throw error;
    }
  }

  /**
   * Get exam session data
   */
  private async getExamSession(sessionId: string): Promise<ExamSession | null> {
    const { data, error } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching exam session:', error);
      return null;
    }

    return data;
  }

  /**
   * Get all exam responses with question details
   */
  private async getExamResponses(sessionId: string): Promise<ExamResponse[]> {
    const { data, error } = await supabase
      .from('exam_responses')
      .select(`
        *,
        question:exam_questions(*)
      `)
      .eq('exam_session_id', sessionId);

    if (error) {
      console.error('Error fetching exam responses:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get exam result data
   */
  private async getExamResult(sessionId: string): Promise<ExamResult | null> {
    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .eq('exam_session_id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching exam result:', error);
      return null;
    }

    // Transform database column names to TypeScript interface
    return {
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
      textEvaluationTimestamp: data.text_evaluation_timestamp
    };
  }

  /**
   * Get candidate data
   */
  private async getCandidate(sessionId: string): Promise<Candidate | null> {
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('candidate_id')
      .eq('id', sessionId)
      .single();

    if (!session?.candidate_id) return null;

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', session.candidate_id)
      .single();

    if (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }

    return data;
  }

  /**
   * Get job description data
   */
  private async getJobDescription(sessionId: string): Promise<JobDescription | null> {
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('job_description_id')
      .eq('id', sessionId)
      .single();

    if (!session?.job_description_id) return null;

    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', session.job_description_id)
      .single();

    if (error) {
      console.error('Error fetching job description:', error);
      return null;
    }

    return data;
  }

  /**
   * Analyze MCQ performance
   */
  private analyzeMCQPerformance(responses: ExamResponse[]): ReportData['mcqResults'] {
    const mcqResponses = responses.filter(r => r.question?.question_type === 'mcq');
    
    if (mcqResponses.length === 0) {
      return {
        totalQuestions: 0,
        correctAnswers: 0,
        score: 0,
        percentage: 0,
        averageTimePerQuestion: 0
      };
    }

    const correctAnswers = mcqResponses.filter(r => r.is_correct).length;
    const totalScore = mcqResponses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
    const maxScore = mcqResponses.reduce((sum, r) => sum + (r.question?.points || 1), 0);
    const totalTime = mcqResponses.reduce((sum, r) => sum + (r.time_taken_seconds || 0), 0);

    return {
      totalQuestions: mcqResponses.length,
      correctAnswers,
      score: totalScore,
      percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
      averageTimePerQuestion: mcqResponses.length > 0 ? Math.round(totalTime / mcqResponses.length) : 0
    };
  }

  /**
   * Analyze text performance
   */
  private analyzeTextPerformance(responses: ExamResponse[]): ReportData['textResults'] {
    const textResponses = responses.filter(r => r.question?.question_type === 'text');
    
    if (textResponses.length === 0) {
      return {
        totalQuestions: 0,
        averageScore: 0,
        averagePercentage: 0,
        averageConfidence: 0,
        totalScore: 0,
        maxScore: 0,
        percentage: 0
      };
    }

    const totalScore = textResponses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
    const maxScore = textResponses.reduce((sum, r) => sum + (r.question?.points || 1), 0);
    
    // Calculate average confidence from AI evaluation
    const confidenceScores = textResponses
      .map(r => r.evaluation_details?.ai_evaluation?.ai_confidence)
      .filter(conf => conf !== undefined);
    
    const averageConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length 
      : 0;

    return {
      totalQuestions: textResponses.length,
      averageScore: textResponses.length > 0 ? totalScore / textResponses.length : 0,
      averagePercentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      totalScore,
      maxScore,
      percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    };
  }

  /**
   * Analyze individual questions
   */
  private analyzeQuestions(responses: ExamResponse[]): QuestionAnalysis[] {
    return responses.map(response => {
      const question = response.question;
      const evaluationDetails = response.evaluation_details;
      
      return {
        questionId: response.question_id,
        questionText: question?.question_text || '',
        questionType: question?.question_type as 'mcq' | 'text',
        category: question?.question_category || 'general',
        difficulty: question?.difficulty_level || 'medium',
        points: question?.points || 1,
        candidateAnswer: response.answer_text || '',
        correctAnswer: question?.correct_answer,
        pointsEarned: response.points_earned || 0,
        isCorrect: response.is_correct || false,
        timeTaken: response.time_taken_seconds,
        evaluationDetails,
        feedback: evaluationDetails?.ai_evaluation?.feedback
      };
    });
  }

  /**
   * Identify skill gaps
   */
  private identifySkillGaps(questionAnalysis: QuestionAnalysis[], jobDescription: JobDescription | null): SkillGap[] {
    if (!jobDescription) return [];

    const skillGaps: SkillGap[] = [];
    const requiredSkills = jobDescription.required_skills || [];
    
    // Analyze performance by category
    const categoryPerformance = this.analyzeCategoryPerformance(questionAnalysis);
    
    requiredSkills.forEach(skill => {
      const category = this.mapSkillToCategory(skill);
      const performance = categoryPerformance[category] || 0;
      const requiredLevel = 70; // Default required level
      
      if (performance < requiredLevel) {
        skillGaps.push({
          skill,
          level: performance < 50 ? 'critical' : performance < 70 ? 'important' : 'nice_to_have',
          currentLevel: performance,
          requiredLevel,
          gap: requiredLevel - performance,
          recommendations: this.generateSkillRecommendations(skill, performance)
        });
      }
    });

    return skillGaps;
  }

  /**
   * Analyze performance by category
   */
  private analyzeCategoryPerformance(questionAnalysis: QuestionAnalysis[]): Record<string, number> {
    const categoryScores: Record<string, { total: number; max: number }> = {};
    
    questionAnalysis.forEach(q => {
      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { total: 0, max: 0 };
      }
      categoryScores[q.category].total += q.pointsEarned;
      categoryScores[q.category].max += q.points;
    });

    const categoryPerformance: Record<string, number> = {};
    Object.entries(categoryScores).forEach(([category, scores]) => {
      categoryPerformance[category] = scores.max > 0 ? Math.round((scores.total / scores.max) * 100) : 0;
    });

    return categoryPerformance;
  }

  /**
   * Map skill to category
   */
  private mapSkillToCategory(skill: string): string {
    const skillLower = skill.toLowerCase();
    
    if (skillLower.includes('javascript') || skillLower.includes('react') || skillLower.includes('node')) {
      return 'technical';
    } else if (skillLower.includes('sql') || skillLower.includes('database')) {
      return 'technical';
    } else if (skillLower.includes('css') || skillLower.includes('html')) {
      return 'technical';
    } else if (skillLower.includes('problem') || skillLower.includes('logic')) {
      return 'aptitude';
    }
    
    return 'general';
  }

  /**
   * Generate skill recommendations
   */
  private generateSkillRecommendations(skill: string, currentLevel: number): string[] {
    const recommendations: string[] = [];
    
    if (currentLevel < 30) {
      recommendations.push(`Start with basic ${skill} concepts and fundamentals`);
      recommendations.push(`Practice with beginner-level exercises and tutorials`);
    } else if (currentLevel < 60) {
      recommendations.push(`Focus on intermediate ${skill} concepts`);
      recommendations.push(`Work on practical projects to apply knowledge`);
    } else {
      recommendations.push(`Refine advanced ${skill} techniques`);
      recommendations.push(`Study best practices and optimization strategies`);
    }
    
    return recommendations;
  }

  /**
   * Generate insights
   */
  private generateInsights(questionAnalysis: QuestionAnalysis[], skillGaps: SkillGap[]): {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze strengths and weaknesses from question analysis
    const correctQuestions = questionAnalysis.filter(q => q.isCorrect);
    const incorrectQuestions = questionAnalysis.filter(q => !q.isCorrect);

    // Identify strong categories
    const categoryPerformance = this.analyzeCategoryPerformance(questionAnalysis);
    Object.entries(categoryPerformance).forEach(([category, score]) => {
      if (score >= 80) {
        strengths.push(`Strong performance in ${category} questions`);
      } else if (score < 50) {
        weaknesses.push(`Needs improvement in ${category} questions`);
      }
    });

    // Add skill gap insights
    skillGaps.forEach(gap => {
      if (gap.level === 'critical') {
        weaknesses.push(`Critical gap in ${gap.skill} (${gap.currentLevel}% vs required ${gap.requiredLevel}%)`);
      }
      recommendations.push(...gap.recommendations);
    });

    // General recommendations
    if (correctQuestions.length > incorrectQuestions.length) {
      strengths.push('Demonstrates good understanding of core concepts');
    } else {
      weaknesses.push('Needs to strengthen fundamental knowledge');
      recommendations.push('Focus on core concepts before advancing to complex topics');
    }

    return { strengths, weaknesses, recommendations };
  }

  /**
   * Extract hiring recommendation from exam result
   */
  private extractHiringRecommendation(result: ExamResult): ReportData['hiringRecommendation'] {
    const hiringRecs = result.hiringRecommendations;
    
    if (hiringRecs?.hiring_decision) {
      return {
        recommendation: hiringRecs.hiring_decision.recommendation as any,
        confidence: hiringRecs.hiring_decision.confidence || 0.5,
        reasoning: hiringRecs.hiring_decision.reasoning || 'No specific reasoning provided'
      };
    }

    // Fallback based on overall performance
    const recommendation = result.percentage >= 70 ? 'hire' : 
                          result.percentage >= 50 ? 'interview' : 'reject';
    
    return {
      recommendation,
      confidence: 0.7,
      reasoning: `Based on overall performance of ${result.percentage}%`
    };
  }
}

export const reportGenerationService = new ReportGenerationService();
