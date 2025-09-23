import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Clock, CheckCircle, AlertCircle, Mic, MicOff, Volume2 } from 'lucide-react';
import { InterviewMessage, InterviewSession } from '../../types';
import { InterviewSystemService } from '../../services/interviewSystem';
import { elevenLabsService, STTResponse } from '../../services/elevenLabs';
import LoadingSpinner from '../ui/LoadingSpinner';
import VoiceRecorder from './VoiceRecorder';
import VoicePlayer from './VoicePlayer';

interface ChatInterfaceProps {
  sessionId: string;
  session: InterviewSession;
  onSessionUpdate: (session: InterviewSession) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, session, onSessionUpdate }) => {
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true); // Default to voice-only
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages when component mounts
  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  // Check voice availability
  useEffect(() => {
    setIsVoiceAvailable(elevenLabsService.isAvailable());
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when session is active
  useEffect(() => {
    if (session.status === 'in_progress' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [session.status]);

  const loadMessages = async () => {
    try {
      const { data, error } = await InterviewSystemService.getInterviewMessages(sessionId);
      if (error) {
        console.error('Error loading messages:', error);
        return;
      }
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText?: string, isVoiceMessage = false) => {
    const textToSend = messageText || newMessage.trim();
    if (!textToSend || isLoading || session.status !== 'in_progress') {
      return;
    }

    if (!isVoiceMessage) {
      setNewMessage('');
    }
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Send message to n8n workflow
      const { data: message, error } = await InterviewSystemService.sendChatMessage({
        sessionId,
        message: textToSend,
        sender: 'candidate'
      });

      if (error) {
        console.error('Error sending message:', error);
        // Add error message to chat
        const errorMessage: InterviewMessage = {
          id: `error-${Date.now()}`,
          interviewSessionId: sessionId,
          messageType: 'error',
          content: 'Failed to send message. Please try again.',
          sender: 'system',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } else if (message) {
        // Add candidate message to chat with voice metadata if applicable
        const candidateMessage: InterviewMessage = {
          ...message,
          voiceMode: isVoiceMessage,
          messageType: isVoiceMessage ? 'voice_input' : 'answer'
        };
        setMessages(prev => [...prev, candidateMessage]);
        
        // Simulate AI typing delay
        setTimeout(() => {
          setIsTyping(false);
          // The AI response will be added when n8n webhook calls back
        }, 1000 + Math.random() * 2000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceTranscription = async (result: { transcript: string; response: string; audioResponse: string; confidence: number }) => {
    if (result.transcript.trim()) {
      // Add the candidate's message to the chat
      const candidateMessage: InterviewMessage = {
        id: `temp-${Date.now()}`,
        interviewSessionId: session.id || '',
        messageType: 'voice_input',
        content: result.transcript,
        sender: 'candidate',
        voiceMode: true,
        audioUrl: undefined,
        audioDuration: 0,
        originalAudioTranscript: result.transcript,
        transcriptionConfidence: result.confidence,
        transcriptionLanguage: 'en',
        voiceMetadata: undefined,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, candidateMessage]);

      // If we have an AI response, add it to the chat
      if (result.response && result.response.trim()) {
        const aiMessage: InterviewMessage = {
          id: `temp-${Date.now() + 1}`,
          interviewSessionId: session.id || '',
          messageType: 'voice_response',
          content: result.response,
          sender: 'ai',
          voiceMode: true,
          audioUrl: result.audioResponse,
          audioDuration: 0,
          originalAudioTranscript: undefined,
          transcriptionConfidence: undefined,
          transcriptionLanguage: undefined,
          voiceMetadata: undefined,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiMessage]);

        // Auto-play the AI's voice response if available
        if (result.audioResponse) {
          try {
            const audio = new Audio(result.audioResponse);
            await audio.play();
          } catch (error) {
            console.error('Error playing AI voice response:', error);
          }
        }
      }
    }
  };

  const handleVoiceError = (error: string) => {
    console.error('Voice error:', error);
    // You could show a toast notification here
  };

  const playAIMessage = async (message: InterviewMessage) => {
    if (message.sender === 'ai' && message.content) {
      try {
        // Generate speech from AI text response
        const voiceConfig = elevenLabsService.getCurrentVoiceConfig();
        const ttsResponse = await elevenLabsService.textToSpeech({
          text: message.content,
          voiceId: voiceConfig.voiceId,
          voiceSettings: voiceConfig.settings
        });
        
        // Play the audio
        const audio = new Audio(ttsResponse.audioUrl);
        await audio.play();
        
        // Clean up the URL after playing
        audio.onended = () => URL.revokeObjectURL(ttsResponse.audioUrl);
      } catch (error) {
        console.error('Error playing AI message:', error);
      }
    }
  };

  const toggleVoiceMode = () => {
    setVoiceMode(!voiceMode);
  };

  const getStatusIcon = () => {
    switch (session.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (session.status) {
      case 'pending':
        return 'Preparing interview...';
      case 'in_progress':
        return 'Interview in progress';
      case 'completed':
        return 'Interview completed';
      case 'failed':
        return 'Interview failed';
      case 'cancelled':
        return 'Interview cancelled';
      default:
        return 'Unknown status';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <Bot className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">AI Interview</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Session: {sessionId}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Waiting for the interview to begin...</p>
            <p className="text-sm mt-2">The AI interviewer will start with the first question.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'candidate' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'candidate'
                    ? 'bg-blue-600 text-white'
                    : message.sender === 'ai'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === 'ai' && (
                    <Bot className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  )}
                  {message.sender === 'candidate' && (
                    <User className="h-4 w-4 mt-0.5 text-blue-200 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Voice Player for AI messages */}
                    {message.sender === 'ai' && isVoiceAvailable && (
                      <div className="mt-2 flex items-center space-x-2">
                        <VoicePlayer
                          text={message.content}
                          autoPlay={false}
                          className="text-xs"
                        />
                        <button
                          onClick={() => playAIMessage(message)}
                          className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                          title="Play AI response"
                        >
                          <Volume2 className="h-3 w-3" />
                          <span>Play</span>
                        </button>
                      </div>
                    )}
                    
                    <p className="text-xs mt-1 opacity-70">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {session.status === 'in_progress' && (
        <div className="border-t border-gray-200 p-4">
          {/* Voice Mode Toggle - Hidden for voice-only interview */}
          {/* Voice mode is always on for voice-only interviews */}

          {/* Voice Recorder */}
          {voiceMode && isVoiceAvailable && (
            <div className="mb-3">
              <VoiceRecorder
                onTranscription={handleVoiceTranscription}
                onError={handleVoiceError}
                sessionId={sessionId}
                disabled={isLoading}
                language="en-US"
                className="flex justify-center"
              />
            </div>
          )}

          {/* Text Input - Hidden for voice-only mode */}
          {!voiceMode && (
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer here..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!newMessage.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      )}

      {/* Completed state */}
      {session.status === 'completed' && (
        <div className="border-t border-gray-200 p-4 bg-green-50">
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-900 mb-1">Interview Completed!</h3>
            <p className="text-sm text-green-700">
              Thank you for completing the interview. Your responses are being analyzed and a detailed report will be generated.
            </p>
          </div>
        </div>
      )}

      {/* Failed state */}
      {session.status === 'failed' && (
        <div className="border-t border-gray-200 p-4 bg-red-50">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <h3 className="font-semibold text-red-900 mb-1">Interview Failed</h3>
            <p className="text-sm text-red-700">
              There was a technical issue with the interview. Please contact support for assistance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
