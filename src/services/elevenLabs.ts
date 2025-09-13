// Eleven Labs Voice Integration Service
// Handles Text-to-Speech (TTS) and Speech-to-Text (STT) operations

import { VoiceConfig, DEFAULT_VOICE_CONFIG, getVoiceForJobType, getVoiceForDepartment, VOICE_PRESETS } from '../config/voiceConfig';

export interface VoiceSettings {
  stability: number; // 0.0 to 1.0
  similarityBoost: number; // 0.0 to 1.0
  style?: number; // 0.0 to 1.0 (for some voices)
  useSpeakerBoost?: boolean;
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  modelId?: string;
  voiceSettings?: VoiceSettings;
}

export interface TTSResponse {
  audioUrl: string;
  audioData?: ArrayBuffer;
  duration?: number;
  metadata?: {
    voiceId: string;
    modelId: string;
    characters: number;
    processingTime: number;
  };
}

export interface STTRequest {
  audioData: ArrayBuffer;
  language?: string;
  model?: string;
}

export interface STTResponse {
  text: string;
  confidence: number;
  language: string;
  duration: number;
  metadata?: {
    model: string;
    processingTime: number;
  };
}

export interface Voice {
  voiceId: string;
  name: string;
  category: string;
  description?: string;
  labels?: Record<string, string>;
  previewUrl?: string;
  availableForTts?: boolean;
  availableForStt?: boolean;
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';
  public defaultVoiceId: string = DEFAULT_VOICE_CONFIG.voiceId; // Use configured default
  private defaultModelId: string = 'eleven_monolingual_v1';
  private currentVoiceConfig: VoiceConfig = DEFAULT_VOICE_CONFIG;

  constructor() {
    this.apiKey = process.env.REACT_APP_ELEVEN_LABS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Eleven Labs API key not found. Voice features will be disabled.');
    }
  }

  // Check if service is available
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  // Set voice configuration
  setVoiceConfig(voiceConfig: VoiceConfig): void {
    this.currentVoiceConfig = voiceConfig;
    this.defaultVoiceId = voiceConfig.voiceId;
  }

  // Get current voice configuration
  getCurrentVoiceConfig(): VoiceConfig {
    return this.currentVoiceConfig;
  }

  // Set voice based on job type
  setVoiceForJobType(jobType: string): void {
    const voiceConfig = getVoiceForJobType(jobType);
    this.setVoiceConfig(voiceConfig);
  }

  // Set voice based on department
  setVoiceForDepartment(department: string): void {
    const voiceConfig = getVoiceForDepartment(department);
    this.setVoiceConfig(voiceConfig);
  }

  // Set voice by ID
  setVoiceById(voiceId: string): boolean {
    const voiceConfig = Object.values(VOICE_PRESETS)
      .find((voice: VoiceConfig) => voice.voiceId === voiceId);
    
    if (voiceConfig) {
      this.setVoiceConfig(voiceConfig);
      return true;
    }
    return false;
  }

  // Get available voices
  async getVoices(): Promise<Voice[]> {
    if (!this.isAvailable()) {
      throw new Error('Eleven Labs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  // Convert text to speech
  async textToSpeech(request: TTSRequest): Promise<TTSResponse> {
    if (!this.isAvailable()) {
      throw new Error('Eleven Labs API key not configured');
    }

    try {
      const startTime = Date.now();
      
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${request.voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text: request.text,
            model_id: request.modelId || this.defaultModelId,
            voice_settings: request.voiceSettings || this.currentVoiceConfig.settings,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.statusText}`);
      }

      const audioData = await response.arrayBuffer();
      const processingTime = Date.now() - startTime;

      // Create a blob URL for the audio
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        audioUrl,
        audioData,
        metadata: {
          voiceId: request.voiceId,
          modelId: request.modelId || this.defaultModelId,
          characters: request.text.length,
          processingTime,
        },
      };
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw error;
    }
  }

  // Convert speech to text (using Eleven Labs STT if available, or fallback to Web Speech API)
  async speechToText(request: STTRequest): Promise<STTResponse> {
    // For now, we'll use the Web Speech API as Eleven Labs STT is not widely available
    // This can be enhanced when Eleven Labs STT becomes more accessible
    return this.webSpeechToText(request);
  }

  // Web Speech API implementation (fallback)
  private async webSpeechToText(request: STTRequest): Promise<STTResponse> {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = request.language || 'en-US';

      recognition.onresult = (event: any) => {
        const result = event.results[0];
        const text = result[0].transcript;
        const confidence = result[0].confidence || 0.8; // Default confidence if not provided

        resolve({
          text,
          confidence,
          language: recognition.lang,
          duration: 0, // Web Speech API doesn't provide duration
          metadata: {
            model: 'Web Speech API',
            processingTime: 0,
          },
        });
      };

      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.onend = () => {
        // Recognition ended
      };

      // Start recognition
      recognition.start();
    });
  }

  // Play audio from URL
  async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      
      audio.onloadeddata = () => {
        audio.play().then(resolve).catch(reject);
      };
      
      audio.onerror = () => {
        reject(new Error('Failed to load audio'));
      };
      
      audio.onended = () => {
        resolve();
      };
    });
  }

  // Stop audio playback
  stopAudio(): void {
    // Stop all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  // Get default voice settings for interview context
  getInterviewVoiceSettings(): VoiceSettings {
    return this.currentVoiceConfig.settings;
  }

  // Clean up audio URLs to prevent memory leaks
  revokeAudioUrl(audioUrl: string): void {
    if (audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
  }

  // Get voice duration estimate (rough calculation)
  estimateSpeechDuration(text: string): number {
    // Rough estimate: 150 words per minute, average 5 characters per word
    const words = text.split(' ').length;
    const minutes = words / 150;
    return Math.ceil(minutes * 60); // Return seconds
  }
}

// Export singleton instance
export const elevenLabsService = new ElevenLabsService();
export default elevenLabsService;
