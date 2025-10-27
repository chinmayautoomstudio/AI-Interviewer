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
  Brain,
  TrendingUp
} from 'lucide-react';
import { examService } from '../../services/examService';
import { ExamResult, ExamResponse } from '../../types';

interface MCQExamResultsPageProps {}

const MCQExamResultsPage: React.FC<MCQExamResultsPageProps> = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [responses, setResponses] = useState<ExamResponse[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuestionReview, setShowQuestionReview] = useState(false);

  const loadExamResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load exam result and responses
      const [result, responsesData] = await Promise.all([
        examService.getExamResult(sessionId!),
        examService.getSessionResponses(sessionId!)
      ]);

      console.log('🔍 Exam Result Debug:', {
        result,
        responsesData,
        examSession: result?.examSession,
        totalQuestions: result?.examSession?.total_questions,
        responsesLength: responsesData?.length,
        startedAt: result?.examSession?.started_at,
        completedAt: result?.examSession?.completed_at,
        timeTakenMinutes: result?.timeTakenMinutes
      });

      setExamResult(result);
      setResponses(responsesData);
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

  const handleQuestionNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (direction === 'next' && currentQuestionIndex < responses.length - 1) {
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

  // Additional safety check for empty responses
  if (responses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <BookOpen className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Responses Found</h1>
          <p className="text-gray-600 mb-6">No exam responses were found for this session. The exam may not have been completed properly.</p>
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

  const currentResponse = responses[currentQuestionIndex];
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
                <p className={`text-lg font-medium ${getScoreColor(percentage)}`}>
                  {examResult.evaluationStatus === 'passed' ? 'PASSED' : 'NEEDS IMPROVEMENT'}
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
                    <span className="text-blue-900 font-bold">{responses.length || examResult.examSession?.total_questions || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <span className="text-purple-800 font-medium">Time Taken</span>
                    </div>
                    <span className="text-purple-900 font-bold">
                      {(() => {
                        // Calculate time taken from session data
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
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">Technical Score</span>
                    </div>
                    <span className="text-green-900 font-bold">
                      {examResult.technicalScore || examResult.correctAnswers || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Brain className="h-5 w-5 text-orange-600" />
                      <span className="text-orange-800 font-medium">Aptitude Score</span>
                    </div>
                    <span className="text-orange-900 font-bold">
                      {examResult.aptitudeScore || Math.round((examResult.correctAnswers / (examResult.correctAnswers + examResult.wrongAnswers)) * 100) || 0}
                    </span>
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
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowQuestionReview(false)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Back to Results</span>
              </button>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Question Review</h2>
                <p className="text-gray-600">
                  Question {currentQuestionIndex + 1} of {responses.length}
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
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <span>Close Exam</span>
              </button>
            </div>

            {/* Question Card */}
            {currentResponse && (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
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
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Points: {currentResponse.points_earned}/{currentResponse.question?.points || 0}
                  </div>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {currentResponse.question?.question_text}
                  </h3>
                  
                  {/* Options */}
                  <div className="space-y-3">
                    {currentResponse.question?.mcq_options?.map((option, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${getOptionStyle(
                          option.option,
                          currentResponse.question?.correct_answer || '',
                          currentResponse.answer_text || ''
                        )}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{option.option}.</span>
                          <span>{option.text}</span>
                          {option.option === currentResponse.question?.correct_answer && (
                            <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                          )}
                          {option.option === currentResponse.answer_text && option.option !== currentResponse.question?.correct_answer && (
                            <XCircle className="h-5 w-5 text-red-600 ml-auto" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                {currentResponse.question?.answer_explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                    <p className="text-blue-800">{currentResponse.question.answer_explanation}</p>
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
              {responses.length > 10 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs lg:text-sm text-gray-600">Go to:</span>
                  <input
                    type="number"
                    min="1"
                    max={responses.length}
                    value={currentQuestionIndex + 1}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 1 && value <= responses.length) {
                        setCurrentQuestionIndex(value - 1);
                      }
                    }}
                    className="w-12 lg:w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <span className="text-xs lg:text-sm text-gray-600">of {responses.length}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                {/* Optimized pagination with ellipsis */}
                {(() => {
                  const totalQuestions = responses.length;
                  const currentPage = currentQuestionIndex + 1;
                  const maxVisiblePages = 7; // Show max 7 page numbers
                  
                  if (totalQuestions <= maxVisiblePages) {
                    // Show all pages if total is small
                    return responses.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg font-medium transition-colors text-xs lg:text-sm ${
                          index === currentQuestionIndex
                            ? 'bg-blue-600 text-white'
                            : responses[index].is_correct
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
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
                      className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg font-medium transition-colors text-xs lg:text-sm ${
                        0 === currentQuestionIndex
                          ? 'bg-blue-600 text-white'
                          : responses[0].is_correct
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
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
                          className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg font-medium transition-colors text-xs lg:text-sm ${
                            i === currentQuestionIndex
                              ? 'bg-blue-600 text-white'
                              : responses[i].is_correct
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
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
                        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg font-medium transition-colors text-xs lg:text-sm ${
                          totalQuestions - 1 === currentQuestionIndex
                            ? 'bg-blue-600 text-white'
                            : responses[totalQuestions - 1].is_correct
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
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
                disabled={currentQuestionIndex === responses.length - 1}
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
