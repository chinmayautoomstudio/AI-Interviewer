// Question Navigator Component
// Provides navigation between questions with visual indicators

import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
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
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/50 p-4 sm:p-6 shadow-lg">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Question Navigator</h3>
        <div className="flex flex-col space-y-1 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            <span className="font-medium">{answeredQuestions.size} answered</span>
          </div>
          <div className="flex items-center space-x-1">
            <Circle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <span className="font-medium">{questions.length - answeredQuestions.size} remaining</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
          <span className="font-medium">Progress</span>
          <span className="font-semibold">{Math.round((answeredQuestions.size / questions.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 sm:h-2 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${(answeredQuestions.size / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question grid - Responsive */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => !disabled && onQuestionSelect(index)}
            disabled={disabled}
            className={`
              relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md min-h-[60px] sm:min-h-[80px]
              ${getQuestionStyle(index)}
              ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              ${index === currentQuestionIndex ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
            `}
            title={`Question ${index + 1}: ${question.question_type.toUpperCase()} - ${question.difficulty_level}`}
          >
            {/* Question number */}
            <div className="flex items-center space-x-1 mb-1">
              {getQuestionIcon(index)}
              <span className="text-xs font-bold">{index + 1}</span>
            </div>

            {/* Question type and difficulty - combined to save space */}
            <div className="mb-1 flex flex-col items-center space-y-0.5">
              {question.question_type === 'mcq' ? (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1 py-0.5 rounded text-center">
                  MCQ
                </span>
              ) : (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-1 py-0.5 rounded text-center">
                  TEXT
                </span>
              )}
              <div className={`text-xs font-bold ${getDifficultyColor(question.difficulty_level)}`}>
                {question.difficulty_level.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Points indicator */}
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shadow-lg font-bold">
              {question.points}
            </div>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="pt-3 sm:pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            <span className="text-gray-600 font-medium">Answered</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Circle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 fill-current" />
            <span className="text-gray-600 font-medium">Current</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Circle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <span className="text-gray-600 font-medium">Unanswered</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs rounded-full flex items-center justify-center font-bold">
              P
            </div>
            <span className="text-gray-600 font-medium">Points</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigator;
