import React, { useState, useEffect } from 'react';
import { Volume2, Play, Settings, Mic } from 'lucide-react';
import { VoiceConfig, getAllVoicePresets, VOICE_PRESETS } from '../../config/voiceConfig';
import { elevenLabsService } from '../../services/elevenLabs';

interface VoiceSelectorProps {
  onVoiceChange?: (voiceConfig: VoiceConfig) => void;
  currentVoiceId?: string;
  className?: string;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  onVoiceChange,
  currentVoiceId,
  className = '',
}) => {
  const [selectedVoice, setSelectedVoice] = useState<VoiceConfig>(VOICE_PRESETS.professional_female);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [testText, setTestText] = useState('Hello! This is a test of the selected voice for your AI interviewer.');

  useEffect(() => {
    if (currentVoiceId) {
      const voice = Object.values(VOICE_PRESETS).find(v => v.voiceId === currentVoiceId);
      if (voice) {
        setSelectedVoice(voice);
      }
    }
  }, [currentVoiceId]);

  const handleVoiceSelect = (voiceConfig: VoiceConfig) => {
    setSelectedVoice(voiceConfig);
    elevenLabsService.setVoiceConfig(voiceConfig);
    onVoiceChange?.(voiceConfig);
  };

  const testVoice = async (voiceConfig: VoiceConfig) => {
    if (!elevenLabsService.isAvailable()) {
      alert('Eleven Labs API key not configured. Please set REACT_APP_ELEVEN_LABS_API_KEY in your .env file.');
      return;
    }

    setIsPlaying(voiceConfig.voiceId);
    try {
      const response = await elevenLabsService.textToSpeech({
        text: testText,
        voiceId: voiceConfig.voiceId,
        voiceSettings: voiceConfig.settings,
      });
      
      // Play the audio
      if (response.audioUrl) {
        await elevenLabsService.playAudio(response.audioUrl);
      }
    } catch (error) {
      console.error('Error testing voice:', error);
      alert('Failed to test voice. Please check your API key and internet connection.');
    } finally {
      setIsPlaying(null);
    }
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'female' ? '👩' : '👨';
  };

  const getAgeIcon = (age: string) => {
    switch (age) {
      case 'young': return '🟢';
      case 'middle': return '🟡';
      case 'mature': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className={`voice-selector ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <Volume2 className="h-5 w-5 mr-2" />
          AI Interviewer Voice Selection
        </h3>
        <p className="text-sm text-gray-600">
          Choose the voice that will conduct your AI interviews. Each voice has different characteristics suitable for various interview types.
        </p>
      </div>

      {/* Test Text Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Text
        </label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="Enter text to test the voice..."
        />
      </div>

      {/* Voice Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(VOICE_PRESETS).map(([key, voice]) => (
          <div
            key={voice.voiceId}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedVoice.voiceId === voice.voiceId
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleVoiceSelect(voice)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{getGenderIcon(voice.gender)}</span>
                  <span className="text-sm">{getAgeIcon(voice.age)}</span>
                  <h4 className="font-medium text-gray-900">{voice.name}</h4>
                  {selectedVoice.voiceId === voice.voiceId && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Selected</span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{voice.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {voice.accent} accent
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {voice.gender}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {voice.age}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500">{voice.useCase}</p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  testVoice(voice);
                }}
                disabled={isPlaying === voice.voiceId}
                className="ml-2 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                title="Test Voice"
              >
                {isPlaying === voice.voiceId ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Voice Settings */}
      {selectedVoice && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Voice Settings
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Stability:</span>
              <span className="ml-2 text-gray-600">{selectedVoice.settings.stability}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Similarity Boost:</span>
              <span className="ml-2 text-gray-600">{selectedVoice.settings.similarityBoost}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Speaker Boost:</span>
              <span className="ml-2 text-gray-600">
                {selectedVoice.settings.useSpeakerBoost ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Selection Buttons */}
      <div className="mt-4">
        <h4 className="font-medium text-gray-900 mb-2">Quick Selection by Job Type</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleVoiceSelect(VOICE_PRESETS.technical_male)}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Technical Roles
          </button>
          <button
            onClick={() => handleVoiceSelect(VOICE_PRESETS.friendly_female)}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Creative Roles
          </button>
          <button
            onClick={() => handleVoiceSelect(VOICE_PRESETS.professional_male)}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Management Roles
          </button>
          <button
            onClick={() => handleVoiceSelect(VOICE_PRESETS.professional_female)}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            General Interviews
          </button>
          <button
            onClick={() => handleVoiceSelect(VOICE_PRESETS.sia_friendly)}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Customer Care
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSelector;
