import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { microphonePermissionManager, MicrophonePermissionState } from '../../utils/microphonePermissions';

interface MicrophonePermissionPromptProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  showInstructions?: boolean;
  className?: string;
}

const MicrophonePermissionPrompt: React.FC<MicrophonePermissionPromptProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  showInstructions = true,
  className = '',
}) => {
  const [permissionState, setPermissionState] = useState<MicrophonePermissionState>({
    status: 'unknown',
    canRecord: false,
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    setIsChecking(true);
    try {
      const state = await microphonePermissionManager.checkPermissionStatus();
      setPermissionState(state);
    } catch (error) {
      console.error('Error checking microphone permission:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const requestPermission = async () => {
    setIsRequesting(true);
    try {
      const state = await microphonePermissionManager.requestMicrophonePermission();
      setPermissionState(state);
      
      if (state.status === 'granted') {
        onPermissionGranted?.();
      } else {
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusIcon = () => {
    switch (permissionState.status) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'prompt':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <MicOff className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (permissionState.status) {
      case 'granted':
        return 'Microphone access granted';
      case 'denied':
        return 'Microphone access denied';
      case 'prompt':
        return 'Microphone permission required';
      default:
        return 'Checking microphone status...';
    }
  };

  const getStatusColor = () => {
    switch (permissionState.status) {
      case 'granted':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'denied':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'prompt':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Permission Status */}
      <div className={`flex items-center space-x-3 p-4 rounded-lg border ${getStatusColor()}`}>
        {isChecking ? (
          <RefreshCw className="h-5 w-5 text-gray-500 animate-spin" />
        ) : (
          getStatusIcon()
        )}
        <div className="flex-1">
          <p className="font-medium">{getStatusText()}</p>
          {permissionState.error && (
            <p className="text-sm mt-1 opacity-90">{permissionState.error}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {permissionState.status === 'prompt' && (
          <button
            onClick={requestPermission}
            disabled={isRequesting}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRequesting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            <span>{isRequesting ? 'Requesting...' : 'Allow Microphone'}</span>
          </button>
        )}

        {permissionState.status === 'denied' && (
          <button
            onClick={requestPermission}
            disabled={isRequesting}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRequesting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            <span>{isRequesting ? 'Retrying...' : 'Try Again'}</span>
          </button>
        )}

        <button
          onClick={checkPermission}
          disabled={isChecking}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Instructions */}
      {showInstructions && permissionState.status !== 'granted' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to enable microphone access:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {microphonePermissionManager.getPermissionInstructions().map((instruction, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-3 pt-3 border-t border-blue-200">
            <h5 className="font-medium text-blue-900 mb-1">Browser-specific instructions:</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              {microphonePermissionManager.getBrowserInstructions().map((instruction, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Success Message */}
      {permissionState.status === 'granted' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-800 font-medium">Microphone is ready for voice interviews!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MicrophonePermissionPrompt;
