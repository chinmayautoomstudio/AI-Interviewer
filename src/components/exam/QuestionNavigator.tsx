// Question Navigator Component
// Provides navigation between questions with visual indicators

import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { QuestionNavigatorProps } from '../../types';

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentQuestionIndex,
  answeredQuestions,
  onQuestionSelect,
  disabled = false
}) => {
  const getQuestionStatus = (index: number) => {
    if (answeredQuestions.has(index)) {
      return 'answered';
    }
    if (index === currentQuestionIndex) {
      return 'current';
    }
    return 'unanswered';
  };

  const getQuestionIcon = (index: number) => {
    const status = getQuestionStatus(index);
    
    switch (status) {
      case 'answered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'current':
        return <Circle className="w-4 h-4 text-blue-600 fill-current" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getQuestionStyle = (index: number) => {
    const status = getQuestionStatus(index);
    
    switch (status) {
      case 'answered':
        return 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100';
      case 'current':
        return 'bg-blue-50 border-blue-500 text-blue-800 hover:bg-blue-100';
      default:
        return 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50';
    }
  };

  const getQuestionTypeIcon = (questionType: string) => {
    switch (questionType) {
      case 'mcq':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded">
            MCQ
          </span>
        );
      case 'text':
        return (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded">
            TEXT
          </span>
        );
      default:
        return null;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Question Navigator</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>{answeredQuestions.size} answered</span>
          </div>
          <div className="flex items-center space-x-1">
            <Circle className="w-4 h-4 text-gray-400" />
            <span>{questions.length - answeredQuestions.size} remaining</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round((answeredQuestions.size / questions.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(answeredQuestions.size / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question grid */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => !disabled && onQuestionSelect(index)}
            disabled={disabled}
            className={`
              relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200
              ${getQuestionStyle(index)}
              ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              ${index === currentQuestionIndex ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
            `}
            title={`Question ${index + 1}: ${question.question_type.toUpperCase()} - ${question.difficulty_level}`}
          >
            {/* Question number */}
            <div className="flex items-center space-x-1 mb-1">
              {getQuestionIcon(index)}
              <span className="text-sm font-medium">{index + 1}</span>
            </div>

            {/* Question type */}
            <div className="mb-1">
              {getQuestionTypeIcon(question.question_type)}
            </div>

            {/* Difficulty indicator */}
            <div className={`text-xs font-medium ${getDifficultyColor(question.difficulty_level)}`}>
              {question.difficulty_level.charAt(0).toUpperCase()}
            </div>

            {/* Points indicator */}
            <div className="absolute -top-1 -right-1 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {question.points}
            </div>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-gray-600">Answered</span>
          </div>
          <div className="flex items-center space-x-2">
            <Circle className="w-4 h-4 text-blue-600 fill-current" />
            <span className="text-gray-600">Current</span>
          </div>
          <div className="flex items-center space-x-2">
            <Circle className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Unanswered</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center">
              P
            </div>
            <span className="text-gray-600">Points</span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-green-800">
            {answeredQuestions.size}
          </div>
          <div className="text-xs text-green-600">Answered</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-yellow-800">
            {questions.length - answeredQuestions.size}
          </div>
          <div className="text-xs text-yellow-600">Remaining</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-blue-800">
            {questions.reduce((sum, q) => sum + q.points, 0)}
          </div>
          <div className="text-xs text-blue-600">Total Points</div>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigator;
