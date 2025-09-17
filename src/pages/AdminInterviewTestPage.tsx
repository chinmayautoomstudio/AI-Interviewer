import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Play, Square, Users, Briefcase, Bot, Volume2, Settings, TestTube } from 'lucide-react';
import { InterviewSystemService } from '../services/interviewSystem';
import { ttsManager } from '../services/ttsManager';
import { getBestIndianVoice, getVoiceForJobType, getVoiceForDepartment } from '../config/voiceConfig';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import VoiceRecorder from '../components/interview/VoiceRecorder';
import VoicePlayer from '../components/interview/VoicePlayer';
import InterviewSetupPage from './InterviewSetupPage';
import InterviewPage from './InterviewPage';
import { Candidate, JobDescription, AIAgent, InterviewSession, InterviewMessage } from '../types';
import { supabase } from '../services/supabase';
import { microphonePermissionManager } from '../utils/microphonePermissions';

const AdminInterviewTestPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'setup' | 'interview' | 'main'>('main');

  // Load data on component mount
  useEffect(() => {
    loadData();
    checkVoiceAvailability();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop any ongoing audio playback
      // Note: TTS Manager doesn't have stopAudio method, audio is managed by browser
      // Revoke any audio URLs to free memory
      if (currentSession) {
        messages.forEach(message => {
          if (message.audioUrl) {
            URL.revokeObjectURL(message.audioUrl);
          }
        });
      }
    };
  }, [currentSession, messages]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load candidates
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('status', 'active')
        .limit(10);
      
      if (candidatesError) {
        throw new Error(`Failed to load candidates: ${candidatesError.message}`);
      }
      setCandidates(candidatesData || []);

      // Load job descriptions
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_descriptions')
        .select('*')
        .limit(10);
      
      if (jobsError) {
        throw new Error(`Failed to load job descriptions: ${jobsError.message}`);
      }
      setJobDescriptions(jobsData || []);

      // Load AI agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .limit(10);
      
      if (agentsError) {
        throw new Error(`Failed to load AI agents: ${agentsError.message}`);
      }
      setAiAgents(agentsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const checkVoiceAvailability = () => {
    setIsVoiceAvailable(ttsManager.isAvailable());
  };

  const startInterview = () => {
    if (!selectedCandidate || !selectedJob) {
      alert('Please select a candidate and job description');
      return;
    }

    console.log('🚀 Starting interview setup with:', {
      candidate: selectedCandidate.name,
      job: selectedJob.title,
      agent: selectedAgent?.name || 'None',
      agentWebhook: selectedAgent?.n8nWebhookUrl || 'No webhook URL'
    });

    // Navigate to setup page
    setCurrentPage('setup');
  };

  const handleSetupComplete = async (session: InterviewSession) => {
    setCurrentSession(session);
    setCurrentPage('interview');
    
    // Don't auto-play hardcoded greeting - let AI Agent generate and play it
    // The AI Agent will generate the greeting and it will be played automatically
  };

  const handleBackToMain = () => {
    setCurrentPage('main');
    setCurrentSession(null);
    setMessages([]);
  };

  const handleEndInterview = () => {
    setCurrentPage('main');
    setCurrentSession(null);
    setMessages([]);
  };

  const endInterview = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      // Use the cancelInterview method to end the session
      const result = await InterviewSystemService.cancelInterview(currentSession.sessionId);
      
      if (!result.error) {
        alert('Interview ended successfully!');
        handleEndInterview();
      } else {
        alert('Failed to end interview: ' + result.error);
      }
    } catch (error) {
      console.error('Error ending interview:', error);
      alert('Failed to end interview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscription = (result: { transcript: string; response: string; audioResponse: string; confidence: number }) => {
    if (result.transcript.trim()) {
      // Add the candidate's message to the chat
      const candidateMessage: InterviewMessage = {
        id: `temp-${Date.now()}`,
        interviewSessionId: currentSession?.id || '',
        messageType: 'voice_input',
        content: result.transcript,
        sender: 'candidate',
        voiceMode: true,
        audioUrl: undefined,
        audioDuration: 0,
        originalAudioTranscript: result.transcript,
        transcriptionConfidence: result.confidence,
        transcriptionLanguage: 'en',
        voiceMetadata: undefined,
        timestamp: new Date().toISOString()
      };

      // Add the AI's response to the chat
      const aiMessage: InterviewMessage = {
        id: `temp-${Date.now() + 1}`,
        interviewSessionId: currentSession?.id || '',
        messageType: 'voice_response',
        content: result.response,
        sender: 'ai',
        voiceMode: true,
        audioUrl: result.audioResponse,
        audioDuration: 0,
        originalAudioTranscript: undefined,
        transcriptionConfidence: undefined,
        transcriptionLanguage: undefined,
        voiceMetadata: undefined,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, candidateMessage, aiMessage]);
    }
  };

  const handleVoiceError = (error: string) => {
    console.error('Voice error:', error);
    alert('Voice error: ' + error);
  };

  const handleTestCandidateResponse = async (response: string) => {
    if (!currentSession || !selectedCandidate || !selectedJob) {
      alert('Please ensure interview is started and candidate/job are selected');
      return;
    }

    try {
      // Add candidate message to chat
      const candidateMessage: InterviewMessage = {
        id: `candidate-${Date.now()}`,
        interviewSessionId: currentSession.id,
        messageType: 'answer',
        content: response,
        sender: 'candidate',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, candidateMessage]);

      // Send to AI Agent
      const result = await InterviewSystemService.sendCandidateResponse(
        currentSession.sessionId,
        response,
        selectedCandidate.id,
        selectedJob.id
      );

      if (result.data) {
        // Add AI response to chat
        const aiMessage: InterviewMessage = {
          id: `ai-${Date.now()}`,
          interviewSessionId: currentSession.id,
          messageType: 'question',
          content: result.data.aiResponse,
          sender: 'ai',
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        console.error('❌ AI Agent response failed:', result.error);
        alert('Failed to get AI response: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending candidate response:', error);
      alert('Error sending response: ' + error);
    }
  };

  const testVoice = async () => {
    if (!isVoiceAvailable) {
      alert('Voice features not available. Please check your ElevenLabs API key.');
      return;
    }

    try {
      const testText = "Hello! This is a test of the voice system for the AI Interviewer. How does this sound?";
      const voiceConfig = ttsManager.getCurrentVoiceConfig();
      const response = await ttsManager.textToSpeech({
        text: testText,
        voiceId: currentVoice || voiceConfig.voiceId,
        voiceSettings: voiceConfig.settings
      });
      
      if (response.audioUrl) {
        // Play audio using browser's Audio API
        const audio = new Audio(response.audioUrl);
        await audio.play();
      } else {
        // For browser TTS, audio is already playing
        console.log('🔊 Browser TTS is playing directly');
      }
    } catch (error) {
      console.error('Error testing voice:', error);
      alert('Failed to test voice: ' + error);
    }
  };

  // Render different pages based on current state
  if (currentPage === 'setup' && selectedCandidate && selectedJob) {
    return (
      <InterviewSetupPage
        candidate={selectedCandidate}
        jobDescription={selectedJob}
        aiAgent={selectedAgent}
        onSetupComplete={handleSetupComplete}
        onBack={handleBackToMain}
      />
    );
  }

  if (currentPage === 'interview' && currentSession) {
    return (
      <InterviewPage
        session={currentSession}
        onEndInterview={handleEndInterview}
        onBack={handleBackToMain}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TestTube className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Interview Testing</h1>
              <p className="text-gray-600">Test voice interviews and AI interactions</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="text-red-600">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Data</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Voice Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Volume2 className="h-5 w-5 text-gray-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Voice System Status</h3>
                <p className="text-sm text-gray-600">
                  {isVoiceAvailable ? 'Voice features available' : 'Voice features not available'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={testVoice}
                disabled={!isVoiceAvailable}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                Test Voice
              </button>
              <button
                onClick={async () => {
                  if (!isVoiceMode) {
                    // Check microphone permission before enabling voice mode
                    const permissionState = await microphonePermissionManager.checkPermissionStatus();
                    if (!permissionState.canRecord) {
                      if (permissionState.status === 'denied') {
                        alert('Microphone access denied. Please allow microphone access in your browser settings and refresh the page.');
                        return;
                      } else if (permissionState.status === 'prompt') {
                        const newPermissionState = await microphonePermissionManager.requestMicrophonePermission();
                        if (!newPermissionState.canRecord) {
                          alert('Microphone permission is required for voice mode. Please allow microphone access.');
                          return;
                        }
                      } else {
                        alert('Microphone not available. Please check your microphone connection and browser settings.');
                        return;
                      }
                    }
                  }
                  setIsVoiceMode(!isVoiceMode);
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isVoiceMode 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isVoiceMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                {isVoiceMode ? 'Voice Mode ON' : 'Voice Mode OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Interview Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Candidate Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Select Candidate</h3>
            </div>
            <select
              value={selectedCandidate?.id || ''}
              onChange={(e) => {
                const candidate = candidates.find(c => c.id === e.target.value);
                setSelectedCandidate(candidate || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a candidate...</option>
              {candidates.map(candidate => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} ({candidate.candidate_id})
                </option>
              ))}
            </select>
            {selectedCandidate && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">{selectedCandidate.name}</p>
                <p className="text-xs text-blue-700">{selectedCandidate.email}</p>
                <p className="text-xs text-blue-700">ID: {selectedCandidate.candidate_id}</p>
              </div>
            )}
          </div>

          {/* Job Description Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Select Job</h3>
            </div>
            <select
              value={selectedJob?.id || ''}
              onChange={(e) => {
                const job = jobDescriptions.find(j => j.id === e.target.value);
                setSelectedJob(job || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a job...</option>
              {jobDescriptions.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.department}
                </option>
              ))}
            </select>
            {selectedJob && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900">{selectedJob.title}</p>
                <p className="text-xs text-green-700">{selectedJob.department}</p>
                <p className="text-xs text-green-700">ID: {selectedJob.job_description_id}</p>
              </div>
            )}
          </div>

          {/* AI Agent Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Bot className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Select AI Agent</h3>
            </div>
            <select
              value={selectedAgent?.id || ''}
              onChange={(e) => {
                const agent = aiAgents.find(a => a.id === e.target.value);
                setSelectedAgent(agent || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose an agent (optional)...</option>
              {aiAgents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.agentType})
                </option>
              ))}
            </select>
            {selectedAgent && (
              <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900">{selectedAgent.name}</p>
                <p className="text-xs text-purple-700">Type: {selectedAgent.agentType || 'Not specified'}</p>
                <p className="text-xs text-purple-700">ID: {selectedAgent.id}</p>
                {selectedAgent.n8nWebhookUrl && (
                  <p className="text-xs text-purple-600 mt-1">
                    <span className="font-medium">Webhook:</span> {selectedAgent.n8nWebhookUrl}
                  </p>
                )}
                {selectedAgent.description && (
                  <p className="text-xs text-purple-600 mt-1">{selectedAgent.description}</p>
                )}
                {selectedJob && (
                  <div className="mt-2 pt-2 border-t border-purple-200">
                    <p className="text-xs text-purple-600">
                      <span className="font-medium">Voice:</span> {getVoiceForJobType(selectedJob.title).name} ({getVoiceForJobType(selectedJob.title).gender})
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Interview Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Interview Controls</h3>
              <p className="text-sm text-gray-600">
                {currentSession ? 'Interview in progress' : 'Ready to start interview'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {!currentSession ? (
                <button
                  onClick={startInterview}
                  disabled={!selectedCandidate || !selectedJob || isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Start Interview'}
                </button>
              ) : (
                <button
                  onClick={endInterview}
                  disabled={isLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : 'End Interview'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Voice Interface */}
        {currentSession && isVoiceMode && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Mic className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Voice Interview Interface</h3>
            </div>
            <div className="flex justify-center">
              <VoiceRecorder
                onTranscription={handleVoiceTranscription}
                onError={handleVoiceError}
                sessionId={currentSession.sessionId}
                disabled={isLoading}
                language="en-US"
                className="flex justify-center"
              />
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Interview Messages</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'candidate' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'candidate'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {message.voiceMode && (
                      <div className="mt-2 flex items-center space-x-2">
                        <Volume2 className="h-3 w-3" />
                        <span className="text-xs opacity-75">Voice</span>
                        {message.audioUrl && (
                          <button
                            onClick={() => {
                              const audio = new Audio(message.audioUrl);
                              audio.play().catch(console.error);
                            }}
                            className="ml-2 p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Play audio"
                          >
                            <Play className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Test Candidate Response Input */}
            {currentSession && (
              <div className="border-t pt-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type your response to test the AI Agent..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        handleTestCandidateResponse(e.currentTarget.value.trim());
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="Type your response"]') as HTMLInputElement;
                      if (input?.value.trim()) {
                        handleTestCandidateResponse(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <LoadingSpinner size="md" />
              <span className="text-gray-700">Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInterviewTestPage;
