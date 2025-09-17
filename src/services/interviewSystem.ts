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
  // Response cache to prevent duplicate processing
  private static responseCache = new Map<string, { response: any; timestamp: number }>();
  
  // Generate unique session ID
  static generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `INT-${timestamp}-${random}`.toUpperCase();
  }

  // Clear response cache for a new interview session
  static clearResponseCache(sessionId: string): void {
    console.log('🧹 Clearing response cache for session:', sessionId);
    // Remove all entries for this session
    const entries = Array.from(this.responseCache.entries());
    for (const [key, value] of entries) {
      if (key.startsWith(sessionId)) {
        this.responseCache.delete(key);
      }
    }
    console.log('✅ Response cache cleared for session:', sessionId);
  }

  // Get current session data
  static async getCurrentSession(): Promise<{
    sessionId: string;
    candidate: Candidate;
    jobDescription: JobDescription;
    aiAgent: AIAgent | null;
  } | null> {
    try {
      // Get the most recent active session
      const { data: sessions, error } = await supabase
        .from('interview_sessions')
        .select(`
          session_id,
          candidate: candidates(*),
          job_description: job_descriptions(*),
          ai_agent: ai_agents(*)
        `)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Error fetching current session:', error);
        return null;
      }

      if (!sessions || sessions.length === 0) {
        console.log('⚠️ No active session found');
        return null;
      }

      const session = sessions[0];
      console.log('✅ Current session found:', session.session_id);

      return {
        sessionId: session.session_id,
        candidate: Array.isArray(session.candidate) ? session.candidate[0] : session.candidate,
        jobDescription: Array.isArray(session.job_description) ? session.job_description[0] : session.job_description,
        aiAgent: Array.isArray(session.ai_agent) ? session.ai_agent[0] : session.ai_agent
      };
    } catch (error) {
      console.error('❌ Error getting current session:', error);
      return null;
    }
  }

  // Check if response is duplicate and add to cache
  private static isDuplicateResponse(sessionId: string, response: any): boolean {
    // Normalize response by trimming whitespace and newlines for better duplicate detection
    const normalizedResponse = typeof response === 'string' 
      ? response.trim() 
      : response && typeof response === 'object' && response.output
        ? { ...response, output: response.output.trim() }
        : response;
    
    const responseKey = `${sessionId}-${JSON.stringify(normalizedResponse)}`;
    const now = Date.now();
    
    // Clean old cache entries (older than 30 seconds)
    const entries = Array.from(this.responseCache.entries());
    for (const [key, value] of entries) {
      if (now - value.timestamp > 30000) {
        this.responseCache.delete(key);
      }
    }
    
    if (this.responseCache.has(responseKey)) {
      console.log('⚠️ Duplicate response detected, ignoring:', response);
      console.log('📊 Normalized response:', normalizedResponse);
      console.log('📊 Cache key:', responseKey);
      return true;
    }
    
    // Add to cache
    this.responseCache.set(responseKey, { response: normalizedResponse, timestamp: now });
    console.log('✅ New response added to cache:', normalizedResponse);
    console.log('📊 Cache key:', responseKey);
    return false;
  }

  // Create interview session without calling n8n workflow
  static async createInterviewSession(request: StartInterviewRequest): Promise<{ data: InterviewSession | null; error?: string }> {
    try {
      console.log('🔍 InterviewSystemService.createInterviewSession called with:', request);
      const sessionId = this.generateSessionId();
      console.log('📝 Generated session ID:', sessionId);
      
      // Get candidate and job description data
      console.log('👤 Fetching candidate data for ID:', request.candidateId);
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', request.candidateId)
        .single();

      if (candidateError) {
        console.error('❌ Candidate fetch error:', candidateError);
        return { data: null, error: `Candidate not found: ${candidateError.message}` };
      }
      console.log('✅ Candidate found:', candidate?.name);

      console.log('💼 Fetching job description data for ID:', request.jobDescriptionId);
      const { data: jobDescription, error: jobError } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('id', request.jobDescriptionId)
        .single();

      if (jobError) {
        console.error('❌ Job description fetch error:', jobError);
        return { data: null, error: `Job description not found: ${jobError.message}` };
      }
      console.log('✅ Job description found:', jobDescription?.title);

      // Get AI agent if specified
      let aiAgent = null;
      if (request.aiAgentId) {
        console.log('🤖 Fetching AI agent data for ID:', request.aiAgentId);
        const { data: agent, error: agentError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', request.aiAgentId)
          .single();
        
        if (agentError) {
          console.error('❌ AI Agent fetch error:', agentError);
        } else {
          console.log('✅ AI Agent found:', {
            name: agent?.name,
            webhookUrl: agent?.n8n_webhook_url,
            active: agent?.is_active
          });
        }
      } else {
        console.log('ℹ️ No AI Agent ID provided');
      }

      // Create interview session
      console.log('💾 Creating interview session in database...');
      const sessionData = {
        session_id: sessionId,
        candidate_id: request.candidateId,
        job_description_id: request.jobDescriptionId,
        ai_agent_id: request.aiAgentId || null,
        status: 'pending',
        started_at: new Date().toISOString(),
        total_questions: 0,
        questions_answered: 0
      };
      console.log('📋 Session data to insert:', sessionData);

      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (sessionError) {
        console.error('❌ Session creation error:', sessionError);
        return { data: null, error: `Failed to create interview session: ${sessionError.message}` };
      }
      console.log('✅ Interview session created successfully:', session);

      // Transform database response to match TypeScript interface
      const transformedSession: InterviewSession = {
        id: session.id,
        sessionId: session.session_id,
        candidateId: session.candidate_id,
        jobDescriptionId: session.job_description_id,
        aiAgentId: session.ai_agent_id,
        status: session.status,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        durationMinutes: session.duration_minutes,
        totalQuestions: session.total_questions,
        questionsAnswered: session.questions_answered,
        createdAt: session.created_at,
        updatedAt: session.updated_at
      };

      // Return session data without calling n8n workflow
      return { 
        data: {
          ...transformedSession,
          aiGreeting: null // Let AI Agent generate the greeting
        } as InterviewSession & { aiGreeting: string | null }
      };
    } catch (error) {
      console.error('Error creating interview session:', error);
      return { data: null, error: 'Failed to create interview session' };
    }
  }

  // Start a new interview session (with n8n workflow call)
  static async startInterview(request: StartInterviewRequest): Promise<{ data: InterviewSession | null; error?: string }> {
    try {
      console.log('🔍 InterviewSystemService.startInterview called with:', request);
      const sessionId = this.generateSessionId();
      console.log('📝 Generated session ID:', sessionId);
      
      // Get candidate and job description data
      console.log('👤 Fetching candidate data for ID:', request.candidateId);
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', request.candidateId)
        .single();

      if (candidateError) {
        console.error('❌ Candidate fetch error:', candidateError);
        return { data: null, error: `Candidate not found: ${candidateError.message}` };
      }
      console.log('✅ Candidate found:', candidate?.name);

      console.log('💼 Fetching job description data for ID:', request.jobDescriptionId);
      const { data: jobDescription, error: jobError } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('id', request.jobDescriptionId)
        .single();

      if (jobError) {
        console.error('❌ Job description fetch error:', jobError);
        return { data: null, error: `Job description not found: ${jobError.message}` };
      }
      console.log('✅ Job description found:', jobDescription?.title);

      // Get AI agent if specified
      let aiAgent = null;
      if (request.aiAgentId) {
        console.log('🤖 Fetching AI agent data for ID:', request.aiAgentId);
        const { data: agent, error: agentError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', request.aiAgentId)
          .single();
        
        if (agentError) {
          console.error('❌ AI Agent fetch error:', agentError);
        } else {
          console.log('✅ AI Agent found:', {
            name: agent?.name,
            webhookUrl: agent?.n8n_webhook_url,
            active: agent?.is_active
          });
        }
      } else {
        console.log('ℹ️ No AI Agent ID provided');
      }

      // Create interview session
      console.log('💾 Creating interview session in database...');
      const sessionData = {
        session_id: sessionId,
        candidate_id: request.candidateId,
        job_description_id: request.jobDescriptionId,
        ai_agent_id: request.aiAgentId || null,
        status: 'pending',
        started_at: new Date().toISOString(),
        total_questions: 0,
        questions_answered: 0
      };
      console.log('📋 Session data to insert:', sessionData);

      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (sessionError) {
        console.error('❌ Session creation error:', sessionError);
        return { data: null, error: `Failed to create interview session: ${sessionError.message}` };
      }
      console.log('✅ Interview session created successfully:', session);

      // Don't call webhook here - let startActualInterview handle the initial greeting
      // This prevents duplicate webhook calls
      console.log('✅ Interview session created, webhook will be called by startActualInterview');

      // Return session data without greeting (will be fetched by startActualInterview)
      return { 
        data: session
      };
    } catch (error) {
      console.error('Error starting interview:', error);
      return { data: null, error: 'Failed to start interview' };
    }
  }

  // Start the actual interview by calling n8n workflow
  static async startActualInterview(sessionId: string): Promise<{ data: { greeting: any; sessionId: string } | null; error?: string }> {
    try {
      console.log('🚀 Starting actual interview for session:', sessionId);
      console.log('📊 startActualInterview called at:', new Date().toISOString());
      
      // Clear response cache for this new interview session
      this.clearResponseCache(sessionId);
      
      // Get the interview session data
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select(`
          *,
          candidate:candidates(*),
          job_description:job_descriptions(*),
          ai_agent:ai_agents(*)
        `)
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !session) {
        return { data: null, error: 'Session not found' };
      }

      const candidate = session.candidate;
      const jobDescription = session.job_description;
      const aiAgent = session.ai_agent;

      // Call n8n workflow
      const aiResponse = await this.sendToN8nWorkflow(sessionId, candidate, jobDescription, aiAgent);
      console.log('🤖 AI Agent initial response:', aiResponse);
      
      return {
        data: {
          greeting: aiResponse.greeting,
          sessionId: sessionId
        }
      };
    } catch (error) {
      console.error('Error starting actual interview:', error);
      return { data: null, error: 'Failed to start actual interview' };
    }
  }

  // Send audio to n8n workflow for speech-to-text processing
  static async sendAudioToN8nWorkflow(
    sessionId: string,
    candidate: Candidate,
    jobDescription: JobDescription,
    aiAgent: AIAgent | null,
    audioBlob: Blob
  ): Promise<{ response?: string; sessionId?: string; error?: string }> {
    try {
      console.log('🎤 Sending audio to N8N workflow for session:', sessionId);
      console.log('📊 Audio size:', audioBlob.size, 'bytes');
      console.log('📊 Audio type:', audioBlob.type);
      console.log('📊 Request timestamp:', new Date().toISOString());
      
      // Use AI Agent's webhook URL if available, otherwise fall back to environment variable
      let webhookUrl = aiAgent?.n8nWebhookUrl || (aiAgent as any)?.n8n_webhook_url;
      let isUsingFallback = false;
      
      if (!webhookUrl) {
        webhookUrl = process.env.REACT_APP_N8N_INTERVIEW_WEBHOOK;
        isUsingFallback = true;
        console.log('⚠️ Using environment webhook URL as fallback');
      }
      
      if (!webhookUrl) {
        console.error('❌ No webhook URL available for audio processing');
        return { error: 'No webhook URL available. Please configure webhook URL in database or environment variables.' };
      }
      
      console.log(`🔗 Using ${isUsingFallback ? 'environment' : 'database'} webhook URL:`, webhookUrl);
      console.log('🤖 AI Agent:', aiAgent?.name || 'None');

      // Create FormData to send audio file
      const formData = new FormData();
      
      // Create a file from the blob
      const audioFile = new File([audioBlob], 'audio.webm', {
        type: audioBlob.type || 'audio/webm'
      });
      
      formData.append('audio', audioFile);
      formData.append('action', 'candidate_response');
      formData.append('session_id', sessionId);
      formData.append('candidate_id', candidate.id);
      formData.append('job_description_id', jobDescription.id);
      formData.append('timestamp', new Date().toISOString());
      
      console.log('📤 Sending audio to webhook...');
      console.log('🔗 Webhook URL:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData
      });

      console.log('📥 Webhook response status:', response.status);
      console.log('📥 Webhook response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webhook error response:', errorText);
        throw new Error(`N8N webhook failed: ${response.status} - ${errorText}`);
      }
      
      // Handle response
      let responseData = null;
      try {
        const responseText = await response.text();
        console.log('📥 Raw webhook response:', responseText);
        
        if (responseText.trim()) {
          responseData = JSON.parse(responseText);
          console.log('✅ Parsed webhook response data:', responseData);
        } else {
          console.log('ℹ️ Webhook returned empty response');
        }
      } catch (parseError) {
        console.log('ℹ️ Webhook response is not JSON, treating as successful');
      }

      // Check for duplicate response
      if (this.isDuplicateResponse(sessionId, responseData)) {
        console.log('⚠️ Duplicate response detected, returning null to prevent processing');
        return {
          response: undefined,
          sessionId: sessionId
        };
      }
      
      // Extract response text from various possible formats
      let responseText = '';
      if (responseData) {
        if (typeof responseData === 'string') {
          responseText = responseData;
        } else if (responseData.output) {
          responseText = responseData.output;
        } else if (responseData.response) {
          responseText = responseData.response;
        } else if (responseData.text) {
          responseText = responseData.text;
        } else if (responseData.message) {
          responseText = responseData.message;
        }
      }
      
      console.log('🤖 AI Agent response received:', { response: responseText });
      
      return {
        response: responseText,
        sessionId: sessionId
      };
      
    } catch (error: any) {
      console.error('❌ Error sending audio to N8N workflow:', error);
      
      // Handle specific error types
      let errorMessage = `Failed to process audio: ${error.message}`;
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        if (error.message.includes('CORS')) {
          errorMessage = 'CORS Error: The webhook server needs to allow requests from localhost:3000. Please configure CORS headers on your n8n server.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Webhook Not Found (404): The webhook URL does not exist. Please check the webhook URL in your AI Agent configuration.';
        } else {
          errorMessage = `Network Error: ${error.message}. Please check your internet connection and webhook URL.`;
        }
      }
      
      return { error: errorMessage };
    }
  }

  // Send audio to n8n workflow with fallback to environment webhook URL
  static async sendAudioToN8nWorkflowWithFallback(
    sessionId: string,
    candidate: Candidate,
    jobDescription: JobDescription,
    aiAgent: AIAgent | null,
    audioBlob: Blob
  ): Promise<{ response?: string; sessionId?: string; error?: string }> {
    try {
      console.log('🔄 Attempting fallback webhook for audio processing...');
      
      // Force use of environment webhook URL
      const webhookUrl = process.env.REACT_APP_N8N_INTERVIEW_WEBHOOK;
      
      if (!webhookUrl) {
        console.error('❌ No environment webhook URL available for fallback');
        return { error: 'No environment webhook URL available for fallback' };
      }
      
      console.log('🔗 Using environment webhook URL for fallback:', webhookUrl);
      
      // Create FormData to send audio file
      const formData = new FormData();
      
      // Create a file from the blob
      const audioFile = new File([audioBlob], 'audio.webm', {
        type: audioBlob.type || 'audio/webm'
      });
      
      formData.append('audio', audioFile);
      formData.append('action', 'candidate_response');
      formData.append('session_id', sessionId);
      formData.append('candidate_id', candidate.id);
      formData.append('job_description_id', jobDescription.id);
      formData.append('timestamp', new Date().toISOString());
      
      console.log('📤 Sending audio to fallback webhook...');
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit'
      });
      
      console.log('📥 Fallback webhook response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Fallback webhook error response:', errorText);
        throw new Error(`Fallback webhook failed: ${response.status} - ${errorText}`);
      }
      
      // Handle response
      let responseData = null;
      try {
        const responseText = await response.text();
        console.log('📥 Raw fallback webhook response:', responseText);
        
        if (responseText.trim()) {
          responseData = JSON.parse(responseText);
          console.log('✅ Parsed fallback webhook response data:', responseData);
        } else {
          console.log('ℹ️ Fallback webhook returned empty response');
        }
      } catch (parseError) {
        console.log('ℹ️ Fallback webhook response is not JSON, treating as successful');
      }
      
      // Extract response text from various possible formats
      let responseText = '';
      if (responseData) {
        if (typeof responseData === 'string') {
          responseText = responseData;
        } else if (responseData.output) {
          responseText = responseData.output;
        } else if (responseData.response) {
          responseText = responseData.response;
        } else if (responseData.text) {
          responseText = responseData.text;
        } else if (responseData.message) {
          responseText = responseData.message;
        }
      }
      
      console.log('🤖 Fallback AI Agent response received:', { response: responseText });
      
      return {
        response: responseText,
        sessionId: sessionId
      };
      
    } catch (error: any) {
      console.error('❌ Error in fallback webhook:', error);
      return { error: `Fallback webhook failed: ${error.message}` };
    }
  }

  // Send interview data to n8n workflow
  static async sendToN8nWorkflow(
    sessionId: string, 
    candidate: Candidate, 
    jobDescription: JobDescription, 
    aiAgent: AIAgent | null
  ): Promise<{ greeting?: string; sessionId?: string; error?: string }> {
    try {
      console.log('🚀 Sending to N8N workflow for session:', sessionId);
      console.log('📊 Request timestamp:', new Date().toISOString());
      
      // Use AI Agent's webhook URL if available, otherwise fall back to environment variable
      console.log('🔍 Checking webhook URLs...');
      console.log('AI Agent object:', aiAgent);
      console.log('AI Agent webhook URL (n8nWebhookUrl):', aiAgent?.n8nWebhookUrl);
      console.log('AI Agent webhook URL (n8n_webhook_url):', (aiAgent as any)?.n8n_webhook_url);
      console.log('Environment webhook URL:', process.env.REACT_APP_N8N_INTERVIEW_WEBHOOK);
      
      // Try both property names since we might have raw DB data or transformed data
      let webhookUrl = aiAgent?.n8nWebhookUrl || (aiAgent as any)?.n8n_webhook_url;
      let isUsingFallback = false;
      
      if (!webhookUrl) {
        webhookUrl = process.env.REACT_APP_N8N_INTERVIEW_WEBHOOK;
        isUsingFallback = true;
        console.log('⚠️ Using environment webhook URL as fallback');
      }
      
      if (!webhookUrl) {
        console.error('❌ No webhook URL available - skipping n8n workflow');
        console.error('❌ AI Agent webhook URL (n8nWebhookUrl):', aiAgent?.n8nWebhookUrl);
        console.error('❌ AI Agent webhook URL (n8n_webhook_url):', (aiAgent as any)?.n8n_webhook_url);
        console.error('❌ Environment webhook URL:', process.env.REACT_APP_N8N_INTERVIEW_WEBHOOK);
        console.error('❌ Please run: node update-webhook-url.js to configure webhook URL');
        return { error: 'No webhook URL available. Please configure webhook URL in database.' }; // Return gracefully instead of throwing error
      }
      
      console.log(`🔗 Using ${isUsingFallback ? 'environment' : 'database'} webhook URL:`, webhookUrl);
      console.log('🤖 AI Agent:', aiAgent?.name || 'None');

      const payload = {
        action: 'candidate_response',
        session_id: sessionId,
        candidate_id: candidate.id,
        job_description_id: jobDescription.id,
        candidate_response: "Start the interview.",
        timestamp: new Date().toISOString()
      };

      console.log('📤 Sending payload to webhook:', payload);
      console.log('🔗 Webhook URL:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'omit' // Don't send credentials for CORS
      });

      console.log('📥 Webhook response status:', response.status);
      console.log('📥 Webhook response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webhook error response:', errorText);
        
        // If the error is CORS or 404, and we're using database webhook, try environment webhook as fallback
        if ((response.status === 404 || errorText.includes('CORS')) && !isUsingFallback) {
          console.log('🔄 Database webhook failed, attempting fallback to environment webhook...');
          
          const fallbackWebhookUrl = process.env.REACT_APP_N8N_INTERVIEW_WEBHOOK;
          if (fallbackWebhookUrl) {
            console.log('🔗 Using environment webhook URL for fallback:', fallbackWebhookUrl);
            
            const fallbackResponse = await fetch(fallbackWebhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
              mode: 'cors',
              credentials: 'omit'
            });
            
            if (fallbackResponse.ok) {
              console.log('✅ Fallback webhook successful');
              const fallbackData = await fallbackResponse.json();
              return {
                greeting: fallbackData.output || fallbackData.response || fallbackData.text || fallbackData.message,
                sessionId: sessionId
              };
            } else {
              console.error('❌ Fallback webhook also failed:', fallbackResponse.status);
            }
          }
        }
        
        throw new Error(`N8N webhook failed: ${response.status} - ${errorText}`);
      }
      
      // Handle response - some webhooks might not return JSON
      let responseData = null;
      try {
        const responseText = await response.text();
        console.log('📥 Raw webhook response:', responseText);
        
        if (responseText.trim()) {
          responseData = JSON.parse(responseText);
          console.log('✅ Parsed webhook response data:', responseData);
        } else {
          console.log('ℹ️ Webhook returned empty response - this is normal for n8n workflows that don\'t return data');
        }
      } catch (parseError) {
        console.log('ℹ️ Webhook response is not JSON, treating as successful - this is normal for n8n workflows');
      }

      // Update session status to in_progress
      await supabase
        .from('interview_sessions')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      // Check for duplicate response
      if (this.isDuplicateResponse(sessionId, responseData)) {
        console.log('⚠️ Duplicate response detected, returning null to prevent processing');
        return {
          greeting: undefined,
          sessionId: sessionId
        };
      }
      
      // Return the AI Agent's response directly - no special greeting handling
      console.log('🤖 AI Agent response received:', responseData);
      
      return {
        greeting: responseData,
        sessionId: sessionId
      };

    } catch (error: any) {
      console.error('Error sending to N8N workflow:', error);
      
      // Handle specific error types
      let errorMessage = 'Failed to connect to AI Agent';
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        if (error.message.includes('CORS')) {
          errorMessage = 'CORS Error: The webhook server needs to allow requests from localhost:3000. Please configure CORS headers on your n8n server.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Webhook Not Found (404): The webhook URL does not exist. Please check the webhook URL in your AI Agent configuration.';
        } else {
          errorMessage = `Network Error: ${error.message}. Please check your internet connection and webhook URL.`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Update session status to failed
      await supabase
        .from('interview_sessions')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
      
      return { error: errorMessage };
    }
  }

  // Note: Voice processing (STT/TTS) is now handled directly in the frontend
  // This provides better real-time performance and reduces n8n workflow complexity

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

  // Send candidate response to n8n workflow for AI Agent processing
  static async sendCandidateResponse(
    sessionId: string,
    candidateResponse: string,
    candidateId: string,
    jobDescriptionId: string
  ): Promise<{ data: { aiResponse: string; sessionId: string } | null; error?: string }> {
    try {
      console.log('🚀 sendCandidateResponse called!');
      console.log('📤 Sending candidate response to AI Agent...');
      console.log('Session ID:', sessionId);
      console.log('Candidate Response:', candidateResponse);
      console.log('Candidate ID:', candidateId);
      console.log('Job Description ID:', jobDescriptionId);

      // Get the AI Agent's webhook URL from the session
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select(`
          *,
          ai_agent:ai_agents(*)
        `)
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !session) {
        return { data: null, error: 'Session not found' };
      }

      const aiAgent = session.ai_agent;
      const webhookUrl = aiAgent?.n8n_webhook_url || aiAgent?.n8nWebhookUrl;

      console.log('🤖 AI Agent data:', aiAgent);
      console.log('🔗 Webhook URL from database:', webhookUrl);

      if (!webhookUrl) {
        return { data: null, error: 'AI Agent webhook URL not found' };
      }

      const payload = {
        action: 'candidate_response',
        session_id: sessionId,
        candidate_id: candidateId,
        job_description_id: jobDescriptionId,
        candidate_response: candidateResponse,
        timestamp: new Date().toISOString()
      };

      console.log('📤 Sending payload to AI Agent:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI Agent error response:', errorText);
        return { data: null, error: `AI Agent failed: ${response.status} - ${errorText}` };
      }

      const responseData = await response.json();
      console.log('✅ AI Agent response:', responseData);
      console.log('✅ AI Agent response type:', typeof responseData);
      console.log('✅ AI Agent response is array:', Array.isArray(responseData));

      let aiResponse = '';
      
      // Handle array response format
      if (Array.isArray(responseData) && responseData.length > 0) {
        const firstItem = responseData[0];
        console.log('✅ First array item:', firstItem);
        console.log('✅ First array item keys:', Object.keys(firstItem));
        console.log('✅ First array item.output:', firstItem.output);
        console.log('✅ First array item.response:', firstItem.response);
        console.log('✅ First array item.message:', firstItem.message);
        aiResponse = firstItem.output || firstItem.response || firstItem.message || firstItem.text || firstItem.content;
        console.log('✅ Array extraction result:', aiResponse);
      } else {
        // Handle object response format
        console.log('✅ AI Agent response keys:', Object.keys(responseData));
        console.log('✅ AI Agent response.output:', responseData.output);
        console.log('✅ AI Agent response.response:', responseData.response);
        console.log('✅ AI Agent response.message:', responseData.message);
        console.log('✅ AI Agent response.ai_response:', responseData.ai_response);
        aiResponse = responseData.output || responseData.response || responseData.message || responseData.ai_response || responseData.text || responseData.content;
        console.log('✅ Object extraction result:', aiResponse);
      }
      
      console.log('✅ Extracted AI Response:', aiResponse);
      console.log('✅ Extracted AI Response type:', typeof aiResponse);
      console.log('✅ Extracted AI Response length:', aiResponse?.length);
      console.log('✅ Extracted AI Response truthy:', !!aiResponse);

      const result = {
        data: {
          aiResponse: aiResponse,
          sessionId: sessionId
        }
      };
      
      console.log('🎯 Returning result:', result);
      console.log('🎯 Result data:', result.data);
      console.log('🎯 Result aiResponse:', result.data.aiResponse);
      
      return result;

    } catch (error) {
      console.error('Error sending candidate response:', error);
      return { data: null, error: 'Failed to send candidate response' };
    }
  }

  // Send chat message to n8n workflow (legacy method)
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
