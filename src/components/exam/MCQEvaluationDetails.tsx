// MCQ Evaluation Details Component
// Displays detailed evaluation results for MCQ questions

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, Target, Brain } from 'lucide-react';

interface MCQEvaluationDetailsProps {
  evaluationDetails: {
    confidence: number;
    explanation: string;
    selectedOption: string;
    correctOption: string;
    evaluationDetails: {
      answerMatched: boolean;
      optionTextMatched: boolean;
      caseInsensitiveMatch: boolean;
      trimmedMatch: boolean;
      similarity?: number;
    };
    autoEvaluated?: boolean;
    evaluatedAt?: string;
  };
  question: {
    question_text: string;
    mcq_options?: Array<{ option: string; text: string }>;
    correct_answer?: string;
    answer_explanation?: string;
  };
  candidateAnswer: string;
  isCorrect: boolean;
}

const MCQEvaluationDetails: React.FC<MCQEvaluationDetailsProps> = ({
  evaluationDetails,
  question,
  candidateAnswer,
  isCorrect
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

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
          <h3 className="font-semibold text-gray-900">MCQ Auto-Evaluation</h3>
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

      {/* Answer Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">Your Answer</span>
          </div>
          <p className="text-gray-700">{candidateAnswer}</p>
        </div>
        
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-medium text-gray-900">Correct Answer</span>
          </div>
          <p className="text-gray-700">{evaluationDetails.correctOption}</p>
        </div>
      </div>

      {/* MCQ Options Display */}
      {question.mcq_options && question.mcq_options.length > 0 && (
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-gray-900">Available Options</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {question.mcq_options.map((option, index) => {
              const isSelected = option.option === candidateAnswer || option.text === candidateAnswer;
              const isCorrect = option.option === evaluationDetails.correctOption || option.text === evaluationDetails.correctOption;
              
              return (
                <div
                  key={index}
                  className={`p-2 rounded-lg border-2 ${
                    isCorrect
                      ? 'border-green-200 bg-green-50'
                      : isSelected
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${
                      isCorrect ? 'text-green-700' : isSelected ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {option.option}
                    </span>
                    <span className={`${
                      isCorrect ? 'text-green-700' : isSelected ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {option.text}
                    </span>
                    {isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evaluation Details */}
      <div className="bg-white rounded-lg p-3 border">
        <div className="flex items-center space-x-2 mb-3">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-900">Evaluation Details</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
              evaluationDetails.evaluationDetails.answerMatched ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {evaluationDetails.evaluationDetails.answerMatched ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-xs text-gray-600">Answer Match</p>
          </div>
          
          <div className="text-center">
            <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
              evaluationDetails.evaluationDetails.optionTextMatched ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {evaluationDetails.evaluationDetails.optionTextMatched ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <p className="text-xs text-gray-600">Option Text</p>
          </div>
          
          <div className="text-center">
            <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
              evaluationDetails.evaluationDetails.caseInsensitiveMatch ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {evaluationDetails.evaluationDetails.caseInsensitiveMatch ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <p className="text-xs text-gray-600">Case Match</p>
          </div>
          
          <div className="text-center">
            <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
              evaluationDetails.evaluationDetails.trimmedMatch ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {evaluationDetails.evaluationDetails.trimmedMatch ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <p className="text-xs text-gray-600">Trimmed Match</p>
          </div>
        </div>
        
        {evaluationDetails.evaluationDetails.similarity && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Similarity Score</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(evaluationDetails.evaluationDetails.similarity * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${evaluationDetails.evaluationDetails.similarity * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Explanation */}
      {evaluationDetails.explanation && (
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">Explanation</span>
          </div>
          <p className="text-gray-700 text-sm">{evaluationDetails.explanation}</p>
        </div>
      )}

      {/* Auto-evaluation Info */}
      {evaluationDetails.autoEvaluated && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Auto-Evaluated</span>
          </div>
          {evaluationDetails.evaluatedAt && (
            <p className="text-xs text-blue-700 mt-1">
              Evaluated at: {formatDate(evaluationDetails.evaluatedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MCQEvaluationDetails;
