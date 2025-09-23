import React, { useState, useEffect } from 'react';
import { Mic, Volume2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface VoiceSystemDebugProps {
  onClose: () => void;
}

const VoiceSystemDebug: React.FC<VoiceSystemDebugProps> = ({ onClose }) => {
  const [tests, setTests] = useState<{
    microphone: 'pending' | 'success' | 'error' | 'not-supported';
    tts: 'pending' | 'success' | 'error' | 'not-supported';
    stt: 'pending' | 'success' | 'error' | 'not-supported';
    permissions: 'pending' | 'success' | 'error' | 'not-supported';
  }>({
    microphone: 'pending',
    tts: 'pending',
    stt: 'pending',
    permissions: 'pending'
  });

  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testMicrophone = async () => {
    addLog('🎤 Testing microphone access...');
    setTests(prev => ({ ...prev, microphone: 'pending' }));

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addLog('❌ getUserMedia not supported');
        setTests(prev => ({ ...prev, microphone: 'not-supported' }));
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      addLog(`✅ Microphone access granted - ${stream.getAudioTracks().length} tracks`);
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
      
      setTests(prev => ({ ...prev, microphone: 'success' }));
    } catch (error) {
      addLog(`❌ Microphone access failed: ${error instanceof Error ? error.message : String(error)}`);
      setTests(prev => ({ ...prev, microphone: 'error' }));
    }
  };

  const testTTS = async () => {
    addLog('🔊 Testing Text-to-Speech...');
    setTests(prev => ({ ...prev, tts: 'pending' }));

    try {
      // Test browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Hello, this is a test of the voice system.');
        utterance.volume = 1.0;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        return new Promise<void>((resolve) => {
          utterance.onend = () => {
            addLog('✅ Browser TTS working');
            setTests(prev => ({ ...prev, tts: 'success' }));
            resolve();
          };
          
          utterance.onerror = (event) => {
            addLog(`❌ Browser TTS failed: ${event.error}`);
            setTests(prev => ({ ...prev, tts: 'error' }));
            resolve();
          };

          speechSynthesis.speak(utterance);
        });
      } else {
        addLog('❌ Speech synthesis not supported');
        setTests(prev => ({ ...prev, tts: 'not-supported' }));
      }
    } catch (error) {
      addLog(`❌ TTS test failed: ${error instanceof Error ? error.message : String(error)}`);
      setTests(prev => ({ ...prev, tts: 'error' }));
    }
  };

  const testSTT = async () => {
    addLog('🎯 Testing Speech-to-Text...');
    setTests(prev => ({ ...prev, stt: 'pending' }));

    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        return new Promise<void>((resolve) => {
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            addLog(`✅ STT working - heard: "${transcript}"`);
            setTests(prev => ({ ...prev, stt: 'success' }));
            resolve();
          };

          recognition.onerror = (event: any) => {
            addLog(`❌ STT failed: ${event.error}`);
            setTests(prev => ({ ...prev, stt: 'error' }));
            resolve();
          };

          recognition.onend = () => {
            if (tests.stt === 'pending') {
              addLog('⚠️ STT ended without result');
              setTests(prev => ({ ...prev, stt: 'error' }));
              resolve();
            }
          };

          recognition.start();
          addLog('🎯 Listening for speech... (say something)');
          
          // Timeout after 5 seconds
          setTimeout(() => {
            if (tests.stt === 'pending') {
              recognition.stop();
              addLog('⏰ STT test timeout');
              setTests(prev => ({ ...prev, stt: 'error' }));
              resolve();
            }
          }, 5000);
        });
      } else {
        addLog('❌ Speech recognition not supported');
        setTests(prev => ({ ...prev, stt: 'not-supported' }));
      }
    } catch (error) {
      addLog(`❌ STT test failed: ${error instanceof Error ? error.message : String(error)}`);
      setTests(prev => ({ ...prev, stt: 'error' }));
    }
  };

  const testPermissions = async () => {
    addLog('🔐 Testing permissions...');
    setTests(prev => ({ ...prev, permissions: 'pending' }));

    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        addLog(`🔐 Microphone permission: ${permission.state}`);
        
        if (permission.state === 'granted') {
          setTests(prev => ({ ...prev, permissions: 'success' }));
        } else if (permission.state === 'denied') {
          setTests(prev => ({ ...prev, permissions: 'error' }));
        } else {
          setTests(prev => ({ ...prev, permissions: 'pending' }));
        }
      } else {
        addLog('⚠️ Permissions API not supported');
        setTests(prev => ({ ...prev, permissions: 'not-supported' }));
      }
    } catch (error) {
      addLog(`❌ Permission test failed: ${error instanceof Error ? error.message : String(error)}`);
      setTests(prev => ({ ...prev, permissions: 'error' }));
    }
  };

  const runAllTests = async () => {
    addLog('🚀 Starting voice system diagnostics...');
    setLogs([]);
    
    await testPermissions();
    await testMicrophone();
    await testTTS();
    await testSTT();
    
    addLog('✅ All tests completed');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'not-supported':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <div className="h-5 w-5 border-2 border-gray-300 rounded-full animate-spin" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Working';
      case 'error':
        return 'Failed';
      case 'not-supported':
        return 'Not Supported';
      default:
        return 'Testing...';
    }
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Voice System Diagnostics</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Test Results */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mic className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Microphone</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(tests.microphone)}
                  <span className="text-sm">{getStatusText(tests.microphone)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Volume2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Text-to-Speech</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(tests.tts)}
                  <span className="text-sm">{getStatusText(tests.tts)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mic className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium">Speech-to-Text</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(tests.stt)}
                  <span className="text-sm">{getStatusText(tests.stt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium">Permissions</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(tests.permissions)}
                  <span className="text-sm">{getStatusText(tests.permissions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div>
            <h3 className="font-medium mb-2">Test Logs</h3>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg h-48 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={runAllTests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Run Tests Again
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSystemDebug;
