import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Pause } from 'lucide-react';
import { InterviewSystemService } from '../../services/interviewSystem';
import { elevenLabsService } from '../../services/elevenLabs';

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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

    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to access microphone. Please check permissions.');
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
      // Send audio to n8n workflow for ElevenLabs STT processing
      const result = await InterviewSystemService.sendVoiceMessage(
        sessionId,
        recordingState.audioBlob,
        recordingState.duration * 1000 // Convert to milliseconds
      );

      if (result.data) {
        onTranscription(result.data);
      } else {
        onError(result.error || 'Failed to process voice message');
      }

    } catch (error) {
      console.error('Error processing recording:', error);
      onError('Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
          <button
            onClick={startRecording}
            disabled={disabled}
            className="flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-full transition-colors"
            title="Start Recording"
          >
            <Mic className="h-6 w-6" />
          </button>
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
            <span className="text-sm text-blue-600">Processing...</span>
          )}
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
