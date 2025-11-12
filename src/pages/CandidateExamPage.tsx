// Candidate Exam Page
// Main exam interface for candidates taking online exams

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MCQQuestion, 
  TextQuestion, 
  QuestionNavigator, 
  ExamProgressBar,
  ExamInstructions 
} from '../components/exam';
import FullScreenExam from '../components/exam/FullScreenExam';
import { 
  ExamSession, 
  ExamQuestion
} from '../types';
import { examService } from '../services/examService';
import { getClientInfo } from '../utils/ipDetection';
import { SecurityViolation } from '../services/examSecurityService';
import { examSecurityService } from '../services/examSecurityService';
import { getButtonClass, getIconClass } from '../styles/buttonStyles';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Clock,
  User,
  Mail
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
  const [examStarted, setExamStarted] = useState(false); // Track if exam has actually started
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [examStatus, setExamStatus] = useState<'expired' | 'completed' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showSubmittingModal, setShowSubmittingModal] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);

  // Security violation handler
  const handleSecurityViolation = useCallback((violation: SecurityViolation) => {
    // Log violation to server
    if (session) {
      examService.logSecurityViolation(session.id, violation).catch(console.error);
    }

    // Show warning for high severity violations
    if (violation.severity === 'high') {
      alert(`Security violation detected: ${violation.details}\n\nThis violation has been logged. Continued violations may result in exam termination.`);
    }
  }, [session]);

  // Exam start handler
  const handleExamStart = useCallback(async () => {
    setExamStarted(true);
    console.log('🎯 Exam started with full security monitoring');
    
    // Ensure security monitoring is active
    if (!examSecurityService.isSecurityActive()) {
      console.log('⚠️ Security monitoring not active, starting it now...');
      examSecurityService.startMonitoring(handleSecurityViolation, session?.duration_minutes);
    }
  }, [session, handleSecurityViolation]);

  // Exam end handler
  const handleExamEnd = useCallback(() => {
    setExamStarted(false);
    console.log('🏁 Exam ended');
  }, []);

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

  // Handle exam submission and stop security
  const handleExamSubmission = useCallback(async () => {
    try {
      // Save all answers before completing exam
      console.log('💾 Saving all answers before exam completion...');
      await autoSave();
      
      // Stop security monitoring when exam is submitted
      if (examSecurityService.isSecurityActive()) {
        examSecurityService.stopSecurityForExamCompletion();
      }
      
      // Continue with normal exam submission logic
      console.log('📝 Exam submitted - security monitoring stopped');
    } catch (error) {
      console.error('Error stopping security on exam submission:', error);
    }
  }, [autoSave]);

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

        if (examSession.status === 'expired' || examSession.status === 'completed') {
          setExamStatus(examSession.status);
          setIsLoading(false);
          return;
        }

        setSession(examSession);

        // Fetch questions early to determine question types for instructions
        try {
          console.log('🔄 Fetching questions early for instructions...');
          const examQuestions = await examService.getExamQuestions(examSession.id);
          console.log('📚 Loaded questions for instructions:', examQuestions.length);
          
          // Determine question types from fetched questions
          const uniqueTypes = new Set<string>();
          examQuestions.forEach(q => {
            if (q.question_type === 'mcq') {
              uniqueTypes.add('Multiple Choice Questions (MCQs)');
            } else if (q.question_type === 'text') {
              uniqueTypes.add('Text Questions');
            }
          });
          
          const typesArray = Array.from(uniqueTypes);
          setQuestionTypes(typesArray); // Only show actual question types in exam
          console.log('📋 Determined question types:', typesArray);
        } catch (questionError) {
          console.warn('⚠️ Failed to fetch questions early:', questionError);
          setQuestionTypes([]); // Don't show fallback types
        }

        // Skip instructions if exam is already in progress (handles page refresh)
        if (examSession.status === 'in_progress') {
          console.log('✅ Exam already in progress - skipping instructions');
          setShowInstructions(false);
          // Don't set examStarted to true here - let FullScreenExam handle it after security is confirmed active
          // This ensures the security warning modal still shows
        } else {
          setShowInstructions(true);
          setExamStarted(false); // Ensure warning shows for new sessions
        }

        // Start exam if not already started
        if (examSession.status === 'pending') {
          try {
            console.log('🔄 Starting exam session with IP detection...');
            
            // Get client information including IP address
            const clientInfo = await getClientInfo();
            console.log('📊 Client info:', {
              ip: clientInfo.ip,
              userAgent: clientInfo.userAgent.substring(0, 50) + '...',
              detectionMethod: clientInfo.detectionMethod,
              timestamp: clientInfo.timestamp
            });

            const startedSession = await examService.startExamSession(
              examSession.id,
              clientInfo.ip || undefined, // Convert null to undefined
              clientInfo.userAgent
            );
            
            console.log('✅ Exam session started successfully with IP tracking');
            setSession(startedSession);
          } catch (startError) {
            console.warn('Failed to start exam session, continuing with existing session:', startError);
            // Continue with the existing session - it might already be started
          }
        }

        // Load questions
        console.log('🔄 Loading questions for session:', examSession.id);
        let examQuestions = await examService.getExamQuestions(examSession.id);
        console.log('📚 Loaded questions:', examQuestions.length);

        // Ensure stable question order across reloads (persisted per session)
        const orderKey = `exam_question_order_${examSession.id}`;
        const storedOrder = localStorage.getItem(orderKey);
        if (storedOrder) {
          const orderArr: string[] = JSON.parse(storedOrder);
          // Reorder questions to match stored order; append any new ones to the end
          const idToQuestion = new Map(examQuestions.map(q => [q.id, q]));
          const reordered: typeof examQuestions = [];
          orderArr.forEach(id => {
            const q = idToQuestion.get(id);
            if (q) {
              reordered.push(q);
              idToQuestion.delete(id);
            }
          });
          // Add any remaining (new) questions
          reordered.push(...Array.from(idToQuestion.values()));
          examQuestions = reordered;
        } else {
          // First load - store order
          localStorage.setItem(orderKey, JSON.stringify(examQuestions.map(q => q.id)));
        }

        setQuestions(examQuestions);

        // Restore saved progress (answers and current index) from DB and localStorage
        try {
          const existingResponses = await examService.getSessionResponses(examSession.id);
          if (existingResponses && existingResponses.length > 0) {
            const restoredAnswers = new Map<string, string>();
            const restoredAnsweredIdx = new Set<number>();
            existingResponses.forEach(r => {
              if (r.question_id && r.answer_text) {
                restoredAnswers.set(r.question_id, r.answer_text);
                const idx = examQuestions.findIndex(q => q.id === r.question_id);
                if (idx !== -1) restoredAnsweredIdx.add(idx);
              }
            });
            if (restoredAnswers.size > 0) setAnswers(restoredAnswers);
            if (restoredAnsweredIdx.size > 0) setAnsweredQuestions(restoredAnsweredIdx);
          }

          const lsKey = `exam_progress_${examSession.id}`;
          const saved = localStorage.getItem(lsKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (typeof parsed.currentIndex === 'number') {
              setCurrentQuestionIndex(Math.max(0, Math.min(examQuestions.length - 1, parsed.currentIndex)));
            }
            if (parsed.answers && typeof parsed.answers === 'object') {
              const map = new Map<string, string>(Object.entries(parsed.answers));
              if (map.size > 0) setAnswers(map);
            }
          }
        } catch (restoreErr) {
          console.warn('⚠️ Failed to restore progress:', restoreErr);
        }

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
          // Don't start timer yet - wait for exam to actually begin
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

  // Start exam timer when exam actually begins
  const startExamTimer = useCallback(() => {
    if (!examStarted && session) {
      console.log('🎯 Starting exam timer - exam has begun');
      setExamStarted(true);
      
      // If exam was already started, calculate remaining time
      if (session.started_at) {
        const now = new Date();
        const startTime = new Date(session.started_at);
        const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
        const remaining = Math.max(0, session.duration_minutes - elapsedMinutes);
        setTimeRemaining(remaining);
      } else {
        // Fresh start
        setTimeRemaining(session.duration_minutes);
      }
    }
  }, [examStarted, session]);

  // Handle time up
  const handleTimeUp = useCallback(async () => {
    if (!session) return;
    
    try {
      setIsSubmitting(true);
      setShowSubmittingModal(true);
      
      // Stop security monitoring when time is up
      await handleExamSubmission();
      
      await examService.completeExam(session.id);
      navigate(`/exam/mcq-results/${session.id}`);
    } catch (err) {
      console.error('Error completing exam:', err);
      setError('Failed to submit exam. Please contact support.');
      setShowSubmittingModal(false);
    }
  }, [session, navigate, handleExamSubmission]);

  // Timer countdown - only run when exam has started
  useEffect(() => {
    if (!session || session.status !== 'in_progress' || timeRemaining <= 0 || !examStarted) return;

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
  }, [session, timeRemaining, handleTimeUp, examStarted]);

  // Start timer when exam begins - ONLY after user consent is given
  useEffect(() => {
    // Only start timer if:
    // 1. Instructions are closed
    // 2. Questions are loaded
    // 3. Exam hasn't started yet (timer-wise)
    // 4. Security monitoring is active (meaning user gave consent)
    if (!showInstructions && questions.length > 0 && !examStarted) {
      // Check if security is active - this confirms user gave consent
      if (examSecurityService.isSecurityActive()) {
        console.log('✅ Security active - starting exam timer after user consent');
        startExamTimer();
      } else {
        console.log('⏸️ Waiting for user consent before starting exam timer');
      }
    }
  }, [showInstructions, questions.length, examStarted, startExamTimer]);


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

  // Persist progress to localStorage whenever answers or index changes
  useEffect(() => {
    if (!session || questions.length === 0) return;
    const lsKey = `exam_progress_${session.id}`;
    const obj: any = {
      currentIndex: currentQuestionIndex,
      answers: Object.fromEntries(answers.entries()),
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem(lsKey, JSON.stringify(obj));
    } catch {}
  }, [session, currentQuestionIndex, answers, questions.length]);

  // Handle manual submit
  const handleSubmitExam = async () => {
    if (!session) return;

    // Check if all questions are answered
    const unansweredQuestions = questions.length - answers.size;
    if (unansweredQuestions > 0) {
      const confirmed = window.confirm(
        `You have ${unansweredQuestions} unanswered question${unansweredQuestions > 1 ? 's' : ''}. Are you sure you want to submit your exam without answering all questions?`
      );
      
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(
        'Are you sure you want to submit your exam? This action cannot be undone.'
      );
      
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(true);
      setShowSubmittingModal(true);
      
      // Stop security monitoring before submitting exam
      await handleExamSubmission();
      
      await examService.completeExam(session.id);
      navigate(`/exam/mcq-results/${session.id}`);
    } catch (err) {
      console.error('Error submitting exam:', err);
      setError('Failed to submit exam. Please try again.');
      setIsSubmitting(false);
      setShowSubmittingModal(false);
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

  // Exam is over state (expired or completed)
  if (examStatus === 'expired' || examStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Exam is Over</h2>
          <p className="text-lg text-gray-700 mb-6">
            This exam has already been completed or has expired. Please close this window.
          </p>
          <div className="text-sm text-gray-500">
            <p>Thank you for your participation.</p>
          </div>
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
          questionTypes: questionTypes // Only show actual question types
        }}
        candidate={session.candidate}
        jobDescription={session.job_description}
      />
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : '';

  return (
    <FullScreenExam
      onViolation={handleSecurityViolation}
      onExamStart={handleExamStart}
      onExamEnd={handleExamEnd}
      showWarning={!examStarted}
      warningMessage="This exam is monitored for security purposes. Fullscreen mode and security monitoring are required. Please ensure you follow all exam rules and do not attempt to use restricted keys or switch tabs."
      examDurationMinutes={session?.duration_minutes}
    >
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 fixed inset-0 overflow-auto">
      {/* Submitting modal overlay */}
      {showSubmittingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white w-11/12 max-w-md rounded-2xl shadow-2xl p-6 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Submitting your responses…</h3>
            <p className="text-sm text-gray-600">We are saving and analyzing your answers. Please do not refresh or close this window.</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Mobile Header */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs sm:text-sm">E</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                    {session?.job_description?.title || 'Online Exam'}
                  </h1>
                  <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 flex-wrap">
                    <span>Q{currentQuestionIndex + 1}/{questions.length}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{answeredQuestions.size} answered</span>
                    {/* Candidate Information */}
                    {session?.candidate && (
                      <>
                        <span className="hidden md:inline">•</span>
                        <div className="hidden md:flex items-center space-x-1">
                          <User className="w-3 h-3 text-gray-500" />
                          <span className="truncate max-w-[120px]">{session.candidate.name}</span>
                  </div>
                        <span className="hidden lg:inline">•</span>
                        <div className="hidden lg:flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-gray-500" />
                          <span className="truncate max-w-[150px]">{session.candidate.email}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Controls */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Auto-save status - Mobile */}
              <div className="hidden sm:flex items-center space-x-2 text-sm">
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
              
              {/* Auto-save status - Mobile Icon Only */}
              <div className="sm:hidden">
                {autoSaveStatus === 'saving' && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                )}
                {autoSaveStatus === 'saved' && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                {autoSaveStatus === 'error' && (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
              </div>
              
              {/* Submit button */}
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className={`${getButtonClass('submit')} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className={`${getIconClass('submit')} animate-spin`} />
                    <span className="hidden sm:inline">Submitting...</span>
                    <span className="sm:hidden">Submit</span>
                  </>
                ) : (
                  <>
                    <Save className={getIconClass('submit')} />
                    <span className="hidden sm:inline">
                      Submit Exam {answers.size < questions.length ? `(${questions.length - answers.size} unanswered)` : ''}
                    </span>
                    <span className="sm:hidden">
                      Submit {answers.size < questions.length ? `(${questions.length - answers.size})` : ''}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 h-full">
          {/* Main content */}
          <div className="xl:col-span-3 flex flex-col space-y-4 sm:space-y-6">
            {/* Candidate Information Card - Mobile */}
            {session?.candidate && (
              <div className="md:hidden bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200/50 shadow-sm p-3 sm:p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {session.candidate.name}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-600 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{session.candidate.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Timer with Working Progress Bar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200/50 shadow-sm p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-lg sm:text-xl font-bold text-blue-600 font-mono">
                      {Math.floor(timeRemaining)}:{(Math.round((timeRemaining % 1) * 60)).toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:inline">
                      Time Remaining
                    </span>
                  </div>
                  
                  {/* Progress bar - shows elapsed time */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${Math.max(0, Math.min(100, ((session?.duration_minutes || 30) - timeRemaining) / (session?.duration_minutes || 30) * 100))}%` 
                      }}
                />
                  </div>
            </div>

                {/* Warning indicators */}
                {timeRemaining <= 1 && (
                  <div className="flex items-center space-x-1 text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-xs font-semibold">1 min!</span>
                  </div>
                )}
                {timeRemaining <= 5 && timeRemaining > 1 && (
                  <div className="flex items-center space-x-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-xs font-semibold">5 min!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Unanswered Questions Warning */}
            {answers.size < questions.length && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-semibold text-yellow-800">
                      {questions.length - answers.size} Question{questions.length - answers.size > 1 ? 's' : ''} Remaining
                    </h3>
                    <p className="text-xs text-yellow-700 mt-1">
                      You have {questions.length - answers.size} unanswered question{questions.length - answers.size > 1 ? 's' : ''}. 
                      Make sure to answer all questions before submitting your exam.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Panel - COMPLETELY HIDDEN FOR CANDIDATES */}
            {false && process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">🔍 Debug Info</h3>
                <div className="text-xs sm:text-sm text-yellow-700 space-y-1">
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <span>Status: <span className="font-mono bg-yellow-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">{session?.status || 'null'}</span></span>
                    <span>Questions: <span className="font-mono bg-yellow-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">{questions.length}</span></span>
                    <span>Current: <span className="font-mono bg-yellow-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">{currentQuestionIndex}</span></span>
                    <span>Auto-save: <span className="font-mono bg-yellow-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs">{autoSaveStatus}</span></span>
                  </div>
                </div>
              </div>
            )}

            {/* Current question - Mobile Optimized */}
            {questions.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200/50 shadow-sm p-4 sm:p-6 text-center">
                <div className="text-gray-500 mb-4">
                  <div className="text-base sm:text-lg font-semibold mb-2">No Questions Available</div>
                  <p className="text-sm">Loading questions for this exam...</p>
                </div>
              </div>
            ) : currentQuestion ? (
              <div className="space-y-4 pb-24 xl:pb-0">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
                  {/* Question Number Badge */}
                  <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </span>
                    </div>
                  </div>
                  
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
            </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200/50 shadow-sm p-4 sm:p-6 text-center">
                <div className="text-gray-500 mb-4">
                  <div className="text-base sm:text-lg font-semibold mb-2">Question Not Found</div>
                  <p className="text-sm">Unable to load the current question.</p>
                </div>
              </div>
            )}

            {/* Navigation buttons - Mobile Optimized */}
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200/50 shadow-sm p-3 sm:p-4">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg ${currentQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Previous</span>
              </button>

              <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg font-medium">
                Q{currentQuestionIndex + 1}/{questions.length}
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmitExam}
                  disabled={isSubmitting}
                  className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Submit Exam</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Sidebar - Hidden on mobile, visible on xl screens */}
          <div className="hidden xl:block space-y-6">
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

          {/* Mobile Bottom Navigation - Simplified */}
          <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200/50 shadow-lg z-20">
            <div className="px-3 py-2">
              {/* Mobile Progress Bar - Compact */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold">{Math.round((answeredQuestions.size / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(answeredQuestions.size / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Mobile Navigation Controls */}
              <div className="flex items-center justify-between mb-2">
                {/* Previous Button - Larger for mobile */}
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`flex items-center space-x-2 px-5 py-3 rounded-lg text-base font-semibold transition-all duration-200 ${
                    currentQuestionIndex === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Prev</span>
                </button>

                {/* Question Counter */}
                <div className="text-sm text-gray-600 font-medium">
                  Q{currentQuestionIndex + 1}/{questions.length}
                </div>

                {/* Next/Submit Button - Larger for mobile */}
                {currentQuestionIndex === questions.length - 1 ? (
                  <button
                    onClick={handleSubmitExam}
                    disabled={isSubmitting}
                    className={`flex items-center space-x-2 px-5 py-3 rounded-lg text-base font-semibold transition-all duration-200 ${
                      isSubmitting 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Submit Exam</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center space-x-2 px-5 py-3 rounded-lg text-base font-semibold transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Mobile Question Navigator - Compact (scrolls all questions) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>{answeredQuestions.size}/{questions.length}</span>
                </div>
                
                {/* Mobile Question Grid - Compact */}
                <div className="flex space-x-1 overflow-x-auto no-scrollbar max-w-[70%]">
                  {questions.map((_, index) => {
                    const questionIndex = index;
                    const isAnswered = answeredQuestions.has(questionIndex);
                    const isCurrent = questionIndex === currentQuestionIndex;
                    
                    return (
                      <button
                        key={questionIndex}
                        onClick={() => handleQuestionSelect(questionIndex)}
                        className={`w-6 h-6 rounded text-xs font-bold transition-all duration-200 ${
                          isAnswered 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : isCurrent 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {questionIndex + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </FullScreenExam>
  );
};

export default CandidateExamPage;
