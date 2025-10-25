// Exam Report Workflow Service
// Service for triggering n8n workflow to generate comprehensive exam reports

import { supabase } from './supabase';

export interface ExamReportRequest {
  session_id: string;
  candidate_id?: string;
  job_description_id?: string;
  include_detailed_analysis?: boolean;
  include_hiring_recommendation?: boolean;
  include_skill_gaps?: boolean;
  report_format?: 'comprehensive' | 'summary' | 'detailed';
}

export interface ExamReportResponse {
  success: boolean;
  action: string;
  session_id: string;
  candidate_name?: string;
  job_title?: string;
  report_generated?: boolean;
  hiring_recommendation?: string;
  confidence_level?: number;
  overall_performance?: string;
  report_metadata?: any;
  message?: string;
  error?: string;
}

export class ExamReportWorkflowService {
  private static readonly N8N_WEBHOOK_URL = process.env.REACT_APP_N8N_EXAM_REPORT_WEBHOOK;

  /**
   * Trigger n8n workflow to generate comprehensive exam report
   */
  static async generateExamReport(request: ExamReportRequest): Promise<ExamReportResponse> {
    try {
      console.log('🚀 Triggering exam report generation workflow...');
      console.log('📊 Request:', request);
      console.log('🔗 Webhook URL:', this.N8N_WEBHOOK_URL);

      if (!this.N8N_WEBHOOK_URL) {
        console.error('❌ N8N webhook URL not configured');
        throw new Error('N8N webhook URL not configured. Please set REACT_APP_N8N_EXAM_REPORT_WEBHOOK environment variable.');
      }

      const response = await fetch(this.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ N8N webhook failed:', response.status, errorText);
        throw new Error(`N8N webhook failed: ${response.status} ${errorText}`);
      }

      const result: ExamReportResponse = await response.json();
      console.log('✅ Exam report generation response:', result);

      return result;
    } catch (error) {
      console.error('❌ Error generating exam report:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive report from database
   */
  static async getComprehensiveReport(sessionId: string): Promise<any> {
    try {
      console.log('📊 Fetching comprehensive report for session:', sessionId);

      const { data, error } = await supabase
        .from('exam_results')
        .select('comprehensive_report, report_generated_at, report_version')
        .eq('exam_session_id', sessionId)
        .single();

      if (error) {
        console.error('❌ Error fetching comprehensive report:', error);
        throw new Error(`Failed to fetch comprehensive report: ${error.message}`);
      }

      if (!data || !data.comprehensive_report) {
        console.log('⚠️ No comprehensive report found for session:', sessionId);
        return null;
      }

      console.log('✅ Comprehensive report fetched successfully');
      return data.comprehensive_report;
    } catch (error) {
      console.error('❌ Error in getComprehensiveReport:', error);
      throw error;
    }
  }

  /**
   * Check if comprehensive report exists for a session
   */
  static async hasComprehensiveReport(sessionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select('comprehensive_report')
        .eq('exam_session_id', sessionId)
        .single();

      if (error) {
        console.error('❌ Error checking comprehensive report:', error);
        return false;
      }

      return !!(data && data.comprehensive_report);
    } catch (error) {
      console.error('❌ Error in hasComprehensiveReport:', error);
      return false;
    }
  }

  /**
   * Generate report for multiple sessions
   */
  static async generateBulkReports(sessionIds: string[]): Promise<ExamReportResponse[]> {
    try {
      console.log('🚀 Generating bulk reports for sessions:', sessionIds);

      const promises = sessionIds.map(sessionId => 
        this.generateExamReport({
          session_id: sessionId,
          include_detailed_analysis: true,
          include_hiring_recommendation: true,
          include_skill_gaps: true,
          report_format: 'comprehensive'
        })
      );

      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`❌ Failed to generate report for session ${sessionIds[index]}:`, result.reason);
          return {
            success: false,
            action: 'exam_report_failed',
            session_id: sessionIds[index],
            error: result.reason?.message || 'Unknown error',
            message: 'Exam report generation failed'
          };
        }
      });
    } catch (error) {
      console.error('❌ Error generating bulk reports:', error);
      throw error;
    }
  }

  /**
   * Get report generation status
   */
  static async getReportStatus(sessionId: string): Promise<{
    hasReport: boolean;
    generatedAt?: string;
    reportVersion?: string;
    lastUpdated?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select('comprehensive_report, report_generated_at, report_version, updated_at')
        .eq('exam_session_id', sessionId)
        .single();

      if (error) {
        console.error('❌ Error fetching report status:', error);
        return { hasReport: false };
      }

      return {
        hasReport: !!(data && data.comprehensive_report),
        generatedAt: data?.report_generated_at,
        reportVersion: data?.report_version,
        lastUpdated: data?.updated_at
      };
    } catch (error) {
      console.error('❌ Error in getReportStatus:', error);
      return { hasReport: false };
    }
  }
}
