import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { elevenLabsService, TTSRequest, TTSResponse } from '../../services/elevenLabs';

interface VoicePlayerProps {
  text: string;
  voiceId?: string;
  autoPlay?: boolean;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface PlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  audioUrl: string | null;
  error: string | null;
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({
  text,
  voiceId,
  autoPlay = false,
  onPlaybackStart,
  onPlaybackEnd,
  onError,
  className = '',
}) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    isLoading: false,
    duration: 0,
    currentTime: 0,
    audioUrl: null,
    error: null,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playbackState.audioUrl) {
        elevenLabsService.revokeAudioUrl(playbackState.audioUrl);
      }
    };
  }, [playbackState.audioUrl]);

  // Generate audio when text changes
  useEffect(() => {
    if (text && elevenLabsService.isAvailable()) {
      generateAudio();
    }
  }, [text, voiceId]);

  // Auto-play if enabled
  useEffect(() => {
    if (autoPlay && playbackState.audioUrl && !playbackState.isPlaying && !playbackState.isLoading) {
      playAudio();
    }
  }, [autoPlay, playbackState.audioUrl, playbackState.isPlaying, playbackState.isLoading]);

  const generateAudio = async () => {
    if (!text.trim()) return;

    setPlaybackState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const ttsRequest: TTSRequest = {
        text,
        voiceId: voiceId || elevenLabsService.defaultVoiceId,
        voiceSettings: elevenLabsService.getInterviewVoiceSettings(),
      };

      const ttsResponse: TTSResponse = await elevenLabsService.textToSpeech(ttsRequest);
      
      setPlaybackState(prev => ({
        ...prev,
        audioUrl: ttsResponse.audioUrl,
        duration: ttsResponse.duration || elevenLabsService.estimateSpeechDuration(text),
        isLoading: false,
      }));

    } catch (error) {
      console.error('Error generating audio:', error);
      const errorMessage = 'Failed to generate speech audio';
      setPlaybackState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      onError?.(errorMessage);
    }
  };

  const playAudio = () => {
    if (!playbackState.audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(playbackState.audioUrl);
    audioRef.current = audio;
    audio.volume = isMuted ? 0 : volume;

    audio.onplay = () => {
      setPlaybackState(prev => ({ ...prev, isPlaying: true }));
      onPlaybackStart?.();
      
      // Start progress tracking
      progressIntervalRef.current = setInterval(() => {
        setPlaybackState(prev => ({
          ...prev,
          currentTime: audio.currentTime,
        }));
      }, 100);
    };

    audio.onended = () => {
      setPlaybackState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      onPlaybackEnd?.();
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    audio.onpause = () => {
      setPlaybackState(prev => ({ ...prev, isPlaying: false }));
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    audio.onerror = () => {
      const errorMessage = 'Failed to play audio';
      setPlaybackState(prev => ({
        ...prev,
        error: errorMessage,
        isPlaying: false,
      }));
      onError?.(errorMessage);
    };

    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      const errorMessage = 'Failed to start audio playback';
      setPlaybackState(prev => ({
        ...prev,
        error: errorMessage,
        isPlaying: false,
      }));
      onError?.(errorMessage);
    });
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaybackState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume;
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = playbackState.duration > 0 
    ? (playbackState.currentTime / playbackState.duration) * 100 
    : 0;

  if (!elevenLabsService.isAvailable()) {
    return (
      <div className={`voice-player-disabled ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <VolumeX className="h-4 w-4" />
          <span className="text-sm">Voice features unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`voice-player ${className}`}>
      {/* Error State */}
      {playbackState.error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {playbackState.error}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center space-x-3">
        {/* Play/Pause Button */}
        <button
          onClick={playbackState.isPlaying ? pauseAudio : playAudio}
          disabled={playbackState.isLoading || !playbackState.audioUrl}
          className="flex items-center justify-center w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-full transition-colors"
          title={playbackState.isPlaying ? "Pause" : "Play"}
        >
          {playbackState.isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : playbackState.isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        {/* Stop Button */}
        {playbackState.audioUrl && (
          <button
            onClick={stopAudio}
            className="flex items-center justify-center w-8 h-8 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors"
            title="Stop"
          >
            <div className="w-3 h-3 bg-white rounded-sm" />
          </button>
        )}

        {/* Volume Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="flex items-center justify-center w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Time Display */}
        {playbackState.audioUrl && (
          <div className="text-sm text-gray-600 font-mono">
            {formatTime(playbackState.currentTime)} / {formatTime(playbackState.duration)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {playbackState.audioUrl && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {playbackState.isLoading && (
        <div className="mt-2 text-sm text-blue-600">
          Generating speech audio...
        </div>
      )}

      {/* Hidden audio element */}
      {playbackState.audioUrl && (
        <audio
          ref={audioRef}
          src={playbackState.audioUrl}
          preload="none"
        />
      )}
    </div>
  );
};

export default VoicePlayer;
