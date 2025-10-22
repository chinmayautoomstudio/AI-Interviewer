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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
              TEXT
            </span>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {question.difficulty_level}
            </span>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {question.points} point{question.points !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Time limit: {question.time_limit_seconds}s</span>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
          {question.question_text}
        </h3>
      </div>

      {/* Answer Input */}
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={localAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer here..."
            className={`
              w-full h-32 p-4 border-2 rounded-lg resize-none transition-all duration-200
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
          <div className="absolute bottom-2 right-2">
            <span className={`text-xs font-medium ${getCharCountColor()}`}>
              {charCount}/{maxLength}
            </span>
          </div>
        </div>

        {/* Answer guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Answer Guidelines:</p>
              <ul className="space-y-1 text-blue-700">
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
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Model Answer:</h4>
          <p className="text-gray-700 leading-relaxed">
            {question.answer_explanation}
          </p>
        </div>
      )}

      {/* Topic and tags */}
      {(question.topic || question.tags.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {question.topic && (
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {question.topic.name}
            </span>
          )}
          {question.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded"
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
