// Google Cloud Text-to-Speech Service
// Alternative to ElevenLabs for AI HR Saathi

export interface GoogleTTSRequest {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface GoogleTTSResponse {
  audioUrl: string;
  duration: number;
  voice: string;
  language: string;
}

export interface GoogleVoice {
  name: string;
  languageCode: string;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  naturalSampleRateHertz: number;
}

class GoogleCloudTTSService {
  private apiKey: string;
  private baseUrl: string = 'https://texttospeech.googleapis.com/v1';
  private defaultVoice: string = 'en-US-Wavenet-D'; // Professional male voice
  private defaultLanguage: string = 'en-US';

  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_CLOUD_API_KEY || '';
  }

  // Check if service is available
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  // Get available voices
  async getVoices(): Promise<GoogleVoice[]> {
    if (!this.isAvailable()) {
      throw new Error('Google Cloud TTS API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices?key=${this.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching Google Cloud voices:', error);
      throw error;
    }
  }

  // Convert text to speech
  async textToSpeech(request: GoogleTTSRequest): Promise<GoogleTTSResponse> {
    if (!this.isAvailable()) {
      throw new Error('Google Cloud TTS API key not configured');
    }

    try {
      const voice = request.voice || this.defaultVoice;
      const language = request.language || this.defaultLanguage;
      
      const requestBody = {
        input: { text: request.text },
        voice: {
          languageCode: language,
          name: voice,
          ssmlGender: this.getGenderFromVoice(voice)
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: request.speed || 1.0,
          pitch: request.pitch || 0.0,
          volumeGainDb: request.volume || 0.0
        }
      };

      console.log('🎤 Google Cloud TTS request:', requestBody);

      const response = await fetch(`${this.baseUrl}/text:synthesize?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google Cloud TTS error:', errorText);
        throw new Error(`Google Cloud TTS failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Convert base64 audio to blob URL
      const audioBlob = new Blob([
        Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
      ], { type: 'audio/mp3' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Estimate duration (rough calculation)
      const duration = this.estimateDuration(request.text);

      console.log('✅ Google Cloud TTS successful:', { voice, language, duration });

      return {
        audioUrl,
        duration,
        voice,
        language
      };

    } catch (error) {
      console.error('Error with Google Cloud TTS:', error);
      throw error;
    }
  }

  // Get gender from voice name
  private getGenderFromVoice(voiceName: string): 'MALE' | 'FEMALE' | 'NEUTRAL' {
    if (voiceName.includes('Male') || voiceName.includes('-M-')) {
      return 'MALE';
    } else if (voiceName.includes('Female') || voiceName.includes('-F-')) {
      return 'FEMALE';
    }
    return 'NEUTRAL';
  }

  // Estimate audio duration based on text length
  private estimateDuration(text: string): number {
    // Rough estimate: 150 words per minute
    const words = text.split(' ').length;
    return (words / 150) * 60; // Convert to seconds
  }

  // Get professional interview voices
  getInterviewVoices(): GoogleVoice[] {
    return [
      {
        name: 'en-US-Wavenet-D',
        languageCode: 'en-US',
        gender: 'MALE',
        naturalSampleRateHertz: 24000
      },
      {
        name: 'en-US-Wavenet-E',
        languageCode: 'en-US',
        gender: 'FEMALE',
        naturalSampleRateHertz: 24000
      },
      {
        name: 'en-US-Wavenet-F',
        languageCode: 'en-US',
        gender: 'FEMALE',
        naturalSampleRateHertz: 24000
      },
      {
        name: 'en-US-Wavenet-G',
        languageCode: 'en-US',
        gender: 'MALE',
        naturalSampleRateHertz: 24000
      }
    ];
  }

  // Set default voice for interviews
  setInterviewVoice(voiceType: 'professional_male' | 'professional_female' | 'friendly_male' | 'friendly_female'): void {
    const voiceMap = {
      professional_male: 'en-US-Wavenet-D',
      professional_female: 'en-US-Wavenet-E',
      friendly_male: 'en-US-Wavenet-G',
      friendly_female: 'en-US-Wavenet-F'
    };
    
    this.defaultVoice = voiceMap[voiceType];
  }
}

// Export singleton instance
export const googleCloudTTSService = new GoogleCloudTTSService();
