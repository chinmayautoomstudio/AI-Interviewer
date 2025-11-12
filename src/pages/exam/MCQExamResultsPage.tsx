// MCQ Exam Results Page
// Shows instant results and question review for MCQ exams

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award, 
  BookOpen, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Target,
  Brain
} from 'lucide-react';
import { examService } from '../../services/examService';
import { ExamResult, ExamResponse, ExamQuestion } from '../../types';
import { FormattedQuestionText } from '../../components/exam/FormattedQuestionText';

interface MCQExamResultsPageProps {}

const MCQExamResultsPage: React.FC<MCQExamResultsPageProps> = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [responses, setResponses] = useState<ExamResponse[]>([]);
  const [allQuestions, setAllQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuestionReview, setShowQuestionReview] = useState(false);
  const [gotoInputValue, setGotoInputValue] = useState<string>('');

  const loadExamResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load exam result and responses first to check exam status
      const [result, responsesData] = await Promise.all([
        examService.getExamResult(sessionId!),
        examService.getSessionResponses(sessionId!)
      ]);

      // Check if exam is completed
      const isCompleted = result?.examSession?.status === 'completed' || result?.examSession?.status === 'expired';
      
      // Always use session.total_questions as the source of truth
      const expectedQuestionCount = result?.examSession?.total_questions;
      
      if (!expectedQuestionCount || expectedQuestionCount <= 0) {
        console.error('❌ Missing or invalid total_questions in exam session:', {
          sessionId: result?.examSession?.id,
          total_questions: result?.examSession?.total_questions
        });
        setError('Invalid exam configuration: total questions not found');
        setLoading(false);
        return;
      }

      // Try to fetch stored questions first (for both completed and in-progress exams)
      let storedQuestions: ExamQuestion[] = [];
      try {
        storedQuestions = await examService.getStoredSessionQuestions(sessionId!);
        console.log('📚 Fetched stored questions:', storedQuestions.length, 'out of', expectedQuestionCount, 'expected');
      } catch (error) {
        console.warn('⚠️ Failed to fetch stored questions (backward compatibility):', error);
      }

      let finalQuestions: ExamQuestion[] = [];
      let questionSource: string = '';

      if (storedQuestions.length > 0) {
        // Use stored questions as source of truth (includes all questions: answered + skipped)
        if (storedQuestions.length === expectedQuestionCount) {
          // Perfect match - use stored questions as-is
          finalQuestions = storedQuestions;
          questionSource = 'stored-complete';
          console.log('✅ Using complete stored questions:', {
            total: finalQuestions.length,
            expected: expectedQuestionCount
          });
        } else if (storedQuestions.length < expectedQuestionCount) {
          // Incomplete stored questions - try to get remaining from getExamQuestions
          console.warn('⚠️ Stored questions incomplete, attempting to fetch remaining:', {
            stored: storedQuestions.length,
            expected: expectedQuestionCount,
            missing: expectedQuestionCount - storedQuestions.length
          });
          
          try {
            // Try to get all questions (should return stored if they exist)
            const allQuestions = await examService.getExamQuestions(sessionId!);
            const storedQuestionIds = new Set(storedQuestions.map(q => q.id));
            
            // Add any missing questions
            const missingQuestions = allQuestions.filter(q => !storedQuestionIds.has(q.id));
            if (missingQuestions.length > 0) {
              console.log('📝 Found', missingQuestions.length, 'additional questions to add');
              finalQuestions = [...storedQuestions, ...missingQuestions].slice(0, expectedQuestionCount);
              questionSource = 'stored-partial-fetched';
            } else {
              // No additional questions found, use what we have
              finalQuestions = storedQuestions;
              questionSource = 'stored-incomplete';
            }
          } catch (error) {
            console.error('❌ Error fetching additional questions:', error);
            // Use what we have
            finalQuestions = storedQuestions;
            questionSource = 'stored-incomplete';
          }
        } else {
          // More stored questions than expected - limit to expected count
          console.warn('⚠️ More stored questions than expected, limiting:', {
            stored: storedQuestions.length,
            expected: expectedQuestionCount
          });
          finalQuestions = storedQuestions.slice(0, expectedQuestionCount);
          questionSource = 'stored-limited';
        }
      } else {
        // Backward compatibility: No stored questions found, fallback to old method
        console.warn('⚠️ No stored questions found - using backward compatibility mode');
        questionSource = 'backward-compat';

        // Extract questions from responses (answered questions only)
        const answeredQuestionIds = new Set<string>();
        const questionsFromResponses: ExamQuestion[] = [];
        responsesData.forEach(r => {
          if (r.question && r.question_id) {
            answeredQuestionIds.add(r.question_id);
            if (!questionsFromResponses.find(q => q.id === r.question_id)) {
              questionsFromResponses.push(r.question);
            }
          }
        });

        if (isCompleted) {
          // For completed exams without stored questions: only show answered questions
          finalQuestions = questionsFromResponses;
          console.warn('⚠️ Completed exam without stored questions - only showing answered questions:', {
            answered: finalQuestions.length,
            expected: expectedQuestionCount,
            skipped: expectedQuestionCount - finalQuestions.length,
            note: 'Skipped questions cannot be shown without stored question list'
          });
        } else {
          // For in-progress exams: fetch questions from service and combine
          try {
            const questionsData = await examService.getExamQuestions(sessionId!);
            const skippedQuestions = questionsData.filter(q => !answeredQuestionIds.has(q.id));
            finalQuestions = [...questionsFromResponses, ...skippedQuestions].slice(0, expectedQuestionCount);
            console.log('🔄 In-progress exam - combined answered and skipped questions:', {
              answered: questionsFromResponses.length,
              skipped: skippedQuestions.length,
              total: finalQuestions.length
            });
          } catch (error) {
            console.error('❌ Error fetching questions for in-progress exam:', error);
            finalQuestions = questionsFromResponses; // Fallback to answered only
          }
        }
      }

      // Ensure we don't exceed expected count
      if (finalQuestions.length > expectedQuestionCount) {
        console.warn('⚠️ Question count exceeds configured total, limiting:', {
          actual: finalQuestions.length,
          expected: expectedQuestionCount
        });
        finalQuestions = finalQuestions.slice(0, expectedQuestionCount);
      }

      // Debug logging
      console.log('🔍 Question Loading Summary:', {
        examStatus: result?.examSession?.status,
        isCompleted,
        questionSource,
        configuredTotal: expectedQuestionCount,
        finalQuestionsCount: finalQuestions.length,
        responsesCount: responsesData.length,
        storedQuestionsCount: storedQuestions.length,
        matchesConfigured: finalQuestions.length === expectedQuestionCount
      });

      setExamResult(result);
      setResponses(responsesData);
      setAllQuestions(finalQuestions);
    } catch (err) {
      console.error('Error loading exam results:', err);
      setError('Failed to load exam results');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadExamResults();
    }
  }, [sessionId, loadExamResults]);

  // Clear goto input value when question index changes externally (e.g., via pagination)
  useEffect(() => {
    setGotoInputValue('');
  }, [currentQuestionIndex]);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-blue-100';
    if (percentage >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreIcon = (percentage: number) => {
    if (percentage >= 80) return <Trophy className="h-8 w-8 text-green-600" />;
    if (percentage >= 60) return <Award className="h-8 w-8 text-blue-600" />;
    if (percentage >= 40) return <Target className="h-8 w-8 text-yellow-600" />;
    return <Brain className="h-8 w-8 text-red-600" />;
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 80) return 'Excellent! Outstanding performance!';
    if (percentage >= 60) return 'Good job! You passed the exam.';
    if (percentage >= 40) return 'Not bad, but there\'s room for improvement.';
    return 'Keep practicing to improve your skills.';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Create a map of question_id -> response for quick lookup
  // Since we build questions from responses first, matching should be straightforward
  const responsesMap = new Map<string, ExamResponse>();
  responses.forEach(r => {
    if (r.question_id) {
      responsesMap.set(r.question_id, r);
    }
    // Also index by question.id from joined data as fallback
    if (r.question?.id) {
      responsesMap.set(r.question.id, r);
    }
  });
  
  // Create a set of answered question IDs for quick lookup
  const answeredQuestionIds = new Set(responses.map(r => r.question_id).filter(Boolean));
  
  // Debug: Log matching info for current question
  if (allQuestions.length > 0 && currentQuestionIndex < allQuestions.length) {
    const debugQuestion = allQuestions[currentQuestionIndex];
    const debugResponse = responsesMap.get(debugQuestion.id);
    const isAnswered = answeredQuestionIds.has(debugQuestion.id);
    console.log('🔍 Current Question Matching Debug:', {
      questionIndex: currentQuestionIndex,
      questionId: debugQuestion.id,
      questionText: debugQuestion.question_text?.substring(0, 50),
      hasResponse: !!debugResponse,
      isAnswered,
      responseQuestionId: debugResponse?.question_id,
      responseAnswer: debugResponse?.answer_text,
      responseIsCorrect: debugResponse?.is_correct,
      allResponseIds: Array.from(responsesMap.keys()),
      answeredQuestionIds: Array.from(answeredQuestionIds)
    });
  }
  
  // Get current question and its response (if answered)
  const currentQuestion = allQuestions[currentQuestionIndex] || null;
  // Simple lookup: question is answered if it's in the responses map
  const currentResponse = currentQuestion ? responsesMap.get(currentQuestion.id) || null : null;
  const isSkipped = currentQuestion && !answeredQuestionIds.has(currentQuestion.id);

  const handleQuestionNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (direction === 'next' && currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const getOptionStyle = (option: string, correctAnswer: string, userAnswer: string) => {
    if (option === correctAnswer) {
      return 'bg-green-100 border-green-500 text-green-800';
    }
    if (option === userAnswer && option !== correctAnswer) {
      return 'bg-red-100 border-red-500 text-red-800';
    }
    return 'bg-gray-50 border-gray-200 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !examResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Failed to load exam results'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Additional safety check for empty questions
  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <BookOpen className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Questions Found</h1>
          <p className="text-gray-600 mb-6">No exam questions were found for this session. The exam may not have been set up properly.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.round(examResult.percentage);
  
  // Debug logging for troubleshooting
  console.log('🔍 Current Exam Data:', {
    examResult,
    responses: responses.length,
    examSession: examResult.examSession,
    totalQuestions: examResult.examSession?.total_questions,
    startedAt: examResult.examSession?.started_at,
    completedAt: examResult.examSession?.completed_at
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {!showQuestionReview ? (
        // Results Overview
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                {getScoreIcon(percentage)}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Exam Completed!
              </h1>
              <p className="text-xl text-gray-600">
                {getScoreMessage(percentage)}
              </p>
            </div>

            {/* Score Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(percentage)} mb-4`}>
                  <span className={`text-3xl font-bold ${getScoreColor(percentage)}`}>
                    {percentage}%
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Your Score
                </h2>
                <p className={`text-lg font-medium ${getScoreColor(percentage)} mb-2`}>
                  {examResult.evaluationStatus === 'passed' ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                </p>
                <p className="text-base text-gray-600 font-semibold">
                  {examResult.totalScore || 0} / {examResult.maxScore || 0} points
                </p>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{examResult.correctAnswers}</div>
                  <div className="text-sm text-green-700">Correct Answers</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">{examResult.wrongAnswers}</div>
                  <div className="text-sm text-red-700">Wrong Answers</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-600">{examResult.skippedQuestions}</div>
                  <div className="text-sm text-gray-700">Skipped</div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">Total Questions</span>
                    </div>
                    <span className="text-blue-900 font-bold">{allQuestions.length || examResult.examSession?.total_questions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <span className="text-purple-800 font-medium">Time Taken</span>
                    </div>
                    <span className="text-purple-900 font-bold">
                      {(() => {
                        if (examResult.examSession?.started_at && examResult.examSession?.completed_at) {
                          const startTime = new Date(examResult.examSession.started_at);
                          const endTime = new Date(examResult.examSession.completed_at);
                          const timeDiffMs = endTime.getTime() - startTime.getTime();
                          const timeDiffMinutes = Math.round(timeDiffMs / (1000 * 60));
                          return formatTime(timeDiffMinutes);
                        }
                        return formatTime(examResult.timeTakenMinutes || 0);
                      })()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Eye className="h-5 w-5 text-indigo-600" />
                      <span className="text-indigo-800 font-medium">Responses Submitted</span>
                    </div>
                    <span className="text-indigo-900 font-bold">{responses.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowQuestionReview(true)}
                className="flex items-center justify-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                <Eye className="h-5 w-5" />
                <span>Review Questions & Answers</span>
              </button>
              
              <button
                onClick={() => {
                  // Show confirmation before closing
                  const confirmed = window.confirm('Are you sure you want to close the exam? This will close the current tab.');
                  
                  if (confirmed) {
                    // Try multiple methods to close the tab/window
                    try {
                      // Method 1: Standard window.close()
                      window.close();
                      
                      // Method 2: If window.close() doesn't work, try to navigate away
                      setTimeout(() => {
                        // Check if window is still open
                        if (!window.closed) {
                          // Try to navigate to a blank page or parent
                          if (window.opener) {
                            window.opener.focus();
                            window.close();
                          } else {
                            // Navigate to about:blank as fallback
                            window.location.href = 'about:blank';
                          }
                        }
                      }, 100);
                    } catch (error) {
                      console.log('Could not close window:', error);
                      // Fallback: Navigate to home page
                      navigate('/');
                    }
                  }
                }}
                className="flex items-center justify-center space-x-2 px-8 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                <span>Close Exam</span>
              </button>
            </div>
            
            {/* Info message about closing */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                Clicking "Close Exam" will close this tab. You can review your answers before closing.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Question Review
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Review Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-3 sm:space-y-0">
              <button
                onClick={() => setShowQuestionReview(false)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Back to Results</span>
              </button>
              
              <div className="text-center order-first sm:order-none">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Question Review</h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Question {currentQuestionIndex + 1} of {allQuestions.length}
                </p>
              </div>
              
              <button
                onClick={() => {
                  const confirmed = window.confirm('Are you sure you want to close the exam? This will close the current tab.');
                  
                  if (confirmed) {
                    try {
                      window.close();
                      setTimeout(() => {
                        if (!window.closed) {
                          if (window.opener) {
                            window.opener.focus();
                            window.close();
                          } else {
                            window.location.href = 'about:blank';
                          }
                        }
                      }, 100);
                    } catch (error) {
                      console.log('Could not close window:', error);
                      navigate('/');
                    }
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 sm:px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm"
              >
                <span>Close Exam</span>
              </button>
            </div>

            {/* Question Card */}
            {currentQuestion && (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    {isSkipped ? (
                      <>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                          <Clock className="h-5 w-5 text-gray-600" />
                        </div>
                        <span className="font-semibold text-gray-600">
                          Skipped
                        </span>
                      </>
                    ) : currentResponse ? (
                      <>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          currentResponse.is_correct ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {currentResponse.is_correct ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <span className={`font-semibold ${
                          currentResponse.is_correct ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {currentResponse.is_correct ? 'Correct' : 'Incorrect'}
                        </span>
                      </>
                    ) : null}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {isSkipped ? (
                      <>Points: 0/{currentQuestion.points || 1}</>
                    ) : currentResponse ? (
                      <>Points: {currentResponse.points_earned}/{currentResponse.question?.points || 0}</>
                    ) : null}
                  </div>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <div className="text-lg font-semibold text-gray-900 mb-4">
                    <FormattedQuestionText text={currentQuestion.question_text} />
                  </div>
                  
                  {/* Options */}
                  <div className="space-y-3">
                    {currentQuestion.mcq_options?.map((option, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${getOptionStyle(
                          option.option,
                          currentQuestion.correct_answer || '',
                          isSkipped ? '' : (currentResponse?.answer_text || '')
                        )}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{option.option}.</span>
                          <span>{option.text}</span>
                          {option.option === currentQuestion.correct_answer && (
                            <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                          )}
                          {!isSkipped && option.option === currentResponse?.answer_text && option.option !== currentQuestion.correct_answer && (
                            <XCircle className="h-5 w-5 text-red-600 ml-auto" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                {currentQuestion.answer_explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                    <p className="text-blue-800">{currentQuestion.answer_explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              <button
                onClick={() => handleQuestionNavigation('prev')}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 px-4 lg:px-6 py-2 lg:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
              >
                <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5" />
                <span>Previous</span>
              </button>
              
              {/* Quick navigation input for large question sets */}
              {allQuestions.length > 10 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs lg:text-sm text-gray-600">Go to:</span>
                  <input
                    type="number"
                    min="1"
                    max={allQuestions.length}
                    value={gotoInputValue || currentQuestionIndex + 1}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      setGotoInputValue(inputValue);
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1 && value <= allQuestions.length) {
                        setCurrentQuestionIndex(value - 1);
                        setGotoInputValue('');
                      } else {
                        setGotoInputValue('');
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-12 lg:w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <span className="text-xs lg:text-sm text-gray-600">of {allQuestions.length}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                {/* Optimized pagination with ellipsis */}
                {(() => {
                  const totalQuestions = allQuestions.length;
                  const currentPage = currentQuestionIndex + 1;
                  const maxVisiblePages = 7; // Show max 7 page numbers
                  
                  // Helper function to get button style for a question
                  const getQuestionButtonStyle = (index: number) => {
                    if (index === currentQuestionIndex) {
                      return 'bg-blue-600 text-white';
                    }
                    const question = allQuestions[index];
                    // Check if question was answered using the answeredQuestionIds set
                    if (!answeredQuestionIds.has(question.id)) {
                      return 'bg-gray-100 text-gray-600 hover:bg-gray-200'; // Skipped
                    }
                    // Question was answered - check if correct or incorrect
                    const response = responsesMap.get(question.id);
                    return response?.is_correct
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-red-100 text-red-600 hover:bg-red-200';
                  };
                  
                  if (totalQuestions <= maxVisiblePages) {
                    // Show all pages if total is small
                    return allQuestions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg font-medium transition-colors text-xs lg:text-sm ${getQuestionButtonStyle(index)}`}
                      >
                        {index + 1}
                      </button>
                    ));
                  }
                  
                  // Smart pagination for large numbers
                  const pages = [];
                  const showEllipsis = totalQuestions > maxVisiblePages;
                  
                  // Always show first page
                  pages.push(
                    <button
                      key={0}
                      onClick={() => setCurrentQuestionIndex(0)}
                      className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg font-medium transition-colors text-xs lg:text-sm ${getQuestionButtonStyle(0)}`}
                    >
                      1
                    </button>
                  );
                  
                  if (showEllipsis && currentPage > 4) {
                    pages.push(
                      <span key="ellipsis1" className="px-2 text-gray-500">...</span>
                    );
                  }
                  
                  // Show pages around current page
                  const startPage = Math.max(1, currentPage - 2);
                  const endPage = Math.min(totalQuestions - 1, currentPage + 2);
                  
                  for (let i = startPage; i <= endPage; i++) {
                    if (i !== 0 && i !== totalQuestions - 1) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentQuestionIndex(i)}
                          className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg font-medium transition-colors text-xs lg:text-sm ${getQuestionButtonStyle(i)}`}
                        >
                          {i + 1}
                        </button>
                      );
                    }
                  }
                  
                  if (showEllipsis && currentPage < totalQuestions - 3) {
                    pages.push(
                      <span key="ellipsis2" className="px-2 text-gray-500">...</span>
                    );
                  }
                  
                  // Always show last page
                  if (totalQuestions > 1) {
                    pages.push(
                      <button
                        key={totalQuestions - 1}
                        onClick={() => setCurrentQuestionIndex(totalQuestions - 1)}
                        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg font-medium transition-colors text-xs lg:text-sm ${getQuestionButtonStyle(totalQuestions - 1)}`}
                      >
                        {totalQuestions}
                      </button>
                    );
                  }
                  
                  return pages;
                })()}
              </div>
              
              <button
                onClick={() => handleQuestionNavigation('next')}
                disabled={currentQuestionIndex === allQuestions.length - 1}
                className="flex items-center space-x-2 px-4 lg:px-6 py-2 lg:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCQExamResultsPage;
