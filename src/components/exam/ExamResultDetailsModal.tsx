// Exam Result Details Modal
// Modal for viewing detailed exam results and candidate performance

import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, Clock, CheckCircle, XCircle, AlertCircle, User, Briefcase, BarChart3, Shield, Globe, AlertTriangle } from 'lucide-react';
import { ExamResultWithDetails } from '../../services/examResultsService';
import MCQEvaluationDetails from './MCQEvaluationDetails';
import TextEvaluationDetails from './TextEvaluationDetails';

interface ExamResultDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultId: string | null;
}

const ExamResultDetailsModal: React.FC<ExamResultDetailsModalProps> = ({
  isOpen,
  onClose,
  resultId
}) => {
  const [result, setResult] = useState<ExamResultWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const loadResultDetails = useCallback(async () => {
    if (!resultId) return;

    try {
      setLoading(true);
      setError(null);

      // Import the service dynamically to avoid circular dependencies
      const { examResultsService } = await import('../../services/examResultsService');
      const response = await examResultsService.getExamResultById(resultId);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to load exam result details');
      }
    } catch (error) {
      console.error('Error loading result details:', error);
      setError('Failed to load exam result details');
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  const loadResponses = useCallback(async () => {
    if (!result || !result.examSessionId) return;

    try {
      setLoadingResponses(true);
      
      const { ExamService } = await import('../../services/examService');
      const examService = new ExamService();
      const responses = await examService.getSessionResponses(result.examSessionId);
      
      setResponses(responses);
    } catch (err) {
      console.error('Error loading responses:', err);
    } finally {
      setLoadingResponses(false);
    }
  }, [result]);

  useEffect(() => {
    if (isOpen && resultId) {
      loadResultDetails();
    }
  }, [isOpen, resultId, loadResultDetails]);

  useEffect(() => {
    if (result && result.examSessionId) {
      loadResponses();
    }
  }, [result, loadResponses]);

  const handleClose = () => {
    setResult(null);
    setError(null);
    setResponses([]);
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'passed': return 'Passed';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending Review';
      default: return status;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const downloadResult = () => {
    if (!result) return;

    const resultData = {
      candidate: result.candidate,
      jobDescription: result.jobDescription,
      examSession: result.examSession,
      result: {
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        correctAnswers: result.correctAnswers,
        wrongAnswers: result.wrongAnswers,
        skippedQuestions: result.skippedQuestions,
        technicalScore: result.technicalScore,
        aptitudeScore: result.aptitudeScore,
        timeTakenMinutes: result.timeTakenMinutes,
        evaluationStatus: result.evaluationStatus,
        createdAt: result.createdAt
      }
    };

    const dataStr = JSON.stringify(resultData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam-result-${result.candidate?.name || 'candidate'}-${result.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Exam Result Details</h2>
              <p className="text-sm text-gray-600">Detailed performance analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadResult}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download Result"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading result details...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Candidate and Job Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Candidate Information</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <span className="ml-2 text-gray-900">{result.candidate?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <span className="ml-2 text-gray-900">{result.candidate?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <span className="ml-2 text-gray-900">{result.candidate?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Briefcase className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Job Information</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Position:</span>
                      <span className="ml-2 text-gray-900">{result.jobDescription?.title || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Department:</span>
                      <span className="ml-2 text-gray-900">{result.jobDescription?.department || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Experience Level:</span>
                      <span className="ml-2 text-gray-900">{result.jobDescription?.experienceLevel || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Overview */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Score Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(result.percentage)}`}>
                      {result.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {result.totalScore}/{result.maxScore}
                    </div>
                    <div className="text-sm text-gray-600">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {result.timeTakenMinutes || 0} min
                    </div>
                    <div className="text-sm text-gray-600">Time Taken</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {getStatusIcon(result.evaluationStatus)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.evaluationStatus)}`}>
                        {getStatusText(result.evaluationStatus)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Status</div>
                  </div>
                </div>
              </div>

              {/* Answer Breakdown */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Answer Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.correctAnswers}</div>
                    <div className="text-sm text-green-700">Correct Answers</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{result.wrongAnswers}</div>
                    <div className="text-sm text-red-700">Wrong Answers</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{result.skippedQuestions}</div>
                    <div className="text-sm text-yellow-700">Skipped Questions</div>
                  </div>
                </div>
              </div>

              {/* Category Scores */}
              {(result.technicalScore !== undefined || result.aptitudeScore !== undefined) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Category Scores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.technicalScore !== undefined && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900">Technical</span>
                          <span className="text-xl font-bold text-blue-600">{result.technicalScore}</span>
                        </div>
                      </div>
                    )}
                    {result.aptitudeScore !== undefined && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-purple-900">Aptitude</span>
                          <span className="text-xl font-bold text-purple-600">{result.aptitudeScore}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Security & IP Information - Prominent Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Security & IP Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* IP Address */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">IP Address</span>
                    </div>
                    {result.examSession?.ip_address ? (
                      <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded break-all">
                        {result.examSession.ip_address}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Not available</p>
                    )}
                  </div>
                  
                  {/* User Agent */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">User Agent</span>
                    </div>
                    {result.examSession?.user_agent ? (
                      <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded break-words max-h-20 overflow-y-auto">
                        {result.examSession.user_agent}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Not available</p>
                    )}
                  </div>
                </div>

                {/* Security Violations Summary */}
                {result.securityViolations && result.securityViolations.length > 0 ? (
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-semibold text-gray-900">Security Violations Detected</span>
                      </div>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                        {result.securityViolations.length} Total
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      {result.securityViolations.filter((v: any) => v.severity === 'high').length > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                          {result.securityViolations.filter((v: any) => v.severity === 'high').length} High
                        </span>
                      )}
                      {result.securityViolations.filter((v: any) => v.severity === 'medium').length > 0 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">
                          {result.securityViolations.filter((v: any) => v.severity === 'medium').length} Medium
                        </span>
                      )}
                      {result.securityViolations.filter((v: any) => v.severity === 'low').length > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                          {result.securityViolations.filter((v: any) => v.severity === 'low').length} Low
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-gray-900">No Security Violations</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">No security violations detected during this exam session.</p>
                  </div>
                )}
              </div>

              {/* Detailed Security Violations */}
              {result.securityViolations && result.securityViolations.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Shield className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-900">Security Violations Details</h3>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                      {result.securityViolations.length} Total
                    </span>
                  </div>
                  <div className="space-y-3">
                    {result.securityViolations.map((violation: any, index: number) => (
                      <div key={violation.id || index} className={`border-l-4 rounded p-3 ${
                        violation.severity === 'high' ? 'border-red-500 bg-red-50' :
                        violation.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                violation.severity === 'high' ? 'bg-red-200 text-red-800' :
                                violation.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-blue-200 text-blue-800'
                              }`}>
                                {violation.severity.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {violation.violation_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{violation.violation_details}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(violation.timestamp)}
                            </p>
                          </div>
                          {violation.severity === 'high' && (
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam Session Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Exam Session Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Session ID:</span>
                    <span className="ml-2 text-gray-900 font-mono text-sm">{result.examSessionId}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Total Questions:</span>
                    <span className="ml-2 text-gray-900">{result.examSession?.total_questions || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Duration:</span>
                    <span className="ml-2 text-gray-900">{result.examSession?.duration_minutes || 'N/A'} minutes</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Completed At:</span>
                    <span className="ml-2 text-gray-900">{formatDate(result.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Question Evaluations */}
              {result.examSession && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Question Evaluations</h3>
                  <div className="space-y-4">
                    {loadingResponses ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p>Loading question evaluations...</p>
                      </div>
                    ) : responses.length > 0 ? (
                      responses.map((response, index) => (
                        <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">
                              Question {index + 1}: {response.question?.question_type?.toUpperCase()}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {response.is_correct ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              <span className="text-sm font-medium text-gray-600">
                                {response.points_earned}/{response.question?.points || 1} points
                              </span>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Question:</strong> {response.question?.question_text}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Answer:</strong> {response.answer_text}
                            </p>
                          </div>

                          {/* MCQ Evaluation Details */}
                          {response.question?.question_type === 'mcq' && response.evaluation_details && (
                            <MCQEvaluationDetails
                              evaluationDetails={response.evaluation_details}
                              question={response.question}
                              candidateAnswer={response.answer_text}
                              isCorrect={response.is_correct || false}
                            />
                          )}

                          {/* Text Evaluation Details */}
                          {response.question?.question_type === 'text' && response.evaluation_details && (
                            <TextEvaluationDetails
                              evaluationDetails={response.evaluation_details}
                              question={response.question}
                              candidateAnswer={response.answer_text}
                              isCorrect={response.is_correct || false}
                              score={response.points_earned}
                              maxScore={response.question.points}
                            />
                          )}

                          {/* Basic evaluation for questions without detailed evaluation */}
                          {!response.evaluation_details && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm text-gray-600">
                                <strong>Status:</strong> {response.is_correct ? 'Correct' : 'Incorrect'}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Points Earned:</strong> {response.points_earned}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Time Taken:</strong> {response.time_taken_seconds || 'N/A'} seconds
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No question evaluations available</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Responses may not be loaded or evaluation is still in progress
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Evaluation */}
              {result.aiEvaluation && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">AI Evaluation</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(result.aiEvaluation, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResultDetailsModal;
