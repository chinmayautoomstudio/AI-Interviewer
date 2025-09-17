// TTS Manager - Handles multiple TTS providers
// Primary: Amazon Polly, Fallback: ElevenLabs

import { elevenLabsService, TTSRequest, TTSResponse } from './elevenLabs';
import { amazonPollyWithSDK, PollyTTSRequest, PollyTTSResponse } from './awsPollyWithSDK';

export interface TTSManagerRequest {
  text: string;
  voiceId?: string;
  voiceSettings?: any;
  provider?: 'elevenlabs' | 'polly' | 'auto';
}

export interface TTSManagerResponse {
  audioUrl: string;
  duration: number;
  voice: string;
  language: string;
  provider: 'elevenlabs' | 'polly';
}

class TTSManager {
  private primaryProvider: 'elevenlabs' | 'polly' = 'polly';
  private fallbackProvider: 'elevenlabs' | 'polly' = 'elevenlabs';

  constructor() {
    // Check which providers are available
    this.checkProviderAvailability();
  }

  // Check which TTS providers are available
  private checkProviderAvailability(): void {
    const elevenLabsAvailable = elevenLabsService.isAvailable();
    const pollyAvailable = amazonPollyWithSDK.isAvailable();

    console.log('🔍 TTS Provider Availability:', {
      elevenLabs: elevenLabsAvailable,
      amazonPolly: pollyAvailable
    });

    // Set primary and fallback based on availability
    if (pollyAvailable && elevenLabsAvailable) {
      this.primaryProvider = 'polly';
      this.fallbackProvider = 'elevenlabs';
    } else if (pollyAvailable) {
      this.primaryProvider = 'polly';
      this.fallbackProvider = 'polly';
    } else if (elevenLabsAvailable) {
      this.primaryProvider = 'elevenlabs';
      this.fallbackProvider = 'elevenlabs';
    } else {
      console.warn('⚠️ No TTS providers available!');
    }
  }

  // Convert text to speech with automatic fallback
  async textToSpeech(request: TTSManagerRequest): Promise<TTSManagerResponse> {
    const provider = request.provider || 'auto';
    
    if (provider === 'auto') {
      return this.textToSpeechWithFallback(request);
    } else if (provider === 'elevenlabs') {
      return this.textToSpeechElevenLabs(request);
    } else if (provider === 'polly') {
      return this.textToSpeechPolly(request);
    } else {
      throw new Error(`Unknown TTS provider: ${provider}`);
    }
  }

  // Text to speech with automatic fallback
  private async textToSpeechWithFallback(request: TTSManagerRequest): Promise<TTSManagerResponse> {
    try {
      // Try primary provider first (Amazon Polly)
      if (this.primaryProvider === 'polly') {
        try {
          return await this.textToSpeechPolly(request);
        } catch (error) {
          console.warn('⚠️ Amazon Polly failed, falling back to ElevenLabs:', error);
          return await this.textToSpeechElevenLabs(request);
        }
      } else {
        try {
          return await this.textToSpeechElevenLabs(request);
        } catch (error) {
          console.warn('⚠️ ElevenLabs failed, falling back to Amazon Polly:', error);
          return await this.textToSpeechPolly(request);
        }
      }
    } catch (error) {
      console.error('❌ All TTS providers failed:', error);
      throw new Error('All TTS providers are unavailable');
    }
  }

  // Text to speech using ElevenLabs
  private async textToSpeechElevenLabs(request: TTSManagerRequest): Promise<TTSManagerResponse> {
    if (!elevenLabsService.isAvailable()) {
      throw new Error('ElevenLabs not available');
    }

    const elevenLabsRequest: TTSRequest = {
      text: request.text,
      voiceId: request.voiceId || elevenLabsService.getCurrentVoiceConfig().voiceId,
      voiceSettings: request.voiceSettings
    };

    const response = await elevenLabsService.textToSpeech(elevenLabsRequest);
    
    return {
      audioUrl: response.audioUrl,
      duration: response.duration || 0,
      voice: response.metadata?.voiceId || 'Unknown',
      language: 'en-US', // ElevenLabs doesn't provide language in response
      provider: 'elevenlabs'
    };
  }

  // Text to speech using Amazon Polly
  private async textToSpeechPolly(request: TTSManagerRequest): Promise<TTSManagerResponse> {
    if (!amazonPollyWithSDK.isAvailable()) {
      throw new Error('Amazon Polly not available');
    }

    const pollyRequest: PollyTTSRequest = {
      text: request.text,
      voice: request.voiceId || amazonPollyWithSDK.getCurrentVoiceConfig().voiceId,
      language: 'en-US'
    };

    const response = await amazonPollyWithSDK.textToSpeech(pollyRequest);
    
    // Handle browser TTS special URL
    if (response.audioUrl === 'browser-tts://completed') {
      console.log('🔊 Browser TTS completed - no audio URL needed');
      // For browser TTS, we don't need to return an audio URL since it plays directly
      return {
        audioUrl: '', // Empty URL for browser TTS
        duration: response.duration,
        voice: response.voice,
        language: response.language,
        provider: 'polly'
      };
    }
    
    return {
      audioUrl: response.audioUrl,
      duration: response.duration,
      voice: response.voice,
      language: response.language,
      provider: 'polly'
    };
  }

  // Get available voices from all providers
  async getAvailableVoices(): Promise<{
    elevenlabs: any[];
    polly: any[];
  }> {
    const voices: {
      elevenlabs: any[];
      polly: any[];
    } = {
      elevenlabs: [],
      polly: []
    };

    try {
      if (elevenLabsService.isAvailable()) {
        voices.elevenlabs = await elevenLabsService.getVoices();
      }
    } catch (error) {
      console.warn('Failed to get ElevenLabs voices:', error);
    }

    try {
      if (amazonPollyWithSDK.isAvailable()) {
        voices.polly = await amazonPollyWithSDK.getVoices();
      }
    } catch (error) {
      console.warn('Failed to get Amazon Polly voices:', error);
    }

    return voices;
  }

  // Set voice for interviews
  setInterviewVoice(voiceType: 'professional_male' | 'professional_female' | 'friendly_male' | 'friendly_female'): void {
    if (elevenLabsService.isAvailable()) {
      // Use a default voice ID for ElevenLabs
      const defaultVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Default ElevenLabs voice
      elevenLabsService.setVoiceById(defaultVoiceId);
    }
    
    if (amazonPollyWithSDK.isAvailable()) {
      amazonPollyWithSDK.setInterviewVoice(voiceType);
    }
  }

  // Get current voice configuration
  getCurrentVoiceConfig(): { voiceId: string; settings: any; provider: string } {
    if (this.primaryProvider === 'polly' && amazonPollyWithSDK.isAvailable()) {
      const config = amazonPollyWithSDK.getCurrentVoiceConfig();
      return {
        ...config,
        provider: 'polly'
      };
    } else if (elevenLabsService.isAvailable()) {
      const config = elevenLabsService.getCurrentVoiceConfig();
      return {
        ...config,
        provider: 'elevenlabs'
      };
    } else {
      throw new Error('No TTS providers available');
    }
  }

  // Check if any TTS provider is available
  isAvailable(): boolean {
    return elevenLabsService.isAvailable() || amazonPollyWithSDK.isAvailable();
  }

  // Get provider status
  getProviderStatus(): {
    elevenlabs: boolean;
    polly: boolean;
    primary: string;
    fallback: string;
  } {
    return {
      elevenlabs: elevenLabsService.isAvailable(),
      polly: amazonPollyWithSDK.isAvailable(),
      primary: this.primaryProvider,
      fallback: this.fallbackProvider
    };
  }
}

// Export singleton instance
export const ttsManager = new TTSManager();
