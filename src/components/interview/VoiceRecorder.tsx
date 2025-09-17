import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { InterviewSystemService } from '../../services/interviewSystem';
import { ttsManager } from '../../services/ttsManager';
import { amazonTranscribeService } from '../../services/amazonTranscribe';
import { microphonePermissionManager } from '../../utils/microphonePermissions';
import { supabase } from '../../services/supabase';

interface VoiceRecorderProps {
  onTranscription: (transcription: { transcript: string; response: string; audioResponse: string; confidence: number }) => void;
  onError: (error: string) => void;
  sessionId: string;
  disabled?: boolean;
  language?: string;
  className?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  onError,
  sessionId,
  disabled = false,
  language = 'en-US',
  className = '',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSTTRunning, setIsSTTRunning] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup function
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
    setIsListening(false);
  };

  // Audio level monitoring
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average audio level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 64, 1); // More sensitive normalization (was 128)
    
    // Only update if there's a significant change to avoid too many re-renders
    if (Math.abs(normalizedLevel - audioLevel) > 0.01) {
      setAudioLevel(normalizedLevel);
    }
    
    // Continue monitoring
    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  };

  // Start audio monitoring
  const startAudioMonitoring = async () => {
    try {
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false, // Disable for better level detection
          noiseSuppression: false, // Disable for better level detection
          autoGainControl: false   // Disable for better level detection
        }
      });
      streamRef.current = stream;
      console.log('✅ Microphone access granted');
      
      console.log('🎤 Setting up audio context...');
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Better settings for audio level detection
      analyserRef.current.fftSize = 512; // Increased for better resolution
      analyserRef.current.smoothingTimeConstant = 0.3; // Less smoothing for more responsive meter
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      microphoneRef.current.connect(analyserRef.current);
      
      console.log('✅ Audio monitoring setup complete');
      setIsListening(true);
      monitorAudioLevel();
    } catch (error: any) {
      console.error('❌ Error starting audio monitoring:', error);
      if (error.name === 'NotAllowedError') {
        console.warn('⚠️ Microphone access denied - audio meter will not work');
        // Don't show error for audio monitoring, just log it
      } else if (error.name === 'NotFoundError') {
        console.warn('⚠️ No microphone found - audio meter will not work');
        // Don't show error for audio monitoring, just log it
      } else {
        console.warn('⚠️ Audio monitoring failed:', error.message);
        // Don't show error for audio monitoring, just log it
      }
    }
  };

  // Stop audio monitoring
  const stopAudioMonitoring = () => {
    cleanup();
  };

  // Initialize audio monitoring on component mount (with error handling)
  useEffect(() => {
    // Start audio monitoring immediately for the meter
    startAudioMonitoring();
    
    return () => {
      cleanup();
    };
  }, []);

  // Process AI response
  const processAIResponse = async (transcript: string, confidence: number) => {
    try {
      console.log('📝 Processing AI response for transcript:', transcript);
      
      // Get the actual candidate and job description IDs from the session
      // We need to fetch the session data to get the correct IDs
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('candidate_id, job_description_id')
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('❌ Error fetching session data:', sessionError);
        onError('Failed to get session information. Please try again.');
        return;
      }

      console.log('📊 Session data:', { 
        candidateId: session.candidate_id, 
        jobDescriptionId: session.job_description_id 
      });

      const result = await InterviewSystemService.sendCandidateResponse(
        sessionId,
        transcript,
        session.candidate_id,
        session.job_description_id
      );

      if (result.error) {
        console.error('❌ Error sending candidate response:', result.error);
        onError(`Failed to send response: ${result.error}`);
        return;
      }

      console.log('✅ AI response received:', result.data);
      
      let aiResponse = '';
      if (result.data && Array.isArray(result.data.aiResponse) && result.data.aiResponse.length > 0) {
        const firstItem = result.data.aiResponse[0];
        aiResponse = (firstItem as any).output || (firstItem as any).response || (firstItem as any).message || (firstItem as any).text || (firstItem as any).content;
      } else if (result.data && typeof result.data.aiResponse === 'object' && result.data.aiResponse !== null) {
        const responseObj = result.data.aiResponse as any;
        aiResponse = responseObj.output || responseObj.response || responseObj.message || responseObj.ai_response || responseObj.text || responseObj.content;
      } else if (result.data && typeof result.data.aiResponse === 'string') {
        aiResponse = result.data.aiResponse;
      }

      if (!aiResponse) {
        console.warn('⚠️ AI Response is empty or null!');
        onError('AI response is empty. Please try again.');
        return;
      }

      console.log('✅ Final AI response:', aiResponse);

      // Generate TTS for AI response
      let audioResponse = '';
      try {
        const voiceConfig = ttsManager.getCurrentVoiceConfig();
        const ttsResponse = await ttsManager.textToSpeech({
          text: aiResponse,
          voiceId: voiceConfig.voiceId,
          voiceSettings: voiceConfig.settings
        });
        audioResponse = ttsResponse.audioUrl;
        
        // Don't auto-play here - let the parent component handle audio playback
        // This prevents audio overlap issues
      } catch (ttsError) {
        console.warn('⚠️ TTS failed:', ttsError);
      }

      onTranscription({
        transcript,
        response: aiResponse,
        audioResponse,
        confidence
      });

    } catch (error: any) {
      console.error('❌ Error processing AI response:', error);
      onError(`Failed to process response: ${error.message}`);
    }
  };

  // Stop current voice recording
  const stopVoiceRecording = () => {
    console.log('🛑 Stopping voice recording...');
    if (isSTTRunning) {
      // Stop Amazon Transcribe if running
      amazonTranscribeService.stopTranscription();
      setIsSTTRunning(false);
      setInterimText('');
    }
    setIsProcessing(false);
  };

  // Handle Amazon Transcribe voice input
  const handleVoiceInput = async () => {
    console.log('🎤 handleVoiceInput called');
    console.log('📊 Current state:', { isProcessing, isSTTRunning, isListening });
    
    if (isProcessing || isSTTRunning) {
      console.log('⚠️ Voice input blocked - already processing or STT running');
      return;
    }

    setIsProcessing(true);
    console.log('✅ Set isProcessing to true');
    
    try {
      console.log('🎤 Starting voice input...');
      
      // Audio monitoring should already be started on component mount
      if (!isListening) {
        console.log('⚠️ Audio monitoring not started, attempting to start...');
        await startAudioMonitoring();
      } else {
        console.log('✅ Audio monitoring is already active');
      }
      
      console.log('🔍 Checking Amazon Transcribe availability...');
      if (!amazonTranscribeService.isAvailable()) {
        console.log('⚠️ Amazon Transcribe not configured, falling back to Web Speech API');
        console.log('📊 Amazon Transcribe status:', {
          isAvailable: amazonTranscribeService.isAvailable(),
          awsAccessKey: !!process.env.REACT_APP_AWS_ACCESS_KEY_ID,
          awsSecretKey: !!process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
          awsRegion: process.env.REACT_APP_AWS_REGION
        });
        await handleWebSpeechInput();
        return;
      } else {
        console.log('✅ Amazon Transcribe is available');
      }

      console.log('🔧 Initializing Amazon Transcribe...');
      const initialized = await amazonTranscribeService.initialize();
      console.log('📊 Amazon Transcribe initialization result:', initialized);
      
      if (!initialized) {
        console.log('⚠️ Failed to initialize Amazon Transcribe, falling back to Web Speech API');
        await handleWebSpeechInput();
        return;
      } else {
        console.log('✅ Amazon Transcribe initialized successfully');
      }

      let hasResult = false;
      let hasStarted = false;
      let hasProcessed = false; // Flag to prevent duplicate processing
      
      console.log('⏰ Setting up 30-second timeout for Amazon Transcribe...');
      // Increased timeout for long speech while maintaining fast partial result processing
      const timeout = setTimeout(() => {
        if (!hasResult) {
          console.log('⏰ Amazon Transcribe timeout after 30 seconds, falling back to Web Speech API');
          console.log('📊 Timeout state:', { hasResult, hasStarted, isSTTRunning });
          amazonTranscribeService.stopTranscription();
          setIsSTTRunning(false);
          setInterimText('');
          
          // Fallback to Web Speech API
          console.log('🔄 Starting Web Speech API fallback...');
          handleWebSpeechInput().catch((fallbackError) => {
            console.error('❌ Web Speech API fallback also failed:', fallbackError);
            console.log('📊 Fallback error details:', {
              name: fallbackError.name,
              message: fallbackError.message,
              stack: fallbackError.stack
            });
            onError('Voice input failed. Please try again or use text input.');
          });
        }
      }, 30000); // 30 second timeout for Amazon Transcribe (increased for long speech)

      console.log('🎤 Starting Amazon Transcribe transcription...');
      await amazonTranscribeService.startTranscription(
        (result) => {
          console.log('🎤 Amazon Transcribe result received:', result);
          console.log('📊 Result details:', { 
            text: result.text, 
            isPartial: result.isPartial, 
            confidence: result.confidence,
            textLength: result.text?.length || 0
          });
          hasStarted = true;
          
          if (result.isPartial) {
            console.log('📝 Processing partial result:', result.text);
            setInterimText(result.text);
          } else if (result.text && result.text.trim() && !hasProcessed) {
            console.log('✅ Processing final result:', result.text);
            console.log('📊 Final result details:', { 
              text: result.text, 
              length: result.text.length, 
              confidence: result.confidence 
            });
            
            hasResult = true;
            hasProcessed = true;
            clearTimeout(timeout);
            amazonTranscribeService.stopTranscription();
            setIsSTTRunning(false);
            setInterimText('');
            
            // For long speech, add a small delay to ensure complete processing
            if (result.text.length > 50) {
              console.log('📝 Long speech detected in Amazon Transcribe, ensuring complete processing...');
              setTimeout(() => {
                console.log('✅ Amazon Transcribe transcription successful (long speech), processing AI response...');
                processAIResponse(result.text, result.confidence);
              }, 1000); // Wait 1 second for long speech
            } else {
              console.log('✅ Amazon Transcribe transcription successful, processing AI response...');
              processAIResponse(result.text, result.confidence);
            }
          } else if (hasProcessed) {
            console.log('⚠️ Amazon Transcribe result already processed, ignoring duplicate');
          } else {
            console.log('⚠️ Empty or invalid result received:', result);
          }
        },
        (error) => {
          console.error('❌ Amazon Transcribe error callback triggered:', error);
          console.log('📊 Error details:', { 
            name: (error as any).name, 
            message: error.message, 
            stack: (error as any).stack 
          });
          clearTimeout(timeout);
          amazonTranscribeService.stopTranscription();
          setIsSTTRunning(false);
          setInterimText('');
          
          // Fallback to Web Speech API
          console.log('🔄 Falling back to Web Speech API due to Amazon Transcribe error');
          handleWebSpeechInput().catch((fallbackError) => {
            console.error('❌ Web Speech API fallback also failed:', fallbackError);
            console.log('📊 Amazon Transcribe error details:', {
              code: error.code,
              message: error.message,
              details: error.details
            });
            console.log('📊 Web Speech API fallback error details:', {
              name: fallbackError.name,
              message: fallbackError.message,
              stack: fallbackError.stack
            });
            onError(`Voice input failed: ${error.message}. Please try again or use text input.`);
          });
        }
      );

      console.log('✅ Amazon Transcribe startTranscription called, setting isSTTRunning to true');
      setIsSTTRunning(true);
      
    } catch (error: any) {
      console.error('❌ Error in voice input:', error);
      onError('Voice input failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback to Web Speech API
  const handleWebSpeechInput = async () => {
    console.log('🔄 handleWebSpeechInput called - Web Speech API fallback');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('❌ Speech recognition not supported in this browser');
      console.log('📊 Browser support check:', {
        webkitSpeechRecognition: 'webkitSpeechRecognition' in window,
        SpeechRecognition: 'SpeechRecognition' in window,
        userAgent: navigator.userAgent
      });
      onError('Speech recognition not supported in this browser');
      return;
    } else {
      console.log('✅ Web Speech API is available in this browser');
      console.log('📊 Browser support details:', {
        webkitSpeechRecognition: 'webkitSpeechRecognition' in window,
        SpeechRecognition: 'SpeechRecognition' in window
      });
    }

    // Audio monitoring should already be started on component mount
    if (!isListening) {
      console.log('⚠️ Audio monitoring not started for Web Speech API, attempting to start...');
      try {
        await startAudioMonitoring();
      } catch (error) {
        console.warn('⚠️ Audio monitoring failed, continuing with speech recognition:', error);
      }
    } else {
      console.log('✅ Audio monitoring is active for Web Speech API');
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    console.log('🔧 Creating SpeechRecognition instance...');
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true; // Allow continuous speech
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1; // Only get the best result
    
    // Optimize for faster response (removed problematic settings)
    // Note: Removed grammar and serviceURI settings that were causing errors
    
    console.log('⚙️ Web Speech API configuration:', {
      continuous: recognition.continuous,
      interimResults: recognition.interimResults,
      lang: recognition.lang
    });

    return new Promise<void>((resolve, reject) => {
      console.log('⏰ Setting up 45-second timeout for Web Speech API...');
      let hasProcessed = false; // Flag to prevent duplicate processing
      const timeout = setTimeout(() => {
        console.log('⏰ Web Speech API timeout after 45 seconds');
        recognition.stop();
        reject(new Error('Speech recognition timeout. Please try speaking again or use text input.'));
      }, 45000); // 45 second timeout for Web Speech API (increased for long speech)

      recognition.onresult = (event: any) => {
        console.log('🎤 Web Speech API onresult triggered');
        console.log('📊 Event details:', { 
          resultsLength: event.results.length,
          resultIndex: event.results.length - 1
        });
        
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        
        console.log('🎤 Web Speech API result:', { 
          text, 
          isFinal: result.isFinal,
          confidence: result[0].confidence,
          textLength: text?.length || 0
        });
        
        if (result.isFinal && text.trim() && !hasProcessed) {
          console.log('✅ Processing final Web Speech API result');
          console.log('📊 Final result details:', { 
            text, 
            length: text.length, 
            confidence: result[0].confidence 
          });
          
          // For long speech, wait longer to ensure we have the complete result
          if (text.length > 50) {
            console.log('📝 Long speech detected, waiting for complete result...');
            const waitTime = text.length > 200 ? 4000 : 2000; // 4s for very long speech, 2s for medium
            console.log(`⏰ Waiting ${waitTime}ms for long speech completion...`);
            setTimeout(() => {
              if (!hasProcessed) {
                hasProcessed = true;
                clearTimeout(timeout);
                recognition.stop();
                console.log('✅ Web Speech API transcription successful (long speech):', text);
                processAIResponse(text, result[0].confidence || 0.8);
                resolve();
              }
            }, waitTime);
          } else {
            hasProcessed = true;
            clearTimeout(timeout);
            recognition.stop();
            console.log('✅ Web Speech API transcription successful:', text);
            processAIResponse(text, result[0].confidence || 0.8);
            resolve();
          }
        } else if (text.trim().length > 0 && !hasProcessed) {
          console.log('📝 Processing partial Web Speech API result - showing interim text only');
          setInterimText(text);
          
          // For single words or short phrases, process immediately for faster response
          if (text.trim().length <= 10) {
            console.log('⚡ Short speech detected, processing immediately:', text);
            hasProcessed = true;
            clearTimeout(timeout);
            recognition.stop();
            processAIResponse(text, 0.6); // Lower confidence for partial results
            resolve();
          } else {
            // For longer speech, wait for final result
            console.log('⏳ Longer speech detected, waiting for final result');
          }
        } else if (hasProcessed) {
          console.log('⚠️ Result already processed, ignoring duplicate');
        } else {
          console.log('⚠️ Web Speech API result too short or empty:', text);
        }
      };

      recognition.onerror = (event: any) => {
        clearTimeout(timeout);
        console.error('❌ Web Speech API error callback triggered:', event.error);
        console.log('📊 Error event details:', {
          error: event.error,
          type: event.type,
          timeStamp: event.timeStamp
        });
        
        if (event.error === 'no-speech') {
          console.log('⚠️ No speech detected error');
          reject(new Error('No speech detected. Please speak clearly into your microphone.'));
        } else if (event.error === 'audio-capture') {
          console.log('⚠️ Audio capture error');
          reject(new Error('Microphone not accessible. Please check your microphone permissions.'));
        } else if (event.error === 'not-allowed') {
          console.log('⚠️ Not allowed error');
          reject(new Error('Microphone access denied. Please allow microphone access.'));
        } else if (event.error === 'aborted') {
          console.log('⚠️ Speech recognition aborted - this is usually normal when stopping');
          // Don't reject for aborted errors - they're usually intentional stops
          if (!hasProcessed) {
            console.log('🔄 Speech was aborted before processing, trying again...');
            // Try to restart recognition after a short delay
            setTimeout(() => {
              if (!hasProcessed) {
                console.log('🔄 Restarting speech recognition after abort...');
                try {
                  recognition.start();
                } catch (restartError) {
                  console.error('❌ Failed to restart recognition:', restartError);
                  reject(new Error('Speech recognition failed to restart. Please try again.'));
                }
              }
            }, 1000);
          }
        } else {
          console.log('⚠️ Other speech recognition error:', event.error);
          reject(new Error(`Speech recognition failed: ${event.error}`));
        }
      };

      recognition.onend = () => {
        clearTimeout(timeout);
        setIsSTTRunning(false);
        setInterimText('');
        console.log('🔚 Web Speech API recognition ended');
      };

      recognition.onstart = () => {
        console.log('🎤 Web Speech API recognition started');
      };

      recognition.onnomatch = () => {
        console.log('⚠️ Web Speech API no match found');
      };

      recognition.onspeechstart = () => {
        console.log('🎤 Web Speech API speech start detected');
        // DISABLED: Don't auto-process during speech start - wait for natural speech end
        // This prevents premature stopping after just a few words
        console.log('⏳ Speech started - waiting for natural speech end instead of auto-processing');
      };

      recognition.onspeechend = () => {
        console.log('🎤 Web Speech API speech end detected');
        console.log('📊 Current interim text length:', interimText.trim().length);
        
        // Wait longer for long speech to ensure complete capture
        const waitTime = interimText.trim().length > 50 ? 3000 : 1000; // 3s for long speech, 1s for short
        console.log(`⏰ Waiting ${waitTime}ms for speech completion...`);
        
        setTimeout(() => {
          if (!hasProcessed && interimText.trim().length > 0) { // Reduced from 10 to 0 - capture any speech
            console.log('⚡ Processing speech after pause:', interimText);
            hasProcessed = true;
            clearTimeout(timeout);
            recognition.stop();
            processAIResponse(interimText, 0.7); // Use interim text with medium confidence
            resolve();
          } else if (!hasProcessed) {
            console.log('⚠️ Speech end detected but no text captured');
            console.log('🔄 Continuing to listen for more speech...');
            // Don't stop recognition - continue listening for more speech
            // The timeout will eventually handle this if no more speech comes
          }
        }, waitTime);
      };

      try {
        console.log('🎤 Starting Web Speech API recognition...');
        recognition.start();
        setIsSTTRunning(true);
        console.log('✅ Web Speech API recognition initiated successfully');
      } catch (error) {
        clearTimeout(timeout);
        console.error('❌ Failed to start Web Speech API:', error);
        console.log('📊 Start error details:', { 
          name: (error as any).name, 
          message: (error as any).message 
        });
        reject(error);
      }
    });
  };

  return (
    <div className={`voice-recorder ${className}`}>
      {/* Audio Level Meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Microphone Level</span>
          <span className="text-xs text-gray-500">
            {isListening ? '🎤 Listening' : '🔇 Not Listening'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ${
              audioLevel > 0.7 ? 'bg-red-500' : 
              audioLevel > 0.4 ? 'bg-yellow-500' : 
              audioLevel > 0.1 ? 'bg-green-500' : 'bg-gray-300'
            }`}
            style={{ width: `${Math.max(audioLevel * 100, 2)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Quiet</span>
          <span>Loud</span>
        </div>
      </div>


      {/* Voice Input Button */}
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={isSTTRunning ? stopVoiceRecording : handleVoiceInput}
          disabled={disabled || isProcessing}
          className={`flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 ${
            isSTTRunning 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-green-500 hover:bg-green-600 hover:scale-105'
          } disabled:bg-gray-400 disabled:cursor-not-allowed text-white shadow-lg`}
          title={isSTTRunning ? "Click to stop recording" : "Click to speak"}
        >
          {isSTTRunning ? (
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              </div>
              <span className="text-xs mt-1">Stop</span>
            </div>
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </button>

        {/* Status Text */}
        {isSTTRunning && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              🎤 <strong>Listening...</strong> Speak clearly into your microphone
            </p>
            <p className="text-xs text-gray-500 mb-2">
              💡 <strong>Tip:</strong> Say anything - single words, phrases, or complete sentences. The system will capture it all!
            </p>
            {interimText && (
              <p className="text-xs text-gray-500 italic">
                "{interimText}"
              </p>
            )}
          </div>
        )}

        {!isSTTRunning && !isProcessing && (
          <p className="text-sm text-gray-600 text-center">
            Click the microphone to start speaking
          </p>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;