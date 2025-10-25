// Candidate Exam Page
// Main exam interface for candidates taking online exams

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ExamTimer, 
  MCQQuestion, 
  TextQuestion, 
  QuestionNavigator, 
  ExamProgressBar,
  ExamInstructions 
} from '../components/exam';
import { 
  ExamSession, 
  ExamQuestion, 
  ExamResponse,
  SubmitAnswerRequest 
} from '../types';
import { examService } from '../services/examService';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  CheckCircle, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';

export const CandidateExamPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  // State management
  const [session, setSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0); // minutes - will be set from session
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Load exam session and questions
  useEffect(() => {
    const loadExam = async () => {
      if (!token) {
        setError('Invalid exam link');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get exam session
        const examSession = await examService.getExamByToken(token);
        if (!examSession) {
          setError('Exam not found or expired');
          setIsLoading(false);
          return;
        }

        // Debug logging
        console.log('🔍 Exam Session Debug Info:', {
          id: examSession.id,
          exam_token: examSession.exam_token,
          status: examSession.status,
          started_at: examSession.started_at,
          completed_at: examSession.completed_at,
          duration_minutes: examSession.duration_minutes,
          total_questions: examSession.total_questions,
          candidate_id: examSession.candidate_id,
          job_description_id: examSession.job_description_id
        });

        if (examSession.status === 'expired') {
          setError('This exam has expired');
          setIsLoading(false);
          return;
        }

        if (examSession.status === 'completed') {
          navigate(`/exam/results/${examSession.id}`);
          return;
        }

        setSession(examSession);

        // Start exam if not already started
        if (examSession.status === 'pending') {
          try {
            const startedSession = await examService.startExamSession(
              examSession.id,
              undefined, // IP address
              navigator.userAgent
            );
            setSession(startedSession);
          } catch (startError) {
            console.warn('Failed to start exam session, continuing with existing session:', startError);
            // Continue with the existing session - it might already be started
          }
        }

        // Load questions
        console.log('🔄 Loading questions for session:', examSession.id);
        const examQuestions = await examService.getExamQuestions(examSession.id);
        console.log('📚 Loaded questions:', examQuestions.length);
        setQuestions(examQuestions);

        // Calculate time remaining
        if (examSession.started_at) {
          const startTime = new Date(examSession.started_at);
          const now = new Date();
          const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
          const remaining = Math.max(0, examSession.duration_minutes - elapsedMinutes);
          console.log('⏰ Time calculation:', {
            duration_minutes: examSession.duration_minutes,
            elapsedMinutes: elapsedMinutes,
            remaining: remaining,
            started_at: examSession.started_at
          });
          setTimeRemaining(remaining);
        } else {
          console.log('⏰ Initial time remaining:', examSession.duration_minutes);
          setTimeRemaining(examSession.duration_minutes);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading exam:', err);
        setError('Failed to load exam. Please try again.');
        setIsLoading(false);
      }
    };

    loadExam();
  }, [token, navigate]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!session || answers.size === 0) {
      console.log('⏭️ Auto-save skipped:', { 
        hasSession: !!session, 
        answersCount: answers.size 
      });
      return;
    }

    try {
      console.log('💾 Starting auto-save:', {
        sessionId: session.id,
        answersCount: answers.size,
        answers: Array.from(answers.entries()).map(([id, answer]) => ({
          questionId: id,
          answer: answer?.substring(0, 50) + '...'
        }))
      });

      setAutoSaveStatus('saving');
      
      // Submit all current answers
      for (const [questionId, answer] of Array.from(answers.entries())) {
        console.log('📤 Submitting answer for question:', questionId);
        await examService.submitAnswer({
          exam_session_id: session.id,
          question_id: questionId,
          answer_text: answer
        });
        console.log('✅ Answer submitted for question:', questionId);
      }
      
      setAutoSaveStatus('saved');
      console.log('✅ Auto-save completed successfully');
    } catch (err) {
      console.error('❌ Auto-save error:', err);
      setAutoSaveStatus('error');
    }
  }, [session, answers]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!session || session.status !== 'in_progress') {
      console.log('⏭️ Auto-save interval skipped:', {
        hasSession: !!session,
        sessionStatus: session?.status
      });
      return;
    }

    console.log('⏰ Setting up auto-save interval for session:', session.id);
    const interval = setInterval(() => {
      console.log('⏰ Auto-save interval triggered');
      autoSave();
    }, 30000); // 30 seconds
    
    return () => {
      console.log('🧹 Clearing auto-save interval');
      clearInterval(interval);
    };
  }, [session, autoSave]);

  // Timer countdown
  useEffect(() => {
    if (!session || session.status !== 'in_progress' || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - (1/60); // Decrease by 1 second (1/60 minute)
        if (newTime <= 0) {
          handleTimeUp();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // Handle answer selection
  const handleAnswerSelect = async (questionId: string, answer: string) => {
    console.log('📝 Answer selected:', {
      questionId,
      answer: answer?.substring(0, 50) + '...',
      currentAnswersCount: answers.size
    });

    setAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      console.log('✅ Answer added to state:', {
        questionId,
        newAnswersCount: newAnswers.size,
        allAnswers: Array.from(newAnswers.entries()).map(([id, ans]) => ({
          questionId: id,
          answer: ans?.substring(0, 50) + '...'
        }))
      });
      return newAnswers;
    });

    // Mark question as answered
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
      setAnsweredQuestions(prev => new Set([...Array.from(prev), questionIndex]));
      console.log('✅ Question marked as answered:', questionIndex + 1);
    }

    // Immediately submit the answer to database
    if (session && session.status === 'in_progress') {
      try {
        console.log('🚀 Immediately submitting answer to database...');
        setAutoSaveStatus('saving');
        
        const response = await examService.submitAnswer({
          exam_session_id: session.id,
          question_id: questionId,
          answer_text: answer
        });
        
        console.log('✅ Answer immediately saved to database:', response.id);
        setAutoSaveStatus('saved');
        
        // Show success feedback briefly
        setTimeout(() => {
          setAutoSaveStatus('saved');
        }, 2000);
        
      } catch (error) {
        console.error('❌ Error immediately saving answer:', error);
        setAutoSaveStatus('error');
        
        // Show error feedback
        alert(`Failed to save answer: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
        
        // Reset status after showing error
        setTimeout(() => {
          setAutoSaveStatus('saved');
        }, 3000);
      }
    } else {
      console.log('⚠️ Cannot save answer immediately - session not in progress:', {
        hasSession: !!session,
        sessionStatus: session?.status
      });
      setAutoSaveStatus('error');
    }
  };

  // Handle time up
  const handleTimeUp = async () => {
    if (!session) return;
    
    try {
      setIsSubmitting(true);
      await examService.completeExam(session.id);
      navigate(`/exam/completion/${session.id}`);
    } catch (err) {
      console.error('Error completing exam:', err);
      setError('Failed to submit exam. Please contact support.');
    }
  };

  // Handle manual submit
  const handleSubmitExam = async () => {
    if (!session) return;

    const confirmed = window.confirm(
      'Are you sure you want to submit your exam? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      await examService.completeExam(session.id);
      navigate(`/exam/completion/${session.id}`);
    } catch (err) {
      console.error('Error submitting exam:', err);
      setError('Failed to submit exam. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle question navigation
  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Instructions modal
  if (showInstructions && session) {
    return (
      <ExamInstructions
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        onStartExam={() => setShowInstructions(false)}
        examDetails={{
          title: session.job_description?.title || 'Technical Assessment',
          duration: session.duration_minutes,
          totalQuestions: session.total_questions,
          questionTypes: ['Multiple Choice', 'Text Questions'],
          passingScore: 60
        }}
      />
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 fixed inset-0 overflow-auto">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {session?.job_description?.title || 'Online Exam'}
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <span>•</span>
                    <span>{answeredQuestions.size} answered</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto-save status */}
              <div className="flex items-center space-x-2 text-sm">
                {autoSaveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-blue-600">Saving...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Saved</span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">Save failed</span>
                  </>
                )}
              </div>
              
              {/* Submit button */}
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Submit Exam</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Main content */}
          <div className="lg:col-span-3 flex flex-col space-y-6">
            {/* Timer */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
                <ExamTimer
                  duration_minutes={Math.floor(timeRemaining)}
                  onTimeUp={handleTimeUp}
                  onWarning={(timeRemaining) => {
                    if (timeRemaining <= 60) {
                      // Show critical warning
                      console.log('Critical: Less than 1 minute remaining');
                    } else if (timeRemaining <= 300) {
                      // Show warning
                      console.log('Warning: Less than 5 minutes remaining');
                    }
                  }}
                  isActive={session?.status === 'in_progress'}
                />
            </div>

            {/* Debug Panel - Remove this in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2">🔍 Debug Info</h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div>Session Status: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{session?.status || 'null'}</span></div>
                  <div>Session ID: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{session?.id || 'null'}</span></div>
                  <div>Questions Count: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{questions.length}</span></div>
                  <div>Current Question Index: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{currentQuestionIndex}</span></div>
                  <div>Interface Disabled: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{session?.status !== 'in_progress' ? 'YES' : 'NO'}</span></div>
                  <div>Auto-save Status: <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{autoSaveStatus}</span></div>
                </div>
              </div>
            )}

            {/* Current question */}
            {questions.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-8 text-center">
                <div className="text-gray-500 mb-4">
                  <div className="text-xl font-semibold mb-2">No Questions Available</div>
                  <p>Loading questions for this exam...</p>
                </div>
                <div className="text-sm text-gray-400">
                  Debug: Questions array length: {questions.length}
                </div>
              </div>
            ) : currentQuestion ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden flex-1">
                {currentQuestion.question_type === 'mcq' ? (
                  <MCQQuestion
                    question={currentQuestion}
                    selectedAnswer={currentAnswer}
                    onAnswerSelect={(answer) => handleAnswerSelect(currentQuestion.id, answer)}
                    disabled={session?.status !== 'in_progress'}
                  />
                ) : (
                  <TextQuestion
                    question={currentQuestion}
                    answer={currentAnswer}
                    onAnswerChange={(answer) => handleAnswerSelect(currentQuestion.id, answer)}
                    disabled={session?.status !== 'in_progress'}
                    maxLength={1000}
                  />
                )}
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-8 text-center">
                <div className="text-gray-500 mb-4">
                  <div className="text-xl font-semibold mb-2">Question Not Found</div>
                  <p>Unable to load the current question.</p>
                </div>
                <div className="text-sm text-gray-400">
                  Debug: Current index: {currentQuestionIndex}, Questions length: {questions.length}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>

              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Progress */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
              <ExamProgressBar
                currentQuestion={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                answeredQuestions={answeredQuestions.size}
                timeRemaining={timeRemaining}
                totalDuration={session?.duration_minutes || 0}
              />
            </div>

            {/* Question Navigator */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
              <QuestionNavigator
                questions={questions}
                currentQuestionIndex={currentQuestionIndex}
                answeredQuestions={answeredQuestions}
                onQuestionSelect={handleQuestionSelect}
                disabled={session?.status !== 'in_progress'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateExamPage;
