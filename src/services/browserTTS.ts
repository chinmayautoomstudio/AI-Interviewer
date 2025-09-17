// Browser Text-to-Speech Service
// Fallback TTS using browser's built-in speech synthesis

export interface BrowserTTSRequest {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface BrowserTTSResponse {
  audioUrl: string;
  duration: number;
  voice: string;
  language: string;
}

class BrowserTTSService {
  private defaultVoice: string = 'Samantha'; // Female voice like Kajal
  private defaultLanguage: string = 'en-IN'; // Indian English

  constructor() {
    console.log('🔧 Browser TTS service initialized');
  }

  // Check if service is available
  isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }

  // Convert text to speech using browser's speech synthesis
  async textToSpeech(request: BrowserTTSRequest): Promise<BrowserTTSResponse> {
    if (!this.isAvailable()) {
      throw new Error('Browser speech synthesis not supported');
    }

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(request.text);
        
        // Set voice properties
        utterance.rate = request.speed || 1.0;
        utterance.pitch = request.pitch || 1.0;
        utterance.volume = request.volume || 1.0;
        utterance.lang = request.language || this.defaultLanguage;

        // Try to find a suitable voice
        const voices = speechSynthesis.getVoices();
        const selectedVoice = this.selectVoice(voices, request.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        // Calculate duration
        const duration = this.estimateDuration(request.text);

        // Handle completion
        utterance.onend = () => {
          resolve({
            audioUrl: 'browser-tts://completed', // Special URL to indicate browser TTS
            duration,
            voice: utterance.voice?.name || 'Default',
            language: utterance.lang
          });
        };

        utterance.onerror = (event) => {
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        // Start speech synthesis
        speechSynthesis.speak(utterance);

        console.log('🔊 Browser TTS started (Female Voice):', {
          text: request.text.substring(0, 50) + '...',
          voice: utterance.voice?.name || 'Default',
          rate: utterance.rate,
          pitch: utterance.pitch,
          isFemale: utterance.voice?.name?.toLowerCase().includes('samantha') || 
                   utterance.voice?.name?.toLowerCase().includes('susan') ||
                   utterance.voice?.name?.toLowerCase().includes('karen') ||
                   utterance.voice?.name?.toLowerCase().includes('victoria') ||
                   utterance.voice?.name?.toLowerCase().includes('zira') ||
                   utterance.voice?.name?.toLowerCase().includes('hazel')
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Select appropriate voice
  private selectVoice(voices: SpeechSynthesisVoice[], preferredVoice?: string): SpeechSynthesisVoice | null {
    if (!voices.length) return null;

    // If preferred voice is specified, try to find it
    if (preferredVoice) {
      const voice = voices.find(v => 
        v.name.toLowerCase().includes(preferredVoice.toLowerCase()) ||
        v.name.toLowerCase().includes('google') ||
        v.name.toLowerCase().includes('microsoft')
      );
      if (voice) return voice;
    }

    // Prioritize Indian English female voices like Kajal
    const indianEnglishVoices = voices.filter(v => 
      v.lang.startsWith('en-IN') && 
      (v.name.toLowerCase().includes('kajal') ||
       v.name.toLowerCase().includes('indian') ||
       v.name.toLowerCase().includes('india'))
    );

    if (indianEnglishVoices.length > 0) {
      return indianEnglishVoices[0];
    }

    // Fallback to other female voices
    const femaleVoices = voices.filter(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('samantha') ||
       v.name.toLowerCase().includes('susan') ||
       v.name.toLowerCase().includes('karen') ||
       v.name.toLowerCase().includes('victoria') ||
       v.name.toLowerCase().includes('zira') ||
       v.name.toLowerCase().includes('hazel') ||
       v.name.toLowerCase().includes('google uk english female') ||
       v.name.toLowerCase().includes('microsoft zira') ||
       v.name.toLowerCase().includes('microsoft susan'))
    );

    if (femaleVoices.length > 0) {
      return femaleVoices[0];
    }

    // Fallback to any good English voice
    const goodVoices = voices.filter(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('google') || 
       v.name.toLowerCase().includes('microsoft') ||
       v.name.toLowerCase().includes('alex'))
    );

    return goodVoices[0] || voices[0];
  }

  // Estimate audio duration
  private estimateDuration(text: string): number {
    // Rough estimate: 150 words per minute
    const words = text.split(' ').length;
    return (words / 150) * 60;
  }

  // Get available voices
  getVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices();
  }

  // Get available female voices
  getFemaleVoices(): SpeechSynthesisVoice[] {
    const voices = speechSynthesis.getVoices();
    return voices.filter(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('samantha') ||
       v.name.toLowerCase().includes('susan') ||
       v.name.toLowerCase().includes('karen') ||
       v.name.toLowerCase().includes('victoria') ||
       v.name.toLowerCase().includes('zira') ||
       v.name.toLowerCase().includes('hazel') ||
       v.name.toLowerCase().includes('google uk english female') ||
       v.name.toLowerCase().includes('microsoft zira') ||
       v.name.toLowerCase().includes('microsoft susan'))
    );
  }

  // Log available voices for debugging
  logAvailableVoices(): void {
    const voices = speechSynthesis.getVoices();
    const femaleVoices = this.getFemaleVoices();
    
    console.log('🎤 Available Browser TTS Voices:');
    console.log('Total voices:', voices.length);
    console.log('Female voices:', femaleVoices.length);
    
    if (femaleVoices.length > 0) {
      console.log('🎤 Female voices found:');
      femaleVoices.forEach((voice, index) => {
        console.log(`${index + 1}. ${voice.name} (${voice.lang})`);
      });
    } else {
      console.log('⚠️ No female voices found, will use default voice');
    }
  }

  // Stop current speech
  stop(): void {
    speechSynthesis.cancel();
  }

  // Check if currently speaking
  isSpeaking(): boolean {
    return speechSynthesis.speaking;
  }
}

// Export singleton instance
export const browserTTSService = new BrowserTTSService();
