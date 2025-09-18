import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, ArrowLeft, Clock } from 'lucide-react';
import { InterviewSystemService } from '../services/interviewSystem';
import { ttsManager } from '../services/ttsManager';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import VoiceRecorder from '../components/interview/VoiceRecorder';
import { InterviewSession } from '../types';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      
      // Note: Interview is already started in InterviewSetupPage, play the AI greeting that was passed
      console.log('ℹ️ Interview already started in setup page, playing AI greeting...');
      
      // Check if we have the AI greeting from the session
      if ((session as any).aiGreeting) {
        console.log('✅ AI greeting found in session:', (session as any).aiGreeting);
        
        // Extract text content from AI response (handle different response formats)
        let aiText = '';
        const greeting = (session as any).aiGreeting;
        
        if (typeof greeting === 'string') {
          aiText = greeting;
        } else if (greeting && typeof greeting === 'object') {
          // Try to extract text from various possible fields
          aiText = greeting.greeting || 
                  greeting.message || 
                  greeting.ai_response ||
                  greeting.response ||
                  greeting.output ||
                  greeting.text ||
                  greeting.content ||
                  JSON.stringify(greeting);
        }
        
        if (aiText) {
          // Convert AI response to speech and play it
          try {
            console.log('🔊 Converting AI greeting to speech...');
            const { ttsManager } = await import('../services/ttsManager');
            const ttsResult = await ttsManager.textToSpeech({
              text: aiText,
              provider: 'auto'
            });
            
            if (ttsResult.audioUrl) {
              console.log('🔊 Playing AI greeting:', ttsResult.audioUrl);
              await playAudio(ttsResult.audioUrl);
              console.log('✅ AI greeting played successfully');
            } else {
              console.log('🔊 Browser TTS is playing directly');
            }
          } catch (ttsError) {
            console.warn('⚠️ TTS failed for AI greeting:', ttsError);
          }
        } else {
          console.log('⚠️ No text content found in AI greeting');
        }
      } else {
        console.log('⚠️ No AI greeting found in session');
      }
      
      // Mark greeting as processed since interview is already active
      greetingProcessedRef.current = true;
    };

    // Start the interview with AI Agent after a short delay to ensure page is fully loaded
    setTimeout(() => {
      startInterviewWithAI();
    }, 500);

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


  const handleVoiceTranscription = async (result: { transcript: string; response: string; audioResponse: string; confidence: number }) => {
    console.log('🎯 handleVoiceTranscription called with:', result);
    
    // Handle AI response (when transcript is empty but response is present)
    if (result.response.trim()) {
      console.log('✅ AI response received:', result.response);
      
      // Auto-play the AI's voice response if available
      if (result.audioResponse) {
        try {
          console.log('🔊 Playing AI voice response:', result.audioResponse);
          await playAudio(result.audioResponse);
          console.log('✅ AI voice response played successfully');
        } catch (error) {
          console.error('❌ Error playing AI voice response:', error);
        }
      } else {
        console.log('⚠️ No audio response to play');
      }
    } 
    // Handle voice input transcript (when transcript is present)
    else if (result.transcript.trim()) {
      console.log('✅ Voice input received:', result.transcript);
      // The AI response will be handled by the VoiceRecorder itself
    } 
    else {
      console.log('⚠️ Empty transcript and response received');
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


        {/* Voice Interface */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Mic className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Voice Interview</h3>
          </div>
          
          <div className="text-center text-gray-600 mb-6">
            <p className="text-sm">🎤 <strong>Voice Mode Active</strong> - Use the voice recorder below to respond to the interviewer.</p>
            <p className="text-xs text-gray-500 mt-1">Speak naturally and the AI will respond with voice.</p>
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
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center space-x-2 text-gray-600 py-4">
              <LoadingSpinner size="sm" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;