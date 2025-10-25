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
    <div className="bg-white rounded-2xl border border-gray-200/50 p-8 shadow-lg">
      {/* Question Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm font-semibold px-3 py-1.5 rounded-full shadow-sm">
              {question.points} point{question.points !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>Time limit: {question.time_limit_seconds}s</span>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
          {question.question_text}
        </h3>
      </div>

      {/* Answer Input */}
      <div className="space-y-6">
        <div className="relative">
          <textarea
            value={localAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer here..."
            className={`
              w-full h-40 p-6 border-2 rounded-xl resize-none transition-all duration-200 text-lg
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
          <div className="absolute bottom-3 right-3">
            <span className={`text-sm font-medium ${getCharCountColor()} bg-white px-2 py-1 rounded-lg shadow-sm`}>
              {charCount}/{maxLength}
            </span>
          </div>
        </div>

        {/* Answer guidelines */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start space-x-3">
            <FileText className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2 text-lg">Answer Guidelines:</p>
              <ul className="space-y-2 text-blue-700 text-lg">
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
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-3 text-lg">Model Answer:</h4>
          <p className="text-gray-700 leading-relaxed text-lg">
            {question.answer_explanation}
          </p>
        </div>
      )}

      {/* Topic and tags */}
      {(question.topic || question.tags.length > 0) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {question.topic && (
            <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-sm font-semibold px-3 py-1.5 rounded-full shadow-sm">
              {question.topic.name}
            </span>
          )}
          {question.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 text-sm font-semibold px-3 py-1.5 rounded-full shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TextQuestion;
