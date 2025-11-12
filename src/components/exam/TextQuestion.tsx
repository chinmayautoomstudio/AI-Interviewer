// Text Question Component
// Displays text-based questions with textarea input

import React, { useState, useEffect } from 'react';
import { FileText, Clock } from 'lucide-react';
import { TextQuestionProps } from '../../types';

export const TextQuestion: React.FC<TextQuestionProps> = ({
  question,
  answer = '',
  onAnswerChange,
  disabled = false,
  maxLength = 1000
}) => {
  const [localAnswer, setLocalAnswer] = useState(answer);
  const [charCount, setCharCount] = useState(answer.length);

  // Update local state when answer prop changes
  useEffect(() => {
    setLocalAnswer(answer);
    setCharCount(answer.length);
  }, [answer]);

  const handleAnswerChange = (value: string) => {
    if (disabled) return;
    
    // Enforce character limit
    if (value.length <= maxLength) {
      setLocalAnswer(value);
      setCharCount(value.length);
      onAnswerChange(value);
    }
  };

  const getCharCountColor = (): string => {
    const percentage = (charCount / maxLength) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-gray-500';
  };

  const getCharCountBgColor = (): string => {
    const percentage = (charCount / maxLength) * 100;
    if (percentage >= 90) return 'bg-red-50 border-red-200';
    if (percentage >= 75) return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/50 p-4 sm:p-6 lg:p-8 shadow-lg">
      {/* Question Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm">
              {question.points} point{question.points !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Time limit: {question.time_limit_seconds}s</span>
          </div>
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-relaxed">
          {question.question_text}
        </h3>
      </div>

      {/* Answer Input */}
      <div className="space-y-4 sm:space-y-6">
        <div className="relative">
          <textarea
            value={localAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer here..."
            className={`
              w-full h-32 sm:h-40 p-4 sm:p-6 border-2 rounded-lg sm:rounded-xl resize-none transition-all duration-200 text-sm sm:text-base lg:text-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${disabled 
                ? 'bg-gray-50 border-gray-200 cursor-not-allowed' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${getCharCountBgColor()}
            `}
            maxLength={maxLength}
          />
          
          {/* Character count */}
          <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
            <span className={`text-xs sm:text-sm font-medium ${getCharCountColor()} bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg shadow-sm`}>
              {charCount}/{maxLength}
            </span>
          </div>
        </div>

        {/* Answer guidelines */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-blue-800">
              <p className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base lg:text-lg">Answer Guidelines:</p>
              <ul className="space-y-1 sm:space-y-2 text-blue-700 text-sm sm:text-base lg:text-lg">
                <li>• Be specific and provide clear explanations</li>
                <li>• Include relevant examples where applicable</li>
                <li>• Use proper grammar and formatting</li>
                <li>• Aim for comprehensive but concise answers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Answer explanation (show when disabled and answer exists) */}
      {disabled && localAnswer && question.answer_explanation && (
        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-base sm:text-lg">Model Answer:</h4>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg">
            {question.answer_explanation}
          </p>
        </div>
      )}
    </div>
  );
};

export default TextQuestion;
