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


  return (
    <div className="bg-white rounded-xl border border-gray-200/50 p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Questions</h3>
        <div className="flex items-center space-x-3 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="font-medium">{answeredQuestions.size}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Circle className="w-3 h-3 text-gray-400" />
            <span className="font-medium">{questions.length - answeredQuestions.size}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span className="font-medium">Progress</span>
          <span className="font-semibold">{Math.round((answeredQuestions.size / questions.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${(answeredQuestions.size / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question grid - Compact */}
      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-1 mb-3">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => !disabled && onQuestionSelect(index)}
            disabled={disabled}
            className={`
              relative flex flex-col items-center justify-center p-1.5 rounded border transition-all duration-200 shadow-sm hover:shadow-md min-h-[40px]
              ${getQuestionStyle(index)}
              ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              ${index === currentQuestionIndex ? 'ring-1 ring-blue-500' : ''}
            `}
            title={`Question ${index + 1}`}
          >
            {/* Question number only */}
            <div className="flex items-center space-x-0.5">
              {getQuestionIcon(index)}
              <span className="text-xs font-bold">{index + 1}</span>
            </div>

            {/* Points indicator */}
            <div className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center shadow-lg font-bold">
              {question.points}
            </div>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="text-gray-600 font-medium">Answered</span>
          </div>
          <div className="flex items-center space-x-1">
            <Circle className="w-3 h-3 text-blue-600 fill-current" />
            <span className="text-gray-600 font-medium">Current</span>
          </div>
          <div className="flex items-center space-x-1">
            <Circle className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600 font-medium">Unanswered</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs rounded-full flex items-center justify-center font-bold">
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
