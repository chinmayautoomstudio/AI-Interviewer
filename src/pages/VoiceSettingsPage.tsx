import React, { useState, useEffect } from 'react';
import { Volume2, Save, RotateCcw, Globe, Play } from 'lucide-react';
import VoiceSelector from '../components/voice/VoiceSelector';
import { VoiceConfig, VOICE_PRESETS, getIndianAccentVoices } from '../config/voiceConfig';
import { elevenLabsService } from '../services/elevenLabs';

const VoiceSettingsPage: React.FC = () => {
  const [currentVoice, setCurrentVoice] = useState<VoiceConfig>(VOICE_PRESETS.professional_female);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  useEffect(() => {
    // Load current voice configuration
    const currentConfig = elevenLabsService.getCurrentVoiceConfig();
    setCurrentVoice(currentConfig);
  }, []);

  const handleVoiceChange = (voiceConfig: VoiceConfig) => {
    setCurrentVoice(voiceConfig);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save voice configuration (you can extend this to save to database)
      elevenLabsService.setVoiceConfig(currentVoice);
      
      // Save to localStorage for persistence
      localStorage.setItem('ai-interviewer-voice-config', JSON.stringify(currentVoice));
      
      setSaveMessage('Voice settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving voice settings:', error);
      setSaveMessage('Failed to save voice settings');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultVoice = VOICE_PRESETS.professional_female;
    setCurrentVoice(defaultVoice);
    elevenLabsService.setVoiceConfig(defaultVoice);
    setSaveMessage('Voice settings reset to default');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const testVoice = async (voiceConfig: VoiceConfig) => {
    if (!elevenLabsService.isAvailable()) {
      alert('Eleven Labs API key not configured. Please set REACT_APP_ELEVEN_LABS_API_KEY in your .env file.');
      return;
    }

    setIsPlaying(voiceConfig.voiceId);
    try {
      const testText = "Hello! This is a test of the Indian-friendly voice for your AI interviewer. How does this sound?";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Volume2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Voice Settings</h1>
              <p className="text-gray-600">Configure the AI interviewer's voice for different interview scenarios</p>
            </div>
          </div>
        </div>

        {/* Current Voice Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Voice Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-700">Voice Name</div>
              <div className="text-lg font-semibold text-gray-900">{currentVoice.name}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-700">Accent</div>
              <div className="text-lg font-semibold text-gray-900">{currentVoice.accent}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-700">Gender</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">{currentVoice.gender}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-700">Age Group</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">{currentVoice.age}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
            <div className="text-gray-900">{currentVoice.description}</div>
          </div>
        </div>

        {/* Voice Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <VoiceSelector
            onVoiceChange={handleVoiceChange}
            currentVoiceId={currentVoice.voiceId}
          />
        </div>

        {/* Indian Accent Voices Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Globe className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Indian Accent Friendly Voices</h2>
              <p className="text-gray-600">Optimized voices for Indian English pronunciation</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getIndianAccentVoices().map((voice) => (
              <div
                key={voice.voiceId}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  currentVoice.voiceId === voice.voiceId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleVoiceChange(voice)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{voice.name}</h3>
                  <div className="flex items-center space-x-2">
                    {currentVoice.voiceId === voice.voiceId && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        testVoice(voice);
                      }}
                      disabled={isPlaying === voice.voiceId}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
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
                <p className="text-sm text-gray-600 mb-2">{voice.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="capitalize">{voice.gender}</span>
                  <span className="capitalize">{voice.age}</span>
                  <span>{voice.accent}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Use Case: {voice.useCase}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-medium text-orange-900 mb-2">🇮🇳 About Indian Accent Voices</h4>
            <p className="text-sm text-orange-800">
              These voices are optimized with adjusted stability and similarity settings to provide 
              better pronunciation for Indian English speakers. While ElevenLabs doesn't offer native 
              Indian accent voices, these configurations help achieve more natural-sounding speech 
              for Indian English interviews.
            </p>
          </div>
        </div>

        {/* Save Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Save Configuration</h3>
              <p className="text-gray-600">Save your voice settings to use them in interviews</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset to Default</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
          
          {saveMessage && (
            <div className={`mt-4 p-3 rounded-lg ${
              saveMessage.includes('successfully') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>

        {/* Voice Features Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Voice Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Available Features:</h4>
              <ul className="space-y-1">
                <li>• Text-to-Speech for AI responses</li>
                <li>• Speech-to-Text for candidate input</li>
                <li>• Voice customization per job type</li>
                <li>• Real-time voice conversations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Voice Selection:</h4>
              <ul className="space-y-1">
                <li>• Automatic selection by job type</li>
                <li>• Manual voice configuration</li>
                <li>• Voice testing before interviews</li>
                <li>• Persistent voice settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSettingsPage;
