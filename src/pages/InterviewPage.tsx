import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Play, Volume2, MessageSquare, Send, ArrowLeft, Clock, User, Bot } from 'lucide-react';
import { InterviewSystemService } from '../services/interviewSystem';
import { ttsManager } from '../services/ttsManager';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import VoiceRecorder from '../components/interview/VoiceRecorder';
import { InterviewSession, InterviewMessage } from '../types';

interface InterviewPageProps {
  session: InterviewSession;
  onEndInterview: () => void;
  onBack: () => void;
}

const InterviewPage: React.FC<InterviewPageProps> = ({
  session,
  onEndInterview,
  onBack
}) => {
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(true); // Voice mode is default
  const [currentMessage, setCurrentMessage] = useState('');
  const [interviewDuration, setInterviewDuration] = useState(0);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const greetingProcessedRef = useRef<boolean>(false);
  const startInterviewCalledRef = useRef<boolean>(false);

  // Helper function to stop any currently playing audio
  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
  };

  // Helper function to play audio with proper cleanup
  const playAudio = useCallback(async (audioUrl: string) => {
    try {
      // Stop any currently playing audio
      stopCurrentAudio();
      
      // Create and play new audio with volume boost
      const audio = new Audio(audioUrl);
      audio.volume = 1.0; // Maximum volume
      currentAudioRef.current = audio;
      
      await audio.play();
      
      // Clean up when audio ends
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      
      // Clean up on error
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
    } catch (error) {
      console.warn('⚠️ Audio playback failed:', error);
      URL.revokeObjectURL(audioUrl);
      currentAudioRef.current = null;
    }
  }, []);

  useEffect(() => {
    console.log('🔄 InterviewPage useEffect called');
    console.log('📊 useEffect called at:', new Date().toISOString());
    console.log('📊 Greeting processed flag:', greetingProcessedRef.current);
    
    // Start the interview timer
    const timer = setInterval(() => {
      setInterviewDuration(prev => prev + 1);
    }, 1000);

    // Don't add hardcoded greeting - let AI Agent generate it
    setMessages([]);

    // Trigger AI Agent to start the interview with greeting
    const startInterviewWithAI = async () => {
      console.log('🔄 startInterviewWithAI function called');
      console.log('📊 Greeting processed flag:', greetingProcessedRef.current);
      console.log('📊 Start interview called flag:', startInterviewCalledRef.current);
      
      // Prevent duplicate calls (React StrictMode causes double execution)
      if (startInterviewCalledRef.current) {
        console.log('⚠️ startInterviewWithAI already called, skipping...');
        return;
      }
      
      // Mark as called immediately to prevent duplicates
      startInterviewCalledRef.current = true;
      
      // Prevent duplicate greeting processing
      if (greetingProcessedRef.current) {
        console.log('⚠️ Greeting already processed, skipping...');
        return;
      }
      
      try {
        console.log('🤖 Starting interview with AI Agent...');
        console.log('📊 Session ID:', session.sessionId);
        const result = await InterviewSystemService.startActualInterview(session.sessionId);
        
        if (result.data && result.data.greeting) {
          console.log('✅ AI Agent response received:', result.data.greeting);
          
          // Mark greeting as processed
          greetingProcessedRef.current = true;
          
          // Extract text content from AI response (handle different response formats)
          let aiText = '';
          if (typeof result.data.greeting === 'string') {
            aiText = result.data.greeting;
          } else if (result.data.greeting && typeof result.data.greeting === 'object') {
            // Try to extract text from various possible fields
            aiText = result.data.greeting.greeting || 
                    result.data.greeting.message || 
                    result.data.greeting.ai_response ||
                    result.data.greeting.response ||
                    result.data.greeting.output ||
                    result.data.greeting.text ||
                    result.data.greeting.content ||
                    JSON.stringify(result.data.greeting);
          }
          
          if (aiText) {
            // Add AI response to messages
            const aiMessage: InterviewMessage = {
              id: `ai-response-${Date.now()}`,
              interviewSessionId: session.id,
              messageType: 'question',
              content: aiText,
              sender: 'ai',
              timestamp: new Date().toISOString()
            };
            
            setMessages([aiMessage]);
            
            // Auto-play the AI response
            try {
              const voiceConfig = ttsManager.getCurrentVoiceConfig();
              const ttsResponse = await ttsManager.textToSpeech({
                text: aiText,
                voiceId: voiceConfig.voiceId,
                voiceSettings: voiceConfig.settings
              });
              
              if (ttsResponse.audioUrl) {
              await playAudio(ttsResponse.audioUrl);
            } else {
              console.log('🔊 Browser TTS is playing directly');
            }
            } catch (ttsError) {
              console.warn('⚠️ TTS failed for AI response:', ttsError);
            }
          } else {
            console.warn('⚠️ Could not extract text from AI response:', result.data.greeting);
          }
        } else if (result.data && result.data.greeting === undefined) {
          console.log('⚠️ Duplicate response detected and ignored');
        } else {
          console.error('❌ No response received from AI Agent');
          console.log('🔍 Debug info:', {
            hasResult: !!result,
            hasData: !!result?.data,
            hasGreeting: !!result?.data?.greeting,
            resultData: result?.data
          });
        }
      } catch (error) {
        console.error('❌ Failed to start interview with AI Agent:', error);
      }
    };

    // Start the interview with AI Agent
    startInterviewWithAI();

    // Add beforeunload event listener to end interview when page is closed/refreshed
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (session) {
        // End the interview session
        InterviewSystemService.cancelInterview(session.sessionId).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopCurrentAudio(); // Stop any playing audio when component unmounts
      
      // Clear response cache when component unmounts to prevent cache pollution
      if (session?.sessionId) {
        InterviewSystemService.clearResponseCache(session.sessionId);
      }
    };
  }, [playAudio, session]); // Include dependencies to prevent warnings

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    console.log('📝 handleSendMessage called with:', currentMessage.trim());

    const candidateMessage: InterviewMessage = {
      id: `candidate-${Date.now()}`,
      interviewSessionId: session.id,
      messageType: 'answer',
      content: currentMessage.trim(),
      sender: 'candidate',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, candidateMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      console.log('📤 Sending to AI Agent...');
      
      // Send to AI Agent
      const result = await InterviewSystemService.sendCandidateResponse(
        session.sessionId,
        currentMessage.trim(),
        session.candidateId,
        session.jobDescriptionId
      );

      console.log('🤖 AI Result:', result);
      console.log('🤖 AI Result data:', result.data);
      console.log('🤖 AI Response text:', result.data?.aiResponse);
      console.log('🤖 AI Response type:', typeof result.data?.aiResponse);
      console.log('🤖 AI Response length:', result.data?.aiResponse?.length);
      console.log('🤖 AI Response truthy:', !!result.data?.aiResponse);

      if (result.data) {
        console.log('✅ AI Response received:', result.data.aiResponse);
        
        // Check if AI response is empty or null
        if (!result.data.aiResponse || result.data.aiResponse.trim() === '') {
          console.error('❌ AI Response is empty or null!');
          setError('AI response is empty. Please try again.');
          return;
        }
        
        // Generate TTS for AI response
        let audioResponse = '';
        try {
          console.log('🔊 Generating TTS...');
          const voiceConfig = ttsManager.getCurrentVoiceConfig();
          const ttsResponse = await ttsManager.textToSpeech({
            text: result.data.aiResponse,
            voiceId: voiceConfig.voiceId,
            voiceSettings: voiceConfig.settings
          });
          audioResponse = ttsResponse.audioUrl;
          console.log('✅ TTS generated:', audioResponse);
          
          // Auto-play the AI response
          if (audioResponse) {
            await playAudio(audioResponse);
          } else {
            console.log('🔊 Browser TTS is playing directly');
          }
        } catch (ttsError) {
          console.warn('⚠️ TTS failed, continuing without audio:', ttsError);
          // Continue without audio - the text response will still show
        }

        const aiMessage: InterviewMessage = {
          id: `ai-${Date.now()}`,
          interviewSessionId: session.id,
          messageType: 'question',
          content: result.data.aiResponse,
          sender: 'ai',
          voiceMode: true,
          audioUrl: audioResponse,
          audioDuration: 0,
          originalAudioTranscript: undefined,
          transcriptionConfidence: undefined,
          transcriptionLanguage: undefined,
          voiceMetadata: undefined,
          timestamp: new Date().toISOString()
        };

        console.log('📝 Adding AI message to chat:', aiMessage);
        setMessages(prev => {
          const newMessages = [...prev, aiMessage];
          console.log('📝 New messages array:', newMessages);
          return newMessages;
        });

        // Audio is already played by the playAudio helper function above
      } else {
        console.error('❌ No AI response data:', result.error);
        setError(result.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscription = async (result: { transcript: string; response: string; audioResponse: string; confidence: number }) => {
    console.log('🎯 handleVoiceTranscription called with:', result);
    
    if (result.transcript.trim()) {
      console.log('✅ Adding candidate message to chat');
      
      // Add the candidate's message to the chat
      const candidateMessage: InterviewMessage = {
        id: `voice-candidate-${Date.now()}`,
        interviewSessionId: session.id,
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

      console.log('✅ Adding AI message to chat');
      
      // Add the AI's response to the chat
      const aiMessage: InterviewMessage = {
        id: `voice-ai-${Date.now()}`,
        interviewSessionId: session.id,
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

      console.log('📝 Setting messages:', [candidateMessage, aiMessage]);
      setMessages(prev => {
        const newMessages = [...prev, candidateMessage, aiMessage];
        console.log('📝 New messages array:', newMessages);
        return newMessages;
      });

      // Auto-play the AI's voice response if available
      if (result.audioResponse) {
        try {
          console.log('🔊 Playing AI voice response using centralized audio management:', result.audioResponse);
          await playAudio(result.audioResponse);
          console.log('✅ AI voice response played successfully');
        } catch (error) {
          console.error('❌ Error playing AI voice response:', error);
        }
      } else {
        console.log('⚠️ No audio response to play');
      }
    } else {
      console.log('⚠️ Empty transcript, not adding messages');
    }
  };

  const handleVoiceError = (error: string) => {
    console.error('Voice error:', error);
    setError('Voice error: ' + error);
  };

  const endInterview = async () => {
    setIsLoading(true);
    try {
      await InterviewSystemService.cancelInterview(session.sessionId);
      onEndInterview();
    } catch (error) {
      console.error('Error ending interview:', error);
      setError('Failed to end interview');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Live Interview</h1>
                <p className="text-sm text-gray-600">Session: {session.sessionId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">{formatDuration(interviewDuration)}</span>
              </div>
              
              <button
                onClick={endInterview}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'End Interview'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="text-red-600">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Interview Conversation</h3>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'candidate' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.sender === 'candidate'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender === 'candidate' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                    <span className="text-xs font-medium">
                      {message.sender === 'candidate' ? 'You' : 'AI Interviewer'}
                    </span>
                  </div>
                  
                  <p className="text-sm">{message.content}</p>
                  
                  {message.voiceMode && (
                    <div className="mt-2 flex items-center space-x-2">
                      <Volume2 className="h-3 w-3" />
                      <span className="text-xs opacity-75">Voice</span>
                      {message.audioUrl && (
                        <button
                          onClick={() => {
                            const audio = new Audio(message.audioUrl);
                            audio.volume = 1.0; // Maximum volume
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
                  
                  <p className="text-xs opacity-75 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center space-x-2 text-gray-600 py-4">
              <LoadingSpinner size="sm" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Voice Interface */}
        {isVoiceMode && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Mic className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Voice Interview</h3>
            </div>
            <div className="flex justify-center">
              <VoiceRecorder
                onTranscription={handleVoiceTranscription}
                onError={handleVoiceError}
                sessionId={session.sessionId}
                disabled={isLoading}
                language="en-US"
                className="flex justify-center"
              />
            </div>
          </div>
        )}

        {/* Input Interface */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Respond to Interviewer</h3>
            <button
              onClick={() => setIsVoiceMode(!isVoiceMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isVoiceMode 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isVoiceMode ? <Mic className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              <span>{isVoiceMode ? '🎤 Voice Mode (Default)' : '✍️ Text Mode (Optional)'}</span>
            </button>
          </div>

          {!isVoiceMode && (
            <div>
              <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">✍️ <strong>Text Mode (Optional)</strong> - Type your response below or switch back to Voice Mode for a more natural conversation.</p>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {isVoiceMode && (
            <div className="text-center text-gray-600">
              <p className="text-sm">🎤 <strong>Voice Mode Active</strong> - Use the voice recorder above to respond to the interviewer.</p>
              <p className="text-xs text-gray-500 mt-1">Click "Text Mode (Optional)" above if you prefer to type your responses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;