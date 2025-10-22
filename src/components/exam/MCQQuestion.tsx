// MCQ Question Component
// Displays multiple choice questions with radio button selection

import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { MCQQuestionProps } from '../../types';

export const MCQQuestion: React.FC<MCQQuestionProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  disabled = false
}) => {
  const handleOptionSelect = (option: string) => {
    if (!disabled) {
      onAnswerSelect(option);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              MCQ
            </span>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {question.difficulty_level}
            </span>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {question.points} point{question.points !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Time limit: {question.time_limit_seconds}s
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
          {question.question_text}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.mcq_options?.map((option, index) => {
          const isSelected = selectedAnswer === option.option;
          const isCorrect = question.correct_answer === option.option;
          
          return (
            <div
              key={option.option}
              className={`
                flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${disabled 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'hover:bg-gray-50 hover:border-gray-300'
                }
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
                }
                ${disabled && isCorrect 
                  ? 'border-green-500 bg-green-50' 
                  : ''
                }
              `}
              onClick={() => handleOptionSelect(option.option)}
            >
              {/* Option indicator */}
              <div className="flex-shrink-0 mt-1">
                {isSelected ? (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              {/* Option content */}
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-700 min-w-[24px]">
                    {option.option}.
                  </span>
                  <span className="text-gray-900 leading-relaxed">
                    {option.text}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Answer explanation (show when disabled and answer is selected) */}
      {disabled && selectedAnswer && question.answer_explanation && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
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

export default MCQQuestion;
