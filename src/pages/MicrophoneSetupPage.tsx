import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertTriangle, CheckCircle, Settings, RefreshCw } from 'lucide-react';
import MicrophonePermissionPrompt from '../components/common/MicrophonePermissionPrompt';
import { microphonePermissionManager, MicrophonePermissionState } from '../utils/microphonePermissions';

const MicrophoneSetupPage: React.FC = () => {
  const [permissionState, setPermissionState] = useState<MicrophonePermissionState>({
    status: 'unknown',
    canRecord: false,
  });
  const [isChecking, setIsChecking] = useState(false);
  const [testRecording, setTestRecording] = useState<{
    isRecording: boolean;
    duration: number;
    audioUrl: string | null;
  }>({
    isRecording: false,
    duration: 0,
    audioUrl: null,
  });

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

  const testMicrophone = async () => {
    try {
      if (!permissionState.canRecord) {
        alert('Please grant microphone permission first.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setTestRecording(prev => ({
          ...prev,
          audioUrl,
        }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setTestRecording({
        isRecording: true,
        duration: 0,
        audioUrl: null,
      });

      // Record for 3 seconds
      setTimeout(() => {
        mediaRecorder.stop();
        setTestRecording(prev => ({
          ...prev,
          isRecording: false,
        }));
      }, 3000);

      // Update duration
      const interval = setInterval(() => {
        setTestRecording(prev => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);

      setTimeout(() => {
        clearInterval(interval);
      }, 3000);

    } catch (error) {
      console.error('Error testing microphone:', error);
      alert('Failed to test microphone. Please check your microphone connection.');
    }
  };

  const playTestRecording = () => {
    if (testRecording.audioUrl) {
      const audio = new Audio(testRecording.audioUrl);
      audio.play();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Microphone Setup</h1>
              <p className="text-gray-600">Configure microphone permissions for voice interviews</p>
            </div>
          </div>
        </div>

        {/* Permission Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Permission Status</h2>
            <button
              onClick={checkPermission}
              disabled={isChecking}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <MicrophonePermissionPrompt
            onPermissionGranted={() => checkPermission()}
            onPermissionDenied={() => checkPermission()}
            showInstructions={true}
          />
        </div>

        {/* Microphone Test */}
        {permissionState.canRecord && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Microphone Test</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Test your microphone to ensure it's working properly for voice interviews.
              </p>

              <div className="flex items-center space-x-4">
                <button
                  onClick={testMicrophone}
                  disabled={testRecording.isRecording}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {testRecording.isRecording ? (
                    <Mic className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  <span>
                    {testRecording.isRecording 
                      ? `Recording... ${testRecording.duration}s` 
                      : 'Test Microphone'
                    }
                  </span>
                </button>

                {testRecording.audioUrl && (
                  <button
                    onClick={playTestRecording}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Play Recording</span>
                  </button>
                )}
              </div>

              {testRecording.audioUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="text-green-800 font-medium">Microphone test successful!</p>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Your microphone is working correctly and ready for voice interviews.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Browser Compatibility */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Browser Compatibility</h2>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-gray-700">Chrome 47+ (Recommended)</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-gray-700">Firefox 29+</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-gray-700">Safari 11+</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-gray-700">Edge 12+</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-yellow-800 font-medium">HTTPS Required</p>
                <p className="text-yellow-700 text-sm">
                  Microphone access requires a secure connection (HTTPS). Make sure you're accessing the application over HTTPS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Microphone not working?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check if your microphone is connected and working</li>
                <li>• Ensure no other applications are using the microphone</li>
                <li>• Try refreshing the page and granting permission again</li>
                <li>• Check your browser's microphone settings</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Permission denied?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click the microphone icon in your browser's address bar</li>
                <li>• Select "Allow" for microphone access</li>
                <li>• Refresh the page after granting permission</li>
                <li>• Check if your browser blocks microphone access by default</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Still having issues?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Try using a different browser</li>
                <li>• Check if your microphone drivers are up to date</li>
                <li>• Ensure you're using HTTPS (not HTTP)</li>
                <li>• Contact support if the problem persists</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicrophoneSetupPage;
