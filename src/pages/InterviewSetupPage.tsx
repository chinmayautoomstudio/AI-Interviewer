import React, { useState, useEffect } from 'react';
import { Mic, Play, Square, Volume2, CheckCircle, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { InterviewSystemService } from '../services/interviewSystem';
import { elevenLabsService } from '../services/elevenLabs';
import { getVoiceForJobType } from '../config/voiceConfig';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Candidate, JobDescription, AIAgent, InterviewSession } from '../types';
import { microphonePermissionManager } from '../utils/microphonePermissions';

interface InterviewSetupPageProps {
  candidate: Candidate;
  jobDescription: JobDescription;
  aiAgent: AIAgent | null;
  onSetupComplete: (session: InterviewSession) => void;
  onBack: () => void;
}

const InterviewSetupPage: React.FC<InterviewSetupPageProps> = ({
  candidate,
  jobDescription,
  aiAgent,
  onSetupComplete,
  onBack
}) => {
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [microphoneStatus, setMicrophoneStatus] = useState<'checking' | 'granted' | 'denied' | 'prompt' | 'unknown'>('checking');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceTested, setVoiceTested] = useState(false);
  const [setupStep, setSetupStep] = useState<'permission' | 'test' | 'ready'>('permission');

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const permissionState = await microphonePermissionManager.checkPermissionStatus();
      setMicrophoneStatus(permissionState.status);
      
      if (permissionState.canRecord) {
        setSetupStep('test');
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setMicrophoneStatus('denied');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      setIsLoading(true);
      const permissionState = await microphonePermissionManager.requestMicrophonePermission();
      setMicrophoneStatus(permissionState.status);
      
      if (permissionState.canRecord) {
        setSetupStep('test');
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setMicrophoneStatus('denied');
    } finally {
      setIsLoading(false);
    }
  };


  const startRecording = async () => {
    try {
      if (microphoneStatus !== 'granted') {
        await requestMicrophonePermission();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Stop recording after 5 seconds
      setTimeout(() => {
        mediaRecorder.stop();
        setIsRecording(false);
        clearInterval(interval);
      }, 5000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.play().catch(console.error);
    }
  };

  const testVoice = async () => {
    try {
      // Check if ElevenLabs service is available
      if (!elevenLabsService.isAvailable()) {
        setError('ElevenLabs API key not configured. Please check your environment variables.');
        return;
      }

      const testText = "Hello! This is a test of the voice system. My name is Supriya, and I'll be your interviewer today. How does this sound?";
      const voiceConfig = getVoiceForJobType(jobDescription.title);
      
      const response = await elevenLabsService.textToSpeech({
        text: testText,
        voiceId: voiceConfig.voiceId,
        voiceSettings: voiceConfig.settings
      });
      
      if (response.audioUrl) {
        await elevenLabsService.playAudio(response.audioUrl);
        setVoiceTested(true);
      }
    } catch (error) {
      console.error('Error testing voice:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          setError('ElevenLabs API key is invalid or expired. Please check your API key configuration.');
        } else if (error.message.includes('TTS request failed')) {
          setError('Failed to generate voice. Please check your ElevenLabs API key and internet connection.');
        } else {
          setError(`Voice test failed: ${error.message}`);
        }
      } else {
        setError('Failed to test voice. Please check your ElevenLabs configuration.');
      }
    }
  };

  const proceedToInterview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let session = currentSession;
      
      if (!session) {
        // Create session first
        const result = await InterviewSystemService.createInterviewSession({
          candidateId: candidate.id,
          jobDescriptionId: jobDescription.id,
          aiAgentId: aiAgent?.id
        });

        if (!result.data) {
          setError(result.error || 'Failed to create interview session');
          return;
        }
        
        session = result.data;
        setCurrentSession(session);
        
        // Set voice configuration based on job type
        const voiceConfig = getVoiceForJobType(jobDescription.title);
        elevenLabsService.setVoiceConfig(voiceConfig);
        
        console.log('✅ Interview session created:', session);
      }

      // Now start the actual interview (call n8n workflow)
      console.log('🔍 Session data before starting actual interview:', session);
      console.log('🔍 Session ID:', session.sessionId);
      
      if (!session.sessionId) {
        setError('Session ID is missing');
        return;
      }
      
      const interviewResult = await InterviewSystemService.startActualInterview(session.sessionId);

      if (interviewResult.data) {
        console.log('✅ Actual interview started:', interviewResult.data);
        
        // Add the AI greeting to the session object so InterviewPage can play it
        const sessionWithGreeting = {
          ...session,
          aiGreeting: interviewResult.data.greeting
        };
        
        // Complete the setup and proceed to interview
        onSetupComplete(sessionWithGreeting);
      } else {
        setError(interviewResult.error || 'Failed to start actual interview');
      }
    } catch (error) {
      console.error('Error proceeding to interview:', error);
      setError('Failed to proceed to interview');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPermissionStep = () => (
    <div className="text-center">
      <div className="mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mic className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Microphone Access Required</h3>
        <p className="text-gray-600 mb-6">
          We need access to your microphone to conduct the voice interview. 
          Please allow microphone access when prompted.
        </p>
      </div>

      {microphoneStatus === 'checking' && (
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <LoadingSpinner size="sm" />
          <span>Checking microphone access...</span>
        </div>
      )}

      {microphoneStatus === 'denied' && (
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2 text-red-600 mb-4">
            <XCircle className="h-5 w-5" />
            <span>Microphone access denied</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Please allow microphone access in your browser settings and refresh the page.
          </p>
          <button
            onClick={checkMicrophonePermission}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Check Again
          </button>
        </div>
      )}

      {microphoneStatus === 'unknown' && (
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2 text-yellow-600 mb-4">
            <XCircle className="h-5 w-5" />
            <span>Microphone status unknown</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Unable to determine microphone status. Please try requesting permission.
          </p>
          <button
            onClick={requestMicrophonePermission}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request Permission
          </button>
        </div>
      )}

      {microphoneStatus === 'prompt' && (
        <button
          onClick={requestMicrophonePermission}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Allow Microphone Access'}
        </button>
      )}

      {microphoneStatus === 'granted' && (
        <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
          <CheckCircle className="h-5 w-5" />
          <span>Microphone access granted!</span>
        </div>
      )}
    </div>
  );

  const renderTestStep = () => (
    <div className="space-y-6">
      {/* Microphone Test */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Your Microphone</h3>
        <p className="text-gray-600 mb-6">
          Record a short test to make sure your microphone is working properly.
        </p>

        <div className="flex items-center justify-center space-x-4 mb-6">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Mic className="h-5 w-5" />
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Square className="h-5 w-5" />
              <span>Stop Recording</span>
            </button>
          )}
        </div>

        {isRecording && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-red-600">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              <span>Recording... {recordingDuration}s</span>
            </div>
          </div>
        )}

        {audioUrl && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Test your recording:</p>
            <button
              onClick={playRecording}
              disabled={isPlaying}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors mx-auto"
            >
              <Play className="h-4 w-4" />
              <span>{isPlaying ? 'Playing...' : 'Play Recording'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Voice Test */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Test AI Voice</h3>
        <p className="text-gray-600 mb-4 text-center">
          Listen to how the AI interviewer will sound during your interview.
        </p>
        
        {!elevenLabsService.isAvailable() && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-800">
              <div className="text-yellow-600">⚠️</div>
              <div>
                <p className="text-sm font-medium">ElevenLabs API Key Not Configured</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Voice features are disabled. Please configure your ElevenLabs API key in the environment variables.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center">
          <button
            onClick={testVoice}
            disabled={!elevenLabsService.isAvailable()}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors mx-auto ${
              elevenLabsService.isAvailable()
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            <Volume2 className="h-5 w-5" />
            <span>Test AI Voice</span>
          </button>
          
          {voiceTested && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Voice test completed!</span>
            </div>
          )}
        </div>
      </div>

      {/* Next Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setSetupStep('ready')}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <span>Continue to Interview</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderReadyStep = () => (
    <div className="text-center">
      <div className="mb-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Start!</h3>
        <p className="text-gray-600 mb-6">
          Your microphone is working and the AI voice is ready. 
          You can now proceed to the interview.
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={proceedToInterview}
          className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mx-auto"
        >
          <span>Start Interview</span>
          <ArrowRight className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => setSetupStep('test')}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Back to Testing
        </button>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Setup Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-3">
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interview Setup</h1>
              <p className="text-gray-600">Prepare for your interview with {candidate.name}</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${setupStep === 'permission' ? 'text-blue-600' : setupStep === 'test' || setupStep === 'ready' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${setupStep === 'permission' ? 'bg-blue-600 text-white' : setupStep === 'test' || setupStep === 'ready' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {setupStep === 'test' || setupStep === 'ready' ? <CheckCircle className="h-5 w-5" /> : '1'}
              </div>
              <span className="text-sm font-medium">Permission</span>
            </div>
            
            <div className={`w-8 h-1 ${setupStep === 'test' || setupStep === 'ready' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center space-x-2 ${setupStep === 'test' ? 'text-blue-600' : setupStep === 'ready' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${setupStep === 'test' ? 'bg-blue-600 text-white' : setupStep === 'ready' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {setupStep === 'ready' ? <CheckCircle className="h-5 w-5" /> : '2'}
              </div>
              <span className="text-sm font-medium">Testing</span>
            </div>
            
            <div className={`w-8 h-1 ${setupStep === 'ready' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center space-x-2 ${setupStep === 'ready' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${setupStep === 'ready' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {setupStep === 'ready' ? <CheckCircle className="h-5 w-5" /> : '3'}
              </div>
              <span className="text-sm font-medium">Ready</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {setupStep === 'permission' && renderPermissionStep()}
          {setupStep === 'test' && renderTestStep()}
          {setupStep === 'ready' && renderReadyStep()}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <LoadingSpinner size="md" />
              <span className="text-gray-700">Setting up interview...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSetupPage;
