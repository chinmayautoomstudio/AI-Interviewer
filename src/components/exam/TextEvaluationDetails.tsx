// Text Evaluation Details Component
// Displays detailed AI evaluation results for text questions

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, Brain, Target, TrendingUp, MessageSquare } from 'lucide-react';

interface TextEvaluationDetailsProps {
  evaluationDetails: {
    confidence: number;
    explanation: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    detailedScores: {
      technical_accuracy: number;
      completeness: number;
      clarity: number;
      relevance: number;
    };
    keywordAnalysis: {
      expected_keywords_found: string[];
      missing_keywords: string[];
      keyword_coverage_percentage: number;
    };
    reasoning: string;
    autoEvaluated: boolean;
    evaluatedAt: string;
    evaluationMethod: string;
  };
  question: {
    question_text: string;
    correct_answer?: string;
    points: number;
    difficulty_level: string;
    question_category: string;
  };
  candidateAnswer: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
}

const TextEvaluationDetails: React.FC<TextEvaluationDetailsProps> = ({
  evaluationDetails,
  question,
  candidateAnswer,
  isCorrect,
  score,
  maxScore
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'High Confidence';
    if (confidence >= 0.7) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const percentage = (score / maxScore) * 100;

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isCorrect ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <h3 className="font-semibold text-gray-900">AI Text Evaluation</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(evaluationDetails.confidence)}`}>
            {getConfidenceText(evaluationDetails.confidence)}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(evaluationDetails.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Score Display */}
      <div className="bg-white rounded-lg p-3 border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">Score</span>
          </div>
          <span className={`text-lg font-bold ${getScoreColor(percentage)}`}>
            {score.toFixed(1)} / {maxScore}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${percentage >= 80 ? 'bg-green-600' : percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {percentage.toFixed(1)}% - {question.difficulty_level} {question.question_category} question
        </p>
      </div>

      {/* Answer Display */}
      <div className="bg-white rounded-lg p-3 border">
        <div className="flex items-center space-x-2 mb-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-900">Candidate Answer</span>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-gray-700 whitespace-pre-wrap">{candidateAnswer}</p>
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="bg-white rounded-lg p-3 border">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-gray-900">Detailed Evaluation</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {evaluationDetails.detailedScores.technical_accuracy?.toFixed(1) || 'N/A'}
            </div>
            <p className="text-xs text-gray-600">Technical Accuracy</p>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div
                className="bg-blue-600 h-1 rounded-full"
                style={{ width: `${(evaluationDetails.detailedScores.technical_accuracy || 0) * 20}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {evaluationDetails.detailedScores.completeness?.toFixed(1) || 'N/A'}
            </div>
            <p className="text-xs text-gray-600">Completeness</p>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div
                className="bg-green-600 h-1 rounded-full"
                style={{ width: `${(evaluationDetails.detailedScores.completeness || 0) * 20}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {evaluationDetails.detailedScores.clarity?.toFixed(1) || 'N/A'}
            </div>
            <p className="text-xs text-gray-600">Clarity</p>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div
                className="bg-yellow-600 h-1 rounded-full"
                style={{ width: `${(evaluationDetails.detailedScores.clarity || 0) * 20}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {evaluationDetails.detailedScores.relevance?.toFixed(1) || 'N/A'}
            </div>
            <p className="text-xs text-gray-600">Relevance</p>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div
                className="bg-purple-600 h-1 rounded-full"
                style={{ width: `${(evaluationDetails.detailedScores.relevance || 0) * 20}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyword Analysis */}
      {evaluationDetails.keywordAnalysis && (
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="w-4 h-4 text-indigo-600" />
            <span className="font-medium text-gray-900">Keyword Analysis</span>
          </div>
          
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Coverage</span>
              <span className="text-sm font-medium text-gray-900">
                {evaluationDetails.keywordAnalysis.keyword_coverage_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${evaluationDetails.keywordAnalysis.keyword_coverage_percentage}%` }}
              ></div>
            </div>
          </div>

          {evaluationDetails.keywordAnalysis.expected_keywords_found?.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-green-700 mb-1">Keywords Found:</p>
              <div className="flex flex-wrap gap-1">
                {evaluationDetails.keywordAnalysis.expected_keywords_found.map((keyword, index) => (
                  <span key={index} className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {evaluationDetails.keywordAnalysis.missing_keywords?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-700 mb-1">Missing Keywords:</p>
              <div className="flex flex-wrap gap-1">
                {evaluationDetails.keywordAnalysis.missing_keywords.map((keyword, index) => (
                  <span key={index} className="inline-flex px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      <div className="bg-white rounded-lg p-3 border">
        <div className="flex items-center space-x-2 mb-3">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-900">AI Feedback</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Overall Assessment:</p>
            <p className="text-sm text-gray-600">{evaluationDetails.explanation}</p>
          </div>

          {evaluationDetails.strengths?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Strengths:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {evaluationDetails.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {evaluationDetails.weaknesses?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-700 mb-1">Areas for Improvement:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {evaluationDetails.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {evaluationDetails.suggestions?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Suggestions:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {evaluationDetails.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Reasoning */}
      {evaluationDetails.reasoning && (
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-gray-900">Evaluation Reasoning</span>
          </div>
          <p className="text-sm text-gray-700">{evaluationDetails.reasoning}</p>
        </div>
      )}

      {/* Auto-evaluation Info */}
      {evaluationDetails.autoEvaluated && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">AI Auto-Evaluated</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Evaluated at: {formatDate(evaluationDetails.evaluatedAt)}
          </p>
          <p className="text-xs text-blue-700">
            Method: {evaluationDetails.evaluationMethod}
          </p>
        </div>
      )}
    </div>
  );
};

export default TextEvaluationDetails;
