import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { InterviewSystemService } from '../../services/interviewSystem';
import { amazonTranscribeService } from '../../services/amazonTranscribe';
import { detectInterviewEnd, shouldAutoEndInterview, shouldShowEndInterviewPopup } from '../../utils/interviewEndDetection';
import InterviewEndPopup from './InterviewEndPopup';

interface VoiceRecorderProps {
  onTranscription: (transcription: { transcript: string; response: string; audioResponse: string; confidence: number }) => void;
  onError: (error: string) => void;
  onEndInterview?: () => void;
  onBackToTest?: () => void;
  sessionId: string;
  disabled?: boolean;
  language?: string;
  className?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  onError,
  onEndInterview,
  onBackToTest,
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
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<Array<{timestamp: string, level: string, message: string}>>([]);
  const [hasProcessedResponse, setHasProcessedResponse] = useState(false);
  const isInitializedRef = useRef(false);
  
  // Interview end detection state
  const [showEndInterviewPopup, setShowEndInterviewPopup] = useState(false);
  const [endInterviewData, setEndInterviewData] = useState<{
    aiMessage: string;
    detectedPhrase?: string;
    confidence: number;
  } | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Debug logging function
  const addDebugLog = (level: 'info' | 'warn' | 'error' | 'success', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, level, message };
    
    setDebugLogs(prev => {
      const newLogs = [...prev, logEntry];
      // Keep only last 50 logs to prevent memory issues
      return newLogs.slice(-50);
    });
    
    // Also log to console for development
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${timestamp}] ${level.toUpperCase()}: ${message}`);
  };

  // Start audio monitoring for visual feedback
  const startAudioMonitoring = async () => {
    try {
      addDebugLog('info', 'Starting audio monitoring...');
      
      if (streamRef.current) {
        addDebugLog('info', 'Audio stream already exists');
        return;
      }

      addDebugLog('info', 'Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      setIsListening(true);
      addDebugLog('success', `Audio stream obtained - ${stream.getAudioTracks().length} audio tracks`);

      // Set up audio analysis for visual feedback
      addDebugLog('info', 'Setting up audio analysis...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      addDebugLog('success', `Audio context created - sample rate: ${audioContext.sampleRate}Hz`);

      // Start monitoring audio levels
      const monitorAudioLevel = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const level = average / 255;
        setAudioLevel(level);
        
        // Log significant audio level changes
        if (level > 0.1 && Math.random() < 0.01) { // Log 1% of high audio levels
          addDebugLog('info', `Audio level: ${(level * 100).toFixed(1)}%`);
        }
        
        animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
      };
      
      monitorAudioLevel();
      addDebugLog('success', 'Audio monitoring started successfully');
      
    } catch (error: any) {
      addDebugLog('error', `Error starting audio monitoring: ${error.message}`);
      if (error.name === 'NotAllowedError') {
        addDebugLog('warn', 'Microphone access denied - audio meter will not work');
        // Don't show error for audio monitoring, just log it
      } else if (error.name === 'NotFoundError') {
        addDebugLog('warn', 'No microphone found - audio meter will not work');
      } else {
        addDebugLog('error', `Unexpected error starting audio monitoring: ${error.name} - ${error.message}`);
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
  const processAIResponse = async (aiResponse: string, confidence: number) => {
    // Prevent duplicate processing
    if (hasProcessedResponse) {
      console.log('⚠️ Response already processed, skipping duplicate call');
      return;
    }

    try {
      console.log('🤖 Processing AI response:', aiResponse);
      console.log('📊 Confidence:', confidence);

      // Mark as processed to prevent duplicates
      setHasProcessedResponse(true);

      // Convert AI response to speech
      let audioResponse = '';
      try {
        console.log('🔊 Converting AI response to speech...');
        const { ttsManager } = await import('../../services/ttsManager');
        const ttsResult = await ttsManager.textToSpeech({
          text: aiResponse,
          provider: 'auto'
        });
        audioResponse = ttsResult.audioUrl;
        console.log('✅ TTS generated:', audioResponse);
      } catch (ttsError) {
        console.warn('⚠️ TTS failed, continuing without audio:', ttsError);
      }

      // Check if the AI response indicates the interview is ending
      const endDetection = detectInterviewEnd(aiResponse);
      if (endDetection.isEnding) {
        console.log('🎯 Interview end detected:', endDetection);
        
        // Store the end interview data
        setEndInterviewData({
          aiMessage: aiResponse,
          detectedPhrase: endDetection.detectedPhrase,
          confidence: endDetection.confidence
        });
        
        // Auto-end if confidence is high enough
        if (shouldAutoEndInterview(endDetection.confidence)) {
          console.log('✅ Auto-ending interview due to high confidence');
          // Calculate wait time based on text length (rough estimate: 150 words per minute)
          const wordCount = aiResponse.split(' ').length;
          const estimatedDurationMs = Math.max((wordCount / 150) * 60 * 1000, 3000); // At least 3 seconds
          const waitTime = Math.min(estimatedDurationMs + 2000, 15000); // Max 15 seconds
          
          console.log(`⏱️ Estimated audio duration: ${Math.round(estimatedDurationMs/1000)}s, waiting ${Math.round(waitTime/1000)}s before ending`);
          
          setTimeout(() => {
            console.log('🔊 Estimated audio finished, ending interview');
            if (onEndInterview) {
              onEndInterview();
            }
          }, waitTime);
        } else if (shouldShowEndInterviewPopup(endDetection.confidence)) {
          console.log('📋 Showing end interview popup');
          setShowEndInterviewPopup(true);
        }
      }

      // Call the transcription callback with AI response and audio
      onTranscription({
        transcript: '', // No transcript needed since this is AI response
        response: aiResponse,
        audioResponse: audioResponse,
        confidence: confidence
      });

    } catch (error: any) {
      console.error('❌ Error processing AI response:', error);
      onError(`Failed to process response: ${error.message}`);
    }
  };

  // Start voice recording (Manual control)
  const startVoiceRecording = async () => {
    addDebugLog('info', 'Starting voice recording - manual control');
    addDebugLog('info', `Current state: processing=${isProcessing}, sttRunning=${isSTTRunning}, listening=${isListening}`);
    
    // Reset response processing flag for new recording
    setHasProcessedResponse(false);
    
    if (isProcessing || isSTTRunning) {
      addDebugLog('warn', 'Recording blocked - already processing or STT running');
      return;
    }

    setIsSTTRunning(true);
    addDebugLog('info', 'Set STT running state to true');
    
    try {
      addDebugLog('info', 'Starting voice recording process...');
      
      // Start audio monitoring when record button is pressed
      if (!isListening) {
        addDebugLog('info', 'Starting audio monitoring for recording...');
        await startAudioMonitoring();
        addDebugLog('success', 'Audio monitoring started');
      } else {
        addDebugLog('info', 'Audio monitoring is already active');
      }

      // Start MediaRecorder for continuous recording
      if (streamRef.current) {
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

        if (selectedType) {
          const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: selectedType,
            audioBitsPerSecond: 128000
          });

          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstart = () => {
            addDebugLog('success', 'MediaRecorder started recording');
          };

          mediaRecorder.onerror = (event) => {
            addDebugLog('error', `MediaRecorder error: ${event}`);
          };

          mediaRecorder.start(100); // Collect data every 100ms
          addDebugLog('success', 'Voice recording started - waiting for user to stop recording');
        } else {
          addDebugLog('error', 'No supported audio format found');
          setIsSTTRunning(false);
          onError('Audio format not supported. Please try a different browser.');
        }
      } else {
        addDebugLog('error', 'No audio stream available');
        setIsSTTRunning(false);
        onError('No audio stream available. Please check your microphone permissions.');
      }
      
    } catch (error: any) {
      addDebugLog('error', `Error starting voice recording: ${error.message}`);
      setIsSTTRunning(false);
      onError('Failed to start recording. Please try again.');
    }
  };

  // Stop voice recording and process audio (Manual control)
  const stopVoiceRecordingAndProcess = async () => {
    addDebugLog('info', 'Stopping voice recording and processing audio');
    
    if (!isSTTRunning) {
      addDebugLog('warn', 'Recording not running, ignoring stop request');
      return;
    }

    setIsSTTRunning(false);
    setIsProcessing(true);
    addDebugLog('info', 'Set STT running to false, processing to true');

    try {
      // Stop MediaRecorder and get audio blob
      addDebugLog('info', 'Stopping MediaRecorder and getting audio...');
      const audioBlob = await new Promise<Blob | null>((resolve) => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
            addDebugLog('success', `Recording stopped: ${audioChunksRef.current.length} chunks, ${blob.size} bytes`);
            resolve(blob);
          };
          mediaRecorderRef.current.stop();
        } else {
          addDebugLog('warn', 'MediaRecorder not running or not available');
          resolve(null);
        }
      });
      
      if (!audioBlob) {
        addDebugLog('error', 'Failed to record audio');
        onError('Failed to record audio. Please check your microphone permissions.');
        return;
      }

      if (audioBlob.size === 0) {
        addDebugLog('error', 'Empty audio blob recorded');
        onError('No audio recorded. Please speak louder or check your microphone.');
        return;
      }

      addDebugLog('success', `Audio recorded successfully: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

      // Get session data
      addDebugLog('info', 'Fetching current session data...');
      const session = await InterviewSystemService.getCurrentSession();
      if (!session) {
        addDebugLog('error', 'No active session found');
        onError('No active interview session. Please start an interview first.');
        return;
      }

      addDebugLog('success', `Session found: ${session.sessionId}, candidate: ${session.candidate.name}, job: ${session.jobDescription.title}`);

      addDebugLog('info', 'Sending audio to n8n workflow for STT and AI response...');
      const result = await InterviewSystemService.sendAudioToN8nWorkflow(
        session.sessionId,
        session.candidate,
        session.jobDescription,
        session.aiAgent,
        audioBlob
      );

      if (result.error) {
        addDebugLog('error', `n8n workflow failed: ${result.error}`);
        
        // If the error is CORS or 404, try using environment webhook URL as fallback
        if (result.error.includes('CORS') || result.error.includes('404')) {
          addDebugLog('info', 'Attempting fallback to environment webhook URL...');
          
          const fallbackResult = await InterviewSystemService.sendAudioToN8nWorkflowWithFallback(
            session.sessionId,
            session.candidate,
            session.jobDescription,
            session.aiAgent,
            audioBlob
          );
          
          if (fallbackResult.response && fallbackResult.response.trim()) {
            addDebugLog('success', `Fallback webhook successful: ${fallbackResult.response.substring(0, 100)}...`);
            await processAIResponse(fallbackResult.response, 0.95);
            return;
          }
        }
        
        addDebugLog('info', 'Falling back to Amazon Transcribe...');
        
        // Fallback to Amazon Transcribe
        try {
          await handleAmazonTranscribeInput();
        } catch (fallbackError) {
          addDebugLog('error', `Amazon Transcribe fallback also failed: ${fallbackError}`);
          onError(`Audio processing failed: ${result.error}`);
        }
        return;
      }

      if (result.response && result.response.trim()) {
        addDebugLog('success', `n8n workflow successful: ${result.response.substring(0, 100)}${result.response.length > 100 ? '...' : ''}`);
        addDebugLog('info', `Response details: sessionId=${result.sessionId}, length=${result.response.length} chars`);
        await processAIResponse(result.response, 0.95); // High confidence for n8n workflow
      } else {
        addDebugLog('warn', 'n8n workflow returned empty response');
        onError('No response received from AI. Please try speaking again.');
      }
      
    } catch (error: any) {
      addDebugLog('error', `Error processing voice input: ${error.message}`);
      onError('Voice input failed. Please try again or use text input.');
    } finally {
      setIsProcessing(false);
      setHasProcessedResponse(false); // Reset for next recording
      
      // Don't stop audio monitoring - keep it active for next recording
      addDebugLog('info', 'Voice input process completed, processing state reset');
    }
  };

  // Record audio for Whisper processing
  const recordAudioForWhisper = async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!streamRef.current) {
        addDebugLog('error', 'No audio stream available for recording');
        resolve(null);
        return;
      }

      addDebugLog('info', 'Setting up MediaRecorder for audio recording...');
      addDebugLog('info', `Stream tracks: ${streamRef.current.getTracks().length}, Audio tracks: ${streamRef.current.getAudioTracks().length}`);

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
        addDebugLog('error', 'No supported audio format found');
        resolve(null);
        return;
      }

      addDebugLog('success', `Using audio format: ${selectedType}`);

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: selectedType,
        audioBitsPerSecond: 128000 // Higher quality
      });

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        addDebugLog('info', `Audio data available: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        addDebugLog('success', 'MediaRecorder started recording');
      };

      mediaRecorder.onstop = () => {
        addDebugLog('info', 'MediaRecorder stopped recording');
        const audioBlob = new Blob(audioChunks, { type: selectedType });
        addDebugLog('success', `Recording complete: ${audioChunks.length} chunks, ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        resolve(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        addDebugLog('error', `MediaRecorder error: ${event}`);
        resolve(null);
      };

      const recordDuration = Math.max(3000, Math.min(8000, 3000 + (audioLevel * 5000)));
      addDebugLog('info', `Recording duration: ${recordDuration}ms (audio level: ${(audioLevel * 100).toFixed(1)}%)`);

      try {
        mediaRecorder.start(100); // Collect data every 100ms
        addDebugLog('success', 'Started recording for n8n workflow...');

        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            addDebugLog('info', 'Stopping recording after timeout');
            mediaRecorder.stop();
          }
        }, recordDuration);
      } catch (error) {
        addDebugLog('error', `Failed to start MediaRecorder: ${error}`);
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

  // Stop voice recording (without processing)
  const stopVoiceRecording = () => {
    addDebugLog('info', 'Stopping voice recording without processing...');
    setIsSTTRunning(false);
    setInterimText('');
    
    // Stop MediaRecorder if running
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    }
    
    if (amazonTranscribeService.isAvailable()) {
      amazonTranscribeService.stopTranscription();
    }
    
    addDebugLog('success', 'Voice recording stopped');
  };

  // Handle interview end popup actions
  const handleEndInterviewConfirm = () => {
    setShowEndInterviewPopup(false);
    if (onEndInterview) {
      onEndInterview();
    }
  };

  const handleEndInterviewCancel = () => {
    setShowEndInterviewPopup(false);
    setEndInterviewData(null);
  };

  // Initialize microphone on mount and cleanup on unmount
  useEffect(() => {
    // Initialize microphone when component mounts
    const initializeMicrophone = async () => {
      if (!isInitializedRef.current) {
        console.log('🎤 Initializing microphone on component mount...');
        try {
          await startAudioMonitoring();
          isInitializedRef.current = true;
        } catch (error) {
          console.error('❌ Failed to initialize microphone:', error);
        }
      }
    };

    initializeMicrophone();

    // Cleanup on unmount
    return () => {
      console.log('🧹 VoiceRecorder cleanup - stopping audio monitoring');
      stopAudioMonitoring();
      isInitializedRef.current = false;
      // Clean up MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return (
    <div className={`voice-recorder ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Audio Level Indicator */}
        <div className="w-16 h-16 rounded-full border-4 border-ai-teal/30 flex items-center justify-center relative">
          <div 
            className="absolute inset-0 rounded-full bg-ai-orange opacity-0 transition-opacity duration-150"
            style={{ 
              opacity: audioLevel > 0.1 ? Math.min(audioLevel * 2, 1) : 0 
            }}
          />
          {isSTTRunning ? (
            <MicOff className="w-8 h-8 text-ai-coral" />
          ) : (
            <Mic className="w-8 h-8 text-ai-teal" />
          )}
        </div>

        {/* Voice Input Button */}
        <button
          onClick={isSTTRunning ? stopVoiceRecordingAndProcess : startVoiceRecording}
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
          <div className="text-sm text-ai-teal text-center max-w-md">
            <span className="font-medium">Interim:</span> {interimText}
          </div>
        )}

        {/* User Tip */}
        <div className="text-xs text-gray-500 text-center max-w-md">
          Click to start recording your response
        </div>

        {/* Debug Toggle */}
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="mt-4 px-3 py-1 text-xs bg-ai-teal/10 hover:bg-ai-teal/20 text-ai-teal rounded transition-colors"
        >
          {debugMode ? 'Hide Debug' : 'Show Debug'}
        </button>

        {/* Debug Panel */}
        {debugMode && (
          <div className="mt-4 w-full max-w-4xl bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-white">Debug Logs</h3>
              <button
                onClick={() => setDebugLogs([])}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {debugLogs.length === 0 ? (
                <div className="text-gray-500">No debug logs yet...</div>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-gray-400 text-xs flex-shrink-0">
                      {log.timestamp}
                    </span>
                    <span className={`text-xs flex-shrink-0 ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warn' ? 'text-yellow-400' :
                      log.level === 'success' ? 'text-green-400' :
                      'text-blue-400'
                    }`}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="text-gray-300 break-words">
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interview End Popup */}
      {endInterviewData && (
        <InterviewEndPopup
          isOpen={showEndInterviewPopup}
          onConfirm={handleEndInterviewConfirm}
          onCancel={handleEndInterviewCancel}
          onBackToTest={onBackToTest}
          aiMessage={endInterviewData.aiMessage}
          detectedPhrase={endInterviewData.detectedPhrase}
          confidence={endInterviewData.confidence}
        />
      )}
    </div>
  );
};

export default VoiceRecorder;