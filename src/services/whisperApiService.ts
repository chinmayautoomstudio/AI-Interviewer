// Whisper API Service - Frontend Integration
// Communicates with Python Whisper Docker service

export interface WhisperApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export interface WhisperTranscriptionRequest {
  audioBlob: Blob;
  language?: string;
  task?: 'transcribe' | 'translate';
  temperature?: number;
  bestOf?: number;
  beamSize?: number;
}

export interface WhisperTranscriptionResponse {
  text: string;
  language: string;
  duration: number;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
  processing_time: number;
}

export interface WhisperHealthResponse {
  status: string;
  model_loaded: boolean;
  model_size: string;
}

class WhisperApiService {
  private config: WhisperApiConfig;
  private isAvailable: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = {
      baseUrl: process.env.REACT_APP_WHISPER_API_URL || 'http://localhost:8000',
      timeout: 30000, // 30 seconds
      retries: 3
    };
    
    this.startHealthCheck();
  }

  // Start periodic health check
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        console.warn('⚠️ Whisper API health check failed:', error);
        this.isAvailable = false;
      }
    }, 30000); // Check every 30 seconds
  }

  // Stop health check
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Check if Whisper API is available
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const health: WhisperHealthResponse = await response.json();
      this.isAvailable = health.status === 'healthy' && health.model_loaded;
      
      console.log('🔍 Whisper API health check:', {
        status: health.status,
        model_loaded: health.model_loaded,
        model_size: health.model_size,
        available: this.isAvailable
      });

      return this.isAvailable;
    } catch (error) {
      console.error('❌ Whisper API health check failed:', error);
      this.isAvailable = false;
      return false;
    }
  }

  // Transcribe audio using Whisper API
  async transcribe(request: WhisperTranscriptionRequest): Promise<WhisperTranscriptionResponse> {
    if (!this.isAvailable) {
      throw new Error('Whisper API is not available');
    }

    const formData = new FormData();
    
    // Create a file from the blob
    const audioFile = new File([request.audioBlob], 'audio.webm', {
      type: request.audioBlob.type || 'audio/webm'
    });
    
    formData.append('file', audioFile);
    formData.append('language', request.language || 'en');
    formData.append('task', request.task || 'transcribe');
    formData.append('temperature', (request.temperature || 0.0).toString());
    formData.append('best_of', (request.bestOf || 5).toString());
    formData.append('beam_size', (request.beamSize || 5).toString());

    console.log('🎤 Sending audio to Whisper API...');
    console.log('📊 Request details:', {
      fileSize: request.audioBlob.size,
      fileType: request.audioBlob.type,
      language: request.language || 'en',
      task: request.task || 'transcribe'
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.baseUrl}/transcribe`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
      }

      const result: WhisperTranscriptionResponse = await response.json();
      
      console.log('✅ Whisper API transcription successful');
      console.log('📊 Result details:', {
        textLength: result.text.length,
        language: result.language,
        duration: result.duration,
        segments: result.segments.length,
        processingTime: result.processing_time
      });

      return result;

    } catch (error: any) {
      console.error('❌ Whisper API transcription failed:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Transcription timeout - audio file too large or server too slow');
      }
      
      throw new Error(`Whisper API error: ${error.message}`);
    }
  }

  // Check if service is available
  async isServiceAvailable(): Promise<boolean> {
    try {
      return await this.checkHealth();
    } catch (error) {
      return false;
    }
  }

  // Get service status
  getStatus(): { available: boolean; config: WhisperApiConfig } {
    return {
      available: this.isAvailable,
      config: this.config
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<WhisperApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Whisper API config updated:', this.config);
  }

  // Cleanup
  destroy(): void {
    this.stopHealthCheck();
  }
}

// Export singleton instance
export const whisperApiService = new WhisperApiService();
export default whisperApiService;
