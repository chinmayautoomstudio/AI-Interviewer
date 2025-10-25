// Exam Results Service
// Service for managing exam results, analytics, and reporting

import { supabase } from './supabase';
import { ExamResult, ExamSession, Candidate, JobDescription } from '../types';

export interface ExamResultWithDetails extends ExamResult {
  candidate: Candidate;
  jobDescription: JobDescription;
  examSession: ExamSession;
  aiEvaluation?: any;
}

export interface ExamResultsFilter {
  search?: string;
  status?: 'pending' | 'passed' | 'failed' | 'all';
  scoreRange?: 'excellent' | 'good' | 'average' | 'poor' | 'all';
  jobDescriptionId?: string;
  candidateId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'score' | 'name' | 'time';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ExamResultsStats {
  totalResults: number;
  passedResults: number;
  failedResults: number;
  pendingResults: number;
  averageScore: number;
  averageTimeTaken: number;
  byJobDescription: Array<{
    jobDescriptionId: string;
    jobTitle: string;
    totalResults: number;
    averageScore: number;
    passRate: number;
  }>;
  byCategory: {
    technical: {
      totalScore: number;
      averageScore: number;
      totalQuestions: number;
    };
    aptitude: {
      totalScore: number;
      averageScore: number;
      totalQuestions: number;
    };
  };
  scoreDistribution: {
    excellent: number; // 90%+
    good: number;      // 70-89%
    average: number;   // 50-69%
    poor: number;      // <50%
  };
}

export interface ExamResultServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ExamResultsService {
  /**
   * Get exam results with filtering and pagination
   */
  async getExamResults(filter: ExamResultsFilter = {}): Promise<ExamResultServiceResponse<ExamResultWithDetails[]>> {
    try {
      let query = supabase
        .from('exam_results')
        .select(`
          *,
          exam_session:exam_sessions(
            *,
            candidate:candidates(*),
            job_description:job_descriptions(*)
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter.status && filter.status !== 'all') {
        query = query.eq('evaluation_status', filter.status);
      }

      if (filter.jobDescriptionId) {
        query = query.eq('exam_session.job_description_id', filter.jobDescriptionId);
      }

      if (filter.candidateId) {
        query = query.eq('candidate_id', filter.candidateId);
      }

      if (filter.dateFrom) {
        query = query.gte('created_at', filter.dateFrom);
      }

      if (filter.dateTo) {
        query = query.lte('created_at', filter.dateTo);
      }

      // Score range filtering
      if (filter.scoreRange && filter.scoreRange !== 'all') {
        switch (filter.scoreRange) {
          case 'excellent':
            query = query.gte('percentage', 90);
            break;
          case 'good':
            query = query.gte('percentage', 70).lt('percentage', 90);
            break;
          case 'average':
            query = query.gte('percentage', 50).lt('percentage', 70);
            break;
          case 'poor':
            query = query.lt('percentage', 50);
            break;
        }
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
        console.error('Error fetching exam results:', error);
        return { success: false, error: error.message };
      }

      // Transform the data to match our interface
      const transformedData: ExamResultWithDetails[] = (data || []).map(result => ({
        id: result.id,
        examSessionId: result.exam_session_id,
        candidateId: result.candidate_id,
        totalScore: result.total_score,
        maxScore: result.max_score,
        percentage: result.percentage,
        correctAnswers: result.correct_answers,
        wrongAnswers: result.wrong_answers,
        skippedQuestions: result.skipped_questions,
        technicalScore: result.technical_score,
        aptitudeScore: result.aptitude_score,
        timeTakenMinutes: result.time_taken_minutes,
        evaluationStatus: result.evaluation_status,
        aiEvaluation: result.ai_evaluation,
        createdAt: result.created_at,
        candidate: result.exam_session?.candidate,
        jobDescription: result.exam_session?.job_description,
        examSession: result.exam_session
      }));

      // Apply search filter after transformation
      let filteredData = transformedData;
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        filteredData = transformedData.filter(result => 
          result.candidate?.name?.toLowerCase().includes(searchTerm) ||
          result.candidate?.email?.toLowerCase().includes(searchTerm) ||
          result.jobDescription?.title?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply sorting
      if (filter.sortBy) {
        filteredData.sort((a, b) => {
          let comparison = 0;
          switch (filter.sortBy) {
            case 'score':
              comparison = a.percentage - b.percentage;
              break;
            case 'name':
              comparison = (a.candidate?.name || '').localeCompare(b.candidate?.name || '');
              break;
            case 'time':
              comparison = (a.timeTakenMinutes || 0) - (b.timeTakenMinutes || 0);
              break;
            case 'date':
            default:
              comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              break;
          }
          return filter.sortOrder === 'asc' ? comparison : -comparison;
        });
      }

      return { success: true, data: filteredData };
    } catch (error) {
      console.error('Error in getExamResults:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch exam results' 
      };
    }
  }

  /**
   * Get exam result by ID
   */
  async getExamResultById(id: string): Promise<ExamResultServiceResponse<ExamResultWithDetails>> {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          *,
          exam_session:exam_sessions(
            *,
            candidate:candidates(*),
            job_description:job_descriptions(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Exam result not found' };
        }
        console.error('Error fetching exam result:', error);
        return { success: false, error: error.message };
      }

      const transformedData: ExamResultWithDetails = {
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
        candidate: data.exam_session?.candidate,
        jobDescription: data.exam_session?.job_description,
        examSession: data.exam_session
      };

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error in getExamResultById:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch exam result' 
      };
    }
  }

  /**
   * Get exam results statistics
   */
  async getExamResultsStats(filter: ExamResultsFilter = {}): Promise<ExamResultServiceResponse<ExamResultsStats>> {
    try {
      // Get all results for statistics calculation
      const resultsResponse = await this.getExamResults({ ...filter, limit: 1000 });
      if (!resultsResponse.success || !resultsResponse.data) {
        return { success: false, error: 'Failed to fetch results for statistics' };
      }

      const results = resultsResponse.data;

      // Calculate basic statistics
      const totalResults = results.length;
      const passedResults = results.filter(r => r.evaluationStatus === 'passed').length;
      const failedResults = results.filter(r => r.evaluationStatus === 'failed').length;
      const pendingResults = results.filter(r => r.evaluationStatus === 'pending').length;
      const averageScore = totalResults > 0 ? results.reduce((sum, r) => sum + r.percentage, 0) / totalResults : 0;
      const averageTimeTaken = totalResults > 0 ? results.reduce((sum, r) => sum + (r.timeTakenMinutes || 0), 0) / totalResults : 0;

      // Calculate score distribution
      const scoreDistribution = {
        excellent: results.filter(r => r.percentage >= 90).length,
        good: results.filter(r => r.percentage >= 70 && r.percentage < 90).length,
        average: results.filter(r => r.percentage >= 50 && r.percentage < 70).length,
        poor: results.filter(r => r.percentage < 50).length
      };

      // Calculate by job description
      const jobDescriptionMap = new Map();
      results.forEach(result => {
        if (result.jobDescription) {
          const jobId = result.jobDescription.id;
          if (!jobDescriptionMap.has(jobId)) {
            jobDescriptionMap.set(jobId, {
              jobDescriptionId: jobId,
              jobTitle: result.jobDescription.title,
              totalResults: 0,
              totalScore: 0,
              passedResults: 0
            });
          }
          const jobStats = jobDescriptionMap.get(jobId);
          jobStats.totalResults++;
          jobStats.totalScore += result.percentage;
          if (result.evaluationStatus === 'passed') {
            jobStats.passedResults++;
          }
        }
      });

      const byJobDescription = Array.from(jobDescriptionMap.values()).map(job => ({
        jobDescriptionId: job.jobDescriptionId,
        jobTitle: job.jobTitle,
        totalResults: job.totalResults,
        averageScore: job.totalScore / job.totalResults,
        passRate: (job.passedResults / job.totalResults) * 100
      }));

      // Calculate by category
      const technicalResults = results.filter(r => r.technicalScore !== undefined);
      const aptitudeResults = results.filter(r => r.aptitudeScore !== undefined);

      const byCategory = {
        technical: {
          totalScore: technicalResults.reduce((sum, r) => sum + (r.technicalScore || 0), 0),
          averageScore: technicalResults.length > 0 ? technicalResults.reduce((sum, r) => sum + (r.technicalScore || 0), 0) / technicalResults.length : 0,
          totalQuestions: technicalResults.length
        },
        aptitude: {
          totalScore: aptitudeResults.reduce((sum, r) => sum + (r.aptitudeScore || 0), 0),
          averageScore: aptitudeResults.length > 0 ? aptitudeResults.reduce((sum, r) => sum + (r.aptitudeScore || 0), 0) / aptitudeResults.length : 0,
          totalQuestions: aptitudeResults.length
        }
      };

      const stats: ExamResultsStats = {
        totalResults,
        passedResults,
        failedResults,
        pendingResults,
        averageScore,
        averageTimeTaken,
        byJobDescription,
        byCategory,
        scoreDistribution
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error in getExamResultsStats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch exam results statistics' 
      };
    }
  }

  /**
   * Update exam result evaluation status
   */
  async updateEvaluationStatus(
    resultId: string, 
    status: 'pending' | 'passed' | 'failed',
    aiEvaluation?: any
  ): Promise<ExamResultServiceResponse<boolean>> {
    try {
      const updateData: any = {
        evaluation_status: status,
        updated_at: new Date().toISOString()
      };

      if (aiEvaluation) {
        updateData.ai_evaluation = aiEvaluation;
      }

      const { error } = await supabase
        .from('exam_results')
        .update(updateData)
        .eq('id', resultId);

      if (error) {
        console.error('Error updating evaluation status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Error in updateEvaluationStatus:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update evaluation status' 
      };
    }
  }

  /**
   * Export exam results to CSV
   */
  async exportExamResults(filter: ExamResultsFilter = {}): Promise<ExamResultServiceResponse<string>> {
    try {
      const resultsResponse = await this.getExamResults({ ...filter, limit: 10000 });
      if (!resultsResponse.success || !resultsResponse.data) {
        return { success: false, error: 'Failed to fetch results for export' };
      }

      const results = resultsResponse.data;

      // Create CSV headers
      const headers = [
        'Candidate Name',
        'Candidate Email',
        'Job Title',
        'Total Score',
        'Max Score',
        'Percentage',
        'Correct Answers',
        'Wrong Answers',
        'Skipped Questions',
        'Technical Score',
        'Aptitude Score',
        'Time Taken (minutes)',
        'Evaluation Status',
        'Completed At'
      ];

      // Create CSV rows
      const rows = results.map(result => [
        result.candidate?.name || '',
        result.candidate?.email || '',
        result.jobDescription?.title || '',
        result.totalScore,
        result.maxScore,
        result.percentage,
        result.correctAnswers,
        result.wrongAnswers,
        result.skippedQuestions,
        result.technicalScore || '',
        result.aptitudeScore || '',
        result.timeTakenMinutes || '',
        result.evaluationStatus,
        new Date(result.createdAt).toLocaleString()
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return { success: true, data: csvContent };
    } catch (error) {
      console.error('Error in exportExamResults:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to export exam results' 
      };
    }
  }
}

export const examResultsService = new ExamResultsService();
