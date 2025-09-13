import { supabase } from './supabase';
import { 
  InterviewSession, 
  InterviewMessage, 
  InterviewReport, 
  StartInterviewRequest, 
  ChatMessageRequest, 
  InterviewCompletionData,
  Candidate,
  JobDescription,
  AIAgent
} from '../types';

export class InterviewSystemService {
  // Generate unique session ID
  static generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `INT-${timestamp}-${random}`.toUpperCase();
  }

  // Start a new interview session
  static async startInterview(request: StartInterviewRequest): Promise<{ data: InterviewSession | null; error?: string }> {
    try {
      const sessionId = this.generateSessionId();
      
      // Get candidate and job description data
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', request.candidateId)
        .single();

      if (candidateError) {
        return { data: null, error: 'Candidate not found' };
      }

      const { data: jobDescription, error: jobError } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('id', request.jobDescriptionId)
        .single();

      if (jobError) {
        return { data: null, error: 'Job description not found' };
      }

      // Get AI agent if specified
      let aiAgent = null;
      if (request.aiAgentId) {
        const { data: agent, error: agentError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', request.aiAgentId)
          .single();
        
        if (!agentError) {
          aiAgent = agent;
        }
      }

      // Create interview session
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert({
          session_id: sessionId,
          candidate_id: request.candidateId,
          job_description_id: request.jobDescriptionId,
          ai_agent_id: request.aiAgentId || null,
          status: 'pending',
          started_at: new Date().toISOString(),
          total_questions: 0,
          questions_answered: 0
        })
        .select()
        .single();

      if (sessionError) {
        return { data: null, error: 'Failed to create interview session' };
      }

      // Send initial data to n8n workflow
      await this.sendToN8nWorkflow(sessionId, candidate, jobDescription, aiAgent);

      return { data: session };
    } catch (error) {
      console.error('Error starting interview:', error);
      return { data: null, error: 'Failed to start interview' };
    }
  }

  // Send interview data to n8n workflow
  static async sendToN8nWorkflow(
    sessionId: string, 
    candidate: Candidate, 
    jobDescription: JobDescription, 
    aiAgent: AIAgent | null
  ): Promise<void> {
    try {
      const webhookUrl = process.env.REACT_APP_N8N_INTERVIEW_WEBHOOK;
      if (!webhookUrl) {
        throw new Error('N8N interview webhook URL not configured');
      }

      const payload = {
        session_id: sessionId,
        candidate_data: {
          id: candidate.id,
          candidate_id: candidate.candidate_id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone || candidate.contact_number,
          skills: candidate.skills || [],
          experience: candidate.experience || '',
          education: candidate.education || '',
          summary: candidate.summary || ''
        },
        job_data: {
          id: jobDescription.id,
          job_description_id: jobDescription.job_description_id,
          title: jobDescription.title,
          department: jobDescription.department,
          location: jobDescription.location,
          requirements: jobDescription.requirements || [],
          skills: jobDescription.skills || [],
          description: jobDescription.description || '',
          responsibilities: jobDescription.responsibilities || []
        },
        ai_agent: aiAgent ? {
          id: aiAgent.id,
          name: aiAgent.name,
          agent_type: aiAgent.agentType,
          webhook_url: aiAgent.n8nWebhookUrl
        } : null
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`);
      }

      // Update session status to in_progress
      await supabase
        .from('interview_sessions')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

    } catch (error) {
      console.error('Error sending to N8N workflow:', error);
      // Update session status to failed
      await supabase
        .from('interview_sessions')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
      throw error;
    }
  }

  // Send voice message to n8n workflow for ElevenLabs STT processing
  static async sendVoiceMessage(
    sessionId: string, 
    audioBlob: Blob, 
    audioDuration: number
  ): Promise<{ data: { transcript: string; response: string; audioResponse: string; confidence: number } | null; error?: string }> {
    try {
      const webhookUrl = process.env.REACT_APP_N8N_VOICE_WEBHOOK;
      if (!webhookUrl) {
        throw new Error('N8N voice webhook URL not configured');
      }

      // Convert Blob to base64 for transmission to ElevenLabs STT
      const base64Audio = await this.blobToBase64(audioBlob);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'voice_message',
          sessionId: sessionId,
          audioData: base64Audio,
          audioDuration: audioDuration,
          audioFormat: audioBlob.type || 'audio/webm',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Voice webhook failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Error sending voice message:', error);
      return { data: null, error: 'Failed to process voice message' };
    }
  }

  // Helper method to convert Blob to base64
  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data:audio/webm;base64,
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Start voice interview session
  static async startVoiceInterview(
    candidateId: string, 
    jobDescriptionId: string, 
    aiAgentId?: string
  ): Promise<{ data: { sessionId: string; voiceId: string; voiceSettings: any } | null; error?: string }> {
    try {
      const webhookUrl = process.env.REACT_APP_N8N_VOICE_WEBHOOK;
      if (!webhookUrl) {
        throw new Error('N8N voice webhook URL not configured');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_interview',
          candidateId: candidateId,
          jobDescriptionId: jobDescriptionId,
          aiAgentId: aiAgentId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Voice interview start failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Error starting voice interview:', error);
      return { data: null, error: 'Failed to start voice interview' };
    }
  }

  // End voice interview session
  static async endVoiceInterview(sessionId: string): Promise<{ data: { report: any } | null; error?: string }> {
    try {
      const webhookUrl = process.env.REACT_APP_N8N_VOICE_WEBHOOK;
      if (!webhookUrl) {
        throw new Error('N8N voice webhook URL not configured');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'end_interview',
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Voice interview end failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Error ending voice interview:', error);
      return { data: null, error: 'Failed to end voice interview' };
    }
  }

  // Send chat message to n8n workflow
  static async sendChatMessage(request: ChatMessageRequest): Promise<{ data: InterviewMessage | null; error?: string }> {
    try {
      // Get the interview session ID first
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('id')
        .eq('session_id', request.sessionId)
        .single();

      if (sessionError || !session) {
        return { data: null, error: 'Session not found' };
      }

      // Save message to database
      const { data: message, error: messageError } = await supabase
        .from('interview_messages')
        .insert({
          interview_session_id: session.id,
          message_type: request.sender === 'candidate' ? 'answer' : 'question',
          content: request.message,
          sender: request.sender,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (messageError) {
        return { data: null, error: 'Failed to save message' };
      }

      // Send to n8n workflow for AI response
      const webhookUrl = process.env.REACT_APP_N8N_CHAT_WEBHOOK;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: request.sessionId,
            message: request.message,
            sender: request.sender,
            timestamp: new Date().toISOString()
          })
        });
      }

      return { data: message };
    } catch (error) {
      console.error('Error sending chat message:', error);
      return { data: null, error: 'Failed to send message' };
    }
  }

  // Get interview session by ID
  static async getInterviewSession(sessionId: string): Promise<{ data: InterviewSession | null; error?: string }> {
    try {
      const { data: session, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        return { data: null, error: 'Session not found' };
      }

      return { data: session };
    } catch (error) {
      console.error('Error getting interview session:', error);
      return { data: null, error: 'Failed to get session' };
    }
  }

  // Get interview messages for a session
  static async getInterviewMessages(sessionId: string): Promise<{ data: InterviewMessage[]; error?: string }> {
    try {
      // Get the interview session ID first
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !session) {
        return { data: [], error: 'Session not found' };
      }

      const { data: messages, error } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('interview_session_id', session.id)
        .order('timestamp', { ascending: true });

      if (error) {
        return { data: [], error: 'Failed to get messages' };
      }

      return { data: messages || [] };
    } catch (error) {
      console.error('Error getting interview messages:', error);
      return { data: [], error: 'Failed to get messages' };
    }
  }

  // Complete interview and generate report
  static async completeInterview(completionData: InterviewCompletionData): Promise<{ data: InterviewReport | null; error?: string }> {
    try {
      // Update session status
      await supabase
        .from('interview_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', completionData.sessionId);

      // Get the interview session ID first
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('id')
        .eq('session_id', completionData.sessionId)
        .single();

      if (sessionError || !session) {
        return { data: null, error: 'Session not found' };
      }

      // Create interview report
      const { data: report, error: reportError } = await supabase
        .from('interview_reports')
        .insert({
          interview_session_id: session.id,
          overall_score: completionData.reportData.overallScore,
          suitability_status: completionData.reportData.suitabilityStatus,
          technical_score: completionData.reportData.scores.technical,
          communication_score: completionData.reportData.scores.communication,
          problem_solving_score: completionData.reportData.scores.problemSolving,
          cultural_fit_score: completionData.reportData.scores.culturalFit,
          strengths: completionData.reportData.strengths,
          weaknesses: completionData.reportData.weaknesses,
          recommendations: completionData.reportData.recommendations,
          detailed_feedback: completionData.reportData.feedback,
          report_data: completionData.reportData,
          email_sent: false,
          email_recipients: []
        })
        .select()
        .single();

      if (reportError) {
        return { data: null, error: 'Failed to create report' };
      }

      // Trigger report generation and email workflow
      await this.triggerReportGeneration(completionData.sessionId, report);

      return { data: report };
    } catch (error) {
      console.error('Error completing interview:', error);
      return { data: null, error: 'Failed to complete interview' };
    }
  }

  // Trigger report generation and email workflow
  static async triggerReportGeneration(sessionId: string, report: InterviewReport): Promise<void> {
    try {
      const webhookUrl = process.env.REACT_APP_N8N_REPORT_WEBHOOK;
      if (!webhookUrl) {
        console.warn('N8N report webhook URL not configured');
        return;
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          report_data: report
        })
      });
    } catch (error) {
      console.error('Error triggering report generation:', error);
    }
  }

  // Get interview report by session ID
  static async getInterviewReport(sessionId: string): Promise<{ data: InterviewReport | null; error?: string }> {
    try {
      // Get the interview session ID first
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !session) {
        return { data: null, error: 'Session not found' };
      }

      const { data: report, error } = await supabase
        .from('interview_reports')
        .select('*')
        .eq('interview_session_id', session.id)
        .single();

      if (error) {
        return { data: null, error: 'Report not found' };
      }

      return { data: report };
    } catch (error) {
      console.error('Error getting interview report:', error);
      return { data: null, error: 'Failed to get report' };
    }
  }

  // Get all interview sessions for a candidate
  static async getCandidateInterviews(candidateId: string): Promise<{ data: InterviewSession[]; error?: string }> {
    try {
      const { data: sessions, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: 'Failed to get interviews' };
      }

      return { data: sessions || [] };
    } catch (error) {
      console.error('Error getting candidate interviews:', error);
      return { data: [], error: 'Failed to get interviews' };
    }
  }

  // Cancel interview session
  static async cancelInterview(sessionId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('interview_sessions')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        return { error: 'Failed to cancel interview' };
      }

      return {};
    } catch (error) {
      console.error('Error cancelling interview:', error);
      return { error: 'Failed to cancel interview' };
    }
  }
}
