import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { InterviewSystemService } from '../../services/interviewSystem';
import { amazonTranscribeService } from '../../services/amazonTranscribe';

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
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSTTRunning, setIsSTTRunning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interimText, setInterimText] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Start audio monitoring for visual feedback
  const startAudioMonitoring = async () => {
    try {
      console.log('🎤 Starting audio monitoring...');
      
      if (streamRef.current) {
        console.log('✅ Audio stream already exists');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      setIsListening(true);
      console.log('✅ Audio stream obtained');

      // Set up audio analysis for visual feedback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start monitoring audio levels
      const monitorAudioLevel = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(average / 255);
        
        animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
      };
      
      monitorAudioLevel();
      console.log('✅ Audio monitoring started');
      
    } catch (error: any) {
      console.error('❌ Error starting audio monitoring:', error);
      if (error.name === 'NotAllowedError') {
        console.warn('⚠️ Microphone access denied - audio meter will not work');
        // Don't show error for audio monitoring, just log it
      } else if (error.name === 'NotFoundError') {
        console.warn('⚠️ No microphone found - audio meter will not work');
      } else {
        console.error('❌ Unexpected error starting audio monitoring:', error);
      }
    }
  };

  // Stop audio monitoring
  const stopAudioMonitoring = () => {
    console.log('🛑 Stopping audio monitoring...');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    analyserRef.current = null;
    setIsListening(false);
    setAudioLevel(0);
    console.log('✅ Audio monitoring stopped');
  };

  // Process AI response
  const processAIResponse = async (transcript: string, confidence: number) => {
    try {
      console.log('🤖 Processing AI response for transcript:', transcript);
      console.log('📊 Confidence:', confidence);

      // Call the transcription callback
      onTranscription({
        transcript: transcript,
        response: '', // Will be filled by the AI response
        audioResponse: '', // Will be filled by TTS
        confidence: confidence
      });

    } catch (error: any) {
      console.error('❌ Error processing AI response:', error);
      onError(`Failed to process response: ${error.message}`);
    }
  };

  // Handle voice input (Primary method - Audio to n8n workflow)
  const handleVoiceInput = async () => {
    console.log('🎤 handleVoiceInput called - using audio-to-n8n workflow');
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
      
      // Record audio for n8n workflow
      console.log('🎤 Recording audio for n8n workflow...');
      const audioBlob = await recordAudioForWhisper();
      
      if (!audioBlob) {
        console.log('❌ Failed to record audio');
        onError('Failed to record audio. Please check your microphone permissions.');
        return;
      }

      if (audioBlob.size === 0) {
        console.log('❌ Empty audio blob recorded');
        onError('No audio recorded. Please speak louder or check your microphone.');
        return;
      }

      console.log('✅ Audio recorded successfully:', audioBlob.size, 'bytes');

      // Get session data
      const session = await InterviewSystemService.getCurrentSession();
      if (!session) {
        console.error('❌ No active session found');
        onError('No active interview session. Please start an interview first.');
        return;
      }

      console.log('🔤 Sending audio to n8n workflow for STT and AI response (audio-to-n8n workflow)...');
      const result = await InterviewSystemService.sendAudioToN8nWorkflow(
        session.sessionId,
        session.candidate,
        session.jobDescription,
        session.aiAgent,
        audioBlob
      );

      if (result.error) {
        console.error('❌ n8n workflow failed:', result.error);
        console.log('🔄 n8n workflow failed, falling back to Amazon Transcribe...');
        
        // Fallback to Amazon Transcribe
        try {
          await handleAmazonTranscribeInput();
        } catch (fallbackError) {
          console.error('❌ Amazon Transcribe fallback also failed:', fallbackError);
          onError(`Audio processing failed: ${result.error}`);
        }
        return;
      }

      if (result.response && result.response.trim()) {
        console.log('✅ n8n workflow successful:', result.response);
        console.log('📊 Response details:', {
          text: result.response,
          sessionId: result.sessionId
        });
        await processAIResponse(result.response, 0.95); // High confidence for n8n workflow
      } else {
        console.log('⚠️ n8n workflow returned empty response');
        onError('No response received from AI. Please try speaking again.');
      }
      
    } catch (error: any) {
      console.error('❌ Audio-to-n8n workflow failed:', error);
      console.log('🔄 n8n workflow failed, falling back to Amazon Transcribe...');
      
      try {
        await handleAmazonTranscribeInput();
      } catch (fallbackError) {
        console.error('❌ Amazon Transcribe fallback also failed:', fallbackError);
        onError(`Speech recognition failed: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Record audio for Whisper processing
  const recordAudioForWhisper = async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!streamRef.current) {
        console.error('❌ No audio stream available');
        resolve(null);
        return;
      }

      console.log('🎤 Setting up MediaRecorder for Whisper...');
      console.log('📊 Stream tracks:', streamRef.current.getTracks().length);
      console.log('📊 Audio tracks:', streamRef.current.getAudioTracks().length);

      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];

      let selectedType = '';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedType = type;
          break;
        }
      }

      if (!selectedType) {
        console.error('❌ No supported audio format found');
        resolve(null);
        return;
      }

      console.log('✅ Using audio format:', selectedType);

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: selectedType,
        audioBitsPerSecond: 128000 // Higher quality
      });

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 Audio data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('🎤 MediaRecorder started');
      };

      mediaRecorder.onstop = () => {
        console.log('🎤 MediaRecorder stopped');
        const audioBlob = new Blob(audioChunks, { type: selectedType });
        console.log('📊 Total audio chunks:', audioChunks.length);
        console.log('📊 Final blob size:', audioBlob.size, 'bytes');
        console.log('📊 Final blob type:', audioBlob.type);
        resolve(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        resolve(null);
      };

      const recordDuration = Math.max(3000, Math.min(8000, 3000 + (audioLevel * 5000)));
      console.log('⏰ Recording duration:', recordDuration, 'ms');

      try {
        mediaRecorder.start(100); // Collect data every 100ms
        console.log('🎤 Started recording for Whisper...');

        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            console.log('⏰ Stopping recording after timeout');
            mediaRecorder.stop();
          }
        }, recordDuration);
      } catch (error) {
        console.error('❌ Failed to start MediaRecorder:', error);
        resolve(null);
      }
    });
  };

  // Amazon Transcribe fallback function
  const handleAmazonTranscribeInput = async () => {
    console.log('🎤 handleAmazonTranscribeInput called - fallback method');
    
    try {
      console.log('🔍 Checking Amazon Transcribe availability...');
      if (!amazonTranscribeService.isAvailable()) {
        console.log('⚠️ Amazon Transcribe not configured, falling back to Web Speech API');
        await handleWebSpeechInput();
        return;
      }

      console.log('🔧 Initializing Amazon Transcribe...');
      const initialized = await amazonTranscribeService.initialize();
      
      if (!initialized) {
        console.log('⚠️ Failed to initialize Amazon Transcribe, falling back to Web Speech API');
        await handleWebSpeechInput();
        return;
      }

      let hasProcessed = false;
      
      const timeout = setTimeout(() => {
        console.log('⏰ Amazon Transcribe timeout reached');
        amazonTranscribeService.stopTranscription();
        setIsSTTRunning(false);
        setInterimText('');
        
        if (!hasProcessed) {
          console.log('⚠️ No result received within timeout, falling back to Web Speech API');
          handleWebSpeechInput().catch((fallbackError) => {
            console.error('❌ Web Speech API fallback also failed:', fallbackError);
            onError('Voice input timeout. Please try again.');
          });
        }
      }, 30000);

      console.log('🎤 Starting Amazon Transcribe...');
      amazonTranscribeService.startTranscription(
        (result) => {
          if (result.text && result.text.trim() && !hasProcessed) {
            hasProcessed = true;
            clearTimeout(timeout);
            amazonTranscribeService.stopTranscription();
            setIsSTTRunning(false);
            setInterimText('');
            
            console.log('✅ Amazon Transcribe successful:', result.text);
            processAIResponse(result.text, result.confidence);
          }
        },
        (error) => {
          console.error('❌ Amazon Transcribe error:', error);
          clearTimeout(timeout);
          amazonTranscribeService.stopTranscription();
          setIsSTTRunning(false);
          setInterimText('');
          
          console.log('🔄 Falling back to Web Speech API due to Amazon Transcribe error');
          handleWebSpeechInput().catch((fallbackError) => {
            console.error('❌ Web Speech API fallback also failed:', fallbackError);
            onError(`Voice input failed: ${error.message}. Please try again or use text input.`);
          });
        }
      );

      setIsSTTRunning(true);
      
    } catch (error: any) {
      console.error('❌ Error in Amazon Transcribe fallback:', error);
      onError('Voice input failed. Please try again.');
    }
  };

  // Fallback to Web Speech API
  const handleWebSpeechInput = async () => {
    console.log('🔄 handleWebSpeechInput called - Web Speech API fallback');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('❌ Speech recognition not supported in this browser');
      console.log('📊 Browser details:', {
        userAgent: navigator.userAgent
      });
      onError('Speech recognition not supported in this browser');
      return;
    } else {
      console.log('✅ Web Speech API is available in this browser');
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        // Audio monitoring should already be started on component mount
        if (!isListening) {
          console.log('⚠️ Audio monitoring not started for Web Speech API, attempting to start...');
          try {
            startAudioMonitoring();
          } catch (error) {
            console.warn('⚠️ Audio monitoring failed, continuing with speech recognition:', error);
          }
        } else {
          console.log('✅ Audio monitoring is active for Web Speech API');
        }

        let hasProcessed = false;
        
        // Configure recognition settings
        recognition.continuous = true; // Allow continuous speech
        recognition.interimResults = true;
        recognition.lang = language;
        recognition.maxAlternatives = 1; // Only get the best result
        
        // Optimize for faster response (removed problematic settings)
        console.log('🔧 Web Speech API configured with language:', language);

        // Set up timeout for long speech
        const timeout = setTimeout(() => {
          if (!hasProcessed) {
            console.log('⏰ Web Speech API timeout after 45 seconds, stopping recognition');
            recognition.stop();
            setIsSTTRunning(false);
            setInterimText('');
            onError('Speech recognition timeout. Please try again.');
            reject(new Error('Speech recognition timeout'));
          }
        }, 45000); // 45 second timeout for long speech

        recognition.onresult = (event: any) => {
          console.log('📊 Web Speech API result event triggered');
          const result = event.results[event.results.length - 1];
          const text = result[0].transcript;
          
          console.log('📊 Web Speech API result:', {
            text: text,
            isFinal: result.isFinal,
            confidence: result[0].confidence,
            hasProcessed: hasProcessed
          });

          if (result.isFinal && text.trim() && !hasProcessed) {
            hasProcessed = true;
            clearTimeout(timeout);
            recognition.stop();
            console.log('✅ Web Speech API transcription successful:', text);
            processAIResponse(text, result[0].confidence || 0.8);
            resolve();
          } else if (text.trim().length > 0 && !hasProcessed) {
            console.log('📝 Processing partial Web Speech API result - showing interim text only');
            setInterimText(text);
            
            // For single words or short phrases, process immediately for faster response
            if (text.trim().length <= 10) {
              console.log('⚡ Processing short speech immediately:', text);
              hasProcessed = true;
              clearTimeout(timeout);
              recognition.stop();
              processAIResponse(text, 0.6); // Lower confidence for partial results
              resolve();
            } else {
              // For longer speech, wait for final result
              console.log('⏳ Waiting for final result for longer speech...');
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error('❌ Web Speech API error:', event);
          clearTimeout(timeout);
          setIsSTTRunning(false);
          setInterimText('');
          
          if (event.error === 'aborted') {
            console.log('🔄 Speech recognition aborted, restarting...');
            // Don't treat aborted as an error, just restart
            setTimeout(() => {
              try {
                recognition.start();
              } catch (restartError) {
                console.error('❌ Failed to restart recognition:', restartError);
                onError('Speech recognition failed. Please try again.');
                reject(restartError);
              }
            }, 100);
            return;
          }
          
          onError(`Speech recognition error: ${event.error}. Please try again.`);
          reject(new Error(event.error));
        };

        recognition.onend = () => {
          clearTimeout(timeout);
          setIsSTTRunning(false);
          setInterimText('');
          console.log('🔚 Web Speech API recognition ended');
        };

        recognition.onspeechstart = () => {
          console.log('🎤 Web Speech API speech start detected');
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
              // Continue listening for more speech
            }
          }, waitTime);
        };

        recognition.onstart = () => {
          console.log('🎤 Web Speech API recognition started');
          setIsSTTRunning(true);
        };

        // Start recognition
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
          onError('Failed to start speech recognition. Please try again.');
          reject(error);
        }
      } catch (error) {
        console.error('❌ Error setting up Web Speech API:', error);
        onError('Speech recognition not available. Please try again.');
        reject(error);
      }
    });
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    console.log('🛑 Stopping voice recording...');
    setIsSTTRunning(false);
    setInterimText('');
    
    if (amazonTranscribeService.isAvailable()) {
      amazonTranscribeService.stopTranscription();
    }
    
    console.log('✅ Voice recording stopped');
  };

  // Initialize audio monitoring on component mount
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await startAudioMonitoring();
      } catch (error) {
        console.warn('⚠️ Failed to initialize audio monitoring:', error);
      }
    };

    initializeAudio();

    // Cleanup on unmount
    return () => {
      stopAudioMonitoring();
    };
  }, []);

  return (
    <div className={`voice-recorder ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Audio Level Indicator */}
        <div className="w-16 h-16 rounded-full border-4 border-gray-300 flex items-center justify-center relative">
          <div 
            className="absolute inset-0 rounded-full bg-green-500 opacity-0 transition-opacity duration-150"
            style={{ 
              opacity: audioLevel > 0.1 ? Math.min(audioLevel * 2, 1) : 0 
            }}
          />
          {isSTTRunning ? (
            <MicOff className="w-8 h-8 text-red-500" />
          ) : (
            <Mic className="w-8 h-8 text-gray-600" />
          )}
        </div>

        {/* Voice Input Button */}
        <button
          onClick={isSTTRunning ? stopVoiceRecording : handleVoiceInput}
          disabled={disabled || isProcessing}
          className={`
            px-6 py-3 rounded-lg font-medium transition-all duration-200
            ${isSTTRunning 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
            ${disabled || isProcessing 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:shadow-lg'
            }
          `}
        >
          {isProcessing ? (
            'Processing...'
          ) : isSTTRunning ? (
            'Stop Recording'
          ) : (
            'Start Recording'
          )}
        </button>

        {/* Status Text */}
        {interimText && (
          <div className="text-sm text-gray-600 text-center max-w-md">
            <span className="font-medium">Interim:</span> {interimText}
          </div>
        )}

        {/* User Tip */}
        <div className="text-xs text-gray-500 text-center max-w-md">
          Say anything - single words, phrases, or complete sentences. The system will capture it all!
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;