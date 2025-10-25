import React, { useState, useEffect } from 'react';
import { X, Download, FileText, TrendingUp, TrendingDown, Clock, Target, Brain, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ReportData, reportGenerationService } from '../../services/reportGenerationService';

interface ExamReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export const ExamReportModal: React.FC<ExamReportModalProps> = ({
  isOpen,
  onClose,
  sessionId
}) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadReport();
    }
  }, [isOpen, sessionId]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const report = await reportGenerationService.generateReport(sessionId);
      setReportData(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'hire':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'interview':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'provide_foundational_training':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'reject':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSkillGapColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'important':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'nice_to_have':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Exam Report</h2>
            {reportData && (
              <span className="text-sm text-gray-500">
                {reportData.candidate.name} - {reportData.jobDescription.title}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {/* TODO: Implement export */}}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Generating report...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <XCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Content */}
        {reportData && (
          <div className="flex flex-col h-full">
            {/* Single Page Report Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <SinglePageReport reportData={reportData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Single Page Report Component
const SinglePageReport: React.FC<{ reportData: ReportData }> = ({ reportData }) => {
  return (
    <div className="space-y-6 pb-4">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Exam Performance Report</h3>
            <p className="text-gray-600 mt-1">
              {reportData.candidate.name} • {reportData.jobDescription.title}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(reportData.evaluationStatus)}
            <span className="text-lg font-medium capitalize">{reportData.evaluationStatus}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{reportData.percentage}%</div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">{reportData.overallScore}</div>
            <div className="text-sm text-gray-600">Points Earned</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600">{reportData.maxScore}</div>
            <div className="text-sm text-gray-600">Max Points</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">{reportData.questionAnalysis.length}</div>
            <div className="text-sm text-gray-600">Total Questions</div>
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MCQ Performance */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h4 className="text-xl font-semibold">MCQ Performance</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Score:</span>
              <span className="font-bold text-lg">{reportData.mcqResults.score}/{reportData.mcqResults.totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-bold text-lg text-green-600">{reportData.mcqResults.percentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Correct Answers:</span>
              <span className="font-bold text-lg">{reportData.mcqResults.correctAnswers}/{reportData.mcqResults.totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Time/Question:</span>
              <span className="font-semibold">{reportData.mcqResults.averageTimePerQuestion}s</span>
            </div>
          </div>
        </div>

        {/* Text Performance */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="h-6 w-6 text-purple-500" />
            <h4 className="text-xl font-semibold">Text Performance</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Score:</span>
              <span className="font-bold text-lg">{reportData.textResults.totalScore}/{reportData.textResults.maxScore}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-bold text-lg text-purple-600">{reportData.textResults.percentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">AI Confidence:</span>
              <span className="font-bold text-lg">{Math.round(reportData.textResults.averageConfidence * 100)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Questions:</span>
              <span className="font-semibold">{reportData.textResults.totalQuestions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hiring Recommendation */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-xl font-semibold mb-4 flex items-center">
          <Target className="h-6 w-6 mr-2 text-blue-600" />
          Hiring Recommendation
        </h4>
        <div className="flex items-center space-x-4">
          <div className={`inline-flex items-center px-6 py-3 rounded-full border text-lg font-medium ${getRecommendationColor(reportData.hiringRecommendation.recommendation)}`}>
            <span className="capitalize">{reportData.hiringRecommendation.recommendation.replace('_', ' ')}</span>
            <span className="ml-3 text-sm">({Math.round(reportData.hiringRecommendation.confidence * 100)}% confidence)</span>
          </div>
        </div>
        <p className="mt-4 text-gray-700 text-lg">{reportData.hiringRecommendation.reasoning}</p>
      </div>

      {/* Question Analysis */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-xl font-semibold mb-6 flex items-center">
          <Brain className="h-6 w-6 mr-2 text-indigo-600" />
          Question Analysis
        </h4>
        <div className="space-y-4">
          {reportData.questionAnalysis.map((question, index) => (
            <div key={question.questionId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">Q{index + 1}</span>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      question.questionType === 'mcq' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {question.questionType.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{question.category}</span>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{question.difficulty}</span>
                  </div>
                  <p className="text-sm text-gray-800 mb-2 font-medium">{question.questionText}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Answer:</span> {question.candidateAnswer}
                  </p>
                  {question.correctAnswer && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Correct Answer:</span> {question.correctAnswer}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  {question.isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  <div className="text-right">
                    <div className="text-lg font-bold">{question.pointsEarned}/{question.points}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              </div>
              
              {question.feedback && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2 font-medium">{question.feedback.overall}</p>
                  {question.feedback.suggestions && question.feedback.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Suggestions:</p>
                      <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                        {question.feedback.suggestions.slice(0, 3).map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skills & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        {reportData.strengths.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2" />
              Strengths
            </h4>
            <ul className="space-y-2">
              {reportData.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-green-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {reportData.weaknesses.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
              <TrendingDown className="h-6 w-6 mr-2" />
              Areas for Improvement
            </h4>
            <ul className="space-y-2">
              {reportData.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-red-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Skill Gaps */}
      {reportData.skillGaps.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-xl font-semibold mb-6 flex items-center">
            <Target className="h-6 w-6 mr-2 text-orange-600" />
            Skill Gaps Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportData.skillGaps.map((gap, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-lg">{gap.skill}</span>
                  <span className={`px-3 py-1 text-sm rounded-full border font-medium ${getSkillGapColor(gap.level)}`}>
                    {gap.level}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Current: {gap.currentLevel}%</span>
                    <span>Required: {gap.requiredLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${gap.currentLevel}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Recommendations:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    {gap.recommendations.slice(0, 2).map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Recommendations */}
      {reportData.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
            <Target className="h-6 w-6 mr-2" />
            General Recommendations
          </h4>
          <ul className="space-y-2">
            {reportData.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <Target className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-blue-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


// Helper function for status icons
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'passed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  }
};

// Helper function for recommendation colors
const getRecommendationColor = (recommendation: string) => {
  switch (recommendation) {
    case 'hire':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'interview':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'provide_foundational_training':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'reject':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Helper function for skill gap colors
const getSkillGapColor = (level: string) => {
  switch (level) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'important':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'nice_to_have':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
