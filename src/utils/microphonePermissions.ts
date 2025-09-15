// Microphone Permission Utilities
// Handles browser microphone permissions for voice interview functionality

export interface MicrophonePermissionState {
  status: 'granted' | 'denied' | 'prompt' | 'unknown';
  error?: string;
  canRecord: boolean;
}

export class MicrophonePermissionManager {
  private static instance: MicrophonePermissionManager;
  private permissionState: MicrophonePermissionState = {
    status: 'unknown',
    canRecord: false,
  };

  private constructor() {}

  public static getInstance(): MicrophonePermissionManager {
    if (!MicrophonePermissionManager.instance) {
      MicrophonePermissionManager.instance = new MicrophonePermissionManager();
    }
    return MicrophonePermissionManager.instance;
  }

  // Check if microphone is available
  public async isMicrophoneAvailable(): Promise<boolean> {
    try {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    } catch (error) {
      console.error('Microphone availability check failed:', error);
      return false;
    }
  }

  // Request microphone permission
  public async requestMicrophonePermission(): Promise<MicrophonePermissionState> {
    try {
      // Check if microphone is available
      if (!(await this.isMicrophoneAvailable())) {
        this.permissionState = {
          status: 'denied',
          error: 'Microphone not available in this browser',
          canRecord: false,
        };
        return this.permissionState;
      }

      // Request permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Permission granted
      this.permissionState = {
        status: 'granted',
        canRecord: true,
      };

      // Stop the stream immediately as we only needed it for permission
      stream.getTracks().forEach(track => track.stop());

      return this.permissionState;
    } catch (error: any) {
      console.error('Microphone permission request failed:', error);
      
      let errorMessage = 'Failed to access microphone';
      let status: 'denied' | 'prompt' = 'denied';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
        status = 'denied';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
        status = 'denied';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application. Please close other applications and try again.';
        status = 'denied';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Microphone constraints cannot be satisfied. Please check your microphone settings.';
        status = 'denied';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Microphone access blocked due to security restrictions. Please use HTTPS.';
        status = 'denied';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Microphone access not supported in this browser.';
        status = 'denied';
      }

      this.permissionState = {
        status,
        error: errorMessage,
        canRecord: false,
      };

      return this.permissionState;
    }
  }

  // Check current permission status
  public async checkPermissionStatus(): Promise<MicrophonePermissionState> {
    try {
      if (!(await this.isMicrophoneAvailable())) {
        this.permissionState = {
          status: 'denied',
          error: 'Microphone not available in this browser',
          canRecord: false,
        };
        return this.permissionState;
      }

      // Check if we can query permissions API
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          switch (permission.state) {
            case 'granted':
              this.permissionState = {
                status: 'granted',
                canRecord: true,
              };
              break;
            case 'denied':
              this.permissionState = {
                status: 'denied',
                error: 'Microphone access denied. Please allow microphone access in your browser settings.',
                canRecord: false,
              };
              break;
            case 'prompt':
              this.permissionState = {
                status: 'prompt',
                error: 'Microphone permission required. Please allow microphone access.',
                canRecord: false,
              };
              break;
            default:
              this.permissionState = {
                status: 'unknown',
                canRecord: false,
              };
          }
        } catch (permissionError) {
          // Permissions API not supported, fall back to requesting permission
          return await this.requestMicrophonePermission();
        }
      } else {
        // Permissions API not supported, fall back to requesting permission
        return await this.requestMicrophonePermission();
      }

      return this.permissionState;
    } catch (error) {
      console.error('Permission status check failed:', error);
      this.permissionState = {
        status: 'unknown',
        error: 'Failed to check microphone permission status',
        canRecord: false,
      };
      return this.permissionState;
    }
  }

  // Get current permission state
  public getPermissionState(): MicrophonePermissionState {
    return { ...this.permissionState };
  }

  // Reset permission state
  public resetPermissionState(): void {
    this.permissionState = {
      status: 'unknown',
      canRecord: false,
    };
  }

  // Get user-friendly permission instructions
  public getPermissionInstructions(): string[] {
    const instructions: string[] = [];

    switch (this.permissionState.status) {
      case 'denied':
        instructions.push('Microphone access has been denied.');
        instructions.push('To enable microphone access:');
        instructions.push('1. Click the microphone icon in your browser\'s address bar');
        instructions.push('2. Select "Allow" for microphone access');
        instructions.push('3. Refresh the page and try again');
        break;
      case 'prompt':
        instructions.push('Microphone permission is required for voice interviews.');
        instructions.push('Please click "Allow" when prompted by your browser.');
        break;
      case 'unknown':
        instructions.push('Unable to determine microphone permission status.');
        instructions.push('Please ensure your browser supports microphone access.');
        break;
      case 'granted':
        instructions.push('Microphone access is granted and ready to use.');
        break;
    }

    return instructions;
  }

  // Get browser-specific instructions
  public getBrowserInstructions(): string[] {
    const userAgent = navigator.userAgent.toLowerCase();
    const instructions: string[] = [];

    if (userAgent.includes('chrome')) {
      instructions.push('Chrome: Click the microphone icon in the address bar and select "Allow"');
    } else if (userAgent.includes('firefox')) {
      instructions.push('Firefox: Click the microphone icon in the address bar and select "Allow"');
    } else if (userAgent.includes('safari')) {
      instructions.push('Safari: Go to Safari > Preferences > Websites > Microphone and allow access');
    } else if (userAgent.includes('edge')) {
      instructions.push('Edge: Click the microphone icon in the address bar and select "Allow"');
    } else {
      instructions.push('Please check your browser settings to allow microphone access');
    }

    return instructions;
  }
}

// Export singleton instance
export const microphonePermissionManager = MicrophonePermissionManager.getInstance();

// Utility functions
export const requestMicrophonePermission = async (): Promise<MicrophonePermissionState> => {
  return await microphonePermissionManager.requestMicrophonePermission();
};

export const checkMicrophonePermission = async (): Promise<MicrophonePermissionState> => {
  return await microphonePermissionManager.checkPermissionStatus();
};

export const isMicrophoneAvailable = async (): Promise<boolean> => {
  return await microphonePermissionManager.isMicrophoneAvailable();
};
