import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Pause } from 'lucide-react';
import { InterviewSystemService } from '../../services/interviewSystem';
import { elevenLabsService } from '../../services/elevenLabs';
import { microphonePermissionManager } from '../../utils/microphonePermissions';
import { supabase } from '../../services/supabase';

interface VoiceRecorderProps {
  onTranscription: (transcription: { transcript: string; response: string; audioResponse: string; confidence: number }) => void;
  onError: (error: string) => void;
  sessionId: string;
  disabled?: boolean;
  language?: string;
  className?: string;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  onError,
  sessionId,
  disabled = false,
  language = 'en-US',
  className = '',
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [fallbackText, setFallbackText] = useState('');
  const [isSTTRunning, setIsSTTRunning] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (recordingState.audioUrl) {
        elevenLabsService.revokeAudioUrl(recordingState.audioUrl);
      }
    };
  }, [recordingState.audioUrl]);

  const startRecording = async () => {
    try {
      // Check microphone permission first
      const permissionState = await microphonePermissionManager.checkPermissionStatus();
      
      if (!permissionState.canRecord) {
        if (permissionState.status === 'denied') {
          onError('Microphone access denied. Please allow microphone access in your browser settings and refresh the page.');
        } else if (permissionState.status === 'prompt') {
          // Request permission
          const newPermissionState = await microphonePermissionManager.requestMicrophonePermission();
          if (!newPermissionState.canRecord) {
            onError('Microphone permission is required for voice recording. Please allow microphone access.');
            return;
          }
        } else {
          onError('Microphone not available. Please check your microphone connection and browser settings.');
          return;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setRecordingState(prev => ({
          ...prev,
          audioBlob,
          audioUrl,
        }));

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
      }));

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);

    } catch (error: any) {
      console.error('Error starting recording:', error);
      
      let errorMessage = 'Failed to access microphone. Please check permissions.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings and refresh the page.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application. Please close other applications and try again.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Microphone access blocked due to security restrictions. Please use HTTPS.';
      }
      
      onError(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume();
        setRecordingState(prev => ({ ...prev, isPaused: false }));
      } else {
        mediaRecorderRef.current.pause();
        setRecordingState(prev => ({ ...prev, isPaused: true }));
      }
    }
  };

  const processRecording = async () => {
    if (!recordingState.audioBlob) return;

    setIsProcessing(true);
    try {
      console.log('🎤 Starting STT process...');
      
      // For now, let's skip STT and go directly to text input
      // This will help us test if the AI response part is working
      console.log('🎤 Skipping STT for testing - showing text input');
      setShowTextFallback(true);
      onError('STT temporarily disabled for testing. Please type your response below.');

    } catch (error) {
      console.error('Error processing recording:', error);
      // Show text fallback option when STT fails
      setShowTextFallback(true);
      onError('Voice transcription failed. You can type your response below.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process AI response (extracted for reuse)
  const processAIResponse = async (text: string, confidence: number) => {
    try {
      console.log('🤖 Processing AI response for text:', text);
      
      // Get session data to extract candidate and job IDs
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('❌ Session not found:', sessionError);
        onError('Session not found');
        return;
      }

      console.log('✅ Session found:', session);
      console.log('📤 Sending to AI Agent...');

      // Send the transcribed text to n8n workflow for AI response
      const aiResult = await InterviewSystemService.sendCandidateResponse(
        sessionId,
        text,
        session.candidate_id,
        session.job_description_id
      );

      console.log('🤖 AI Result:', aiResult);
      console.log('🤖 AI Result data:', aiResult.data);
      console.log('🤖 AI Response text:', aiResult.data?.aiResponse);
      console.log('🤖 AI Response type:', typeof aiResult.data?.aiResponse);

      if (aiResult.data) {
        console.log('✅ AI Response received:', aiResult.data.aiResponse);
        
        // Check if AI response is empty or null
        if (!aiResult.data.aiResponse || aiResult.data.aiResponse.trim() === '') {
          console.error('❌ AI Response is empty or null!');
          onError('AI response is empty. Please try again.');
          return;
        }
        
        // Generate TTS for AI response
        let audioResponse = '';
        try {
          console.log('🔊 Generating TTS...');
          const voiceConfig = elevenLabsService.getCurrentVoiceConfig();
          const ttsResponse = await elevenLabsService.textToSpeech({
            text: aiResult.data.aiResponse,
            voiceId: voiceConfig.voiceId,
            voiceSettings: voiceConfig.settings
          });
          audioResponse = ttsResponse.audioUrl;
          console.log('✅ TTS generated:', audioResponse);
        } catch (ttsError) {
          console.warn('⚠️ TTS failed, continuing without audio:', ttsError);
          // Continue without audio - the text response will still show
        }

        console.log('📤 Calling onTranscription with:', {
          transcript: text,
          response: aiResult.data.aiResponse,
          audioResponse: audioResponse,
          confidence: confidence
        });

        // Return the complete result
        onTranscription({
          transcript: text,
          response: aiResult.data.aiResponse,
          audioResponse: audioResponse,
          confidence: confidence
        });
      } else {
        console.error('❌ No AI response data:', aiResult.error);
        onError(aiResult.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('❌ Error processing AI response:', error);
      onError('Failed to get AI response');
    }
  };

  // Skip STT and go to text input
  const skipSTT = () => {
    setShowTextFallback(true);
    setIsProcessing(false);
    setIsSTTRunning(false);
  };

  // Handle text fallback submission
  const handleTextFallback = async () => {
    if (!fallbackText.trim()) return;

    setIsProcessing(true);
    try {
      await processAIResponse(fallbackText, 1.0); // Text input has 100% confidence
      
      // Reset fallback
      setShowTextFallback(false);
      setFallbackText('');
    } catch (error) {
      console.error('Error processing text fallback:', error);
      onError('Failed to process text response');
    } finally {
      setIsProcessing(false);
    }
  };

  // Start live STT using Web Speech API
  const startLiveSTT = (): Promise<{ text: string; confidence: number }> => {
    return new Promise((resolve, reject) => {
      // Check if speech recognition is supported
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported in this browser. Please use Chrome or Edge.'));
        return;
      }

      // Check if microphone permission is granted
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
          if (result.state === 'denied') {
            reject(new Error('Microphone access denied. Please allow microphone access and try again.'));
            return;
          }
        }).catch(() => {
          // Permission API not supported, continue anyway
        });
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      // Set a timeout for the recognition
      const timeout = setTimeout(() => {
        recognition.stop();
        setIsSTTRunning(false);
        reject(new Error('Speech recognition timeout. Please try speaking again.'));
      }, 5000); // 5 second timeout for faster response

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsSTTRunning(true);
      };

      recognition.onresult = (event: any) => {
        clearTimeout(timeout);
        setIsSTTRunning(false);
        console.log('🎤 Speech recognition result:', event);
        
        if (event.results && event.results.length > 0) {
          const result = event.results[0];
          if (result && result.length > 0) {
            const text = result[0].transcript;
            const confidence = result[0].confidence || 0.8;
            
            console.log('🎤 Transcribed text:', text);
            console.log('🎤 Confidence:', confidence);
            
            resolve({ text, confidence });
          } else {
            reject(new Error('No speech detected. Please try speaking again.'));
          }
        } else {
          reject(new Error('No speech detected. Please try speaking again.'));
        }
      };

      recognition.onerror = (event: any) => {
        clearTimeout(timeout);
        setIsSTTRunning(false);
        console.error('🎤 Speech recognition error:', event.error);
        
        let errorMessage = 'Speech recognition failed. ';
        switch (event.error) {
          case 'no-speech':
            errorMessage += 'No speech detected. Please try speaking again.';
            break;
          case 'audio-capture':
            errorMessage += 'Microphone not found or not working. Please check your microphone.';
            break;
          case 'not-allowed':
            errorMessage += 'Microphone access denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage += 'Network error. Please check your internet connection.';
            break;
          default:
            errorMessage += `Error: ${event.error}. Please try again.`;
        }
        
        reject(new Error(errorMessage));
      };

      recognition.onend = () => {
        clearTimeout(timeout);
        setIsSTTRunning(false);
        console.log('🎤 Speech recognition ended');
      };

      try {
        // Start recognition
        recognition.start();
        console.log('🎤 Starting speech recognition...');
      } catch (error) {
        clearTimeout(timeout);
        setIsSTTRunning(false);
        console.error('🎤 Failed to start speech recognition:', error);
        reject(new Error('Failed to start speech recognition. Please try again.'));
      }
    });
  };

  const playRecording = () => {
    if (!recordingState.audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(recordingState.audioUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);

    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      onError('Failed to play recording.');
    });
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const clearRecording = () => {
    if (recordingState.audioUrl) {
      elevenLabsService.revokeAudioUrl(recordingState.audioUrl);
    }
    
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
    });

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`voice-recorder ${className}`}>
      {/* Recording Controls */}
      <div className="flex items-center space-x-3">
        {!recordingState.isRecording && !recordingState.audioBlob && (
          <>
            <button
              onClick={startRecording}
              disabled={disabled}
              className="flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-full transition-colors"
              title="Start Recording"
            >
              <Mic className="h-6 w-6" />
            </button>
            <button
              onClick={skipSTT}
              className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
              title="Type Instead"
            >
              <span className="text-xs font-bold">T</span>
            </button>
          </>
        )}

        {recordingState.isRecording && (
          <>
            <button
              onClick={pauseRecording}
              className="flex items-center justify-center w-10 h-10 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
              title={recordingState.isPaused ? "Resume Recording" : "Pause Recording"}
            >
              {recordingState.isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            
            <button
              onClick={stopRecording}
              className="flex items-center justify-center w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
              title="Stop Recording"
            >
              <Square className="h-6 w-6" />
            </button>
          </>
        )}

        {recordingState.audioBlob && !recordingState.isRecording && (
          <>
            <button
              onClick={isPlaying ? stopPlayback : playRecording}
              className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
              title={isPlaying ? "Stop Playback" : "Play Recording"}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>

            <button
              onClick={processRecording}
              disabled={isProcessing}
              className="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-full transition-colors"
              title="Process Recording"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={clearRecording}
              className="flex items-center justify-center w-10 h-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors"
              title="Clear Recording"
            >
              <MicOff className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Recording Status */}
      {recordingState.isRecording && (
        <div className="mt-2 flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">
              {recordingState.isPaused ? 'Paused' : 'Recording'}
            </span>
          </div>
          <span className="text-sm font-mono text-gray-500">
            {formatDuration(recordingState.duration)}
          </span>
        </div>
      )}

      {/* Audio Preview */}
      {recordingState.audioBlob && !recordingState.isRecording && (
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            Recording ready ({formatDuration(recordingState.duration)})
          </span>
          {isProcessing && (
            <span className="text-sm text-blue-600">
              {isSTTRunning ? 'Listening...' : 'Processing...'}
            </span>
          )}
          {isSTTRunning && (
            <button
              onClick={skipSTT}
              className="text-xs px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors"
            >
              Skip STT
            </button>
          )}
        </div>
      )}

      {/* Text Fallback */}
      {showTextFallback && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-3">
            Voice transcription failed. Please type your response:
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={fallbackText}
              onChange={(e) => setFallbackText(e.target.value)}
              placeholder="Type your response here..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isProcessing) {
                  handleTextFallback();
                }
              }}
            />
            <button
              onClick={handleTextFallback}
              disabled={!fallbackText.trim() || isProcessing}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isProcessing ? 'Sending...' : 'Send'}
            </button>
            <button
              onClick={() => {
                setShowTextFallback(false);
                setFallbackText('');
              }}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hidden audio element for playback */}
      {recordingState.audioUrl && (
        <audio
          ref={audioRef}
          src={recordingState.audioUrl}
          preload="none"
        />
      )}
    </div>
  );
};

export default VoiceRecorder;
