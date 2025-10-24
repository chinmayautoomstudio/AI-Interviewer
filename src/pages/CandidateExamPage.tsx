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
  const [timeRemaining, setTimeRemaining] = useState(30); // minutes
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
          const startedSession = await examService.startExamSession(
            examSession.id,
            undefined, // IP address
            navigator.userAgent
          );
          setSession(startedSession);
        }

        // Load questions
        const examQuestions = await examService.getExamQuestions(examSession.id);
        setQuestions(examQuestions);

        // Calculate time remaining
        if (examSession.started_at) {
          const startTime = new Date(examSession.started_at);
          const now = new Date();
          const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
          const remaining = Math.max(0, examSession.duration_minutes - elapsedMinutes);
          setTimeRemaining(remaining);
        } else {
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
    if (!session || answers.size === 0) return;

    try {
      setAutoSaveStatus('saving');
      
      // Submit all current answers
      for (const [questionId, answer] of Array.from(answers.entries())) {
        await examService.submitAnswer({
          exam_session_id: session.id,
          question_id: questionId,
          answer_text: answer
        });
      }
      
      setAutoSaveStatus('saved');
    } catch (err) {
      console.error('Auto-save error:', err);
      setAutoSaveStatus('error');
    }
  }, [session, answers]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;

    const interval = setInterval(autoSave, 30000); // 30 seconds
    return () => clearInterval(interval);
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
  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });

    // Mark question as answered
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
      setAnsweredQuestions(prev => new Set([...Array.from(prev), questionIndex]));
    }
  };

  // Handle time up
  const handleTimeUp = async () => {
    if (!session) return;
    
    try {
      setIsSubmitting(true);
      await examService.completeExam(session.id);
      navigate(`/exam/results/${session.id}`);
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
      navigate(`/exam/results/${session.id}`);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {session?.job_description?.title || 'Online Exam'}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>•</span>
                <span>{answeredQuestions.size} answered</span>
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Timer */}
            <ExamTimer
              duration_minutes={timeRemaining}
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

            {/* Current question */}
            {currentQuestion && (
              <div>
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
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>

              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <ExamProgressBar
              currentQuestion={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              answeredQuestions={answeredQuestions.size}
              timeRemaining={timeRemaining}
            />

            {/* Question Navigator */}
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
  );
};

export default CandidateExamPage;
