// Amazon Polly with AWS SDK Implementation
// Real AWS Polly integration with SDK

import AWS from 'aws-sdk';
import { browserTTSService, BrowserTTSRequest } from './browserTTS';

export interface PollyTTSRequest {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface PollyTTSResponse {
  audioUrl: string;
  duration: number;
  voice: string;
  language: string;
}

export interface PollyVoice {
  name: string;
  languageCode: string;
  gender: 'Male' | 'Female';
  engine: 'standard' | 'neural';
}

class AmazonPollyWithSDK {
  private defaultVoice: string = 'Kajal'; // Indian English female voice
  private defaultLanguage: string = 'en-IN'; // Indian English
  private polly: AWS.Polly;

  constructor() {
    // Debug logging for AWS credentials
    const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
    const region = process.env.REACT_APP_AWS_REGION || 'us-east-1';
    
    console.log('🔍 AWS Polly Environment Variables Check:');
    console.log('REACT_APP_AWS_ACCESS_KEY_ID:', accessKeyId ? '***CONFIGURED***' : 'NOT SET');
    console.log('REACT_APP_AWS_SECRET_ACCESS_KEY:', secretAccessKey ? '***CONFIGURED***' : 'NOT SET');
    console.log('REACT_APP_AWS_REGION:', region);

    // Initialize AWS Polly
    this.polly = new AWS.Polly({
      accessKeyId,
      secretAccessKey,
      region
    });
    
    console.log('🔧 Amazon Polly with AWS SDK service initialized');
  }

  // Check if service is available
  isAvailable(): boolean {
    return !!(
      process.env.REACT_APP_AWS_ACCESS_KEY_ID &&
      process.env.REACT_APP_AWS_SECRET_ACCESS_KEY &&
      process.env.REACT_APP_AWS_REGION
    );
  }

  // Get available voices
  async getVoices(): Promise<PollyVoice[]> {
    if (!this.isAvailable()) {
      throw new Error('Amazon Polly credentials not configured');
    }

    try {
      // This will be implemented with AWS SDK
      return this.getInterviewVoices();
    } catch (error) {
      console.error('Error fetching Amazon Polly voices:', error);
      throw error;
    }
  }

  // Convert text to speech using AWS Polly
  async textToSpeech(request: PollyTTSRequest): Promise<PollyTTSResponse> {
    if (!this.isAvailable()) {
      console.warn('⚠️ Amazon Polly credentials not configured, using browser TTS fallback');
      // Fallback to browser TTS
      const browserRequest: BrowserTTSRequest = {
        text: request.text,
        voice: request.voice || 'Samantha', // Use female voice
        language: request.language || 'en-US',
        speed: request.speed || 1.0,
        pitch: request.pitch || 1.0,
        volume: request.volume || 1.0
      };

      const browserResponse = await browserTTSService.textToSpeech(browserRequest);
      return {
        audioUrl: browserResponse.audioUrl,
        duration: browserResponse.duration,
        voice: browserResponse.voice,
        language: browserResponse.language
      };
    }

    try {
      const voice = request.voice || this.defaultVoice;
      const language = request.language || this.defaultLanguage;
      
      console.log('🎤 Amazon Polly TTS request:', { voice, language });

      // Use AWS Polly for real TTS with generative engine
      // Note: Kajal voice supports 'neural' and 'generative' engines (not 'standard')
      const engine = voice === 'Kajal' ? 'neural' : 'neural';
      const params = {
        Text: request.text,
        OutputFormat: 'mp3',
        VoiceId: voice,
        Engine: engine, // Use neural engine for Kajal (generative)
        TextType: 'text',
        LanguageCode: 'en-IN' // Indian English
      };

      const result = await this.polly.synthesizeSpeech(params).promise();
      
      // Convert audio buffer to blob URL
      const audioBlob = new Blob([result.AudioStream as Uint8Array], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Estimate duration
      const duration = this.estimateDuration(request.text);

      console.log('✅ Amazon Polly TTS successful:', { voice, language, duration });

      return {
        audioUrl,
        duration,
        voice,
        language
      };

    } catch (error) {
      console.error('❌ Error with Amazon Polly TTS:', error);
      console.warn('⚠️ Falling back to browser TTS');
      
      // Fallback to browser TTS on error
      const browserRequest: BrowserTTSRequest = {
        text: request.text,
        voice: request.voice || 'Samantha',
        language: request.language || 'en-US',
        speed: request.speed || 1.0,
        pitch: request.pitch || 1.0,
        volume: request.volume || 1.0
      };

      const browserResponse = await browserTTSService.textToSpeech(browserRequest);
      return {
        audioUrl: browserResponse.audioUrl,
        duration: browserResponse.duration,
        voice: browserResponse.voice,
        language: browserResponse.language
      };
    }
  }

  // Create SSML for better voice control
  private createSSML(text: string, options: {
    voice: string;
    speed: number;
    pitch: number;
    volume: number;
  }): string {
    const { speed, pitch, volume } = options;
    
    return `<speak>
      <prosody rate="${speed}" pitch="${pitch > 0 ? '+' : ''}${pitch}%" volume="${volume > 0 ? '+' : ''}${volume}dB">
        ${text}
      </prosody>
    </speak>`;
  }

  // Generate mock audio using browser's speech synthesis
  private async generateMockAudio(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Check if speech synthesis is available
        if (!('speechSynthesis' in window)) {
          reject(new Error('Speech synthesis not supported in this browser'));
          return;
        }

        // Create a simple audio data URL for now
        // In a real implementation, this would be replaced with AWS Polly audio
        const mockAudioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
        
        resolve(mockAudioData);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Estimate audio duration based on text length
  private estimateDuration(text: string): number {
    // Rough estimate: 150 words per minute
    const words = text.split(' ').length;
    return (words / 150) * 60; // Convert to seconds
  }

  // Get professional interview voices
  getInterviewVoices(): PollyVoice[] {
    return [
      {
        name: 'Kajal',
        languageCode: 'en-IN',
        gender: 'Female',
        engine: 'neural'
      },
      {
        name: 'Joanna',
        languageCode: 'en-US',
        gender: 'Female',
        engine: 'neural'
      },
      {
        name: 'Amy',
        languageCode: 'en-US',
        gender: 'Female',
        engine: 'neural'
      },
      {
        name: 'Emma',
        languageCode: 'en-US',
        gender: 'Female',
        engine: 'neural'
      },
      {
        name: 'Matthew',
        languageCode: 'en-US',
        gender: 'Male',
        engine: 'neural'
      },
      {
        name: 'Brian',
        languageCode: 'en-US',
        gender: 'Male',
        engine: 'neural'
      },
      {
        name: 'Joey',
        languageCode: 'en-US',
        gender: 'Male',
        engine: 'neural'
      }
    ];
  }

  // Set default voice for interviews
  setInterviewVoice(voiceType: 'professional_male' | 'professional_female' | 'friendly_male' | 'friendly_female'): void {
    const voiceMap = {
      professional_male: 'Matthew',
      professional_female: 'Kajal', // Indian English female voice
      friendly_male: 'Joey',
      friendly_female: 'Amy'
    };
    
    this.defaultVoice = voiceMap[voiceType];
  }

  // Get current voice configuration
  getCurrentVoiceConfig(): { voiceId: string; settings: any } {
    return {
      voiceId: this.defaultVoice,
      settings: {
        engine: 'neural', // Neural engine for Kajal (generative)
        languageCode: this.defaultLanguage
      }
    };
  }
}

// Export singleton instance
export const amazonPollyWithSDK = new AmazonPollyWithSDK();
